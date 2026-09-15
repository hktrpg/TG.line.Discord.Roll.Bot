/* global CryptoJS */
/**
 * Client-side Discord export HTML decrypt (matches discordlog-new.html).
 */
const SessionLogDecrypt = {
    async gunzipBytes(bytes) {
        if (typeof DecompressionStream === 'function') {
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
            const ab = await new Response(stream).arrayBuffer();
            return new Uint8Array(ab);
        }
        throw new Error('DecompressionStream unavailable');
    },

    decryptLegacy(cipherText, normalizedKey) {
        const iv = CryptoJS.lib.WordArray.create(new Uint8Array(16));
        const keyWords = CryptoJS.enc.Utf8.parse(normalizedKey);
        const decrypted = CryptoJS.AES.decrypt(cipherText, keyWords, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        const jsonText = decrypted.toString(CryptoJS.enc.Utf8);
        if (!jsonText) return null;
        return JSON.parse(jsonText).map((item) => ({
            timestamp: item.t,
            contact: item.c,
            userName: item.u,
            isbot: item.b,
            attachments: item.a || [],
            embeds: item.e || [],
            reply_to: item.r || null,
        }));
    },

    async decryptV2(cipherText, normalizedKey) {
        const packed = Uint8Array.from(atob(cipherText.slice(4)), (c) => c.codePointAt(0));
        if (packed.length < 12 + 16 + 1) return null;
        const iv = packed.subarray(0, 12);
        const authTag = packed.subarray(12, 28);
        const ciphertext = packed.subarray(28);
        const keyBytes = new TextEncoder().encode(normalizedKey);
        const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
        const sealed = new Uint8Array(ciphertext.length + authTag.length);
        sealed.set(ciphertext, 0);
        sealed.set(authTag, ciphertext.length);
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, sealed);
        const gunzipped = await this.gunzipBytes(new Uint8Array(plainBuf));
        const jsonText = new TextDecoder().decode(gunzipped);
        return JSON.parse(jsonText).map((item) => {
            const reply = item.r;
            return {
                timestamp: item.t,
                contact: item.c,
                userName: item.u,
                isbot: item.b,
                attachments: item.a || [],
                embeds: item.e || [],
                reply_to: reply
                    ? {
                        contact: reply.c,
                        userName: reply.u,
                        isbot: reply.b,
                        attachments: reply.a || [],
                        embeds: reply.e || [],
                    }
                    : null,
            };
        });
    },

    async decryptPayload(cipherText, password) {
        if (!cipherText || !password) return null;
        const normalizedKey = password.padEnd(16, password).slice(0, 16);
        if (typeof cipherText === 'string' && cipherText.indexOf('v2g.') === 0) {
            return this.decryptV2(cipherText, normalizedKey);
        }
        return this.decryptLegacy(cipherText, normalizedKey);
    },

    extractAesDataFromHtml(htmlText) {
        const match = htmlText.match(/window\.aesData\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^;]+);/);
        if (!match) return null;
        const raw = match[0].replace(/^window\.aesData\s*=\s*/, '').replace(/;\s*$/, '');
        try {
            return JSON.parse(raw);
        } catch {
            return raw.replaceAll(/^["']|["']$/g, '');
        }
    },

    async parseExportHtmlFile(file, password) {
        const htmlText = await file.text();
        const aesData = this.extractAesDataFromHtml(htmlText);
        if (!aesData) {
            throw new Error('找不到 window.aesData，請確認是 .discord html 匯出檔');
        }
        const messages = await this.decryptPayload(aesData, password);
        if (!messages || messages.length === 0) {
            throw new Error('解密失敗，請確認密碼正確');
        }
        const titleMatch = htmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
        const channelName = titleMatch
            ? titleMatch[1].replace(/Discord.*分析.*/i, '').trim()
            : '';
        return { messages, channelName };
    },
};

window.SessionLogDecrypt = SessionLogDecrypt;
