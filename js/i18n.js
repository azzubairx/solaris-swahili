/**
 * SolarisSwahili — js/i18n.js
 * Shared translation module for subpages (about, compare, dashboard).
 */
const SubI18N = (function () {
    'use strict';

    const T = {
        ar: {
            navHome:      'الرئيسية',
            navAbout:     'عن المشروع',
            navCompare:   'مقارنة',
            navDashboard: 'إحصائيات',
        },
        en: {
            navHome:      'Home',
            navAbout:     'About',
            navCompare:   'Compare',
            navDashboard: 'Dashboard',
        },
    };

    let lang = 'ar';
    try { lang = localStorage.getItem('ss_lang') || 'ar'; } catch {}

    function apply() {
        const isAr = lang === 'ar';
        document.documentElement.lang = lang;
        document.documentElement.dir  = isAr ? 'rtl' : 'ltr';

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const val = T[lang]?.[el.dataset.i18n];
            if (val !== undefined) el.textContent = val;
        });

        /* Language toggle button always shows English abbreviations */
        const lb = document.getElementById('lang-toggle');
        if (lb) lb.textContent = isAr ? 'EN' : 'AR';
    }

    apply();

    window.addEventListener('storage', e => {
        if (e.key !== 'ss_lang') return;
        lang = e.newValue || 'ar';
        apply();
        if (typeof renderCards === 'function') renderCards();
        if (typeof renderAll   === 'function') renderAll();
    });

    return {
        getLang: () => lang,
        toggle: () => {
            lang = lang === 'ar' ? 'en' : 'ar';
            try { localStorage.setItem('ss_lang', lang); } catch {}
            apply();
            if (typeof renderCards === 'function') renderCards();
            if (typeof renderAll   === 'function') renderAll();
        },
    };
})();
