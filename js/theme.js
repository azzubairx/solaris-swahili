/**
 * SolarisSwahili — js/theme.js
 *
 * Runs synchronously as the very first <script> inside <body> on every page.
 * Restores the saved night theme and generates stars before the browser paints
 * a single pixel, preventing Flash of Incorrect Theme (FOIT) on all subpages.
 *
 * No dependencies. No module system. Must stay under ~1 KB.
 */
(function () {
    'use strict';

    var saved = localStorage.getItem('ss_theme');
    if (saved !== 'night') return;

    /* 1 — Apply theme class before any content renders */
    document.body.classList.add('theme-night');

    /* 2 — Set sky CSS variables immediately so the gradient is correct */
    document.documentElement.style.setProperty('--sky-top', '#020617');
    document.documentElement.style.setProperty('--sky-bot', '#0B1120');

    /* 3 — Generate stars so the layer is populated on subpages
           (app.js handles this on index.html via genStars(); this covers
            about.html, compare.html, dashboard.html)                       */
    var stars = document.getElementById('stars-layer');
    if (!stars) return;

    var parts = [];
    for (var i = 0; i < 140; i++) {
        var x = (Math.random() * 100).toFixed(1);
        var y = (Math.random() * 100).toFixed(1);
        var s = (Math.random() * 1.8 + 0.3).toFixed(1);
        var o = (Math.random() * 0.65 + 0.28).toFixed(2);
        parts.push(
            'radial-gradient(' + s + 'px ' + s + 'px at ' +
            x + '% ' + y + '%, rgba(255,255,255,' + o + '), transparent)'
        );
    }
    stars.style.backgroundImage = parts.join(',');
    stars.style.opacity = '0.9';
})();
