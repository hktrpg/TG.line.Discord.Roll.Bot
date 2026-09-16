/**
 * Session log reader layouts (subset of temp/session-log-gallery.html).
 */
const SessionLogReader = {
    THEMES: [
        { id: 'kakuyomu', skin: 'skin-kakuyomu', layout: 'prose' },
        { id: 'kindle', skin: 'skin-kindle', layout: 'kindle' },
        { id: 'parchment', skin: 'skin-parchment', layout: 'prose' },
        { id: 'notion', skin: 'skin-notion', layout: 'prose' },
        { id: 'letter', skin: 'skin-letter', layout: 'letter' },
        { id: 'script', skin: 'skin-script', layout: 'script' },
        { id: 'discord', skin: 'skin-discord', layout: 'discord' },
        { id: 'chat', skin: 'skin-chat', layout: 'chat' },
        { id: 'term', skin: 'skin-term', layout: 'term' },
    ],

    DEFAULT_READER_SETTINGS: {
        fontSize: 18,
        pageWidth: '800',
        lineHeight: 'normal',
        fontFamily: 'serif',
        colorScheme: 'default',
        contentPadding: 'normal',
        hideOOC: false,
        hideDice: false,
        hideNarration: false,
        hideReferences: false,
        emphasizeScenes: true,
    },

    COLOR_SCHEMES: {
        default: null,
        paper: {
            bg: '#f7f1e4', fg: '#2c2416', muted: '#7a6b52', accent: '#8b5a3c',
            dice: '#7a4a32', border: '#d4c4a8', surface: 'rgba(255, 252, 245, 0.78)', swatch: '#f7f1e4',
        },
        sepia: {
            bg: '#f4ecd8', fg: '#5b4636', muted: '#8a7358', accent: '#9a6b42',
            dice: '#7a5a38', border: '#d8c8a8', surface: 'rgba(255, 248, 235, 0.82)', swatch: '#f4ecd8',
        },
        green: {
            bg: '#cfe8cf', fg: '#1f3d1f', muted: '#4a6b4a', accent: '#2d6a2d',
            dice: '#3d5c3d', border: '#a8c8a8', surface: 'rgba(255, 255, 255, 0.55)', swatch: '#cfe8cf',
        },
        gray: {
            bg: '#ececec', fg: '#2a2a2a', muted: '#666666', accent: '#444444',
            dice: '#555555', border: '#cccccc', surface: 'rgba(255, 255, 255, 0.7)', swatch: '#ececec',
        },
        amber: {
            bg: '#fff8e7', fg: '#3d2e1a', muted: '#8a7358', accent: '#c45c4a',
            dice: '#8a5a32', border: '#e8d8b8', surface: 'rgba(255, 252, 240, 0.85)', swatch: '#fff8e7',
        },
        rose: {
            bg: '#fdf2f0', fg: '#4a3030', muted: '#8a6060', accent: '#c45c6a',
            dice: '#9a4a52', border: '#e8c8c8', surface: 'rgba(255, 248, 248, 0.85)', swatch: '#fdf2f0',
        },
        lavender: {
            bg: '#f3f0ff', fg: '#2d2640', muted: '#6a5a8a', accent: '#6a4a9a',
            dice: '#5a4a7a', border: '#d0c8e8', surface: 'rgba(255, 252, 255, 0.82)', swatch: '#f3f0ff',
        },
        dark: {
            bg: '#1e1e1e', fg: '#d4d4d4', muted: '#9a9a9a', accent: '#c45c4a',
            dice: '#b0a080', border: '#3a3a3a', surface: 'rgba(32, 32, 32, 0.92)', swatch: '#1e1e1e',
        },
        blue: {
            bg: '#1e2433', fg: '#c8d0e0', muted: '#8a94a8', accent: '#6a8ac8',
            dice: '#90a8c8', border: '#3a4458', surface: 'rgba(28, 34, 48, 0.92)', swatch: '#1e2433',
        },
        oled: {
            bg: '#000000', fg: '#e0e0e0', muted: '#888888', accent: '#c45c4a',
            dice: '#a0a080', border: '#2a2a2a', surface: 'rgba(16, 16, 16, 0.95)', swatch: '#000000',
        },
    },

    FONT_FACES: {
        serif: {
            family: "'Noto Serif TC', 'Source Serif 4', serif",
            google: 'Noto+Serif+TC:wght@400;600;700',
        },
        sans: {
            family: "'Noto Sans TC', sans-serif",
            google: 'Noto+Sans+TC:wght@400;500;700',
        },
        mincho: {
            family: "'Shippori Mincho', 'Noto Serif TC', serif",
            google: 'Shippori+Mincho:wght@400;500;700',
        },
        source: {
            family: "'Source Serif 4', 'Noto Serif TC', serif",
            google: 'Source+Serif+4:opsz,wght@8..60,400;8..60,600',
        },
        wenkai: {
            family: "'LXGW WenKai TC', 'Kaiti SC', serif",
            google: 'LXGW+WenKai+TC:wght@400;700',
        },
        oldmincho: {
            family: "'Zen Old Mincho', 'Noto Serif TC', serif",
            google: 'Zen+Old+Mincho:wght@400;700',
        },
        rounded: {
            family: "'Zen Maru Gothic', 'Noto Sans TC', sans-serif",
            google: 'Zen+Maru+Gothic:wght@400;500;700',
        },
        huninn: {
            family: "'Huninn', 'Noto Sans TC', sans-serif",
            google: 'Huninn:wght@400;700',
        },
        klee: {
            family: "'Klee One', 'Noto Sans TC', cursive",
            google: 'Klee+One:wght@400;600',
        },
        iansui: {
            family: "'Iansui', 'Noto Serif TC', cursive",
            google: 'Iansui:wght@400;700',
        },
        mono: {
            family: "'IBM Plex Mono', 'Noto Sans TC', monospace",
            google: 'IBM+Plex+Mono:wght@400;500',
        },
    },

    SETTING_OPTIONS: {
        lineHeight: ['compact', 'normal', 'relaxed'],
        fontFamily: [
            'serif', 'sans', 'mincho', 'source', 'wenkai', 'oldmincho',
            'rounded', 'huninn', 'klee', 'iansui', 'mono',
        ],
        contentPadding: ['cozy', 'normal', 'spacious'],
        pageWidth: ['auto', '520', '640', '800', '900', '1000', '1200'],
        colorScheme: [
            'default', 'paper', 'sepia', 'green', 'gray', 'amber',
            'rose', 'lavender', 'dark', 'blue', 'oled',
        ],
    },

    t(key, options) {
        if (typeof window !== 'undefined' && typeof window.wwwT === 'function') {
            return window.wwwT(key, options);
        }
        return key;
    },

    themeLabel(themeId) {
        return this.t(`trpg_theme_${themeId}`);
    },

    fontLabel(fontKey) {
        return this.t(`trpg_reader_font_${fontKey}`);
    },

    colorSchemeLabel(schemeKey) {
        return this.t(`trpg_reader_color_${schemeKey}`);
    },

    colorSchemeDef(schemeKey) {
        return this.COLOR_SCHEMES[schemeKey] ?? null;
    },

    isTintedColorScheme(schemeKey) {
        return Boolean(this.colorSchemeDef(schemeKey));
    },

    fontFamilyStack(fontKey) {
        const face = this.FONT_FACES[fontKey] || this.FONT_FACES.serif;
        return face.family;
    },

    ensureReaderFont(fontKey) {
        if (typeof document === 'undefined') return;
        const face = this.FONT_FACES[fontKey] || this.FONT_FACES.serif;
        if (!face.google) return;
        const id = `reader-font-${fontKey}`;
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${face.google}&display=swap`;
        document.head.append(link);
    },

    esc(s) {
        return String(s)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;');
    },

    diceText(event) {
        return `${event.name || ''}　${event.label || ''}　${event.expr || ''} → ${event.result || ''}　${event.verdict || ''}`.trim();
    },

    referenceBodyHtml(event) {
        const body = String(event.body || '').trim();
        if (!body) {
            return '';
        }
        return body
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => `<p>${this.esc(line)}</p>`)
            .join('');
    },

    renderReference(event) {
        const label = event.caption || event.text || this.t('trpg_reader_reference');
        const title = event.url
            ? `<a href="${this.esc(event.url)}" target="_blank" rel="noopener">${this.esc(label)}</a>`
            : this.esc(label);
        const bodyHtml = this.referenceBodyHtml(event);
        const urlBlock = event.url && !bodyHtml
            ? `<p><a href="${this.esc(event.url)}" target="_blank" rel="noopener">${this.esc(event.url)}</a></p>`
            : '';
        const expandable = Boolean(bodyHtml || event.url);

        if (!expandable) {
            return `<p class="reference">📎 ${title}</p>`;
        }

        const expand = this.t('trpg_reader_expand');
        const collapse = this.t('trpg_reader_collapse');
        return `<details class="reference-fold">
<summary class="reference-summary">
<span class="reference-mark" aria-hidden="true">📎</span>
<span class="reference-title">${title}</span>
<span class="reference-toggle ref-expand">${this.esc(expand)}</span>
<span class="reference-toggle ref-collapse">${this.esc(collapse)}</span>
</summary>
<div class="reference-body">${bodyHtml}${urlBlock}</div>
</details>`;
    },

    filterEvents(events, settings) {
        if (!Array.isArray(events)) return [];
        return events.filter((event) => {
            if (settings?.hideOOC && event.type === 'ooc') return false;
            if (settings?.hideDice && (event.type === 'dice' || event.type === 'system')) return false;
            if (settings?.hideNarration && event.type === 'narration') return false;
            if (settings?.hideReferences && event.type === 'reference') return false;
            return true;
        });
    },

    speakerHue(name) {
        const label = String(name || 'KP');
        return (label.codePointAt(0) || 0) * 17 % 360;
    },

    splitIntoChapters(events) {
        if (!Array.isArray(events) || events.length === 0) {
            return [{
                index: 0,
                title: this.t('trpg_reader_chapter_opening'),
                events: [],
            }];
        }

        const chapters = [];
        let current = {
            index: 0,
            title: this.t('trpg_reader_chapter_opening'),
            events: [],
        };

        for (const event of events) {
            if (event.type === 'scene') {
                if (current.events.length > 0) {
                    chapters.push(current);
                    current = {
                        index: chapters.length,
                        title: event.title || this.t('trpg_reader_scene'),
                        events: [event],
                    };
                } else {
                    current.title = event.title || current.title;
                    current.events.push(event);
                }
            } else {
                current.events.push(event);
            }
        }

        if (current.events.length > 0) {
            chapters.push(current);
        }

        return chapters.length > 0 ? chapters : [{
            index: 0,
            title: this.t('trpg_reader_chapter_opening'),
            events,
        }];
    },

    renderEvent(event) {
        if (event.type === 'scene') {
            return `<p class="scene">◆ ${this.esc(event.title || event.text || '')}</p>`;
        }
        if (event.type === 'narration') {
            return `<p>${this.esc(event.text || '')}</p>`;
        }
        if (event.type === 'say') {
            return `<p>「${this.esc(event.text || '')}」——<span class="who">${this.esc(event.name || '')}</span></p>`;
        }
        if (event.type === 'ooc') {
            return `<p class="ooc">（${this.esc(event.name || '')}：${this.esc(event.text || '')}）</p>`;
        }
        if (event.type === 'dice') {
            return `<p class="dice">〔${this.esc(this.diceText(event))}〕</p>`;
        }
        if (event.type === 'system') {
            return `<p class="dice">${this.esc(event.text || '')}</p>`;
        }
        if (event.type === 'reference') {
            return this.renderReference(event);
        }
        return '';
    },

    renderProse(log, events, options = {}) {
        const body = events.map((e) => this.renderEvent(e)).join('');
        const chapterTitle = options.chapterTitle
            ? `<h2 class="chapter-head">${this.esc(options.chapterTitle)}</h2>`
            : '';
        const showBookHead = options.showBookHead !== false && !options.chapterTitle;
        const head = showBookHead
            ? `<h1>${this.esc(log.title)}</h1><div class="head-meta">${this.esc(log.subtitle || '')}　${this.esc(log.sessionDate || '')}</div>`
            : '';
        return `<div class="inner reader-inner">${head}${chapterTitle}${body}</div>`;
    },

    renderKindle(log, events, options = {}) {
        const body = events.map((e) => this.renderEvent(e)).join('');
        const chapterTitle = options.chapterTitle
            ? `<h2 class="chapter-head">${this.esc(options.chapterTitle)}</h2>`
            : '';
        const showBookHead = options.showBookHead !== false && !options.chapterTitle;
        const head = showBookHead
            ? `<h1>${this.esc(log.title)}</h1><div class="head-meta">${this.esc(log.sessionDate || '')} · ${this.esc(log.location || '')}</div>`
            : '';
        return `<div class="progress"><span></span></div><div class="inner reader-inner">${head}${chapterTitle}${body}</div>`;
    },

    renderDiscord(log, events) {
        const msgs = events.map((event, i) => {
            const who = event.name || (event.type === 'scene' ? this.t('trpg_reader_scene') : this.t('trpg_reader_system'));
            let text = event.type === 'scene'
                ? (event.title || '')
                : (event.text || event.caption || this.diceText(event));
            if (event.type === 'reference' && event.body) {
                text = `${event.caption || text}\n${event.body}`;
            }
            const hue = (who.codePointAt(0) || 0) * 17 % 360;
            return `<div class="msg"><div class="av" style="background:hsl(${hue} 35% 42%)"></div><div><div><span class="nm">${this.esc(who)}</span><span class="tm">#${i + 1}</span></div><div class="tx">${this.esc(text)}</div></div></div>`;
        }).join('');
        return `<div class="chat">${msgs}</div>`;
    },

    renderScript(log, events, options = {}) {
        const blocks = events.map((event) => {
            if (event.type === 'scene') {
                return `<div class="script-scene">${this.esc(event.title || event.text || '')}</div>`;
            }
            if (event.type === 'narration') {
                return `<p class="script-action">${this.esc(event.text || '')}</p>`;
            }
            if (event.type === 'say') {
                return `<div class="script-block">
<div class="script-char">${this.esc(event.name || '')}</div>
<p class="script-dialogue">${this.esc(event.text || '')}</p>
</div>`;
            }
            if (event.type === 'ooc') {
                return `<p class="script-ooc">(${this.esc(event.name || '')}: ${this.esc(event.text || '')})</p>`;
            }
            if (event.type === 'dice' || event.type === 'system') {
                return `<p class="script-dice">[${this.esc(this.diceText(event) || event.text || '')}]</p>`;
            }
            if (event.type === 'reference') {
                return `<div class="script-ref">📎 ${this.esc(event.caption || event.text || '')}</div>`;
            }
            return '';
        }).join('');

        const chapterTitle = options.chapterTitle
            ? `<h2 class="chapter-head">${this.esc(options.chapterTitle)}</h2>`
            : '';
        const showBookHead = options.showBookHead !== false && !options.chapterTitle;
        const head = showBookHead
            ? `<header class="script-head"><h1>${this.esc(log.title)}</h1><p>${this.esc(log.sessionDate || '')}</p></header>`
            : '';
        return `<div class="inner reader-inner script-inner">${head}${chapterTitle}${blocks}</div>`;
    },

    renderLetter(log, events, options = {}) {
        const entries = events.map((event, index) => {
            const stamp = `${String(index + 1).padStart(2, '0')}:00`;
            if (event.type === 'scene') {
                return `<article class="letter-entry letter-scene"><time>${stamp}</time><h3>${this.esc(event.title || '')}</h3></article>`;
            }
            if (event.type === 'narration') {
                return `<article class="letter-entry"><time>${stamp}</time><p>${this.esc(event.text || '')}</p></article>`;
            }
            if (event.type === 'say') {
                return `<article class="letter-entry"><time>${stamp}</time><p><strong>${this.esc(event.name || '')}</strong> — ${this.esc(event.text || '')}</p></article>`;
            }
            if (event.type === 'ooc') {
                return `<article class="letter-entry letter-ooc"><time>${stamp}</time><p>（${this.esc(event.name || '')}：${this.esc(event.text || '')}）</p></article>`;
            }
            if (event.type === 'dice' || event.type === 'system') {
                return `<article class="letter-entry letter-dice"><time>${stamp}</time><p>${this.esc(this.diceText(event) || event.text || '')}</p></article>`;
            }
            if (event.type === 'reference') {
                return `<article class="letter-entry letter-ref"><time>${stamp}</time><p>📎 ${this.esc(event.caption || event.text || '')}</p></article>`;
            }
            return '';
        }).join('');

        const chapterTitle = options.chapterTitle
            ? `<h2 class="chapter-head">${this.esc(options.chapterTitle)}</h2>`
            : '';
        const showBookHead = options.showBookHead !== false && !options.chapterTitle;
        const head = showBookHead
            ? `<header class="letter-head"><h1>${this.esc(log.title)}</h1><p>${this.esc(log.subtitle || '')}</p></header>`
            : '';
        return `<div class="inner reader-inner letter-inner">${head}${chapterTitle}${entries}</div>`;
    },

    renderChat(log, events) {
        const rows = events.map((event, index) => {
            const who = event.name
                || (event.type === 'scene' ? this.t('trpg_reader_scene') : this.t('trpg_reader_system'));
            let text = '';
            switch (event.type) {
                case 'scene':
                    text = event.title || '';
                    break;
                case 'reference':
                    text = event.caption || event.body || event.url || '';
                    break;
                case 'dice':
                case 'system':
                    text = this.diceText(event) || event.text || '';
                    break;
                default:
                    text = event.text || '';
                    break;
            }
            const hue = this.speakerHue(who);
            const sceneClass = event.type === 'scene' ? ' chat-row-scene' : '';
            return `<div class="chat-row${sceneClass}">
<div class="chat-avatar" style="background:hsl(${hue} 42% 46%)">${this.esc(who.slice(0, 1))}</div>
<div class="chat-stack">
<div class="chat-meta"><span class="chat-name">${this.esc(who)}</span><span class="chat-time">#${index + 1}</span></div>
<div class="chat-bubble" style="--chat-hue:${hue}">${this.esc(text)}</div>
</div>
</div>`;
        }).join('');
        return `<div class="chat-feed">${rows}</div>`;
    },

    renderTerm(log, events) {
        let out = `# ${log.title}  ${log.sessionDate || ''}\n`;
        for (const [i, event] of events.entries()) {
            const ts = `23:${String(12 + i).padStart(2, '0')}`;
            switch (event.type) {
                case 'scene':
                    out += `${ts} *** ${event.title}\n`;
                    break;
                case 'narration':
                    out += `${ts} <KP> ${event.text}\n`;
                    break;
                case 'say':
                    out += `${ts} <${event.name}> ${event.text}\n`;
                    break;
                case 'ooc':
                    out += `${ts} -${event.name}- ${event.text}\n`;
                    break;
                case 'dice':
                    out += `${ts} *** ${this.diceText(event)}\n`;
                    break;
                case 'reference':
                    out += `${ts} *** REF ${event.caption || event.url}\n`;
                    break;
                default:
                    out += `${ts} *** ${event.text || ''}\n`;
                    break;
            }
        }
        return `<pre>${this.esc(out)}</pre>`;
    },

    surfaceVarValues(readerSettings = {}) {
        const settings = { ...this.DEFAULT_READER_SETTINGS, ...readerSettings };
        const fontSize = Number(settings.fontSize) || 18;
        const pageWidth = settings.pageWidth === 'auto'
            ? 'min(100%, 48rem)'
            : `${Number(settings.pageWidth) || 800}px`;
        const lineHeights = { compact: 1.45, normal: 1.85, relaxed: 2.5 };
        const paddings = { cozy: '1rem', normal: '2.5rem', spacious: '5rem' };
        const vars = {
            '--reader-font-size': `${fontSize}px`,
            '--reader-page-width': pageWidth,
            '--reader-line-height': String(lineHeights[settings.lineHeight] || lineHeights.normal),
            '--reader-font-family': this.fontFamilyStack(settings.fontFamily),
            '--reader-content-padding': paddings[settings.contentPadding] || paddings.normal,
        };
        const scheme = this.colorSchemeDef(settings.colorScheme);
        if (scheme) {
            vars['--reader-bg'] = scheme.bg;
            vars['--reader-fg'] = scheme.fg;
            vars['--reader-muted'] = scheme.muted;
            vars['--reader-accent'] = scheme.accent;
            vars['--reader-dice'] = scheme.dice;
            vars['--reader-border'] = scheme.border;
            vars['--reader-surface'] = scheme.surface;
        }
        return vars;
    },

    applySurfaceVars(hostEl, readerSettings = {}) {
        if (!hostEl) return;
        const settings = { ...this.DEFAULT_READER_SETTINGS, ...readerSettings };
        this.ensureReaderFont(settings.fontFamily);
        const vars = this.surfaceVarValues(settings);
        const colorKeys = [
            '--reader-bg', '--reader-fg', '--reader-muted', '--reader-accent',
            '--reader-dice', '--reader-border', '--reader-surface',
        ];
        for (const key of colorKeys) {
            if (vars[key]) {
                hostEl.style.setProperty(key, vars[key]);
            } else {
                hostEl.style.removeProperty(key);
            }
        }
        for (const [name, value] of Object.entries(vars)) {
            if (!colorKeys.includes(name)) {
                hostEl.style.setProperty(name, value);
            }
        }
        hostEl.classList.toggle('reader-tinted-host', this.isTintedColorScheme(settings.colorScheme));
    },

    render(log, themeId, options = {}) {
        const theme = this.THEMES.find((t) => t.id === themeId) || this.THEMES[0];
        const mergedSettings = {
            ...this.DEFAULT_READER_SETTINGS,
            ...log.settings,
            ...options.readerSettings,
        };
        const sourceEvents = options.events ?? log.events ?? [];
        const events = this.filterEvents(sourceEvents, mergedSettings);
        let inner;
        switch (theme.layout) {
            case 'prose':
                inner = this.renderProse(log, events, options);
                break;
            case 'kindle':
                inner = this.renderKindle(log, events, options);
                break;
            case 'script':
                inner = this.renderScript(log, events, options);
                break;
            case 'letter':
                inner = this.renderLetter(log, events, options);
                break;
            case 'discord':
                inner = this.renderDiscord(log, events);
                break;
            case 'chat':
                inner = this.renderChat(log, events);
                break;
            default:
                inner = this.renderTerm(log, events);
                break;
        }
        const tinted = this.isTintedColorScheme(mergedSettings.colorScheme) ? ' reader-tinted' : '';
        const extraClass = mergedSettings.emphasizeScenes ? ' reader-emphasize-scenes' : '';
        return {
            theme,
            html: `<div class="page ${theme.skin}${tinted}${extraClass}">${inner}</div>`,
        };
    },
};

if (typeof window !== 'undefined') {
    window.SessionLogReader = SessionLogReader;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionLogReader;
}
