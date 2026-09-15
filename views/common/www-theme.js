/**
 * Shared light/dark theme for HKTRPG www pages (rollbot, hub, session logs).
 * Uses localStorage key "theme" — same as roll chat (index.html).
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'theme';
    const DEFAULT_THEME = 'light';

    function getTheme() {
        try {
            return global.localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
        } catch {
            return DEFAULT_THEME;
        }
    }

    function applyTheme(theme) {
        const next = theme === 'dark' ? 'dark' : 'light';
        global.document.documentElement.setAttribute('data-theme', next);
        try {
            global.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // ignore
        }
        updateThemeToggleButtons(next);
        global.document.dispatchEvent(new CustomEvent('wwwThemeChanged', { detail: { theme: next } }));
    }

    function toggleTheme() {
        applyTheme(getTheme() === 'light' ? 'dark' : 'light');
    }

    function themeLabel(theme) {
        const t = typeof global.wwwT === 'function' ? global.wwwT : null;
        if (theme === 'dark') {
            return t ? t('roll_light_mode') : 'Light mode';
        }
        return t ? t('roll_dark_mode') : 'Dark mode';
    }

    function updateThemeToggleButtons(theme) {
        const label = themeLabel(theme);
        const iconName = theme === 'dark' ? 'bi:sun' : 'bi:moon-stars';
        for (const btn of global.document.querySelectorAll('[data-www-theme-toggle]')) {
            btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
            const textEl = btn.querySelector('[data-www-theme-label]');
            if (textEl) textEl.textContent = label;
            const icon = btn.querySelector('.iconify');
            if (icon) icon.setAttribute('data-icon', iconName);
        }
    }

    function bindThemeToggles() {
        for (const btn of global.document.querySelectorAll('[data-www-theme-toggle]')) {
            if (btn.dataset.wwwThemeBound) continue;
            btn.dataset.wwwThemeBound = '1';
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                toggleTheme();
            });
        }
    }

    function init() {
        applyTheme(getTheme());
        bindThemeToggles();
        global.document.addEventListener('wwwI18nReady', () => {
            updateThemeToggleButtons(getTheme());
        });
    }

    /** Call from inline <head> script to avoid flash */
    function applyEarly() {
        global.document.documentElement.setAttribute('data-theme', getTheme());
    }

    global.wwwThemeManager = {
        getTheme,
        applyTheme,
        toggleTheme,
        init,
        applyEarly,
        updateThemeToggleButtons,
    };
}(window));
