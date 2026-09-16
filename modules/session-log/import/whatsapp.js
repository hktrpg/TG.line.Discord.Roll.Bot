'use strict';

const { collectPlayerNames } = require('./build-work.js');

// Common WhatsApp export formats:
// [12/3/24, 10:00:00 AM] Name: text
// 12/3/24, 10:00 - Name: text
const LINE_RE = /^(?:\[)?(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)(?:\])?\s*[-–]?\s*([^:：\]]+)[:：]\s*([\s\S]*)$/;
const ATTACHMENT_RE = /^(?:<attached:\s*(.+)>)|(?:(.+)\s+\(file attached\))$/i;
const SYSTEM_HINTS = /^(Messages and calls|訊息與通話|You created|你已建立|Messages to this)/i;

/**
 * @param {string} content
 * @returns {{ events: object[], playerNames: string[], sourceMeta: object, warnings: string[] }}
 */
function parseWhatsApp(content) {
    const text = String(content || '').replaceAll('\r\n', '\n');
    const warnings = [];
    const events = [];
    let index = 0;
    let skipped = 0;
    let chatName = '';

    const nextId = () => {
        index += 1;
        return `e${String(index).padStart(4, '0')}`;
    };

    const lines = text.split('\n');
    let current = null;

    const flush = () => {
        if (!current) return;
        const body = current.text.trim();
        if (!body) {
            current = null;
            return;
        }
        if (SYSTEM_HINTS.test(body)) {
            skipped += 1;
            current = null;
            return;
        }
        const attach = body.match(ATTACHMENT_RE);
        if (attach) {
            const filename = (attach[1] || attach[2] || 'attachment').trim();
            events.push({
                id: nextId(),
                type: 'reference',
                name: current.name,
                text: filename,
                url: '',
                caption: filename,
                mime: 'attachment',
                timestamp: current.timestamp,
            });
        } else {
            events.push({
                id: nextId(),
                type: 'say',
                name: current.name,
                text: body.slice(0, 8000),
                timestamp: current.timestamp,
            });
        }
        current = null;
    };

    for (const raw of lines) {
        const line = raw.trimEnd();
        if (!line.trim()) continue;
        const match = line.match(LINE_RE);
        if (match) {
            flush();
            const name = match[3].trim().slice(0, 100);
            const body = match[4] || '';
            const dateStr = `${match[1]} ${match[2]}`;
            const parsed = Date.parse(dateStr);
            current = {
                name,
                text: body,
                timestamp: Number.isFinite(parsed) ? parsed : undefined,
            };
            continue;
        }
        if (current) {
            current.text += `\n${line}`;
        } else if (/^WhatsApp Chat with /i.test(line)) {
            chatName = line.replace(/^WhatsApp Chat with /i, '').trim();
        } else {
            skipped += 1;
        }
    }
    flush();

    if (skipped > 0) {
        warnings.push(`Skipped ${skipped} unrecognized line(s)`);
    }
    if (events.length === 0) {
        warnings.push('No messages parsed from WhatsApp export');
    }

    return {
        events,
        playerNames: collectPlayerNames(events),
        sourceMeta: {
            platform: 'whatsapp',
            chatName: chatName || undefined,
        },
        warnings,
    };
}

module.exports = { parseWhatsApp };
