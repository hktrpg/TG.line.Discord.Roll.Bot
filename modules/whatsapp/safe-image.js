'use strict';

const { pinnedFetchBuffer } = require('../roll-worker/safe-fetch');

// Download once through the validated, IP-pinned connection; do not refetch the URL.
async function fetchWhatsAppImage(url, MessageMedia) {
    if (typeof url !== 'string' || url.length > 2048) throw new Error('Invalid image URL');
    let parsed;
    try { parsed = new URL(url); } catch { throw new Error('Invalid image URL'); }
    const { buffer, contentType } = await pinnedFetchBuffer(parsed, 8 * 1024 * 1024);
    const mime = String(contentType).split(';')[0].trim().toLowerCase();
    if (!/^image\/(jpeg|png|gif|webp)$/.test(mime) || buffer.length === 0) throw new Error('Invalid image response');
    return new MessageMedia(mime, buffer.toString('base64'));
}

module.exports = { fetchWhatsAppImage };
