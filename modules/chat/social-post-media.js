'use strict';

const { createWriteStream } = require('node:fs');
const { writeFile } = require('node:fs/promises');
const { join } = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { load } = require('cheerio');

const MIB = 1024 * 1024;
const crawlerHeaders = { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
const mediaDomains = ['cdninstagram.com', 'fbcdn.net'];
const threadsHosts = ['threads.com', 'www.threads.com', 'threads.net', 'www.threads.net'];
const instagramHosts = ['instagram.com', 'www.instagram.com'];
const facebookHosts = ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'];

function safeURL(value, allowed) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password && !url.port && allowed(url) ? url : null;
    } catch {
        return null;
    }
}

function mediaURL(value) {
    return safeURL(value, url => mediaDomains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`)))?.href;
}

async function fetchBounded(url, allowed, { headers, signal, bytes, method = 'GET' }) {
    for (let hop = 0; hop <= 4; hop++) {
        if (!safeURL(url, allowed)) throw new Error('Unexpected media host or route');
        const response = await fetch(url, { headers, signal, method, redirect: 'manual' });
        const location = response.headers.get('location');
        if (response.status >= 300 && response.status < 400 && location) {
            await response.body?.cancel();
            url = new URL(location, url).href;
            continue;
        }
        if (!response.ok || (method !== 'HEAD' && !response.body) || Number(response.headers.get('content-length')) > bytes) {
            await response.body?.cancel();
            throw new Error('Media is inaccessible or too large');
        }
        return { response, url };
    }
    throw new Error('Too many media redirects');
}

async function* limitBytes(body, limit) {
    let received = 0;
    for await (const chunk of Readable.fromWeb(body)) {
        received += chunk.length;
        if (received > limit) throw new Error('Media exceeded byte limit');
        yield chunk;
    }
}

async function readBody(response, limit) {
    const chunks = [];
    for await (const chunk of limitBytes(response.body, limit)) chunks.push(chunk);
    return Buffer.concat(chunks);
}

function* postObjects($) {
    for (const script of $('script[type="application/json"]').toArray()) {
        let data;
        try {
            data = JSON.parse($(script).text());
        } catch {
            continue;
        }
        const pending = [data];
        while (pending.length > 0) {
            const value = pending.pop();
            if (!value || typeof value !== 'object') continue;
            if (!Array.isArray(value)) yield value;
            for (const child of Object.values(value)) pending.push(child);
        }
    }
}

function selectPostMedia(parts) {
    const video = parts.find(part => part.video && (part.url || part.tracks)) || parts.find(part => part.video);
    if (video) return { kind: 'video', url: video.url, ...(video.tracks && { tracks: video.tracks }) };
    const urls = [...new Set(parts.map(part => part.image).filter(Boolean))].slice(0, 4);
    return urls.length > 0 ? { kind: 'images', urls } : { kind: 'empty' };
}

function compatibleTracks(manifest, maxBytes) {
    if (typeof manifest !== 'string' || manifest.length > 256 * 1024) return;
    const $ = load(manifest, { xmlMode: true });
    if ($('MPD').attr('type') !== 'static' || $('Period').length !== 1) return;
    const tracks = $('Representation').toArray().map(element => ({
        url: mediaURL($(element).children('BaseURL').first().text()),
        codec: $(element).attr('codecs') || '',
        bytes: Number($(element).attr('FBContentLength')),
        bandwidth: Number($(element).attr('bandwidth')) || 0,
    })).filter(track => track.url && track.bytes > 0);
    tracks.sort((left, right) => right.bandwidth - left.bandwidth);
    const audio = tracks.find(track => track.codec.startsWith('mp4a'));
    if (!audio && $('AdaptationSet[contentType="audio"]').length > 0) return;
    const video = tracks.find(track => track.codec.startsWith('avc1') && track.bytes + (audio?.bytes || 0) <= maxBytes - 65_536);
    return video ? { video: video.url, audio: audio?.url } : undefined;
}

function metaParts(post, maxBytes) {
    const items = post.carousel_media?.length ? post.carousel_media : [post];
    return items.map(item => {
        if (item.media_type === 2 || item.video_versions?.length || item.video_dash_manifest) {
            const candidates = (item.video_versions || [])
                .map(version => ({ ...version, url: mediaURL(version.url) })).filter(version => version.url);
            const preferred = candidates.find(version => Math.min(version.width, version.height) <= 720);
            return {
                video: true, url: preferred?.url || candidates[0]?.url,
                tracks: compatibleTracks(item.video_dash_manifest, maxBytes),
            };
        }
        if (item.media_type === 1) {
            const candidates = item.image_versions2?.candidates || [];
            const preferred = candidates.find(candidate => Math.max(candidate.width, candidate.height) <= 1600);
            return { image: mediaURL(preferred?.url) || candidates.map(candidate => mediaURL(candidate.url)).find(Boolean) };
        }
        return {};
    });
}

function facebookParts(attachments) {
    const parts = [];
    for (const attachment of attachments) {
        const album = attachment.all_subattachments?.nodes;
        if (album?.length) {
            parts.push(...facebookParts(album));
            continue;
        }
        const media = attachment.styles?.attachment?.media || attachment.media;
        if (media?.__typename === 'Video') {
            parts.push({ video: true, url: mediaURL(media.browser_native_sd_url) || mediaURL(media.browser_native_hd_url) });
        } else if (media?.__typename === 'Photo') {
            parts.push({ image: mediaURL(media.photo_image?.uri) || mediaURL(media.image?.uri) });
        } else if (media?.__typename === 'GenericAttachmentMedia' && attachment.target?.__typename === 'ExternalUrl') {
            parts.push({ image: mediaURL(media.large_share_image?.uri) });
        }
    }
    return parts;
}

const metaCode = (url, routes) => routes.exec(url.pathname)?.[1];
const threadRoute = /^\/(?:@[^/]+\/post|t)\/([\w-]+)\/?$/;
const instagramRoute = /^\/(?:[\w.-]+\/)?(?:p|reel|tv)\/([\w-]+)\/?$/;
const facebookRoute = /^\/[\w.-]+\/posts\/(?:[^/]+\/)?((?:\d+|pfbid[\w]+))\/?$/i;

function matchMetaPost($, code, maxBytes) {
    const parts = [];
    let found = false;
    for (const item of postObjects($)) {
        if ((item.code === code || item.shortcode === code)
            && [1, 2, 8].includes(item.media_type)
            && (item.image_versions2 || item.video_versions || item.carousel_media)) {
            found = true;
            parts.push(...metaParts(item, maxBytes));
        }
    }
    return found ? selectPostMedia(parts) : null;
}

async function readPrimaryMedia(link, maxBytes = 20 * MIB) {
    const original = new URL(link.url);
    const threads = link.extractor === 'threads';
    const instagram = link.extractor === 'instagram.*';
    const route = threads ? threadRoute : instagram ? instagramRoute : facebookRoute;
    const code = metaCode(original, route);
    if (!threads && !code) return null;
    const hosts = threads ? threadsHosts : instagram ? instagramHosts : facebookHosts;
    const allowed = url => hosts.includes(url.hostname)
        && (code ? metaCode(url, route) === code : (threadRoute.test(url.pathname) || /^\/share\/[\w-]+\/?$/.test(url.pathname)));
    const bytes = 3 * MIB;
    const { response, url } = await fetchBounded(original.href, allowed, { headers: crawlerHeaders, signal: AbortSignal.timeout(10_000), bytes });
    const html = await readBody(response, bytes);
    const $ = load(html.toString('utf8'), { scriptingEnabled: false });
    if (threads || instagram) {
        const canonical = $('meta[property="og:url"]').first().attr('content');
        const canonicalURL = safeURL(canonical, allowed);
        const postCode = code || metaCode(new URL(url), route) || (canonicalURL && metaCode(canonicalURL, route));
        const media = postCode && matchMetaPost($, postCode, maxBytes);
        return media || (instagram && /\/reel\//.test(original.pathname) ? null : { kind: 'unavailable' });
    }
    const parts = [];
    let found = false;
    for (const item of postObjects($)) {
        if (String(item.post_id) !== code || !Array.isArray(item.attachments)) continue;
        found = true;
        parts.push(...facebookParts(item.attachments));
    }
    return found ? selectPostMedia(parts) : { kind: 'unavailable' };
}

async function postVideoLength(url) {
    const { response } = await fetchBounded(url, target => Boolean(mediaURL(target)), {
        method: 'HEAD', signal: AbortSignal.timeout(5000), bytes: Infinity,
    });
    return Number(response.headers.get('content-length'));
}

async function downloadPostVideo(url, file, maxBytes, signal = AbortSignal.timeout(30_000)) {
    const { response } = await fetchBounded(url, target => Boolean(mediaURL(target)), {
        signal, bytes: maxBytes,
    });
    await pipeline(limitBytes(response.body, maxBytes), createWriteStream(file));
}

async function downloadPostImages(urls, directory) {
    const images = [];
    const signal = AbortSignal.timeout(18_000);
    const bytes = 3 * MIB;
    for (const url of urls) {
        const { response } = await fetchBounded(url, target => Boolean(mediaURL(target)), {
            headers: { accept: 'image/jpeg,image/png' }, signal, bytes,
        });
        const data = await readBody(response, bytes);
        const isJpeg = data.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]));
        const isPng = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        if (!isJpeg && !isPng) throw new Error('Unsupported photo encoding');
        const name = `social-photo-${images.length + 1}.${isJpeg ? 'jpg' : 'png'}`;
        const file = join(directory, name);
        await writeFile(file, data);
        images.push({ file, name, contentType: isJpeg ? 'image/jpeg' : 'image/png' });
    }
    return images;
}

module.exports = { readPrimaryMedia, postVideoLength, downloadPostVideo, downloadPostImages };
