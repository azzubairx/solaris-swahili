/**
 * SolarisSwahili — js/theme.js
 *
 * Runs synchronously as the very first <script> inside <body> on every page.
 * Restores saved colour theme, generates star positions, and wires the
 * hamburger navigation toggle — all before the browser paints.
 */
(function () {
    'use strict';

    /* ── Theme restore ──────────────────────────────────────── */
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
    try { saved = localStorage.getItem('ss_theme'); } catch (e) {}
    if (saved) applyTheme(saved);

    /* ── Star background ────────────────────────────────────── */
    var stars = document.getElementById('stars-layer');
    if (stars) {
        var parts = [];
        for (var i = 0; i < 155; i++) {
            var x = (Math.random() * 100).toFixed(1);
            var y = (Math.random() * 100).toFixed(1);
            var s = (Math.random() * 1.8 + 0.3).toFixed(1);
            var o = (Math.random() * 0.65 + 0.28).toFixed(2);
            parts.push('radial-gradient(' + s + 'px ' + s + 'px at ' + x + '% ' + y +
                       '%, rgba(255,255,255,' + o + '), transparent)');
        }
        stars.style.backgroundImage = parts.join(',');
        if (saved === 'night') stars.classList.add('stars-visible');
    }

    /* ── Cross-tab theme sync ───────────────────────────────── */
    window.addEventListener('storage', function (e) {
        if (e.key !== 'ss_theme') return;
        applyTheme(e.newValue || '');
        if (stars) {
            e.newValue === 'night'
                ? stars.classList.add('stars-visible')
                : stars.classList.remove('stars-visible');
        }
    });

    /* ── Hamburger menu toggle (all pages) ──────────────────── */
    /*
     * Runs here so the toggle works on every page (about, compare,
     * dashboard) without depending on app.js or i18n.js loading first.
     */
    var hamburger = document.getElementById('nav-toggle');
    var navLinks  = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            var open = navLinks.classList.toggle('nav-open');
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        /* Close when a nav link is tapped */
        navLinks.addEventListener('click', function (e) {
            if (e.target.closest('.nav-link')) {
                navLinks.classList.remove('nav-open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        /* Close when tapping outside the menu */
        document.addEventListener('click', function (e) {
            if (navLinks.classList.contains('nav-open') &&
                !hamburger.contains(e.target) &&
                !navLinks.contains(e.target)) {
                navLinks.classList.remove('nav-open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }
})();
