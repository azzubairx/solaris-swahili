/**
 * SolarisSwahili — js/app.js
 *
 * نظام التوقيت السواحلي / المغربي التكيفي
 *
 * النموذج الحسابي:
 *   يُعاد ضبط العدّاد عند الشروق (لبدء النهار) وعند الغروب (لبدء الليل).
 *   كل ساعة هنا 60 دقيقة قياسية — لذا يتجاوز العدد 12 في الصيف الطويل
 *   ويقلّ عنها في الشتاء، ليعكس الطول الحقيقي لنهارك وليلك بدقة تامة.
 *
 * APIs: Open-Meteo (solar) · Aladhan (prayers) · Nominatim (geocoding)
 *
 * © 2026 Azzubair — جميع الحقوق محفوظة
 */

const SolarisSwahili = (() => {
    'use strict';

    /* ═══════════════════════════════════════════════════════
       1.  I18N
    ═══════════════════════════════════════════════════════ */
    const I18N = {
        ar: {
            navHome:      'الرئيسية',     navAbout:     'عن المشروع',
            navCompare:   'مقارنة',        navDashboard: 'إحصائيات',
            siteTitle:    'نظام التوقيت السواحلي التكيفي',
            siteSubtitle: 'يعيد العدّاد صفرته عند الشروق (للنهار) وعند الغروب (لليل). كل ساعة هنا 60 دقيقة قياسية — في الصيف تزيد الساعات على 12، وفي الشتاء تنقص.',
            addCity:      'إضافة',         adding:       'جارٍ…',
            cityPlaceholder: 'London, Cairo, Istanbul…',
            cityNotFound:    'لم نجد هذه المدينة. حاوِل كتابتها بالإنجليزية.',
            loading:      'جاري تهيئة النظام…',
            loadingSun:   'جاري جلب بيانات الشمس…',
            loadingPrayer:'جاري جلب مواقيت الصلاة…',
            errorTitle:   'تعذَّر جلب البيانات',
            errorDefault: 'يرجى التحقق من اتصالك بالإنترنت.',
            retry:        'إعادة المحاولة',
            sunrise:      'الشروق',        sunset:       'الغروب',
            standardTime: 'التوقيت القياسي',
            daytime:      'النهار',         nighttime:    'الليل',
            hourLabel:    'الساعة',         of:           'من',
            untilSunrise: 'الشروق',        untilSunset:  'الغروب',
            remaining:    'بقي على',        prayers:      'مواقيت الصلاة',
            equinox:      '≈ تعادل النهار والليل',
            dayLonger:    'النهار أطول بـ', nightLonger:  'الليل أطول بـ',
            shareLink:    'نسخ رابط المدينة',shareImage:   'مشاركة صورة',
            ambientMode:  'وضع الحائط',    themeToggle:  'تبديل الوضع الليلي',
            autoReset:    'إعادة الوضع التلقائي',
            timeFormat:   'تبديل صيغة الوقت',
            downloadPNG:  'تحميل PNG',     close:        'إغلاق',
            exitHint:     'ESC للخروج • F للدخول',
            tooltipTitle: 'كيف يعمل هذا التوقيت؟',
            tooltipBody:  'يُعاد ضبط العدّاد عند الشروق (لبداية النهار) وعند الغروب (لبداية الليل). كل ساعة هنا 60 دقيقة قياسية — في الصيف يتجاوز العدد 12، وفي الشتاء يقلّ عنه.',
            Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
            lessMin: 'أقل من دقيقة',
            min1: 'دقيقة', min2: 'دقيقتان', minN: 'دقائق', minMany: 'دقيقة',
            hr1:  'ساعة',  hr2:  'ساعتان',  hrN:  'ساعات',  hrMany: 'ساعة',
            and: 'و',      removeCity: 'إزالة المدينة',
        },
        en: {
            navHome:      'Home',          navAbout:     'About',
            navCompare:   'Compare',       navDashboard: 'Dashboard',
            siteTitle:    'Adaptive Swahili Timekeeping',
            siteSubtitle: 'The counter resets at sunrise (day) and sunset (night). Each hour is exactly 60 standard minutes — in summer a long day can have 15+ hours.',
            addCity:      'Add',           adding:       'Adding…',
            cityPlaceholder: 'London, Cairo, Istanbul…',
            cityNotFound:    'City not found. Try the English spelling.',
            loading:      'Initialising…',
            loadingSun:   'Fetching solar data…',
            loadingPrayer:'Fetching prayer times…',
            errorTitle:   'Failed to fetch data',
            errorDefault: 'Please check your internet connection.',
            retry:        'Retry',
            sunrise:      'Sunrise',       sunset:       'Sunset',
            standardTime: 'Civil Time',
            daytime:      'Day',           nighttime:    'Night',
            hourLabel:    'Hour',          of:           'of',
            untilSunrise: 'Sunrise',       untilSunset:  'Sunset',
            remaining:    'Until',         prayers:      'Prayer Times',
            equinox:      '≈ Equal Day & Night',
            dayLonger:    'Day is longer by',nightLonger: 'Night is longer by',
            shareLink:    'Copy city link', shareImage:  'Share Image',
            ambientMode:  'Ambient Mode',  themeToggle:  'Toggle Theme',
            autoReset:    'Reset to Auto',
            timeFormat:   'Toggle Time Format',
            downloadPNG:  'Download PNG',  close:        'Close',
            exitHint:     'ESC to exit • F to enter',
            tooltipTitle: 'How does this work?',
            tooltipBody:  'The counter resets at sunrise (day) and sunset (night). Each hour is exactly 60 standard minutes — in summer, a long day can have 15+ hours.',
            Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha',
            lessMin: 'less than a minute',
            min1: 'minute', min2: 'minutes', minN: 'minutes', minMany: 'minutes',
            hr1: 'hour', hr2: 'hours', hrN: 'hours', hrMany: 'hours',
            and: 'and',    removeCity: 'Remove city',
        },
    };

    const Lang = {
        current: 'ar',

        _init() {
            try { this.current = localStorage.getItem('ss_lang') || 'ar'; } catch { /* blocked */ }
        },

        t(key) { return I18N[this.current]?.[key] ?? key; },

        toggle() {
            this.current = this.current === 'ar' ? 'en' : 'ar';
            try { localStorage.setItem('ss_lang', this.current); } catch { /* blocked */ }
            this.apply();
            Cities.buildButtons();
            if (S.activeKey) {
                const city = S.cities[S.activeKey];
                D.cityName.textContent = (this.current === 'en' && city?.nameEn) ? city.nameEn : (city?.name || '');
                if (D.countrySub) D.countrySub.textContent = (this.current === 'en' && city?.countryEn) ? city.countryEn : (city?.country || '');
                updateDateDisplay();
                if (S.solar) renderDayNightBar();
                if (S.prayers) Prayers.renderBar();
            }
        },

        apply() {
            const isAr = this.current === 'ar';
            document.documentElement.lang = this.current;
            document.documentElement.dir  = isAr ? 'rtl' : 'ltr';

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const val = I18N[this.current]?.[el.dataset.i18n];
                if (val !== undefined) el.textContent = val;
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const val = I18N[this.current]?.[el.dataset.i18nPlaceholder];
                if (val !== undefined) el.placeholder = val;
            });
            document.querySelectorAll('[data-i18n-aria]').forEach(el => {
                const val = I18N[this.current]?.[el.dataset.i18nAria];
                if (val !== undefined) el.setAttribute('aria-label', val);
            });

            const lb = document.getElementById('lang-toggle');
            if (lb) lb.textContent = isAr ? 'EN' : 'عر';

            updateDateDisplay();
        },
    };

    /* Cross-tab language sync */
    window.addEventListener('storage', e => {
        if (e.key === 'ss_lang') {
            Lang.current = e.newValue || 'ar';
            Lang.apply();
            Cities.buildButtons();
            if (S.activeKey) {
                const city = S.cities[S.activeKey];
                if (D.cityName) D.cityName.textContent = (Lang.current === 'en' && city?.nameEn) ? city.nameEn : (city?.name || '');
                if (D.countrySub) D.countrySub.textContent = (Lang.current === 'en' && city?.countryEn) ? city.countryEn : (city?.country || '');
                if (S.solar) { renderDayNightBar(); Prayers.renderBar(); }
            }
        }
    });


    /* ═══════════════════════════════════════════════════════
       2.  CONFIG
    ═══════════════════════════════════════════════════════ */
    const CFG = {
        /** Golden-hour window around sunrise/sunset (ms) */
        GOLD_WIN_MS:  45 * 60 * 1_000,
        /** Cache TTL (ms) */
        CACHE_TTL_MS:  6 * 60 * 60 * 1_000,
        /**
         * Aladhan prayer method.
         * 3 = Muslim World League — appropriate for North Africa.
         */
        PRAYER_METHOD: 3,

        DEFAULT_KEYS: ['tobruk', 'benghazi', 'tripoli'],
        DEFAULT_CITIES: {
            tobruk:   { name: 'طبرق',   nameEn: 'Tobruk',   country: 'ليبيا', countryEn: 'Libya',   countryCode: 'LY', lat: '32.0773', lng: '23.9600' },
            benghazi: { name: 'بنغازي', nameEn: 'Benghazi', country: 'ليبيا', countryEn: 'Libya',   countryCode: 'LY', lat: '32.1167', lng: '20.0667' },
            tripoli:  { name: 'طرابلس', nameEn: 'Tripoli',  country: 'ليبيا', countryEn: 'Libya',   countryCode: 'LY', lat: '32.8892', lng: '13.1900' },
        },

        /** Daytime sky gradient waypoints (progress 0→1) */
        SKY_DAY: [
            { p: 0.00, t: '#FEF3C7', b: '#FDBA74' },   // dawn / sunrise
            { p: 0.18, t: '#E0F2FE', b: '#BAE6FD' },   // morning
            { p: 0.50, t: '#F0F9FF', b: '#E5E7EB' },   // noon
            { p: 0.82, t: '#FEF9C3', b: '#FDE68A' },   // afternoon
            { p: 1.00, t: '#FDE68A', b: '#FDBA74' },   // sunset
        ],
        SKY_NIGHT: { t: '#020617', b: '#0B1120' },
    };


    /* ═══════════════════════════════════════════════════════
       3.  STATE
    ═══════════════════════════════════════════════════════ */
    const S = {
        cities:        { ...CFG.DEFAULT_CITIES },
        activeKey:     null,
        solar:         null,
        prayers:       null,
        tickId:        null,
        manualTheme:   false,
        is24Hour:      false,
        loadGen:       0,
        wakeLock:      null,
        ambientActive: false,
    };

    try { S.is24Hour = localStorage.getItem('ss_24h') === 'true'; } catch { /* blocked */ }

    try {
        const raw = localStorage.getItem('ss_custom_cities');
        if (raw) {
            const parsed = JSON.parse(raw);
            Object.entries(parsed).forEach(([k, v]) => {
                if (v && typeof v.name === 'string' && typeof v.lat === 'string' && typeof v.lng === 'string') {
                    S.cities[k] = v;
                }
            });
        }
    } catch { /* corrupted data — ignore */ }


    /* ═══════════════════════════════════════════════════════
       4.  DOM REFS
    ═══════════════════════════════════════════════════════ */
    const el = id => document.getElementById(id);

    const D = {
        loader:       el('loader'),
        loaderTxt:    el('loader-text'),
        errOverlay:   el('error-overlay'),
        errMsg:       el('error-message'),
        retryBtn:     el('retry-btn'),
        app:          el('app-container'),
        citySel:      el('city-selector'),
        cityName:     el('city-name'),
        countrySub:   el('country-sub'),
        dateEl:       el('gregorian-date'),
        hijri:        el('hijri-date'),
        hourNum:      el('hour-display'),
        phaseDisp:    el('phase-display'),
        metricDisp:   el('metric-display'),
        cdNum:        el('countdown-display'),
        cdLbl:        el('next-event-name'),
        arc:          el('progress-arc'),
        celestial:    el('celestial-body'),
        sunShape:     el('sun-shape'),
        moonShape:    el('moon-shape'),
        sunHalo:      el('sun-halo'),
        prayerMrks:   el('prayer-markers'),
        prayerBar:    el('prayer-bar'),
        prayerList:   el('prayer-list'),
        stars:        el('stars-layer'),
        themeBtn:     el('theme-toggle'),
        resetBtn:     el('theme-auto-reset'),
        sunIco:       el('sun-icon'),
        moonIco:      el('moon-icon'),
        shareBtn:     el('share-btn'),
        shareImgBtn:  el('share-img-btn'),
        ambientBtn:   el('ambient-btn'),
        formatBtn:    el('time-format-toggle'),
        cityInput:    el('city-input'),
        addBtn:       el('add-btn'),
        cityErr:      el('city-error'),
        dayBar:       el('day-bar'),
        nightBar:     el('night-bar'),
        dayLen:       el('day-length'),
        nightLen:     el('night-length'),
        compTxt:      el('comparison-text'),
        sunriseEl:    el('sunrise-time'),
        sunsetEl:     el('sunset-time'),
        stdTime:      el('standard-time'),
        ambOverlay:   el('ambient-overlay'),
    };


    /* ═══════════════════════════════════════════════════════
       5.  UTILITIES
    ═══════════════════════════════════════════════════════ */

    /** Zero-pad a number to two digits. */
    const pad = n => String(n).padStart(2, '0');

    /** Format h/m/s to HH:MM:SS. */
    const fmt = (h, m, s) => `${pad(h)}:${pad(m)}:${pad(s)}`;

    /**
     * Format a duration (ms) as a human-readable Arabic or English string.
     * Respects Arabic grammatical plurality rules.
     */
    const fmtDur = ms => {
        const tot = Math.round(ms / 60_000);
        const h = Math.floor(tot / 60);
        const m = tot % 60;
        const t = key => Lang.t(key);

        if (Lang.current === 'en') {
            const hStr = !h ? '' : `${h} ${h === 1 ? t('hr1') : t('hrN')}`;
            const mStr = !m ? '' : `${m} ${m === 1 ? t('min1') : t('minN')}`;
            if (!hStr) return mStr || t('lessMin');
            return mStr ? `${hStr} ${t('and')} ${mStr}` : hStr;
        }

        const hS = !h ? '' : h === 1 ? t('hr1') : h === 2 ? t('hr2') : h <= 10 ? `${h} ${t('hrN')}` : `${h} ${t('hrMany')}`;
        const mS = !m ? '' : m === 1 ? t('min1') : m === 2 ? t('min2') : m <= 10 ? `${m} ${t('minN')}` : `${m} ${t('minMany')}`;
        if (!hS && !mS) return t('lessMin');
        if (!hS) return mS;
        if (!mS) return hS;
        return `${hS} ${t('and')}${mS}`;
    };

    /**
     * Return the city's local date string (YYYY-MM-DD) for the given UTC-offset
     * and day-offset.  Used to ensure Aladhan gets the correct local date,
     * not the UTC date.
     */
    const getCityDateStr = (offsetMins, offDays = 0) => {
        const ms = Date.now() + offsetMins * 60_000 + offDays * 86_400_000;
        return new Date(ms).toISOString().slice(0, 10);
    };

    /**
     * Format a UTC timestamp as the city's local civil time.
     *
     * Method: add the UTC offset so the UTC fields of the Date object
     * equal the local time values, then read them with getUTC*.
     *
     * @param {number}  utcMs    - epoch milliseconds (UTC)
     * @param {number}  offMins  - city UTC offset in minutes
     * @param {boolean} [secs]   - include seconds
     */
    const formatLocal = (utcMs, offMins, secs = false) => {
        const d   = new Date(utcMs + offMins * 60_000);
        const h   = d.getUTCHours();
        const m   = d.getUTCMinutes();
        const sec = d.getUTCSeconds();

        if (S.is24Hour) {
            return secs ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}`;
        }

        /* Arabic indicators: ص = صباحًا (AM), م = مساءً (PM) */
        const suffix = h >= 12 ? 'م' : 'ص';
        const h12    = h % 12 || 12;
        return secs
            ? `${pad(h12)}:${pad(m)}:${pad(sec)} ${suffix}`
            : `${pad(h12)}:${pad(m)} ${suffix}`;
    };

    /**
     * Update Gregorian and Hijri date displays.
     * Called at init and on language change.
     */
    const updateDateDisplay = () => {
        if (!D.dateEl) return;
        const locale = Lang.current === 'ar' ? 'ar-LY' : 'en-GB';
        D.dateEl.textContent = new Intl.DateTimeFormat(locale, {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        }).format(new Date());
    };

    /**
     * Linearly interpolate between two #RRGGBB hex colours.
     * @param {number} t - mix ratio 0→1
     */
    const lerpHex = (a, b, t) => {
        const p = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
        const [r1,g1,b1] = p(a), [r2,g2,b2] = p(b);
        return '#' + [
            Math.round(r1+(r2-r1)*t),
            Math.round(g1+(g2-g1)*t),
            Math.round(b1+(b2-b1)*t),
        ].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
    };

    /* Cached star CSS strings (generated once, reused). */
    let _starsCSSMain = null;
    let _starsCSSAmb  = null;

    /**
     * Generate procedural star background via CSS radial-gradients.
     * Subsequent calls reuse the cached string to keep the star pattern stable.
     *
     * @param {HTMLElement|null} container - null = main #stars-layer
     */
    const genStars = (container) => {
        const target = container || D.stars;
        if (!target) return;
        const isAmb = target.id === 'amb-stars';
        if (!container && _starsCSSMain) { target.style.backgroundImage = _starsCSSMain; return; }
        if (isAmb && _starsCSSAmb) { target.style.backgroundImage = _starsCSSAmb; return; }
        const css = Array.from({ length: 165 }, () => {
            const x = (Math.random()*100).toFixed(1), y = (Math.random()*100).toFixed(1);
            const s = (Math.random()*1.8+0.3).toFixed(1), o = (Math.random()*0.65+0.28).toFixed(2);
            return `radial-gradient(${s}px ${s}px at ${x}% ${y}%, rgba(255,255,255,${o}), transparent)`;
        }).join(',');
        if (!container) _starsCSSMain = css;
        if (isAmb)      _starsCSSAmb  = css;
        target.style.backgroundImage = css;
    };


    /* ═══════════════════════════════════════════════════════
       6.  CACHE
    ═══════════════════════════════════════════════════════ */
    const Cache = {
        /**
         * Bucket index — changes every CFG.CACHE_TTL_MS, providing automatic
         * cache expiry without storing explicit timestamps.
         */
        _bucket: () => Math.floor(Date.now() / CFG.CACHE_TTL_MS),
        key: (prefix, lat, lng) => `ss_${prefix}_${lat}_${lng}_${Cache._bucket()}`,
        get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
        set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full / blocked */ } },
    };


    /* ═══════════════════════════════════════════════════════
       7.  API — Open-Meteo (Solar Data)
    ═══════════════════════════════════════════════════════ */
    const SolarAPI = {
        /**
         * Fetch sunrise/sunset/daylight_duration from Open-Meteo.
         *
         * The API returns local-time strings without a timezone indicator
         * (e.g. "2026-06-21T06:02").  We convert to UTC by treating them as UTC
         * and then subtracting the UTC offset.  This is equivalent to:
         *   local_time - offset = UTC
         *
         * Array layout with past_days=1 & forecast_days=2:
         *   [0] = yesterday  [1] = today  [2] = tomorrow
         *
         * @param {string} lat
         * @param {string} lng
         * @param {AbortSignal} signal
         */
        fetch: async (lat, lng, signal) => {
            const k = Cache.key('sol', lat, lng);
            const cached = Cache.get(k);
            if (cached) return cached;

            D.loaderTxt.textContent = Lang.t('loadingSun');

            const url = 'https://api.open-meteo.com/v1/forecast'
                      + `?latitude=${lat}&longitude=${lng}`
                      + '&daily=sunrise,sunset,daylight_duration'
                      + '&timezone=auto&past_days=1&forecast_days=2';

            let resp;
            try {
                resp = await fetch(url, { signal }).then(r => r.json());
            } catch (e) {
                if (e.name === 'AbortError') throw new Error('انتهت مهلة الاتصال. يرجى التحقق من الإنترنت.');
                throw e;
            }

            if (resp.error || !resp.daily)
                throw new Error('بيانات الشمس غير متاحة حاليًا. يرجى المحاولة لاحقًا.');

            const offMins = Math.round(resp.utc_offset_seconds / 60);

            /**
             * Convert a local-time ISO string to a UTC epoch (ms).
             * Appending 'Z' makes Date treat it as UTC, then subtracting
             * the offset converts it to the true UTC epoch.
             */
            const parseLocal = str =>
                str ? new Date(str + 'Z').getTime() - offMins * 60_000 : null;

            let ySunset   = parseLocal(resp.daily.sunset[0]);
            let tSunrise  = parseLocal(resp.daily.sunrise[1]);
            let tSunset   = parseLocal(resp.daily.sunset[1]);
            let tmSunrise = parseLocal(resp.daily.sunrise[2]);

            if (!tSunrise || !tSunset)
                throw new Error('لا يوجد شروق أو غروب واضح حاليًا (قد تكون المدينة في منطقة قطبية).');

            /* Temporal ordering guards for edge cases. */
            if (!ySunset)             ySunset   = tSunset   - 86_400_000;
            if (!tmSunrise)           tmSunrise = tSunrise  + 86_400_000;
            if (ySunset  >= tSunrise) ySunset  -= 86_400_000;
            if (tSunset  <= tSunrise) tSunset  += 86_400_000;
            if (tmSunrise <= tSunset) tmSunrise += 86_400_000;

            const data = {
                yesterdaySunset:  ySunset,
                todaySunrise:     tSunrise,
                todaySunset:      tSunset,
                tomorrowSunrise:  tmSunrise,
                /**
                 * daylight_duration from Open-Meteo is in SECONDS.
                 * We store it in milliseconds for consistency.
                 */
                dayLengthMs:      resp.daily.daylight_duration[1] * 1_000,
                nightLengthMs:    tmSunrise - tSunset,
                utcOff:           offMins,
                /* HH:MM strings for footer display */
                sunriseStr:       resp.daily.sunrise[1]?.slice(11, 16) || '--:--',
                sunsetStr:        resp.daily.sunset[1]?.slice(11, 16)  || '--:--',
            };

            Cache.set(k, data);
            return data;
        },
    };


    /* ═══════════════════════════════════════════════════════
       8.  API — Aladhan (Prayer Times)
    ═══════════════════════════════════════════════════════ */
    const PrayerAPI = {
        /**
         * Fetch the five daily prayer times from Aladhan.
         *
         * We pass the city's LOCAL date (DD-MM-YYYY) derived from the solar
         * UTC offset — not the user's UTC date — to get the correct times
         * for the city's current calendar day.
         *
         * @param {string} lat
         * @param {string} lng
         * @param {number} utcOff   - from SolarAPI result
         * @param {AbortSignal} signal
         */
        fetch: async (lat, lng, utcOff, signal) => {
            const k = Cache.key('pray', lat, lng);
            const cached = Cache.get(k);
            if (cached) return cached;

            D.loaderTxt.textContent = Lang.t('loadingPrayer');

            const [yyyy, mm, dd] = getCityDateStr(utcOff).split('-');
            const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}`
                      + `?latitude=${lat}&longitude=${lng}`
                      + `&method=${CFG.PRAYER_METHOD}`;

            let res;
            try {
                res = await fetch(url, { signal }).then(r => r.json());
            } catch (e) {
                if (e.name === 'AbortError') return null;  // prayers are optional
                return null;
            }

            if (!res || res.code !== 200) return null;

            Cache.set(k, res.data.timings);
            return res.data.timings;
        },
    };


    /* ═══════════════════════════════════════════════════════
       9.  SKY — Colours & Theme Icons
    ═══════════════════════════════════════════════════════ */
    const Sky = {
        /**
         * Update the sky CSS gradient variables every tick.
         * No-op when the user has manually set the theme.
         */
        update: (phase, progress) => {
            if (S.manualTheme) return;

            let topC, botC;

            if (phase === 'night') {
                topC = CFG.SKY_NIGHT.t;
                botC = CFG.SKY_NIGHT.b;
            } else {
                let lo = CFG.SKY_DAY[0];
                let hi = CFG.SKY_DAY[CFG.SKY_DAY.length - 1];
                for (let i = 0; i < CFG.SKY_DAY.length - 1; i++) {
                    if (progress >= CFG.SKY_DAY[i].p && progress <= CFG.SKY_DAY[i+1].p) {
                        lo = CFG.SKY_DAY[i]; hi = CFG.SKY_DAY[i+1]; break;
                    }
                }
                const frac = (progress - lo.p) / ((hi.p - lo.p) || 1);
                topC = lerpHex(lo.t, hi.t, frac);
                botC = lerpHex(lo.b, hi.b, frac);
            }

            const root = document.documentElement;
            root.style.setProperty('--sky-top', topC);
            root.style.setProperty('--sky-bot', botC);

            /* Keep ambient overlay in sync if active */
            if (S.ambientActive && D.ambOverlay) {
                D.ambOverlay.style.background = `linear-gradient(160deg, ${topC} 0%, ${botC} 100%)`;
            }
        },

        /** Apply fixed sky colours during manual theme override. */
        setManual: isNight => {
            const root = document.documentElement;
            const src  = isNight ? CFG.SKY_NIGHT : CFG.SKY_DAY[2];
            root.style.setProperty('--sky-top', isNight ? src.t : CFG.SKY_DAY[2].t);
            root.style.setProperty('--sky-bot', isNight ? src.b : CFG.SKY_DAY[2].b);
        },

        /** Toggle theme icon and star-layer CSS class. */
        setIcons: isNight => {
            D.sunIco.classList.toggle('hidden',  isNight);
            D.moonIco.classList.toggle('hidden', !isNight);
            /* Stars use CSS class — no inline opacity — to preserve the
               stars-twinkle animation defined in style.css. */
            D.stars.classList.toggle('stars-visible', isNight);
        },
    };


    /* ═══════════════════════════════════════════════════════
       10. PRAYERS
    ═══════════════════════════════════════════════════════ */
    const Prayers = {
        /**
         * Convert an Aladhan time string "HH:MM" or "HH:MM (TZ)" to UTC ms.
         * The string is a local time for the city; subtract the UTC offset to
         * convert to UTC epoch, using the city's local date as the base.
         */
        toMS: (hhmm, offMins, tmrw = false) => {
            if (!hhmm) return 0;
            const timeOnly = hhmm.split(' ')[0];  // strip "(EET)" suffix if present
            const dateStr  = getCityDateStr(offMins, tmrw ? 1 : 0);
            return new Date(`${dateStr}T${timeOnly}:00Z`).getTime() - offMins * 60_000;
        },

        /** Return the next prayer { name, ms } or null. */
        getNext: () => {
            if (!S.prayers || !S.solar) return null;
            const { utcOff } = S.solar;
            const now = Date.now();
            for (const name of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
                const ms = Prayers.toMS(S.prayers[name], utcOff);
                if (ms > now) return { name, ms };
            }
            return { name: 'Fajr', ms: Prayers.toMS(S.prayers.Fajr, utcOff, true) };
        },

        /** Prayer names to show on the arc for each phase. */
        keysForPhase: phase =>
            phase === 'day' ? ['Dhuhr', 'Asr'] : ['Maghrib', 'Isha', 'Fajr'],

        /** Parametric position of a progress value on the arc. */
        arcPos: prog => {
            const angle = Math.PI * (1 - prog);
            return {
                cx: (150 + 130 * Math.cos(angle)).toFixed(1),
                cy: (140 - 130 * Math.sin(angle)).toFixed(1),
            };
        },

        /**
         * Draw prayer-time dots on the SVG arc.
         * Called once per city load (not every tick).
         */
        drawMarkers: (phase, startMs, endMs) => {
            D.prayerMrks.innerHTML = '';
            if (!S.prayers || !S.solar) return;

            const { utcOff } = S.solar;
            const now  = Date.now();
            const next = Prayers.getNext();
            const NS   = tag => document.createElementNS('http://www.w3.org/2000/svg', tag);

            Prayers.keysForPhase(phase).forEach(k => {
                /*
                 * Fajr during the night phase after sunset belongs to tomorrow.
                 * Fajr during the night phase before sunrise belongs to today.
                 */
                const isTmrwFajr =
                    k === 'Fajr' && phase === 'night' && now >= S.solar.todaySunset;

                const ms = Prayers.toMS(S.prayers[k], utcOff, isTmrwFajr);
                if (ms <= startMs || ms >= endMs) return;

                const prog = (ms - startMs) / (endMs - startMs);
                const { cx, cy } = Prayers.arcPos(prog);
                const isNxt = next && next.name === k;

                if (isNxt) {
                    const pulse = NS('circle');
                    pulse.setAttribute('cx', cx);
                    pulse.setAttribute('cy', cy);
                    pulse.setAttribute('r', '5');
                    pulse.setAttribute('class', 'prayer-pulse');
                    D.prayerMrks.appendChild(pulse);
                }

                const dot = NS('circle');
                dot.setAttribute('cx', cx);
                dot.setAttribute('cy', cy);
                dot.setAttribute('r', '4');
                dot.setAttribute('class', `prayer-dot${isNxt ? ' prayer-dot-next' : ''}`);

                const title = NS('title');
                title.textContent = `${Lang.t('prayers')}: ${Lang.t(k)}`;
                dot.appendChild(title);
                D.prayerMrks.appendChild(dot);
            });
        },

        /** Render the prayer-time horizontal bar below the arc. */
        renderBar: () => {
            if (!S.prayers || !S.solar) { D.prayerBar.classList.add('hidden'); return; }
            D.prayerBar.classList.remove('hidden');

            const { utcOff } = S.solar;
            const next = Prayers.getNext();

            D.prayerList.innerHTML = ['Fajr','Dhuhr','Asr','Maghrib','Isha'].map(k => {
                const ms   = Prayers.toMS(S.prayers[k], utcOff);
                const time = formatLocal(ms, utcOff);
                const isNxt = next && next.name === k;
                return `<div class="prayer-item flex flex-col items-center gap-0.5 px-2 py-1 ${isNxt ? 'prayer-item-next' : ''}"
                              role="listitem"
                              aria-label="${Lang.t(k)} ${time}">
                            <span class="p-name" aria-hidden="true">${Lang.t(k)}</span>
                            <span class="p-time" dir="ltr">${time}</span>
                        </div>`;
            }).join('');
        },
    };


    /* ═══════════════════════════════════════════════════════
       11. CLOCK ENGINE — invoked every second
    ═══════════════════════════════════════════════════════ */
    const Clock = {
        run: () => {
            if (!S.solar) return;

            const now = Date.now();
            const { yesterdaySunset, todaySunrise, todaySunset, tomorrowSunrise, utcOff } = S.solar;

            /*
             * Midnight-crossing guard.
             * Open-Meteo data covers yesterday→today→tomorrow.  Once `now`
             * passes `tomorrowSunrise` the daytime data is stale and progress
             * would be clamped at 1.  Silently reload the active city so the
             * clock continues correctly on the new calendar day.
             */
            if (now > tomorrowSunrise + 60_000) {           // 1-min grace
                if (S.tickId) { clearInterval(S.tickId); S.tickId = null; }
                if (S.activeKey) Cities.load(S.activeKey);
                return;
            }

            /* ── Determine current phase ─────────────────────────── */
            let phase, startMs, endMs;
            if (now < todaySunrise) {
                phase = 'night'; startMs = yesterdaySunset; endMs = todaySunrise;
            } else if (now < todaySunset) {
                phase = 'day';   startMs = todaySunrise;    endMs = todaySunset;
            } else {
                phase = 'night'; startMs = todaySunset;     endMs = tomorrowSunrise;
            }

            const dur      = endMs - startMs;
            const progress = Math.max(0, Math.min(1, (now - startMs) / dur));

            /* ── Sky gradient ────────────────────────────────────── */
            Sky.update(phase, progress);

            /* ── Auto theme (night / golden / day) ──────────────── */
            if (!S.manualTheme) {
                const dsr   = Math.abs(now - todaySunrise);
                const dss   = Math.abs(now - todaySunset);
                const theme = phase === 'night'
                            ? 'night'
                            : (dsr < CFG.GOLD_WIN_MS || dss < CFG.GOLD_WIN_MS)
                            ? 'golden'
                            : 'day';

                document.body.classList.remove('theme-night', 'theme-golden');
                if (theme === 'night')  document.body.classList.add('theme-night');
                if (theme === 'golden') document.body.classList.add('theme-golden');
                Sky.setIcons(theme === 'night');
            }

            /* ── Celestial body (sun / moon) ─────────────────────── */
            const isNight = phase === 'night';
            D.sunShape.style.opacity  = isNight ? '0' : '1';
            D.moonShape.style.opacity = isNight ? '1' : '0';
            D.sunHalo.style.opacity   = isNight ? '0' : '1';
            D.arc.setAttribute('stroke', isNight ? 'url(#g-night)' : 'url(#g-day)');

            /* ══ SWAHILI CLOCK — ABSOLUTE 60-MINUTE HOURS ════════
             *
             * The Swahili hour counter uses standard 60-minute hours counted
             * from the START of the current phase (sunrise for day, sunset for
             * night).  The count is NOT capped at 12 — in a summer day of
             * 14 hours, the display will reach hour 14 before sunset.
             *
             * elapsed  = milliseconds since phase start
             * pH       = 0-indexed hours elapsed
             * display  = pH + 1  (1-indexed, so "hour 1" at phase start)
             */
            const elapsed = now - startMs;
            const pH = Math.floor(elapsed / 3_600_000);
            const pM = Math.floor((elapsed % 3_600_000) / 60_000);
            const pS = Math.floor((elapsed % 60_000)    / 1_000);

            D.hourNum.textContent   = pH + 1;
            D.phaseDisp.textContent = `${Lang.t('of')} ${Lang.t(isNight ? 'nighttime' : 'daytime')}`;
            D.metricDisp.textContent = fmt(pH, pM, pS);

            /* ── Countdown to next phase-change event ───────────── */
            const nextEventMs = phase === 'day' ? todaySunset
                              : now < todaySunrise ? todaySunrise
                              : tomorrowSunrise;
            const diff = Math.max(0, nextEventMs - now);

            D.cdLbl.textContent = phase === 'day' ? Lang.t('untilSunset') : Lang.t('untilSunrise');
            D.cdNum.textContent = fmt(
                Math.floor(diff / 3_600_000),
                Math.floor((diff % 3_600_000) / 60_000),
                Math.floor((diff % 60_000)    / 1_000),
            );

            /* ── City civil time ─────────────────────────────────── */
            D.stdTime.textContent = formatLocal(now, utcOff, true);

            /* ══ SVG ARC ANIMATION ════════════════════════════════
             *
             * The celestial body moves along the path:
             *   M 20 140 A 130 130 0 0 1 280 140
             *
             * sweep-flag = 1 (clockwise in SVG y-down space).
             * Clockwise from (20,140) passes through (150,10) — the apex —
             * before reaching (280,140).  This is the UPPER semicircle. ✓
             *
             * Parametric formula:
             *   angle = π × (1 − progress)       [π → 0 as progress 0 → 1]
             *   cx    = 150 + 130 × cos(angle)   [150 = arc centre x]
             *   cy    = 140 − 130 × sin(angle)   [subtract because y↓ in SVG]
             *
             * Verification at key points:
             *   progress = 0   → angle = π   → (20,  140)  sunrise/sunset ✓
             *   progress = 0.5 → angle = π/2 → (150,  10)  apex ✓
             *   progress = 1   → angle = 0   → (280, 140)  sunset/sunrise ✓
             */
            const angle = Math.PI * (1 - progress);
            const cx    = 150 + 130 * Math.cos(angle);
            const cy    = 140 - 130 * Math.sin(angle);

            D.arc.setAttribute('stroke-dashoffset', (100 - progress * 100).toFixed(2));
            D.celestial.setAttribute('transform', `translate(${cx.toFixed(2)},${cy.toFixed(2)})`);

            /* ── Ambient mode ─────────────────────────────────────── */
            if (S.ambientActive) Ambient.update();

            /* ── Prayer bar (refresh once per minute) ───────────── */
            if (S.prayers && Math.floor(now / 1_000) % 60 === 0) {
                Prayers.renderBar();
                Prayers.drawMarkers(phase, startMs, endMs);
            }
        },
    };


    /* ═══════════════════════════════════════════════════════
       12. DAY/NIGHT BAR
    ═══════════════════════════════════════════════════════ */
    const renderDayNightBar = () => {
        if (!S.solar) return;
        const { dayLengthMs, nightLengthMs } = S.solar;
        const totalCycle = dayLengthMs + nightLengthMs;
        const dayPct   = (dayLengthMs / totalCycle * 100).toFixed(1);
        const nightPct = (100 - +dayPct).toFixed(1);
        const diff     = Math.abs(dayLengthMs - nightLengthMs);

        D.dayBar.style.width   = `${dayPct}%`;
        D.nightBar.style.width = `${nightPct}%`;
        D.dayLen.textContent   = fmtDur(dayLengthMs);
        D.nightLen.textContent = fmtDur(nightLengthMs);

        D.compTxt.textContent =
            diff < 5 * 60_000          ? Lang.t('equinox')
            : dayLengthMs > nightLengthMs ? `${Lang.t('dayLonger')} ${fmtDur(diff)}`
            :                               `${Lang.t('nightLonger')} ${fmtDur(diff)}`;
    };


    /* ═══════════════════════════════════════════════════════
       13. SHARE IMAGE (Canvas API)
    ═══════════════════════════════════════════════════════ */
    const ShareImage = {
        async generate() {
            await document.fonts.ready;

            const canvas = document.createElement('canvas');
            canvas.width = 1080; canvas.height = 1080;
            const ctx    = canvas.getContext('2d');
            const isAr   = Lang.current === 'ar';

            const solar = S.solar;
            const now   = Date.now();
            let prog = 0.5, isNight = false;

            if (solar) {
                const { todaySunrise, todaySunset, yesterdaySunset, tomorrowSunrise } = solar;
                isNight = now < todaySunrise || now >= todaySunset;
                const st = isNight ? (now < todaySunrise ? yesterdaySunset : todaySunset) : todaySunrise;
                const en = isNight ? (now < todaySunrise ? todaySunrise : tomorrowSunrise) : todaySunset;
                prog = Math.max(0, Math.min(1, (now - st) / (en - st)));
            }

            /* Background */
            const bg = ctx.createRadialGradient(540, 540, 100, 540, 540, 800);
            if (isNight) {
                bg.addColorStop(0, '#1E1B4B'); bg.addColorStop(1, '#020617');
            } else {
                bg.addColorStop(0, '#FEF08A'); bg.addColorStop(1, '#F59E0B');
            }
            ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1080);

            /* Stars */
            if (isNight) {
                for (let i = 0; i < 300; i++) {
                    ctx.fillStyle = `rgba(255,255,255,${(Math.random()*0.5).toFixed(2)})`;
                    ctx.beginPath();
                    ctx.arc(Math.random()*1080, Math.random()*1080, Math.random()*2, 0, Math.PI*2);
                    ctx.fill();
                }
            }

            /* Glass card */
            ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
            ctx.fillStyle = isNight ? 'rgba(15,23,42,0.60)' : 'rgba(255,255,255,0.72)';
            if (ctx.roundRect) {
                ctx.beginPath(); ctx.roundRect(80, 140, 920, 800, 40); ctx.fill();
            } else {
                ctx.fillRect(80, 140, 920, 800);
            }
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = isNight ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 2; ctx.stroke();

            const city   = S.cities[S.activeKey];
            const cname  = (isAr ? city?.name : city?.nameEn) || city?.name || '';
            const hourTxt = D.hourNum?.textContent  || '--';
            const phase   = D.phaseDisp?.textContent || '';
            const txtClr  = isNight ? '#FFFFFF' : '#111827';
            const secClr  = isNight ? '#94A3B8' : '#4B5563';

            ctx.textAlign   = 'center';
            ctx.textBaseline = 'middle';
            ctx.direction    = isAr ? 'rtl' : 'ltr';

            ctx.fillStyle = txtClr;
            ctx.font = 'bold 280px "JetBrains Mono", monospace';
            ctx.fillText(hourTxt, 540, 490);

            ctx.fillStyle = secClr;
            ctx.font = 'bold 52px "Tajawal", sans-serif';
            ctx.fillText(phase, 540, 690);

            ctx.fillStyle = txtClr;
            ctx.font = 'bold 72px "Tajawal", sans-serif';
            ctx.fillText(cname, 540, 260);

            /* Arc */
            ctx.beginPath(); ctx.arc(540, 820, 200, Math.PI, 0);
            ctx.strokeStyle = isNight ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
            ctx.lineWidth = 12; ctx.stroke();
            ctx.beginPath(); ctx.arc(540, 820, 200, Math.PI, Math.PI + prog * Math.PI);
            ctx.strokeStyle = isNight ? '#818CF8' : '#F59E0B';
            ctx.lineWidth = 12; ctx.stroke();

            /* Brand */
            ctx.fillStyle = secClr;
            ctx.font = 'bold 30px "JetBrains Mono", monospace';
            ctx.direction = 'ltr';
            ctx.fillText('SolarisSwahili', 540, 875);

            return canvas.toDataURL('image/png');
        },

        async show() {
            const btn  = D.shareImgBtn;
            const span = btn?.querySelector('[data-i18n="shareImage"]');
            if (btn) btn.disabled = true;
            if (span) span.textContent = '…';

            try {
                const dataUrl = await this.generate();
                let modal = el('share-img-modal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'share-img-modal';
                    modal.className = 'share-modal';
                    document.body.appendChild(modal);
                }
                modal.innerHTML = `
                    <div class="share-modal-bg"
                         onclick="document.getElementById('share-img-modal').style.display='none'"
                         aria-hidden="true"></div>
                    <div class="share-modal-card" role="dialog" aria-modal="true" aria-label="${Lang.t('shareImage')}">
                        <img src="${dataUrl}" alt="${Lang.t('shareImage')}">
                        <div class="share-modal-actions">
                            <a href="${dataUrl}" download="swahili-time.png"
                               class="add-btn text-sm font-bold rounded-full px-5 py-2.5 no-underline">
                               ⬇ ${Lang.t('downloadPNG')}</a>
                            <button class="city-btn text-sm rounded-full px-5 py-2.5"
                                    onclick="document.getElementById('share-img-modal').style.display='none'">
                               ${Lang.t('close')}</button>
                        </div>
                    </div>`;
                modal.style.display = 'flex';
            } catch (e) {
                console.error('[SS] ShareImage error:', e);
            }

            if (btn) btn.disabled = false;
            if (span) span.textContent = Lang.t('shareImage');
        },
    };


    /* ═══════════════════════════════════════════════════════
       14. AMBIENT MODE (Wall-Clock / Mosque Display)
    ═══════════════════════════════════════════════════════ */
    const Ambient = {
        async enter() {
            S.ambientActive = true;
            if (!D.ambOverlay) return;

            D.ambOverlay.style.display = 'flex';
            const ambStars = el('amb-stars');
            if (ambStars) {
                /* Generate star positions once; Ambient.update() toggles
                   .stars-visible based on day/night phase. */
                genStars(ambStars);
            }

            /* Request fullscreen and WakeLock */
            document.documentElement.requestFullscreen?.().catch(() => {});
            await WakeLock.request();
            document.body.classList.add('wakelock-active');

            this.update();
        },

        exit() {
            S.ambientActive = false;
            if (!D.ambOverlay) return;
            D.ambOverlay.style.display = 'none';

            if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
            }
            WakeLock.release();
            document.body.classList.remove('wakelock-active');
        },

        update() {
            if (!S.ambientActive || !S.solar) return;

            const now = Date.now();
            const { yesterdaySunset, todaySunrise, todaySunset, tomorrowSunrise, utcOff } = S.solar;
            const isNight = now < todaySunrise || now >= todaySunset;
            const st = isNight ? (now < todaySunrise ? yesterdaySunset : todaySunset) : todaySunrise;
            const en = isNight ? (now < todaySunrise ? todaySunrise : tomorrowSunrise) : todaySunset;
            const progress = Math.max(0, Math.min(1, (now - st) / (en - st)));

            /* Swahili hour (absolute model) */
            const elapsed = now - st;
            const pH = Math.floor(elapsed / 3_600_000) + 1;

            const set = (id, v) => { const e = el(id); if (e) e.textContent = v; };
            const city = S.cities[S.activeKey];

            set('amb-city',    (Lang.current === 'en' && city?.nameEn) ? city.nameEn : (city?.name || ''));
            set('amb-country', (Lang.current === 'en' && city?.countryEn) ? city.countryEn : (city?.country || ''));
            set('amb-hour',    pH);
            set('amb-phase',   D.phaseDisp?.textContent || '');
            set('amb-std',     formatLocal(now, utcOff, true));
            set('amb-date',    D.dateEl?.textContent || '');

            const nextMs = isNight
                ? (now < todaySunrise ? todaySunrise : tomorrowSunrise)
                : todaySunset;
            const diff   = Math.max(0, nextMs - now);
            const evtLbl = isNight ? Lang.t('untilSunrise') : Lang.t('untilSunset');
            set('amb-countdown', `${Lang.t('remaining')} ${evtLbl}: ${fmt(
                Math.floor(diff/3_600_000),
                Math.floor((diff%3_600_000)/60_000),
                Math.floor((diff%60_000)/1_000)
            )}`);

            /* Arc */
            const ambArc = el('amb-progress-arc');
            if (ambArc) {
                ambArc.setAttribute('stroke-dashoffset', (100 - progress * 100).toFixed(2));
                ambArc.setAttribute('stroke', isNight ? 'url(#amb-g-night)' : 'url(#amb-g-day)');
            }

            /* Celestial body */
            const ambBody = el('amb-celestial');
            if (ambBody) {
                const angle = Math.PI * (1 - progress);
                const bx = 300 + 255 * Math.cos(angle);
                const by = 270 - 255 * Math.sin(angle);
                ambBody.setAttribute('transform', `translate(${bx.toFixed(1)},${by.toFixed(1)})`);
            }

            const ambSun  = el('amb-sun');  if (ambSun)  ambSun.style.opacity  = isNight ? '0' : '1';
            const ambMoon = el('amb-moon'); if (ambMoon) ambMoon.style.opacity = isNight ? '1' : '0';

            const ambStars = el('amb-stars');
            if (ambStars) ambStars.classList.toggle('stars-visible', isNight);
        },
    };


    /* ═══════════════════════════════════════════════════════
       15. CITIES
    ═══════════════════════════════════════════════════════ */
    const Cities = {
        /** Persist custom (non-default) cities to localStorage. */
        saveCustom: () => {
            try {
                const custom = Object.fromEntries(
                    Object.entries(S.cities).filter(([k]) => !CFG.DEFAULT_KEYS.includes(k))
                );
                localStorage.setItem('ss_custom_cities', JSON.stringify(custom));
            } catch { /* full / blocked */ }
        },

        /** Rebuild the city selector buttons. */
        buildButtons: () => {
            D.citySel.innerHTML = '';
            Object.keys(S.cities).forEach(k => {
                const city      = S.cities[k];
                const isDefault = CFG.DEFAULT_KEYS.includes(k);
                const displayName = (Lang.current === 'en' && city.nameEn) ? city.nameEn : city.name;

                const btn = document.createElement('button');
                btn.type      = 'button';
                btn.className = 'city-btn';
                btn.dataset.city = k;

                const nameSpan = document.createElement('span');
                nameSpan.textContent = displayName;
                btn.appendChild(nameSpan);

                /* Delete button for user-added cities */
                if (!isDefault) {
                    const del = document.createElement('span');
                    del.className = 'city-del';
                    del.setAttribute('role', 'button');
                    del.setAttribute('aria-label', `${Lang.t('removeCity')}: ${displayName}`);
                    del.textContent = '×';
                    del.onclick = e => { e.stopPropagation(); Cities.removeCustom(k); };
                    btn.appendChild(del);
                }

                btn.setAttribute('aria-label', `عرض توقيت ${displayName}`);
                btn.onclick = () => { if (S.activeKey !== k) Cities.load(k); };
                D.citySel.appendChild(btn);
            });
        },

        /** Remove a custom city and fall back to the first default. */
        removeCustom: key => {
            if (CFG.DEFAULT_KEYS.includes(key)) return;
            delete S.cities[key];
            Cities.saveCustom();
            Cities.buildButtons();
            if (S.activeKey === key) Cities.load(CFG.DEFAULT_KEYS[0]);
        },

        /** Update the URL ?city= parameter without reloading. */
        updateURL: cityName => {
            try {
                const url = new URL(window.location.href);
                url.searchParams.set('city', cityName);
                history.replaceState({}, '', url);
            } catch { /* unsupported */ }
        },

        /**
         * Load a city by its key.
         * Uses a generation counter to prevent race conditions on rapid switching.
         */
        load: async key => {
            const gen = ++S.loadGen;
            if (S.tickId) { clearInterval(S.tickId); S.tickId = null; }

            /* Show loader */
            D.loader.classList.remove('opacity-0');
            D.loader.style.pointerEvents = 'auto';
            D.app.style.opacity          = '0';
            D.loaderTxt.textContent      = Lang.t('loading');
            D.errOverlay.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => D.errOverlay.classList.add('hidden'), 500);

            S.activeKey = key;
            const city  = S.cities[key];

            /* Immediate UI update */
            document.querySelectorAll('.city-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.city === key)
            );
            D.cityName.textContent = (Lang.current === 'en' && city.nameEn) ? city.nameEn : city.name;
            if (D.countrySub) {
                D.countrySub.textContent = (Lang.current === 'en' && city.countryEn) ? city.countryEn : (city.country || '');
            }
            updateDateDisplay();
            Cities.updateURL(city.nameEn || city.name);

            /* AbortController with 15-second timeout */
            const ctrl    = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 15_000);

            try {
                /* Fetch solar data first (we need utcOff to compute prayer date) */
                const solar = await SolarAPI.fetch(city.lat, city.lng, ctrl.signal);
                if (gen !== S.loadGen) return;

                /* Then fetch prayers with the city's local date */
                const prayers = await PrayerAPI.fetch(city.lat, city.lng, solar.utcOff, ctrl.signal);
                clearTimeout(timeout);
                if (gen !== S.loadGen) return;

                S.solar   = solar;
                S.prayers = prayers;

                /* Hijri date — use timeZone:'UTC' to avoid browser-timezone mismatch */
                try {
                    const localMs    = Date.now() + solar.utcOff * 60_000;
                    const hijriLocale = Lang.current === 'ar' ? 'ar-SA-u-ca-islamic' : 'en-u-ca-islamic';
                    D.hijri.textContent = new Intl.DateTimeFormat(hijriLocale, {
                        day: 'numeric', month: 'long', year: 'numeric',
                        timeZone: 'UTC',
                    }).format(new Date(localMs));
                } catch { D.hijri.textContent = ''; }

                /* Sunrise / sunset times */
                D.sunriseEl.textContent = formatLocal(solar.todaySunrise, solar.utcOff);
                D.sunsetEl.textContent  = formatLocal(solar.todaySunset,  solar.utcOff);

                /* Day/night bar */
                renderDayNightBar();

                /* Prayer markers (initial draw) */
                const n2 = Date.now();
                let pPhase, pStart, pEnd;
                if (n2 >= solar.todaySunrise && n2 < solar.todaySunset) {
                    pPhase = 'day';   pStart = solar.todaySunrise; pEnd = solar.todaySunset;
                } else {
                    pPhase = 'night';
                    pStart = n2 < solar.todaySunrise ? solar.yesterdaySunset : solar.todaySunset;
                    pEnd   = n2 < solar.todaySunrise ? solar.todaySunrise    : solar.tomorrowSunrise;
                }
                Prayers.drawMarkers(pPhase, pStart, pEnd);
                Prayers.renderBar();

                /* Start the 1-second tick */
                Clock.run();
                S.tickId = setInterval(Clock.run, 1_000);

                /* Hide loader */
                D.loader.classList.add('opacity-0');
                D.loader.style.pointerEvents = 'none';
                D.app.style.opacity          = '1';

            } catch (err) {
                clearTimeout(timeout);
                if (gen !== S.loadGen) return;

                console.error('[SS]', err);
                D.errMsg.textContent = err.message || Lang.t('errorDefault');
                D.errOverlay.classList.remove('hidden');
                requestAnimationFrame(() => {
                    D.errOverlay.classList.remove('opacity-0', 'pointer-events-none');
                    D.errOverlay.setAttribute('aria-hidden', 'false');
                });
                D.loader.classList.add('opacity-0');
                D.loader.style.pointerEvents = 'none';
            }
        },

        /**
         * Search Nominatim for a city by name and load it.
         * Used when a ?city= URL parameter names a city not in S.cities.
         */
        searchAndLoad: async query => {
            try {
                const url = 'https://nominatim.openstreetmap.org/search'
                          + `?format=json&limit=1&addressdetails=1`
                          + `&q=${encodeURIComponent(query)}`
                          + `&email=solarisswahili@users.noreply.github.com`;

                const res = await fetch(url).then(r => r.json());
                if (!res.length) { Cities.load(CFG.DEFAULT_KEYS[0]); return; }

                const r = res[0];
                const lat = parseFloat(r.lat);
                const lng = parseFloat(r.lon);
                if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    Cities.load(CFG.DEFAULT_KEYS[0]); return;
                }

                const k = `c_${Date.now()}`;
                S.cities[k] = {
                    name: r.name || query, nameEn: r.name || query,
                    country: r.address?.country || '', countryEn: r.address?.country || '',
                    countryCode: (r.address?.country_code || '').toUpperCase(),
                    lat: String(lat), lng: String(lng),
                };
                Cities.saveCustom();
                Cities.buildButtons();
                Cities.load(k);
            } catch {
                Cities.load(CFG.DEFAULT_KEYS[0]);
            }
        },
    };


    /* ═══════════════════════════════════════════════════════
       16. WAKELOCK
    ═══════════════════════════════════════════════════════ */
    const WakeLock = {
        async request() {
            if (!('wakeLock' in navigator)) return;
            try {
                S.wakeLock = await navigator.wakeLock.request('screen');
                S.wakeLock.addEventListener('release', () => { S.wakeLock = null; });
            } catch { /* denied or unavailable */ }
        },

        release() {
            if (S.wakeLock) { S.wakeLock.release().catch(() => {}); S.wakeLock = null; }
        },

        async reacquire() {
            if (!S.wakeLock && S.ambientActive && document.visibilityState === 'visible') {
                await WakeLock.request();
            }
        },
    };

    /* Re-acquire WakeLock when the page returns to foreground */
    document.addEventListener('visibilitychange', WakeLock.reacquire);


    /* ═══════════════════════════════════════════════════════
       17. INIT
    ═══════════════════════════════════════════════════════ */
    const init = () => {
        Lang._init();
        Lang.apply();

        /* Stars background — generated once, cached */
        genStars();

        /* Build city buttons */
        Cities.buildButtons();

        /* Time-format button initial label */
        if (D.formatBtn) D.formatBtn.textContent = S.is24Hour ? '12ساعة' : '24H';

        /* ── Restore saved theme ─────────────────────────── */
        const savedTheme = (() => { try { return localStorage.getItem('ss_theme'); } catch { return null; } })();
        if (savedTheme === 'night') {
            S.manualTheme = true;
            document.body.classList.add('theme-night');
            Sky.setIcons(true);
            Sky.setManual(true);
            if (D.resetBtn) {
                D.resetBtn.classList.remove('hidden');
                requestAnimationFrame(() => D.resetBtn.classList.remove('opacity-0', 'translate-x-3'));
            }
        } else if (savedTheme === 'day') {
            S.manualTheme = true;
        }

        /* ── Initial city from URL param ─────────────────── */
        const urlCity = new URLSearchParams(window.location.search).get('city');
        if (urlCity) {
            const matchKey = Object.keys(S.cities).find(k =>
                S.cities[k].name === urlCity || S.cities[k].nameEn === urlCity
            );
            matchKey ? Cities.load(matchKey) : Cities.searchAndLoad(urlCity);
        } else {
            Cities.load(CFG.DEFAULT_KEYS[0]);
        }

        /* ── Event Listeners ─────────────────────────────── */

        /* Add city */
        D.addBtn.onclick = async () => {
            const val = D.cityInput.value.trim();
            if (!val) return;
            D.cityErr.classList.add('hidden');
            D.addBtn.disabled    = true;
            D.addBtn.textContent = Lang.t('adding');

            try {
                const url = 'https://nominatim.openstreetmap.org/search'
                          + `?format=json&limit=1&addressdetails=1`
                          + `&q=${encodeURIComponent(val)}`
                          + `&email=solarisswahili@users.noreply.github.com`;

                const res = await fetch(url).then(r => r.json());
                if (!res.length) throw new Error(Lang.t('cityNotFound'));

                const r   = res[0];
                const lat = parseFloat(r.lat);
                const lng = parseFloat(r.lon);
                if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    throw new Error('إحداثيات غير صحيحة. يرجى المحاولة بمدينة أخرى.');
                }

                const k = `c_${Date.now()}`;
                S.cities[k] = {
                    name: r.name || val, nameEn: r.name || val,
                    country: r.address?.country || '', countryEn: r.address?.country || '',
                    countryCode: (r.address?.country_code || '').toUpperCase(),
                    lat: String(lat), lng: String(lng),
                };
                Cities.saveCustom();
                Cities.buildButtons();
                D.cityInput.value = '';
                Cities.load(k);
            } catch (e) {
                D.cityErr.textContent = e.message;
                D.cityErr.classList.remove('hidden');
            } finally {
                D.addBtn.disabled    = false;
                D.addBtn.textContent = Lang.t('addCity');
            }
        };

        D.cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') D.addBtn.click(); });

        /* Language toggle */
        const langBtn = el('lang-toggle');
        if (langBtn) langBtn.onclick = () => Lang.toggle();

        /* Theme toggle */
        D.themeBtn.onclick = () => {
            S.manualTheme = true;
            document.body.classList.remove('theme-golden');
            const isNight = document.body.classList.toggle('theme-night');
            Sky.setIcons(isNight);
            Sky.setManual(isNight);
            /* localStorage.setItem fires the native storage event in other tabs. */
            try { localStorage.setItem('ss_theme', isNight ? 'night' : 'day'); } catch { /* blocked */ }
            if (D.resetBtn) {
                D.resetBtn.classList.remove('hidden');
                requestAnimationFrame(() => D.resetBtn.classList.remove('opacity-0', 'translate-x-3'));
            }
        };

        /* Auto-theme reset */
        D.resetBtn.onclick = () => {
            S.manualTheme = false;
            try { localStorage.removeItem('ss_theme'); } catch { /* blocked */ }
            D.resetBtn.classList.add('opacity-0', 'translate-x-3');
            setTimeout(() => D.resetBtn.classList.add('hidden'), 300);
            Clock.run();
        };

        /* Time format toggle (12h ↔ 24h) */
        if (D.formatBtn) {
            D.formatBtn.onclick = () => {
                S.is24Hour = !S.is24Hour;
                try { localStorage.setItem('ss_24h', S.is24Hour); } catch { /* blocked */ }
                D.formatBtn.textContent = S.is24Hour ? '12ساعة' : '24H';
                if (S.solar) {
                    D.sunriseEl.textContent = formatLocal(S.solar.todaySunrise, S.solar.utcOff);
                    D.sunsetEl.textContent  = formatLocal(S.solar.todaySunset,  S.solar.utcOff);
                    Prayers.renderBar();
                    Clock.run();
                }
            };
        }

        /* Share link */
        D.shareBtn.onclick = async () => {
            try {
                if (navigator.share) {
                    await navigator.share({ title: 'SolarisSwahili', url: location.href });
                } else {
                    await navigator.clipboard.writeText(location.href);
                    const orig = D.shareBtn.innerHTML;
                    D.shareBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
                    setTimeout(() => { D.shareBtn.innerHTML = orig; }, 2_200);
                }
            } catch { /* cancelled */ }
        };

        /* Share image */
        if (D.shareImgBtn) D.shareImgBtn.onclick = () => ShareImage.show();

        /* Ambient mode */
        if (D.ambientBtn) D.ambientBtn.onclick = () => {
            if (!S.ambientActive && S.solar) Ambient.enter();
        };
        const ambClose = el('amb-close');
        if (ambClose) ambClose.onclick = () => Ambient.exit();

        /* Retry on error */
        D.retryBtn.onclick = () => { if (S.activeKey) Cities.load(S.activeKey); };

        /* Keyboard shortcuts */
        document.addEventListener('keydown', e => {
            if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
                if (!S.ambientActive && S.solar) Ambient.enter();
                else if (S.ambientActive) Ambient.exit();
            }
            if (e.key === 'Escape' && S.ambientActive) Ambient.exit();
        });

        /* Pause tick when tab is hidden; resume on visibility */
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (S.tickId) { clearInterval(S.tickId); S.tickId = null; }
            } else if (S.solar && !S.tickId) {
                Clock.run();
                S.tickId = setInterval(Clock.run, 1_000);
            }
        });
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', SolarisSwahili.init);