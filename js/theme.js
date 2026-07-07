/**
 * SolarisSwahili — js/theme.js
 * Restores visual state fast, avoiding FOIT or flash of wrong styles
 */
(function () {
    'use strict';
    
    // Core engine rendering mode handling!
    const savedTheme = (() => { 
        try { return localStorage.getItem('ss_theme'); } catch (e) { return null; } 
    })();

    if (savedTheme) {
        document.documentElement.classList.add('manual-theme'); // prevent autodetect overwrite if set 
        if (savedTheme === 'night') document.body.classList.add('theme-night');
    }

    // Creating beautiful randomly-placed Canvas CSS stars efficiently without lag
    document.addEventListener("DOMContentLoaded", () => {
        const starsLayer = document.getElementById('stars-layer');
        if (starsLayer) {
            let elements = [];
            // Map 120 gentle stars statically generated!
            for (let i = 0; i < 120; i++) {
                const x = (Math.random() * 100).toFixed(1);
                const y = (Math.random() * 100).toFixed(1);
                const size = (Math.random() * 1.5 + 0.5).toFixed(1);
                const opacity = (Math.random() * 0.5 + 0.2).toFixed(2);
                elements.push(`radial-gradient(${size}px ${size}px at ${x}% ${y}%, rgba(255,255,255,${opacity}), transparent)`);
            }
            starsLayer.style.backgroundImage = elements.join(',');

            // Add or strip visibility natively depending on the loaded element styles body constraints:
            if(document.body.classList.contains('theme-night')){
                starsLayer.classList.add('stars-visible');
            }
        }

        // Connect the menu Toggle Navigation Handler (Reusable inside all SubPages dynamically!)
        const toggleBtn = document.getElementById('nav-toggle');
        const linkPanels = document.getElementById('nav-links');
        
        if (toggleBtn && linkPanels) {
            toggleBtn.onclick = () => {
                const isOp = linkPanels.classList.toggle('nav-open');
                toggleBtn.setAttribute('aria-expanded', isOp.toString());
            };
        }
    });

})();