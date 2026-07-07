/**
 * SolarisSwahili — js/i18n.js
 * Localization Module - Clean, Fast, No Hallucinations
 */
const I18N = (() => {
    'use strict';
    
    const MESSAGES = {
        ar: {
            navHome: 'الرئيسية', 
            navAbout: 'عن المشروع', 
            navCompare: 'مقارنة', 
            navDashboard: 'إحصائيات',
            siteTitle: 'نظام التوقيت السواحلي التكيفي', 
            siteSubtitle: 'يعيد العدّاد صفرته عند الشروق (للنهار) وعند الغروب (لليل). كل ساعة هنا 60 دقيقة قياسية — في الصيف تزيد الساعات عن 12 وفي الشتاء تنقص.',
            addCity: 'إضافة', 
            adding: 'جارٍ…',
            cityPlaceholder: 'London, Cairo, Istanbul…',
            cityNotFound: 'لم نجد هذه المدينة. حاوِل كتابتها بالإنجليزية.',
            loading: 'جاري تهيئة النظام…', 
            errorTitle: 'تعذَّر جلب البيانات',
            errorDefault: 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
            retry: 'إعادة المحاولة',
            sunrise: 'الشروق', 
            sunset: 'الغروب', 
            standardTime: 'التوقيت المدني',
            daytime: 'النهار', 
            nighttime: 'الليل', 
            hourLabel: 'الساعة', 
            of: 'من',
            remaining: 'بقي على', 
            prayers: 'مواقيت الصلاة', 
            sincePhaseStart: 'منذ بداية الطور',
            untilSunrise: 'شروق', 
            untilSunset: 'غروب', 
            shareImage: 'مشاركة صورة',
            tooltipTitle: 'كيف يعمل هذا التوقيت؟',
            tooltipBody: 'يُعاد ضبط العدّاد عند الشروق (نهارًا) وعند الغروب (ليلاً). كل ساعة هنا هي 60 دقيقة قياسية تترجم طول نهارك وليلك الفعلي بدقة تامة.',
            
            // صفحات المقارنة والإحصائيات
            compareTitle: 'مقارنة التوقيت السواحلي',
            compareSub: 'الوقت الحقيقي لكل مدينة بحسب موضع شمسها',
            dashTitle: 'الإحصائيات السنوية والتنبؤ',
            dashSub: 'مراقبة أطوال وعدد الساعات السواحلية للنهار على مدار 365 يوم',
            chart1Title: 'طول النهار عبر العام', 
            chart2Title: 'إجمالي الساعات السواحلية عبر العام',
            todayDaylight: 'النهار اليوم', 
            swahiliToday: 'الساعات السواحلية اليوم', 
            longestDay: 'أطول يوم (انقلاب صيفي)', 
            shortestDay: 'أقصر يوم (انقلاب شتوي)', 
            maxDaylight: 'أقصى نهار (الذروة)', 
            minDaylight: 'أقصر نهار مسجل'
        },
        en: {
            navHome: 'Home', 
            navAbout: 'About', 
            navCompare: 'Compare', 
            navDashboard: 'Dashboard',
            siteTitle: 'Adaptive Swahili Time',
            siteSubtitle: 'The counter resets at sunrise (daytime) and sunset (nighttime). Each hour remains an exact standard 60 minutes.',
            addCity: 'Add', 
            adding: 'Adding...', 
            cityPlaceholder: 'Cairo, Istanbul, New York...', 
            cityNotFound: 'City not found. Try searching with a valid English name.',
            loading: 'Initializing System...', 
            errorTitle: 'Data Fetch Error', 
            errorDefault: 'Please check your internet connection and try again.', 
            retry: 'Retry', 
            sunrise: 'Sunrise', 
            sunset: 'Sunset', 
            standardTime: 'Civil Time', 
            daytime: 'Day', 
            nighttime: 'Night', 
            hourLabel: 'Hour', 
            of: 'of', 
            remaining: 'Time until', 
            prayers: 'Prayer Times', 
            sincePhaseStart: 'since phase start', 
            untilSunrise: 'Sunrise', 
            untilSunset: 'Sunset', 
            shareImage: 'Share Image', 
            tooltipTitle: 'How does this work?', 
            tooltipBody: 'The clock zeroes exactly at sunrise and sunset. Instead of shrinking or stretching, it uses constant 60-minute increments, effectively tracking your real sunlight duration.',
            
            // Compare and Dashboard
            compareTitle: 'Swahili Time Comparison',
            compareSub: 'Live swahili offsets globally synced with exact localized solar paths.',
            dashTitle: 'Annual Predictor & Dashboard',
            dashSub: 'Visualize sunlight variations and swahili time bounds tracking along 365 days.',
            chart1Title: 'Daylight Duration Array Map', 
            chart2Title: 'Standard Swahili Day Hours Annually',
            todayDaylight: 'Daylight Today', 
            swahiliToday: 'Swahili Hours Today', 
            longestDay: 'Longest Day (Summer Solstice)', 
            shortestDay: 'Shortest Day (Winter Solstice)', 
            maxDaylight: 'Maximum Sunlight', 
            minDaylight: 'Minimum Sunlight'
        }
    };
    
    // Check initial state
    let current = (() => { 
        try { return localStorage.getItem('ss_lang') || 'ar'; } catch (e) { return 'ar'; } 
    })();
    
    function applyAll() {
        const d = MESSAGES[current];
        if(!d) return;
        
        document.documentElement.lang = current;
        document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (d[key] !== undefined) {
                 el.textContent = d[key];
                 
                 // Handle specific style tweaks between Arabic/English formats
                 if (el.classList.contains("header-title") && current === 'en') {
                     el.style.fontSize = "1.2rem";
                 } else if (el.classList.contains("header-title") && current === 'ar') {
                     el.style.fontSize = "1.125rem"; // default base size
                 }
            }
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if(d[key]) el.placeholder = d[key];
        });
        
        // Ensure language toggle always says the *opposite* language clearly
        const tgBtn = document.getElementById('lang-toggle');
        if (tgBtn) {
            tgBtn.textContent = current === 'ar' ? 'EN' : 'AR';
        }
    }

    // Apply translations on load
    applyAll();
    
    // Global Storage event for Multi-Tab sync
    window.addEventListener('storage', e => {
        if (e.key === 'ss_lang' && e.newValue) {
             current = e.newValue;
             applyAll();
             if (window.SSApp && typeof window.SSApp.forceUpdateViews === 'function') {
                 window.SSApp.forceUpdateViews(); 
             }
        }
    });

    return {
        getLang: () => current,
        t: (key) => MESSAGES[current] ? (MESSAGES[current][key] ?? key) : key,
        toggle: () => {
            current = current === 'ar' ? 'en' : 'ar';
            try { localStorage.setItem('ss_lang', current); } catch (e) {}
            applyAll();
            
            // Dispatch to the running logical core (app.js, compare.js) if they implement the method
            if (window.SSApp && typeof window.SSApp.forceUpdateViews === 'function') {
                window.SSApp.forceUpdateViews();
            }
        },
        injectMap: (additionalMap) => {
            // Allows scripts like compare.js to cleanly push dynamic data strings into dict
            Object.assign(MESSAGES.ar, additionalMap.ar || {});
            Object.assign(MESSAGES.en, additionalMap.en || {});
            applyAll();
        }
    };
})();