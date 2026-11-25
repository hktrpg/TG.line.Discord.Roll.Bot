'use strict';

const { mkdtemp, readFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { readPrimaryMedia, downloadPostImages } = require('../modules/chat/social-post-media');

const photo = 'https://scontent.cdninstagram.com/target.jpg';
const other = 'https://scontent.cdninstagram.com/reply.mp4';
const video = 'https://scontent.cdninstagram.com/target.mp4';

function page(data) {
    return new Response(`<script type="application/json">${JSON.stringify(data)}</script>`);
}

function image(url) {
    return { media_type: 1, image_versions2: { candidates: [{ url }] } };
}

function clip(url) {
    return { media_type: 2, video_versions: [{ url }] };
}

afterEach(() => jest.restoreAllMocks());

test('resolves a Threads share and chooses its video even when a photo comes first', async () => {
    const fetcher = jest.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/@author/post/target' } }))
        .mockResolvedValueOnce(page({
            reply: { code: 'reply', ...clip(other) },
            post: { code: 'target', media_type: 8, carousel_media: [image(photo), clip(video)] },
        }));
    await expect(readPrimaryMedia({ url: 'https://www.threads.com/share/short', extractor: 'threads' }))
        .resolves.toEqual({ kind: 'video', url: video });
    expect(fetcher).toHaveBeenCalledTimes(2);
});

test('returns only images from a photo-only post even when replies and quotes contain video', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(page({
        reply: { code: 'reply', ...clip(other) },
        post: { code: 'target', ...image(photo), text_post_app_info: { share_info: { quoted_post: clip(other) } } },
    }));
    await expect(readPrimaryMedia({ url: 'https://www.threads.com/@author/post/target', extractor: 'threads' }))
        .resolves.toEqual({ kind: 'images', urls: [photo] });
});

test('prefers an Instagram Reel video to its cover image', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(page({
        node: { code: 'target', ...image(photo), ...clip(video) },
    }));
    await expect(readPrimaryMedia({ url: 'https://www.instagram.com/reel/target/', extractor: 'instagram.*' }))
        .resolves.toEqual({ kind: 'video', url: video });
});

test('selects the highest compatible rendition whose video and audio together fit the upload limit', async () => {
    const small = 'https://scontent.cdninstagram.com/small.mp4';
    const audio = 'https://scontent.cdninstagram.com/audio.m4a';
    const manifest = `<MPD type="static"><Period>
        <AdaptationSet contentType="video">
          <Representation codecs="avc1.10" bandwidth="2" FBContentLength="23000000"><BaseURL>${video}</BaseURL></Representation>
          <Representation codecs="avc1.10" bandwidth="1" FBContentLength="5000000"><BaseURL>${small}</BaseURL></Representation>
        </AdaptationSet>
        <AdaptationSet contentType="audio">
          <Representation codecs="mp4a.40.5" FBContentLength="600000"><BaseURL>${audio}</BaseURL></Representation>
        </AdaptationSet>
    </Period></MPD>`;
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(page({
        node: { code: 'target', ...clip(video), video_dash_manifest: manifest },
    }));
    await expect(readPrimaryMedia({ url: 'https://www.instagram.com/reel/target/', extractor: 'instagram.*' }))
        .resolves.toEqual({ kind: 'video', url: video, tracks: { video: small, audio } });
});

test('uses the Facebook main post card image instead of a different story video or Open Graph thumbnail', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(page({
        related: {
            post_id: '555', attachments: [{ media: { __typename: 'Video', browser_native_sd_url: other } }],
        },
        story: {
            post_id: '123', attachments: [{
                target: { __typename: 'ExternalUrl' },
                styles: { attachment: { media: { __typename: 'GenericAttachmentMedia', large_share_image: { uri: photo } } } },
            }],
        },
    }));
    await expect(readPrimaryMedia({ url: 'https://www.facebook.com/page/posts/123/', extractor: 'facebook.*' }))
        .resolves.toEqual({ kind: 'images', urls: [photo] });
});

test('does not substitute the video thumbnail if the post says it has a video and its URL is unavailable', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(page({
        node: { code: 'target', media_type: 8, carousel_media: [image(photo), clip('https://unrelated.example/video.mp4')] },
    }));
    await expect(readPrimaryMedia({ url: 'https://www.threads.com/@author/post/target', extractor: 'threads' }))
        .resolves.toMatchObject({ kind: 'video' });
});

test('reads X photos from the requested public post and ignores the quoted post', async () => {
    const url = 'https://pbs.twimg.com/media/target.jpg';
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({
        id_str: '123',
        mediaDetails: [{ type: 'photo', media_url_https: url }, { type: 'photo', media_url_https: 'https://unrelated.example/photo.jpg' }],
        quoted_tweet: { mediaDetails: [{ type: 'photo', media_url_https: 'https://pbs.twimg.com/media/quote.jpg' }] },
    }));
    await expect(readPrimaryMedia({ url: 'https://x.com/user/status/123/photo/1', extractor: 'twitter.*' }))
        .resolves.toEqual({ kind: 'images', urls: [url] });
});

