/**
 * SolarisSwahili — js/theme.js
 *
 * Runs synchronously as the very first <script> inside <body> on every page.
 * Restores the saved colour theme and generates star positions before the
 * browser paints, preventing any flash of unstyled content.
 *
 * NOTE: Star *visibility* is controlled exclusively via the CSS class
 * `.stars-visible` — never via inline `opacity`. This lets the CSS
 * `stars-twinkle` animation take effect without being overridden.
 */
(function () {
    'use strict';

    /** Apply sky CSS variables and body class for a given theme name. */
    function applyTheme(theme) {
        var root = document.documentElement;
        if (theme === 'night') {
            document.body.classList.add('theme-night');
            root.style.setProperty('--sky-top', '#020617');
            root.style.setProperty('--sky-bot', '#0B1120');
        } else {
            document.body.classList.remove('theme-night');
            root.style.setProperty('--sky-top', '#F3F4F6');
            root.style.setProperty('--sky-bot', '#E5E7EB');
        }
    }

    var saved = null;
    try { saved = localStorage.getItem('ss_theme'); } catch (e) { /* localStorage blocked */ }

    if (saved) applyTheme(saved);

    /* ── Generate star background image ────────────────────────────── */
    var stars = document.getElementById('stars-layer');
    if (!stars) return;

    var parts = [];
    for (var i = 0; i < 155; i++) {
        var x = (Math.random() * 100).toFixed(1);
        var y = (Math.random() * 100).toFixed(1);
        var s = (Math.random() * 1.8 + 0.3).toFixed(1);
        var o = (Math.random() * 0.65 + 0.28).toFixed(2);
        parts.push(
            'radial-gradient(' + s + 'px ' + s + 'px at ' + x + '% ' + y +
            '%, rgba(255,255,255,' + o + '), transparent)'
        );
    }
    stars.style.backgroundImage = parts.join(',');

    /* Add CSS class for night theme — CSS animation handles opacity. */
    if (saved === 'night') stars.classList.add('stars-visible');

    /* ── Cross-tab theme sync ────────────────────────────────────── */
    window.addEventListener('storage', function (e) {
        if (e.key !== 'ss_theme') return;
        applyTheme(e.newValue || '');
        if (e.newValue === 'night') {
            stars.classList.add('stars-visible');
        } else {
            stars.classList.remove('stars-visible');
        }
    });
})();
