/**
 * Apply saved theme before paint — load in <head> right after www-locale-head.js.
 * Full toggle UI lives in www-theme.js (wwwThemeManager).
 */
(function (global) {
    'use strict';
    try {
        const theme = global.localStorage.getItem('theme') || 'light';
        global.document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    } catch {
        global.document.documentElement.setAttribute('data-theme', 'light');
    }
}(window));
