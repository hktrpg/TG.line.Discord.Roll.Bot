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
