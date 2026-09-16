'use strict';

const { collectPlayerNames } = require('./build-work.js');

// LINE official export (common formats):
// 2024/03/12（火）
// 10:00\tName\ttext
// or: 2018.01.01 星期一
const DATE_HEADER_RE = /^(\d{4}[/.-]\d{1,2}[/.-]\d{1,2})/;
const MSG_TAB_RE = /^(\d{1,2}:\d{2})\t([^\t]+)\t([\s\S]*)$/;
const MSG_SPACE_RE = /^(\d{1,2}:\d{2})\s+([^\s]+)\s+([\s\S]+)$/;
const MEDIA_HINTS = /^(\[?(?:Photo|Image|Sticker|File|影片|圖片|照片|貼圖|檔案)\]?)$/i;

/**
 * @param {string} content
 * @returns {{ events: object[], playerNames: string[], sourceMeta: object, warnings: string[] }}
 */
function parseLine(content) {
    const text = String(content || '').replaceAll('\r\n', '\n');
    const warnings = [];
    const events = [];
    let index = 0;
    let skipped = 0;
    let currentDate = '';
    let chatName = '';

    const nextId = () => {
        index += 1;
        return `e${String(index).padStart(4, '0')}`;
    };

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (!line.trim()) continue;

        if (i < 3 && (/^\[LINE\]/i.test(line) || /儲存日期|Saved on/i.test(line))) {
            continue;
        }
        if (i < 5 && !DATE_HEADER_RE.test(line) && !MSG_TAB_RE.test(line) && line.length < 80) {
            if (!chatName && !/^\d/.test(line)) {
                chatName = line.trim();
                continue;
            }
        }

        const dateMatch = line.match(DATE_HEADER_RE);
        if (dateMatch && !MSG_TAB_RE.test(line) && !MSG_SPACE_RE.test(line)) {
            currentDate = dateMatch[1];
            continue;
        }

        const tabMatch = line.match(MSG_TAB_RE) || line.match(MSG_SPACE_RE);
        if (!tabMatch) {
            skipped += 1;
            continue;
        }

        const time = tabMatch[1];
        const name = tabMatch[2].trim().slice(0, 100);
        const body = (tabMatch[3] || '').trim();
        const dateStr = currentDate ? `${currentDate} ${time}` : time;
        const parsed = Date.parse(dateStr.replaceAll('.', '/'));
        const timestamp = Number.isFinite(parsed) ? parsed : undefined;

        if (!body || MEDIA_HINTS.test(body)) {
            events.push({
                id: nextId(),
                type: 'reference',
                name,
                text: body || 'media',
                url: '',
                caption: body || 'media',
                mime: 'media',
                timestamp,
            });
            continue;
        }

        events.push({
            id: nextId(),
            type: 'say',
            name,
            text: body.slice(0, 8000),
            timestamp,
        });
    }

    if (skipped > 0) {
        warnings.push(`Skipped ${skipped} unrecognized line(s)`);
    }
    if (events.length === 0) {
        warnings.push('No messages parsed from LINE export');
    }

    return {
        events,
        playerNames: collectPlayerNames(events),
        sourceMeta: {
            platform: 'line',
            chatName: chatName || undefined,
        },
        warnings,
    };
}

module.exports = { parseLine };
