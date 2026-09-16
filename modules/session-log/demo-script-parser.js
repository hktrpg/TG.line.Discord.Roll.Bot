'use strict';

/**
 * Parse screenplay-style demo scripts into session-log events.
 *
 * Format:
 *   【場景標題】
 *   旁白段落（無引號）
 *   「對話內容」——角色名
 *   （KP：玩家外資訊）
 *   〔角色名　技能名　1d100 → 42　成功〕
 *   📎 參考標題
 *   > 可展開的附件內容（可多行）
 */
function parseDiceLine(line) {
    const inner = line.slice(1, -1);
    const arrow = inner.match(/^(.+?)\s+(\S+)\s+→\s+(\S+)\s+(.+)$/u);
    if (arrow) {
        const namePart = arrow[1].trim();
        const split = namePart.split(/\s{2,}|\u3000/u);
        const name = split[0] || '';
        const label = split.slice(1).join(' ') || '';
        return {
            type: 'dice',
            name,
            label,
            expr: arrow[2],
            result: arrow[3],
            verdict: arrow[4],
        };
    }
    return { type: 'system', text: inner };
}

function readReferenceBody(lines, startIndex) {
    const bodyLines = [];
    let index = startIndex;
    while (index < lines.length) {
        const next = lines[index].trim();
        if (!next) {
            break;
        }
        if (!next.startsWith('>')) {
            break;
        }
        bodyLines.push(next.replace(/^>\s?/u, ''));
        index += 1;
    }
    return { body: bodyLines.join('\n').trim(), nextIndex: index };
}

function parseDemoScript(script) {
    const events = [];
    const lines = String(script).split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex].trim();
        if (!line) {
            continue;
        }

        const scene = line.match(/^【(.+)】$/u);
        if (scene) {
            events.push({ type: 'scene', title: scene[1] });
            continue;
        }

        const say = line.match(/^「(.+?)」[—\-－―]+(.+)$/u);
        if (say) {
            events.push({ type: 'say', name: say[2].trim(), text: say[1] });
            continue;
        }

        const ooc = line.match(/^（([^：:]+)[：:](.+?)）$/u);
        if (ooc) {
            events.push({ type: 'ooc', name: ooc[1].trim(), text: ooc[2].trim() });
            continue;
        }

        if (line.startsWith('〔') && line.endsWith('〕')) {
            events.push(parseDiceLine(line));
            continue;
        }

        if (line.startsWith('📎')) {
            const { body, nextIndex } = readReferenceBody(lines, lineIndex + 1);
            lineIndex = nextIndex - 1;
            events.push({
                type: 'reference',
                caption: line.replace(/^📎\s*/u, '').trim(),
                url: '',
                body,
            });
            continue;
        }

        events.push({ type: 'narration', text: line });
    }

    return events;
}

function scriptCharCount(script) {
    return String(script).replaceAll(/\s/gu, '').length;
}

function eventsCharCount(events) {
    return events.reduce((sum, ev) => {
        if (ev.type === 'say') {
            return sum + (ev.text || '').length;
        }
        if (ev.type === 'narration') {
            return sum + (ev.text || '').length;
        }
        if (ev.type === 'ooc') {
            return sum + (ev.text || '').length;
        }
        if (ev.type === 'scene') {
            return sum + (ev.title || '').length;
        }
        if (ev.type === 'reference') {
            return sum + (ev.caption || '').length + (ev.body || '').length;
        }
        return sum;
    }, 0);
}

module.exports = {
    parseDemoScript,
    scriptCharCount,
    eventsCharCount,
};
