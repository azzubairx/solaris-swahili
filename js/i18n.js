/**
 * SolarisSwahili — js/i18n.js
 *
 * Shared internationalisation module for subpages (about, compare, dashboard).
 * The main page (index.html) uses its own inline Lang object inside app.js.
 *
 * Exports a single global `SubI18N` object with:
 *   SubI18N.getLang()  → 'ar' | 'en'
 *   SubI18N.toggle()   → switches language and re-applies DOM translations
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
    try { lang = localStorage.getItem('ss_lang') || 'ar'; } catch { /* blocked */ }

    function apply() {
        const isAr = lang === 'ar';
        document.documentElement.lang = lang;
        document.documentElement.dir  = isAr ? 'rtl' : 'ltr';

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const val = T[lang]?.[el.dataset.i18n];
            if (val !== undefined) el.textContent = val;
        });

        const lb = document.getElementById('lang-toggle');
        if (lb) lb.textContent = isAr ? 'EN' : 'عر';
    }

    apply();

    /* Cross-tab language sync */
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
            try { localStorage.setItem('ss_lang', lang); } catch { /* blocked */ }
            apply();
            if (typeof renderCards === 'function') renderCards();
            if (typeof renderAll   === 'function') renderAll();
        },
    };
})();
