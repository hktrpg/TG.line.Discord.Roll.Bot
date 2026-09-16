'use strict';

const {
    processImageBuffer,
    signAssetUrl,
    verifyAssetSignature,
    resolveAssetPath,
    COVER_MAX_BYTES,
} = require('../modules/session-log/session-log-assets.js');

describe('session-log assets', () => {
    test('rejects non-image buffers', async () => {
        const result = await processImageBuffer(Buffer.from('not-an-image'), 'cover');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('INVALID_MIME');
    });

    test('rejects oversized buffer before decode', async () => {
        const huge = Buffer.alloc(COVER_MAX_BYTES + 1, 1);
        const result = await processImageBuffer(huge, 'cover');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('FILE_TOO_LARGE');
    });

    test('signs and verifies asset urls', () => {
        const secret = 'test-secret';
        const url = signAssetUrl(secret, 'owner1', 'abc-cover.webp', 600);
        const parsed = new URL(url, 'http://localhost');
        expect(verifyAssetSignature(
            secret,
            'owner1',
            'abc-cover.webp',
            parsed.searchParams.get('exp'),
            parsed.searchParams.get('sig'),
        )).toBe(true);
        expect(verifyAssetSignature(
            secret,
            'owner1',
            'abc-cover.webp',
            String(Math.floor(Date.now() / 1000) - 10),
            parsed.searchParams.get('sig'),
        )).toBe(false);
    });

    test('resolveAssetPath blocks path traversal', () => {
        expect(resolveAssetPath('owner1', '../etc/passwd')).toBeNull();
        expect(resolveAssetPath('owner1', '..\\secret')).toBeNull();
    });

    test('processes a real png with sharp when available', async () => {
        let sharp;
        try {
            sharp = require('sharp');
        } catch {
            return;
        }
        const png = await sharp({
            create: {
                width: 32,
                height: 48,
                channels: 3,
                background: { r: 20, g: 40, b: 60 },
            },
        }).png().toBuffer();
        const result = await processImageBuffer(png, 'cover');
        expect(result.ok).toBe(true);
        expect(result.variants.length).toBe(2);
        expect(result.hash).toHaveLength(16);
    });
});
