'use strict';

jest.mock('../modules/roll-worker/safe-fetch', () => ({ pinnedFetchBuffer: jest.fn() }));
const { pinnedFetchBuffer } = require('../modules/roll-worker/safe-fetch');
const { fetchWhatsAppImage } = require('../modules/whatsapp/safe-image');

test('WhatsApp uses the pinned download as the media payload', async () => {
    pinnedFetchBuffer.mockResolvedValue({ buffer: Buffer.from('image'), contentType: 'image/png; charset=binary' });
    const Media = jest.fn(function (mime, data) { this.mime = mime; this.data = data; });
    const result = await fetchWhatsAppImage('https://example.com/a.png', Media);
    expect(result).toEqual({ mime: 'image/png', data: Buffer.from('image').toString('base64') });
    expect(pinnedFetchBuffer).toHaveBeenCalledWith(expect.any(URL), 8 * 1024 * 1024);
});

test('WhatsApp rejects non-image, empty, and unsafe responses', async () => {
    pinnedFetchBuffer.mockResolvedValueOnce({ buffer: Buffer.from('x'), contentType: 'text/html' });
    await expect(fetchWhatsAppImage('https://example.com', jest.fn())).rejects.toThrow('Invalid image response');
    pinnedFetchBuffer.mockResolvedValueOnce({ buffer: Buffer.alloc(0), contentType: 'image/png' });
    await expect(fetchWhatsAppImage('https://example.com', jest.fn())).rejects.toThrow('Invalid image response');
    pinnedFetchBuffer.mockRejectedValueOnce(new Error('ssrf check failed'));
    await expect(fetchWhatsAppImage('http://127.0.0.1', jest.fn())).rejects.toThrow('ssrf check failed');
});
