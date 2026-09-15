/**
 * Session log reader layouts (subset of temp/session-log-gallery.html).
 */
const SessionLogReader = {
    THEMES: [
        { id: 'kakuyomu', skin: 'skin-kakuyomu', layout: 'prose' },
        { id: 'kindle', skin: 'skin-kindle', layout: 'kindle' },
        { id: 'discord', skin: 'skin-discord', layout: 'discord' },
        { id: 'term', skin: 'skin-term', layout: 'term' },
    ],

    t(key, options) {
        if (typeof window.wwwT === 'function') {
            return window.wwwT(key, options);
        }
        return key;
    },

    themeLabel(themeId) {
        return this.t(`trpg_theme_${themeId}`);
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

    filterEvents(events, settings) {
        if (!Array.isArray(events)) return [];
        return events.filter((event) => {
            if (settings?.hideOOC && event.type === 'ooc') return false;
            if (settings?.hideDice && event.type === 'dice') return false;
            return true;
        });
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
            const label = event.caption || event.text || this.t('trpg_reader_reference');
            const link = event.url
                ? `<a href="${this.esc(event.url)}" target="_blank" rel="noopener">${this.esc(label)}</a>`
                : this.esc(label);
            return `<p class="reference">📎 ${link}</p>`;
        }
        return '';
    },

    renderProse(log, events) {
        const body = events.map((e) => this.renderEvent(e)).join('');
        return `<div class="inner"><h1>${this.esc(log.title)}</h1><div class="head-meta">${this.esc(log.subtitle || '')}　${this.esc(log.sessionDate || '')}</div>${body}</div>`;
    },

    renderKindle(log, events) {
        const body = events.map((e) => this.renderEvent(e)).join('');
        return `<div class="progress"><span></span></div><div class="inner"><h1>${this.esc(log.title)}</h1><div class="head-meta">${this.esc(log.sessionDate || '')} · ${this.esc(log.location || '')}</div>${body}</div>`;
    },

    renderDiscord(log, events) {
        const msgs = events.map((event, i) => {
            const who = event.name || (event.type === 'scene' ? this.t('trpg_reader_scene') : this.t('trpg_reader_system'));
            const text = event.type === 'scene'
                ? (event.title || '')
                : (event.text || event.caption || this.diceText(event));
            const hue = (who.codePointAt(0) || 0) * 17 % 360;
            return `<div class="msg"><div class="av" style="background:hsl(${hue} 35% 42%)"></div><div><div><span class="nm">${this.esc(who)}</span><span class="tm">#${i + 1}</span></div><div class="tx">${this.esc(text)}</div></div></div>`;
        }).join('');
        return `<div class="chat">${msgs}</div>`;
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

    render(log, themeId) {
        const theme = this.THEMES.find((t) => t.id === themeId) || this.THEMES[0];
        const events = this.filterEvents(log.events || [], log.settings);
        let inner;
        switch (theme.layout) {
            case 'prose':
                inner = this.renderProse(log, events);
                break;
            case 'kindle':
                inner = this.renderKindle(log, events);
                break;
            case 'discord':
                inner = this.renderDiscord(log, events);
                break;
            default:
                inner = this.renderTerm(log, events);
                break;
        }
        return { theme, html: `<div class="page ${theme.skin}">${inner}</div>` };
    },
};

window.SessionLogReader = SessionLogReader;
