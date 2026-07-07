// js/theme.js
(function () {
    'use strict';
    function applyTheme(theme) {
        const root = document.documentElement;
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
    const savedTheme = (() => { try { return localStorage.getItem('ss_theme'); } catch (e) {return null;} })();
    if (savedTheme) applyTheme(savedTheme);

    const starsLayer = document.getElementById('stars-layer');
    if (starsLayer) {
        let layers = [];
        for (let i = 0; i < 155; i++) {
            const x = (Math.random() * 100).toFixed(1), y = (Math.random() * 100).toFixed(1);
            const s = (Math.random() * 1.8 + 0.3).toFixed(1), o = (Math.random() * 0.65 + 0.28).toFixed(2);
            layers.push(`radial-gradient(${s}px ${s}px at ${x}% ${y}%, rgba(255,255,255,${o}), transparent)`);
        }
        starsLayer.style.backgroundImage = layers.join(',');
        if (savedTheme === 'night') starsLayer.classList.add('stars-visible');
    }
    
    // Theme local storage hooks sync tab mechanism 
    window.addEventListener('storage', function (e) {
        if (e.key === 'ss_theme') {
            applyTheme(e.newValue);
            if(starsLayer) e.newValue === 'night' ? starsLayer.classList.add('stars-visible') : starsLayer.classList.remove('stars-visible');
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        const hamburger = document.getElementById('nav-toggle');
        const navLinks = document.getElementById('nav-links');
        if(hamburger && navLinks) {
            hamburger.onclick = () => {
                const open = navLinks.classList.toggle('nav-open');
                hamburger.setAttribute('aria-expanded', open);
            }
            document.addEventListener('click', (e) => {
                if(!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                    navLinks.classList.remove('nav-open');
                    hamburger.setAttribute('aria-expanded', false);
                }
            })
        }
    });
})();