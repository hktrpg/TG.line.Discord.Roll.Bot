'use strict';

const { marked } = require('marked');
const { collectPlayerNames } = require('./build-work.js');

/**
 * Parse Markdown into session-log events using marked.lexer tokens.
 * @param {string} content
 * @returns {{ events: object[], playerNames: string[], sourceMeta: object, warnings: string[] }}
 */
function parseMarkdown(content) {
    const text = String(content || '').replaceAll('\r\n', '\n');
    const warnings = [];
    const events = [];
    let index = 0;

    const nextId = () => {
        index += 1;
        return `e${String(index).padStart(4, '0')}`;
    };

    let tokens;
    try {
        tokens = marked.lexer(text, { gfm: true });
    } catch (error) {
        return {
            events: [],
            playerNames: [],
            sourceMeta: { platform: 'markdown' },
            warnings: [`Markdown parse failed: ${error.message}`],
        };
    }

    const pushParagraph = (raw) => {
        const block = String(raw || '').trim();
        if (!block) return;

        const sayMatch = block.match(/^([^：:\n]{1,40})[：:]\s*([\s\S]+)$/);
        if (sayMatch && !sayMatch[1].startsWith('http') && !/\s/.test(sayMatch[1])) {
            events.push({
                id: nextId(),
                type: 'say',
                name: sayMatch[1].trim().slice(0, 100),
                text: sayMatch[2].trim().slice(0, 8000),
            });
            return;
        }

        const bracketSay = block.match(/^「([^」]{1,40})」\s*([\s\S]+)$/);
        if (bracketSay) {
            events.push({
                id: nextId(),
                type: 'say',
                name: bracketSay[1].trim().slice(0, 100),
                text: bracketSay[2].trim().slice(0, 8000),
            });
            return;
        }

        events.push({
            id: nextId(),
            type: 'narration',
            name: 'KP',
            text: block.slice(0, 8000),
        });
    };

    for (const token of tokens) {
        if (!token || !token.type) continue;
        switch (token.type) {
            case 'heading': {
                events.push({
                    id: nextId(),
                    type: 'scene',
                    title: String(token.text || '').trim().slice(0, 300),
                });
                break;
            }
            case 'paragraph': {
                const imageOnly = String(token.text || '').match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
                if (imageOnly) {
                    events.push({
                        id: nextId(),
                        type: 'reference',
                        name: '',
                        text: imageOnly[1] || '',
                        url: imageOnly[2],
                        caption: imageOnly[1] || '',
                        mime: 'image',
                    });
                } else {
                    pushParagraph(token.text);
                }
                break;
            }
            case 'blockquote': {
                const quoteText = Array.isArray(token.tokens)
                    ? token.tokens.map((item) => item.text || item.raw || '').join('\n')
                    : (token.text || token.raw || '');
                events.push({
                    id: nextId(),
                    type: 'ooc',
                    name: 'OOC',
                    text: String(quoteText).replaceAll(/^>\s?/gm, '').trim().slice(0, 8000),
                });
                break;
            }
            case 'list': {
                const items = (token.items || []).map((item) => item.text || '').filter(Boolean);
                if (items.length > 0) {
                    pushParagraph(items.join('\n'));
                }
                break;
            }
            case 'space':
                break;
            default: {
                if (token.text) pushParagraph(token.text);
                else warnings.push(`Skipped markdown token: ${token.type}`);
            }
        }
    }

    // Standalone image tokens (marked sometimes emits image inside paragraph)
    if (events.length === 0) {
        warnings.push('No content parsed from Markdown');
    }

    return {
        events,
        playerNames: collectPlayerNames(events),
        sourceMeta: { platform: 'markdown' },
        warnings,
    };
}

module.exports = { parseMarkdown };