test('chooses a bounded X MP4 rendition ahead of any attached photo', async () => {
    const url = 'https://video.twimg.com/clip/small.mp4';
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({
        id_str: '123',
        mediaDetails: [
            { type: 'photo', media_url_https: 'https://pbs.twimg.com/media/target.jpg' },
            { type: 'video', video_info: { duration_millis: 20_000, variants: [
                { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/clip/master.m3u8' },
                { content_type: 'video/mp4', bitrate: 5_000_000, url: 'https://video.twimg.com/clip/big.mp4' },
                { content_type: 'video/mp4', bitrate: 500_000, url },
            ] } },
        ],
    }));
    await expect(readPrimaryMedia({ url: 'https://x.com/user/status/123', extractor: 'twitter.*' }, 2 * 1024 * 1024))
        .resolves.toEqual({ kind: 'video', url, duration: 20 });
});

test('keeps only the main Reddit embed images in album order', async () => {
    const first = 'https://preview.redd.it/post-1.jpg?width=640&auto=webp';
    const second = 'https://i.redd.it/post-2.png';
    const html = `
      <div id="t3_other-embed-wrapper"><div id="embed-container">
          <shreddit-aspect-ratio><img src="https://i.redd.it/other.jpg"></shreddit-aspect-ratio>
      </div></div>
      <div id="t3_abc-embed-wrapper"><div id="embed-container">
          <img src="https://i.redd.it/avatar.jpg">
          <shreddit-aspect-ratio><img src="${first}"><img src="${second}"></shreddit-aspect-ratio>
          <shreddit-aspect-ratio><img src="https://unrelated.example/photo.jpg"></shreddit-aspect-ratio>
      </div></div>`;
    const fetcher = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(html));
    await expect(readPrimaryMedia({ url: 'https://www.reddit.com/r/aww/comments/abc/album/', extractor: 'reddit' }))
        .resolves.toEqual({ kind: 'images', urls: [first, second] });
    expect(fetcher).toHaveBeenCalledWith('https://embed.reddit.com/r/aww/comments/abc/album/', expect.anything());
});

test('selects a native Reddit video and its separate audio without opening foreign tracks', async () => {
    const html = `<div id="t3_abc-embed-wrapper"><div id="embed-container">
      <shreddit-player post-id="t3_abc" src="https://v.redd.it/clip/HLSPlaylist.m3u8?f=hd"></shreddit-player>
    </div></div>`;
    const manifest = `<MPD type="static" mediaPresentationDuration="PT1M2.5S"><Period><AdaptationSet>
      <Representation codecs="avc1.123" bandwidth="300000"><BaseURL>DASH_360.mp4</BaseURL></Representation>
      <Representation codecs="avc1.123" bandwidth="1000000"><BaseURL>https://unrelated.example/clip.mp4</BaseURL></Representation>
      <Representation codecs="mp4a.40.2" bandwidth="128000"><BaseURL>audio</BaseURL></Representation>
    </AdaptationSet></Period></MPD>`;
    const fetcher = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(html)).mockResolvedValueOnce(new Response(manifest));
    await expect(readPrimaryMedia({ url: 'https://www.reddit.com/r/aww/comments/abc/video/', extractor: 'reddit' }))
        .resolves.toEqual({
            kind: 'video', duration: 62.5,
            tracks: { video: 'https://v.redd.it/clip/DASH_360.mp4', audio: 'https://v.redd.it/clip/audio' },
        });
    expect(fetcher).toHaveBeenNthCalledWith(2, 'https://v.redd.it/clip/DASHPlaylist.mpd', expect.anything());
});

test('validates CDN redirects and writes only supported image formats within the file-size limit', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'test-social-photo-'));
    try {
        const fetcher = jest.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://unrelated.example/file.jpg' } }))
            .mockResolvedValueOnce(new Response(null, { headers: { 'content-length': String(4 * 1024 * 1024) } }))
            .mockResolvedValueOnce(new Response(Buffer.from([255, 216, 255, 1])));
        await expect(downloadPostImages([photo], directory)).rejects.toThrow('Unexpected media host');
        expect(fetcher).toHaveBeenCalledTimes(1);
        await expect(downloadPostImages([photo], directory)).rejects.toThrow('too large');
        const [attachment] = await downloadPostImages([photo], directory);
        expect(attachment).toMatchObject({ name: 'social-photo-1.jpg', contentType: 'image/jpeg' });
        await expect(readFile(attachment.file)).resolves.toEqual(Buffer.from([255, 216, 255, 1]));
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
