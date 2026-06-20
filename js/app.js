/**
 * SolarisSwahili v3.0
 * ساعة التوقيت السواحلي / المغربي التكيفية
 *
 * يعمل هذا النظام بعدّ الساعات القياسية (60 دقيقة) منذ لحظة الشروق أو الغروب
 * بناءً على بيانات فلكية حية من Open-Meteo API.
 *
 * © 2026 Azzubair — جميع الحقوق محفوظة
 */

'use strict';

const SolarisSwahili = (() => {

    /* ═══════════════════════════════════════════════════════
       1.  CONFIG
    ═══════════════════════════════════════════════════════ */
    const CFG = {
        /** نافذة الغسق / الفجر الذهبية بالميلي ثانية (45 دقيقة) */
        GOLD_WIN_MS: 45 * 60 * 1000,

        /** مدة صلاحية الكاش بالميلي ثانية (6 ساعات) */
        CACHE_TTL_MS: 6 * 60 * 60 * 1000,

        /**
         * طريقة حساب أوقات الصلاة في Aladhan API
         * 3 = رابطة العالم الإسلامي (Muslim World League) — مناسب لشمال أفريقيا
         */
        PRAYER_METHOD: 3,

        /** أسماء الصلوات بالعربية */
        PRAYER_AR: {
            Fajr:    'الفجر',
            Dhuhr:   'الظهر',
            Asr:     'العصر',
            Maghrib: 'المغرب',
            Isha:    'العشاء',
        },

        /** المدن الافتراضية */
        CITIES: {
            tobruk:   { name: 'طبرق',   lat: '32.0773', lng: '23.9600' },
            benghazi: { name: 'بنغازي', lat: '32.1167', lng: '20.0667' },
            tripoli:  { name: 'طرابلس', lat: '32.8892', lng: '13.1900' },
        },

        /** تعريف ألوان السماء النهارية (نقاط زمنية) */
        SKY_DAY: [
            { p: 0.00, t: '#FEF3C7', b: '#FDBA74' },  // فجر / شروق
            { p: 0.18, t: '#E0F2FE', b: '#BAE6FD' },  // صباح
            { p: 0.50, t: '#F0F9FF', b: '#E5E7EB' },  // ظهيرة
            { p: 0.82, t: '#FEF9C3', b: '#FDE68A' },  // عصر
            { p: 1.00, t: '#FDE68A', b: '#FDBA74' },  // غروب
        ],

        /** ألوان السماء الليلية */
        SKY_NIGHT: { t: '#020617', b: '#0B1120' },

        /**
         * معرّف التطبيق لـ Nominatim — مطلوب بسياسة الاستخدام.
         * استبدله بعنوان بريد إلكتروني صالح للتطبيق.
         */
        NOMINATIM_APP: 'solarisswahili-app',
    };


    /* ═══════════════════════════════════════════════════════
       2.  STATE
    ═══════════════════════════════════════════════════════ */
    const S = {
        /** جميع المدن (افتراضية + مُضافة) */
        cities:      { ...CFG.CITIES },

        /** مفتاح المدينة النشطة */
        activeKey:   null,

        /** بيانات الشمس المحسوبة */
        solar:       null,

        /** بيانات مواقيت الصلاة */
        prayers:     null,

        /** معرّف الـ setInterval */
        tickId:      null,

        /** هل يتحكم المستخدم يدوياً في الثيم؟ */
        manualTheme: false,

        /** هل تنسيق الوقت 24 ساعة؟ */
        is24Hour:    false,

        /**
         * عدّاد الجيل — يمنع تداخل استجابات تبديل المدن السريع.
         * كل استدعاء لـ loadCity يأخذ رقم جيله ويُعقد مقارنة قبل تحديث الواجهة.
         */
        loadGen:     0,

        /** كائن WakeLock الحالي (أو null) */
        wakeLock:    null,
    };

    /* ── تهيئة الحالة من localStorage بشكل آمن ─────────── */
    try {
        S.is24Hour = localStorage.getItem('solaris_24h') === 'true';
    } catch { /* localStorage محظور في هذه البيئة */ }

    try {
        const raw = localStorage.getItem('solaris_custom_cities');
        if (raw) {
            const parsed = JSON.parse(raw);
            // تحقق أساسي: كل مدينة يجب أن تملك name و lat و lng
            Object.entries(parsed).forEach(([k, v]) => {
                if (v && typeof v.name === 'string' &&
                    typeof v.lat  === 'string' &&
                    typeof v.lng  === 'string') {
                    S.cities[k] = v;
                }
            });
        }
    } catch { /* بيانات تالفة أو محظورة — نتجاهلها */ }


    /* ═══════════════════════════════════════════════════════
       3.  DOM REFS
    ═══════════════════════════════════════════════════════ */
    const el = id => document.getElementById(id);

    const D = {
        loader      : el('loader'),
        loaderTxt   : el('loader-text'),
        errOverlay  : el('error-overlay'),
        errMsg      : el('error-message'),
        retryBtn    : el('retry-btn'),
        app         : el('app-container'),
        citySel     : el('city-selector'),
        cityName    : el('city-name'),
        hijri       : el('hijri-date'),
        hourNum     : el('hour-display'),
        phaseDisp   : el('phase-display'),
        metricDisp  : el('metric-display'),
        cdNum       : el('countdown-display'),
        cdLbl       : el('next-event-name'),
        arc         : el('progress-arc'),
        celestial   : el('celestial-body'),
        sunShape    : el('sun-shape'),
        moonShape   : el('moon-shape'),
        sunHalo     : el('sun-halo'),
        prayerMrks  : el('prayer-markers'),
        prayerBar   : el('prayer-bar'),
        prayerList  : el('prayer-list'),
        stars       : el('stars-layer'),
        themeBtn    : el('theme-toggle'),
        resetBtn    : el('theme-auto-reset'),
        sunIco      : el('sun-icon'),
        moonIco     : el('moon-icon'),
        shareBtn    : el('share-btn'),
        formatBtn   : el('time-format-toggle'),
        cityInput   : el('city-input'),
        addBtn      : el('add-btn'),
        cityErr     : el('city-error'),
        dayBar      : el('day-bar'),
        nightBar    : el('night-bar'),
        dayLen      : el('day-length'),
        nightLen    : el('night-length'),
        compTxt     : el('comparison-text'),
        sunriseEl   : el('sunrise-time'),
        sunsetEl    : el('sunset-time'),
        stdTime     : el('standard-time'),
    };


    /* ═══════════════════════════════════════════════════════
       4.  UTILITIES
    ═══════════════════════════════════════════════════════ */

    /** يُضيف صفراً بادئاً إذا كان العدد أقل من 10 */
    const pad = n => String(n).padStart(2, '0');

    /** يُنسّق ثلاثة أرقام بصيغة HH:MM:SS */
    const fmt = (h, m, s) => `${pad(h)}:${pad(m)}:${pad(s)}`;

    /**
     * يُحوّل ميلي الثواني إلى نص عربي مُقروء بالساعات والدقائق.
     * يراعي قواعد التذكير والتعدد في اللغة العربية.
     */
    const fmtDur = ms => {
        const tot = Math.round(ms / 60_000);
        const h = Math.floor(tot / 60);
        const m = tot % 60;

        const hS = !h       ? ''
                 : h === 1  ? 'ساعة'
                 : h === 2  ? 'ساعتين'
                 : h <= 10  ? `${h} ساعات`
                 :             `${h} ساعة`;

        const mS = !m       ? ''
                 : m === 1  ? 'دقيقة'
                 : m === 2  ? 'دقيقتين'
                 : m <= 10  ? `${m} دقائق`
                 :             `${m} دقيقة`;

        if (!hS && !mS) return 'أقل من دقيقة';
        if (!hS) return mS;
        if (!mS) return hS;
        return `${hS} و${mS}`;
    };

    /**
     * يُعيد سلسلة التاريخ المحلي للمدينة (YYYY-MM-DD)
     * بناءً على إزاحة UTC المحلية وعدد الأيام المُضافة.
     *
     * @param {number} offsetMins - إزاحة UTC بالدقائق
     * @param {number} [offDays=0] - أيام إضافية (1 لغداً، -1 لأمس)
     */
    const getCityDateStr = (offsetMins, offDays = 0) => {
        const ms = Date.now() + offsetMins * 60_000 + offDays * 86_400_000;
        return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD
    };

    /**
     * يُنسّق طابعاً زمنياً UTC إلى وقت محلي مقروء.
     *
     * الطريقة: نُضيف الإزاحة إلى الطابع الزمني UTC فيُعامله
     * الـ Date كـ UTC ونقرأ getUTCHours/Minutes/Seconds،
     * فنحصل على الساعة المحلية الصحيحة.
     *
     * @param {number} utcMs   - طابع UTC بالميلي ثانية
     * @param {number} offMins - إزاحة UTC بالدقائق
     * @param {boolean} [secs] - هل تُظهر الثواني؟
     */
    const formatLocal = (utcMs, offMins, secs = false) => {
        const d = new Date(utcMs + offMins * 60_000);
        const h = d.getUTCHours();
        const m = d.getUTCMinutes();
        const s = d.getUTCSeconds();

        if (S.is24Hour) {
            return secs ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`;
        }

        // 12-ساعة مع مؤشر عربي (ص = صباحاً، م = مساءً)
        const suffix = h >= 12 ? 'م' : 'ص';
        const h12    = h % 12 || 12;
        return secs
            ? `${pad(h12)}:${pad(m)}:${pad(s)} ${suffix}`
            : `${pad(h12)}:${pad(m)} ${suffix}`;
    };

    /**
     * يُنتج 150 نجمة عشوائية كخلفية CSS لطبقة النجوم.
     * يُستدعى مرة واحدة عند التهيئة.
     */
    const genStars = () => {
        D.stars.style.backgroundImage = Array.from({ length: 150 }, () => {
            const x = (Math.random() * 100).toFixed(1);
            const y = (Math.random() * 100).toFixed(1);
            const r = (Math.random() * 1.8 + 0.3).toFixed(1);
            const o = (Math.random() * 0.65 + 0.28).toFixed(2);
            return `radial-gradient(${r}px ${r}px at ${x}% ${y}%, rgba(255,255,255,${o}), transparent)`;
        }).join(',');
    };

    /**
     * يُدمج لونين سداسيين بنسبة t (0→1).
     *
     * @param {string} a - اللون الأول بصيغة #RRGGBB
     * @param {string} b - اللون الثاني بصيغة #RRGGBB
     * @param {number} t - نسبة الدمج (0 = a كاملاً، 1 = b كاملاً)
     */
    const lerpHex = (a, b, t) => {
        const parse = c => [
            parseInt(c.slice(1, 3), 16),
            parseInt(c.slice(3, 5), 16),
            parseInt(c.slice(5, 7), 16),
        ];
        const [r1, g1, b1] = parse(a);
        const [r2, g2, b2] = parse(b);
        return '#' + [
            Math.round(r1 + (r2 - r1) * t),
            Math.round(g1 + (g2 - g1) * t),
            Math.round(b1 + (b2 - b1) * t),
        ].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
    };


    /* ═══════════════════════════════════════════════════════
       5.  CACHE
    ═══════════════════════════════════════════════════════ */
    const Cache = {
        /**
         * رقم الحاوية الزمنية الحالية (يتغير كل CFG.CACHE_TTL_MS).
         * استخدامه في مفتاح الكاش يُلغي الصلاحية تلقائياً عند انتهاء المدة.
         */
        _bucket: () => Math.floor(Date.now() / CFG.CACHE_TTL_MS),

        key: (prefix, lat, lng) =>
            `solaris_${prefix}_${lat}_${lng}_${Cache._bucket()}`,

        get: k => {
            try { return JSON.parse(localStorage.getItem(k)); }
            catch { return null; }
        },

        set: (k, v) => {
            try { localStorage.setItem(k, JSON.stringify(v)); }
            catch { /* localStorage محظور أو ممتلئ */ }
        },
    };


    /* ═══════════════════════════════════════════════════════
       6.  API — Open-Meteo (Solar)
    ═══════════════════════════════════════════════════════ */
    const SolarAPI = {
        /**
         * يجلب بيانات الشروق والغروب من Open-Meteo.
         *
         * يُعيد الـ API الأوقات بالتوقيت المحلي للمدينة (سلاسل ISO بدون Z).
         * نُحوّلها إلى UTC مطلق بالطريقة: نُضيف "Z" ثم نطرح الإزاحة.
         *
         * مصفوفة daily:
         *   [0] = أمس، [1] = اليوم، [2] = غداً، [3] = بعد غد
         * (past_days=1 + forecast_days=2 + اليوم الأساسي)
         *
         * @param {string} lat     - خط العرض
         * @param {string} lng     - خط الطول
         * @param {AbortSignal} signal - إشارة الإلغاء
         */
        fetch: async (lat, lng, signal) => {
            const k = Cache.key('sol', lat, lng);
            const cached = Cache.get(k);
            if (cached) return cached;

            D.loaderTxt.textContent = 'جاري جلب بيانات الشمس...';

            const url = 'https://api.open-meteo.com/v1/forecast'
                      + `?latitude=${lat}&longitude=${lng}`
                      + '&daily=sunrise,sunset,daylight_duration'
                      + '&timezone=auto&past_days=1&forecast_days=2';

            let resp;
            try {
                resp = await fetch(url, { signal }).then(r => r.json());
            } catch (e) {
                if (e.name === 'AbortError')
                    throw new Error('انتهت مهلة جلب البيانات. يرجى التحقق من الاتصال بالإنترنت.');
                throw e;
            }

            if (resp.error || !resp.daily) {
                throw new Error(
                    'بيانات الشمس غير متاحة حالياً. يرجى المحاولة لاحقاً.\n'
                    + (resp.reason || '')
                );
            }

            const daily   = resp.daily;
            const offMins = Math.round(resp.utc_offset_seconds / 60);

            /**
             * يُحوّل سلسلة وقت محلي (ISO بدون Z) إلى UTC بالميلي ثانية.
             * الطريقة: نُضيف Z لنجعل Date يُفسّرها كـ UTC، ثم نطرح الإزاحة.
             * مثال: "05:30" محلي في UTC+2 → 05:30Z − 2h = 03:30 UTC ✓
             */
            const parseLocal = str => {
                if (!str) return null;
                return new Date(str + 'Z').getTime() - offMins * 60_000;
            };

            let ySunset   = parseLocal(daily.sunset[0]);   // غروب أمس
            let tSunrise  = parseLocal(daily.sunrise[1]);  // شروق اليوم
            let tSunset   = parseLocal(daily.sunset[1]);   // غروب اليوم
            let tmSunrise = parseLocal(daily.sunrise[2]);  // شروق الغد

            if (!tSunrise || !tSunset) {
                throw new Error(
                    'تمرّ هذه المدينة بفترة نهار قطبي أو ليل قطبي مستمر '
                    + '— لا يوجد شروق أو غروب واضح حالياً.'
                );
            }

            // ضمانات التسلسل الزمني الصحيح (حماية من حالات الحافة العرضية)
            if (!ySunset)             ySunset   = tSunset   - 86_400_000;
            if (!tmSunrise)           tmSunrise = tSunrise  + 86_400_000;
            if (ySunset  >= tSunrise) ySunset  -= 86_400_000;
            if (tSunset  <= tSunrise) tSunset  += 86_400_000;
            if (tmSunrise <= tSunset) tmSunrise += 86_400_000;

            /**
             * مدة النهار من Open-Meteo بالثواني — نحوّلها إلى ميلي ثانية.
             * هذا الحقل (daylight_duration) موجود في الاستجابة ومُختبَر.
             */
            const dayLenMs   = daily.daylight_duration[1] * 1_000;

            /**
             * مدة الليل = من غروب اليوم إلى شروق الغد.
             * لا نستخدم API لهذا — نحسبه مباشرةً من الطوابع الزمنية.
             */
            const nightLenMs = tmSunrise - tSunset;

            const data = {
                yesterdaySunset  : ySunset,
                todaySunrise     : tSunrise,
                todaySunset      : tSunset,
                tomorrowSunrise  : tmSunrise,
                dayLengthMs      : dayLenMs,
                nightLengthMs    : nightLenMs,
                utcOff           : offMins,
            };

            Cache.set(k, data);
            return data;
        },
    };


    /* ═══════════════════════════════════════════════════════
       7.  API — Aladhan (Prayers)
    ═══════════════════════════════════════════════════════ */
    const PrayerAPI = {
        /**
         * يجلب مواقيت الصلاة من Aladhan API.
         *
         * يُمرَّر utcOff من بيانات الشمس لحساب التاريخ المحلي الصحيح للمدينة.
         * نستخدم صيغة التاريخ DD-MM-YYYY بدلاً من الطابع الزمني
         * لضمان جلب أوقات اليوم المحلي الصحيح (لا اليوم بتوقيت UTC).
         *
         * الطريقة: 3 = رابطة العالم الإسلامي — مناسب لشمال أفريقيا.
         *
         * @param {string} lat     - خط العرض
         * @param {string} lng     - خط الطول
         * @param {number} utcOff  - إزاحة UTC بالدقائق (من SolarAPI)
         * @param {AbortSignal} signal - إشارة الإلغاء
         */
        fetch: async (lat, lng, utcOff, signal) => {
            const k = Cache.key('pray', lat, lng);
            const cached = Cache.get(k);
            if (cached) return cached;

            D.loaderTxt.textContent = 'جاري جلب مواقيت الصلاة...';

            // تاريخ المدينة المحلي بصيغة DD-MM-YYYY
            const [yyyy, mm, dd] = getCityDateStr(utcOff).split('-');
            const dateStr = `${dd}-${mm}-${yyyy}`;

            const url = `https://api.aladhan.com/v1/timings/${dateStr}`
                      + `?latitude=${lat}&longitude=${lng}`
                      + `&method=${CFG.PRAYER_METHOD}`;

            let res;
            try {
                res = await fetch(url, { signal }).then(r => r.json());
            } catch (e) {
                if (e.name === 'AbortError') return null; // أوقات الصلاة اختيارية
                return null;
            }

            if (!res || res.code !== 200) return null;

            Cache.set(k, res.data.timings);
            return res.data.timings;
        },
    };


    /* ═══════════════════════════════════════════════════════
       8.  SKY — الألوان والثيمات
    ═══════════════════════════════════════════════════════ */
    const Sky = {
        /**
         * يُحدّث متغيرات CSS للسماء كل ثانية بناءً على الطور والتقدم.
         * لا يفعل شيئاً إذا كان المستخدم يتحكم يدوياً بالثيم.
         */
        update: (phase, progress) => {
            if (S.manualTheme) return;

            let topC, botC;

            if (phase === 'الليل') {
                topC = CFG.SKY_NIGHT.t;
                botC = CFG.SKY_NIGHT.b;
            } else {
                // ابحث عن الفترة المناسبة في جدول SKY_DAY
                let lo = CFG.SKY_DAY[0];
                let hi = CFG.SKY_DAY[CFG.SKY_DAY.length - 1];

                for (let i = 0; i < CFG.SKY_DAY.length - 1; i++) {
                    if (progress >= CFG.SKY_DAY[i].p &&
                        progress <= CFG.SKY_DAY[i + 1].p) {
                        lo = CFG.SKY_DAY[i];
                        hi = CFG.SKY_DAY[i + 1];
                        break;
                    }
                }

                const frac = (progress - lo.p) / (hi.p - lo.p || 1);
                topC = lerpHex(lo.t, hi.t, frac);
                botC = lerpHex(lo.b, hi.b, frac);
            }

            const root = document.documentElement;
            root.style.setProperty('--sky-top', topC);
            root.style.setProperty('--sky-bot', botC);
        },

        /** يُطبّق ألوان سماء ثابتة عند التحكم اليدوي في الثيم */
        setManual: isNight => {
            const root = document.documentElement;
            const src  = isNight ? CFG.SKY_NIGHT : CFG.SKY_DAY[2];
            root.style.setProperty('--sky-top', isNight ? src.t : src.t);
            root.style.setProperty('--sky-bot', isNight ? src.b : src.b);
        },

        /** يُعيّن ثيم الجسم (أيقونة الزر + طبقة النجوم) */
        setIcons: isNight => {
            D.sunIco.classList.toggle('hidden', isNight);
            D.moonIco.classList.toggle('hidden', !isNight);
            // النجوم: نستخدم الصنف لا inline-style حتى لا نُعطّل animation CSS
            D.stars.classList.toggle('stars-visible', isNight);
        },
    };


    /* ═══════════════════════════════════════════════════════
       9.  PRAYERS — الأوقات ومؤشرات القوس
    ═══════════════════════════════════════════════════════ */
    const Prayers = {
        /**
         * يُحوّل وقت صلاة من سلسلة "HH:MM" (توقيت محلي) إلى UTC بالميلي ثانية.
         *
         * Aladhan يُعيد أوقاتاً بالتوقيت المحلي مثل "05:12" أو "05:12 (EET)".
         * نُعامل الجزء الزمني كـ UTC (بالإضافة Z) ثم نطرح الإزاحة — نفس منهج SolarAPI.
         *
         * @param {string}  hhmm      - الوقت بصيغة "HH:MM" أو "HH:MM (TZ)"
         * @param {number}  offMins   - إزاحة UTC بالدقائق
         * @param {boolean} [tmrw]    - هل هو لليوم التالي؟ (للفجر بعد الغروب)
         */
        toMS: (hhmm, offMins, tmrw = false) => {
            if (!hhmm) return 0;
            const timeOnly = hhmm.split(' ')[0]; // يُزيل "(EET)" أو أي لاحقة
            const dateStr  = getCityDateStr(offMins, tmrw ? 1 : 0);
            return new Date(`${dateStr}T${timeOnly}:00Z`).getTime()
                   - offMins * 60_000;
        },

        /** يُعيد الصلاة القادمة { name, ms } أو null */
        getNext: () => {
            if (!S.prayers || !S.solar) return null;
            const { utcOff } = S.solar;
            const now = Date.now();

            for (const name of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
                const ms = Prayers.toMS(S.prayers[name], utcOff);
                if (ms > now) return { name, ms };
            }

            // بعد العشاء — الفجر القادم هو فجر الغد
            return {
                name: 'Fajr',
                ms:   Prayers.toMS(S.prayers.Fajr, utcOff, true),
            };
        },

        /** يُعيد قائمة أسماء الصلوات المناسبة للطور (نهار / ليل) */
        keysForPhase: phase =>
            phase === 'النهار'
                ? ['Dhuhr', 'Asr']
                : ['Maghrib', 'Isha', 'Fajr'],

        /** يُعيد مواضع نقاط الصلاة على القوس SVG */
        arcPosition: (progressFraction) => {
            const angle = Math.PI * (1 - progressFraction);
            return {
                cx: (150 + 130 * Math.cos(angle)).toFixed(1),
                cy: (140 - 130 * Math.sin(angle)).toFixed(1),
            };
        },

        /**
         * يرسم نقاط الصلوات على القوس SVG.
         * يُحدَّث عند تغيير المدينة فقط (لا كل ثانية).
         */
        drawMarkers: (phase, startMs, endMs) => {
            D.prayerMrks.innerHTML = '';
            if (!S.prayers || !S.solar) return;

            const { utcOff } = S.solar;
            const now  = Date.now();
            const next = Prayers.getNext();
            const NS   = (tag) =>
                document.createElementNS('http://www.w3.org/2000/svg', tag);

            Prayers.keysForPhase(phase).forEach(k => {
                /**
                 * الفجر في النهار: إذا كنا في الليل بعد الغروب فالفجر القادم هو للغد.
                 * إذا كنا قبل الشروق فالفجر للحظي (لليوم الحالي).
                 */
                const isTmrwFajr =
                    k === 'Fajr' &&
                    phase === 'الليل' &&
                    now >= S.solar.todaySunset;

                const ms = Prayers.toMS(S.prayers[k], utcOff, isTmrwFajr);

                // تجاوز الصلوات خارج نطاق الطور الحالي
                if (ms <= startMs || ms >= endMs) return;

                const prog = (ms - startMs) / (endMs - startMs);
                const { cx, cy } = Prayers.arcPosition(prog);
                const isNxt = next && next.name === k;

                // حلقة النبض للصلاة القادمة
                if (isNxt) {
                    const pulse = NS('circle');
                    pulse.setAttribute('cx', cx);
                    pulse.setAttribute('cy', cy);
                    pulse.setAttribute('r', '5');
                    pulse.setAttribute('class', 'prayer-pulse');
                    D.prayerMrks.appendChild(pulse);
                }

                // النقطة الرئيسية
                const dot = NS('circle');
                dot.setAttribute('cx', cx);
                dot.setAttribute('cy', cy);
                dot.setAttribute('r', '4');
                dot.setAttribute('class',
                    `prayer-dot${isNxt ? ' prayer-dot-next' : ''}`);

                const title = NS('title');
                title.textContent = `صلاة ${CFG.PRAYER_AR[k]}`;
                dot.appendChild(title);
                D.prayerMrks.appendChild(dot);
            });
        },

        /** يُعيد رسم شريط أوقات الصلاة الأفقي */
        renderBar: () => {
            if (!S.prayers || !S.solar) {
                D.prayerBar.classList.add('hidden');
                return;
            }

            D.prayerBar.classList.remove('hidden');
            const { utcOff } = S.solar;
            const next = Prayers.getNext();

            D.prayerList.innerHTML = Object.keys(CFG.PRAYER_AR).map(k => {
                const ms   = Prayers.toMS(S.prayers[k], utcOff);
                const time = formatLocal(ms, utcOff);
                const isNxt = next && next.name === k;
                return `<div class="prayer-item flex flex-col items-center gap-0.5 px-2 py-1
                                    ${isNxt ? 'prayer-item-next' : ''}"
                              role="listitem"
                              aria-label="صلاة ${CFG.PRAYER_AR[k]} الساعة ${time}">
                            <span class="p-name" aria-hidden="true">${CFG.PRAYER_AR[k]}</span>
                            <span class="p-time" dir="ltr">${time}</span>
                        </div>`;
            }).join('');
        },
    };


    /* ═══════════════════════════════════════════════════════
       10. CLOCK ENGINE — يُستدعى كل ثانية
    ═══════════════════════════════════════════════════════ */
    const Clock = {
        run: () => {
            if (!S.solar) return;

            const now = Date.now();
            const {
                yesterdaySunset, todaySunrise, todaySunset,
                tomorrowSunrise, utcOff,
            } = S.solar;

            /* ── تحديد الطور الحالي ── */
            let phase, startMs, endMs;

            if (now < todaySunrise) {
                // ليل ما قبل الشروق (من غروب أمس)
                phase   = 'الليل';
                startMs = yesterdaySunset;
                endMs   = todaySunrise;
            } else if (now < todaySunset) {
                // نهار اليوم
                phase   = 'النهار';
                startMs = todaySunrise;
                endMs   = todaySunset;
            } else {
                // ليل ما بعد الغروب (حتى شروق الغد)
                phase   = 'الليل';
                startMs = todaySunset;
                endMs   = tomorrowSunrise;
            }

            const dur      = endMs - startMs;
            const progress = Math.max(0, Math.min(1, (now - startMs) / dur));

            /* ── تحديث السماء والثيم التلقائي ── */
            Sky.update(phase, progress);

            if (!S.manualTheme) {
                const dsr   = Math.abs(now - todaySunrise);
                const dss   = Math.abs(now - todaySunset);
                const theme = phase === 'الليل'                       ? 'night'
                            : (dsr < CFG.GOLD_WIN_MS || dss < CFG.GOLD_WIN_MS)
                                                                      ? 'golden'
                            :                                           'day';

                document.body.classList.remove('theme-night', 'theme-golden');
                if (theme === 'night')  document.body.classList.add('theme-night');
                if (theme === 'golden') document.body.classList.add('theme-golden');

                Sky.setIcons(theme === 'night');
            }

            /* ── الجسم السماوي (شمس / قمر) ── */
            const isNight = phase === 'الليل';
            D.sunShape.style.opacity  = isNight ? '0' : '1';
            D.moonShape.style.opacity = isNight ? '1' : '0';
            D.sunHalo.style.opacity   = isNight ? '0' : '1';

            /* ── لون قوس التقدم ── */
            D.arc.setAttribute('stroke', isNight ? 'url(#g-night)' : 'url(#g-day)');

            /* ══ الساعة السواحلية التكيفية ══
             * نحسب الوقت المنقضي منذ بداية الطور بالميلي ثانية.
             * الساعة = Math.floor(elapsed / 3600000) + 1 (1-indexed)
             * لا حدّ أقصى عند 12 — يعكس الطول الحقيقي للنهار أو الليل.
             */
            const elapsed = now - startMs;
            const pH = Math.floor(elapsed / 3_600_000);
            const pM = Math.floor((elapsed % 3_600_000) / 60_000);
            const pS = Math.floor((elapsed % 60_000)    / 1_000);

            D.hourNum.textContent    = pH + 1;
            D.phaseDisp.textContent  = `من ${phase}`;
            D.metricDisp.textContent = fmt(pH, pM, pS);

            /* ── العداد التنازلي للحدث القادم ── */
            const nextEventMs = phase === 'النهار' ? todaySunset
                              : now < todaySunrise  ? todaySunrise
                              :                       tomorrowSunrise;

            const diff = Math.max(0, nextEventMs - now);
            D.cdLbl.textContent = phase === 'النهار' ? 'الغروب' : 'الشروق';
            D.cdNum.textContent = fmt(
                Math.floor(diff / 3_600_000),
                Math.floor((diff % 3_600_000) / 60_000),
                Math.floor((diff % 60_000)    / 1_000),
            );

            /* ── التوقيت القياسي للمدينة ── */
            D.stdTime.textContent = formatLocal(now, utcOff, true);

            /* ══ تحريك الجسم السماوي على القوس ══
             *
             * المعادلة:
             *   angle = π × (1 − progress)
             *   cx = 150 + 130 × cos(angle)    [أفقياً]
             *   cy = 140 − 130 × sin(angle)    [الطرح: فوق الأفق، لأن y↓ في SVG]
             *
             * progress=0 (شروق/غروب) → angle=π → cx=20, cy=140 (يسار الأفق)
             * progress=0.5 (ذروة)     → angle=π/2 → cx=150, cy=10 (قمة القوس)
             * progress=1 (غروب/شروق) → angle=0   → cx=280, cy=140 (يمين الأفق)
             */
            const angle = Math.PI * (1 - progress);
            const cx    = 150 + 130 * Math.cos(angle);
            const cy    = 140 - 130 * Math.sin(angle);

            D.arc.setAttribute('stroke-dashoffset', (100 - progress * 100).toFixed(2));
            D.celestial.setAttribute(
                'transform',
                `translate(${cx.toFixed(2)},${cy.toFixed(2)})`
            );
        },
    };


    /* ═══════════════════════════════════════════════════════
       11. CITY MANAGEMENT
    ═══════════════════════════════════════════════════════ */
    const Cities = {

        /** يُحفظ المدن المُضافة يدوياً في localStorage */
        saveCustom: () => {
            try {
                const custom = Object.fromEntries(
                    Object.entries(S.cities).filter(([k]) => !CFG.CITIES[k])
                );
                localStorage.setItem(
                    'solaris_custom_cities',
                    JSON.stringify(custom)
                );
            } catch { /* محظور */ }
        },

        /** يُعيد بناء أزرار المدن */
        buildButtons: () => {
            D.citySel.innerHTML = '';
            Object.keys(S.cities).forEach(k => {
                const btn = document.createElement('button');
                btn.type      = 'button';
                btn.className = 'city-btn';
                btn.dataset.city  = k;
                btn.textContent   = S.cities[k].name;
                btn.setAttribute('aria-label', `عرض توقيت ${S.cities[k].name}`);
                btn.onclick = () => { if (S.activeKey !== k) Cities.load(k); };
                D.citySel.appendChild(btn);
            });
        },

        /**
         * يُحدّث معامل URL (?city=) بدون إعادة تحميل الصفحة.
         * يُمكّن مشاركة الرابط مع المدينة المحددة.
         */
        updateURL: cityName => {
            try {
                const url = new URL(window.location.href);
                url.searchParams.set('city', cityName);
                history.replaceState({}, '', url);
            } catch { /* History API غير مدعوم */ }
        },

        /**
         * يُحمّل مدينة بمفتاحها.
         * يستخدم عدّاد الجيل لمنع تداخل الاستجابات المتأخرة.
         */
        load: async key => {
            const gen = ++S.loadGen; // هذا الطلب حصل على رقم جيله

            if (S.tickId) {
                clearInterval(S.tickId);
                S.tickId = null;
            }

            /* ── أظهر الـ Loader وأخفِ التطبيق ── */
            D.loader.classList.remove('opacity-0');
            D.loader.style.pointerEvents = 'auto';
            D.app.style.opacity          = '0';
            D.loaderTxt.textContent      = 'جاري تهيئة النظام...';

            /* ── أخفِ رسالة الخطأ السابقة ── */
            D.errOverlay.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => D.errOverlay.classList.add('hidden'), 500);

            S.activeKey = key;
            const city  = S.cities[key];

            /* ── حدّث أزرار المدن ── */
            document.querySelectorAll('.city-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.city === key)
            );
            D.cityName.textContent = city.name;

            /* ── حدّث URL ── */
            Cities.updateURL(city.name);

            /* ── AbortController بمهلة 15 ثانية ── */
            const ctrl    = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 15_000);

            try {
                /* ── جلب بيانات الشمس أولاً (نحتاج utcOff لحساب تاريخ الصلاة) ── */
                const solar = await SolarAPI.fetch(city.lat, city.lng, ctrl.signal);

                // تحقق من الجيل: هل تغيّرت المدينة أثناء الانتظار؟
                if (gen !== S.loadGen) return;

                /* ── ثم مواقيت الصلاة بالتاريخ المحلي الصحيح ── */
                const prayers = await PrayerAPI.fetch(
                    city.lat, city.lng, solar.utcOff, ctrl.signal
                );

                clearTimeout(timeout);

                // تحقق نهائي من الجيل
                if (gen !== S.loadGen) return;

                if (!solar) throw new Error('تعذّر تحليل بيانات الشمس. يرجى المحاولة مجدداً.');

                S.solar   = solar;
                S.prayers = prayers;

                /* ── التاريخ الهجري (مُزامَن مع التوقيت المحلي للمدينة) ── */
                try {
                    const localMs = Date.now() + solar.utcOff * 60_000;
                    D.hijri.textContent = new Intl.DateTimeFormat(
                        'ar-LY-u-ca-islamic-nu-latn',
                        { day: 'numeric', month: 'long', year: 'numeric' }
                    ).format(new Date(localMs));
                } catch { D.hijri.textContent = ''; }

                /* ── أوقات الشروق والغروب ── */
                D.sunriseEl.textContent = formatLocal(solar.todaySunrise, solar.utcOff);
                D.sunsetEl.textContent  = formatLocal(solar.todaySunset,  solar.utcOff);

                /* ── شريط النهار والليل ── */
                const { dayLengthMs: dayL, nightLengthMs: nightL } = solar;
                const totalCycle = dayL + nightL;
                const dayPct     = (dayL / totalCycle * 100).toFixed(1);
                const nightPct   = (100 - +dayPct).toFixed(1);
                const diff       = Math.abs(dayL - nightL);

                D.dayBar.style.width   = `${dayPct}%`;
                D.nightBar.style.width = `${nightPct}%`;
                D.dayLen.textContent   = fmtDur(dayL);
                D.nightLen.textContent = fmtDur(nightL);

                D.compTxt.textContent =
                    diff < 5 * 60_000 ? '≈ تعادل النهار والليل'
                  : dayL > nightL     ? `النهار أطول بـ ${fmtDur(diff)}`
                  :                     `الليل أطول بـ ${fmtDur(diff)}`;

                /* ── مؤشرات الصلاة على القوس ── */
                const now2 = Date.now();
                let pPhase, pStart, pEnd;

                if (now2 >= solar.todaySunrise && now2 < solar.todaySunset) {
                    pPhase = 'النهار';
                    pStart = solar.todaySunrise;
                    pEnd   = solar.todaySunset;
                } else {
                    pPhase = 'الليل';
                    pStart = now2 < solar.todaySunrise
                        ? solar.yesterdaySunset
                        : solar.todaySunset;
                    pEnd = now2 < solar.todaySunrise
                        ? solar.todaySunrise
                        : solar.tomorrowSunrise;
                }

                Prayers.drawMarkers(pPhase, pStart, pEnd);
                Prayers.renderBar();

                /* ── تشغيل الساعة ── */
                Clock.run();
                S.tickId = setInterval(Clock.run, 1_000);

                /* ── إخفاء Loader وإظهار التطبيق ── */
                D.loader.classList.add('opacity-0');
                D.loader.style.pointerEvents = 'none';
                D.app.style.opacity          = '1';

            } catch (err) {
                clearTimeout(timeout);
                if (gen !== S.loadGen) return; // تجاهل أخطاء الطلبات المُلغاة

                console.error('[SolarisSwahili]', err);
                D.errMsg.textContent = err.message || 'حدث خطأ غير متوقع.';
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
         * يبحث عن مدينة بالاسم عبر Nominatim ويُحمّلها.
         * يُستخدم لمعالجة معامل URL ?city= عند بدء التشغيل.
         *
         * @param {string} query - اسم المدينة للبحث
         */
        searchAndLoad: async query => {
            try {
                const url = 'https://nominatim.openstreetmap.org/search'
                          + `?format=json&q=${encodeURIComponent(query)}&limit=1`
                          + `&email=${CFG.NOMINATIM_APP}@users.noreply.github.com`;

                const res = await fetch(url).then(r => r.json());

                if (!res.length) {
                    // لم تُوجد: تراجع إلى المدينة الافتراضية
                    Cities.load('tobruk');
                    return;
                }

                const k = `c_${Date.now()}`;
                S.cities[k] = {
                    name: res[0].name || query,
                    lat:  res[0].lat,
                    lng:  res[0].lon,
                };
                Cities.saveCustom();
                Cities.buildButtons();
                Cities.load(k);
            } catch {
                Cities.load('tobruk'); // تراجع آمن
            }
        },
    };


    /* ═══════════════════════════════════════════════════════
       12. WAKELOCK — يمنع إيقاظ الشاشة (للعرض المستمر)
    ═══════════════════════════════════════════════════════ */
    const WakeLock = {
        async request() {
            if (!('wakeLock' in navigator)) return;
            try {
                S.wakeLock = await navigator.wakeLock.request('screen');
                S.wakeLock.addEventListener('release', () => {
                    S.wakeLock = null;
                });
            } catch { /* مرفوض أو غير متاح */ }
        },

        async reacquire() {
            if (!S.wakeLock && document.visibilityState === 'visible') {
                await WakeLock.request();
            }
        },
    };


    /* ═══════════════════════════════════════════════════════
       13. INIT
    ═══════════════════════════════════════════════════════ */
    const init = () => {

        /* ── توليد النجوم (مرة واحدة) ── */
        genStars();

        /* ── بناء أزرار المدن ── */
        Cities.buildButtons();

        /* ── تهيئة زر تنسيق الوقت ── */
        D.formatBtn.textContent = S.is24Hour ? '12H' : '24H';

        D.formatBtn.onclick = () => {
            S.is24Hour = !S.is24Hour;
            try { localStorage.setItem('solaris_24h', S.is24Hour); } catch { }
            D.formatBtn.textContent = S.is24Hour ? '12H' : '24H';

            if (S.solar) {
                D.sunriseEl.textContent = formatLocal(S.solar.todaySunrise, S.solar.utcOff);
                D.sunsetEl.textContent  = formatLocal(S.solar.todaySunset,  S.solar.utcOff);
                Prayers.renderBar();
                Clock.run();
            }
        };

        /* ── زر إضافة مدينة ── */
        D.addBtn.onclick = async () => {
            const val = D.cityInput.value.trim();
            if (!val) return;

            D.cityErr.classList.add('hidden');
            D.addBtn.disabled     = true;
            D.addBtn.textContent  = '...';

            try {
                const url = 'https://nominatim.openstreetmap.org/search'
                          + `?format=json&q=${encodeURIComponent(val)}&limit=1`
                          + `&email=${CFG.NOMINATIM_APP}@users.noreply.github.com`;

                const res = await fetch(url).then(r => r.json());

                if (!res.length) {
                    throw new Error('لم نجد هذه المدينة. حاوِل كتابتها بالإنجليزية.');
                }

                // التحقق من صحة الإحداثيات قبل الاستخدام
                const lat = parseFloat(res[0].lat);
                const lng = parseFloat(res[0].lon);
                if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90) {
                    throw new Error('إحداثيات غير صحيحة. يرجى المحاولة بمدينة أخرى.');
                }

                const k = `c_${Date.now()}`;
                S.cities[k] = {
                    name: res[0].name || val,
                    lat:  String(lat),
                    lng:  String(lng),
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
                D.addBtn.textContent = 'إضافة';
            }
        };

        /* ── Enter في حقل الإدخال ── */
        D.cityInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') D.addBtn.click();
        });

        /* ── زر تبديل الثيم ── */
        D.themeBtn.onclick = () => {
            S.manualTheme = true;
            document.body.classList.remove('theme-golden');
            const isNight = document.body.classList.toggle('theme-night');

            Sky.setIcons(isNight);
            Sky.setManual(isNight);

            D.resetBtn.classList.remove('hidden');
            requestAnimationFrame(() =>
                D.resetBtn.classList.remove('opacity-0', 'translate-x-3')
            );
        };

        /* ── زر إعادة الثيم التلقائي ── */
        D.resetBtn.onclick = () => {
            S.manualTheme = false;
            D.resetBtn.classList.add('opacity-0', 'translate-x-3');
            setTimeout(() => D.resetBtn.classList.add('hidden'), 300);
            Clock.run();
        };

        /* ── زر إعادة المحاولة ── */
        D.retryBtn.onclick = () => {
            if (S.activeKey) Cities.load(S.activeKey);
        };

        /* ── زر المشاركة ── */
        D.shareBtn.onclick = async () => {
            try {
                // URL يحمل معامل ?city= المُحدَّث من Cities.updateURL
                if (navigator.share) {
                    await navigator.share({
                        title: 'التوقيت السواحلي',
                        url:   location.href,
                    });
                } else {
                    await navigator.clipboard.writeText(location.href);
                    const orig = D.shareBtn.innerHTML;
                    D.shareBtn.innerHTML =
                        `<svg class="w-4 h-4" fill="none" stroke="currentColor"
                              viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  stroke-width="2.5" d="M5 13l4 4L19 7"/>
                         </svg>`;
                    setTimeout(() => { D.shareBtn.innerHTML = orig; }, 2_200);
                }
            } catch { /* المستخدم ألغى المشاركة أو الـ API غير مدعوم */ }
        };

        /* ── WakeLock: طلب فوري + إعادة اكتساب عند عودة الصفحة للمقدمة ── */
        WakeLock.request();
        document.addEventListener('visibilitychange', WakeLock.reacquire);

        /* ══════════════════════════════════════════════════
           تحديد المدينة الابتدائية
           الأولوية: معامل URL ?city= → مدينة افتراضية (طبرق)
        ══════════════════════════════════════════════════ */
        const urlCity = new URLSearchParams(window.location.search).get('city');

        if (urlCity) {
            // هل المدينة موجودة في قائمتنا (بالاسم)؟
            const matchKey = Object.keys(S.cities).find(
                k => S.cities[k].name === urlCity
            );

            if (matchKey) {
                Cities.load(matchKey);
            } else {
                // البحث عبر Nominatim
                Cities.searchAndLoad(urlCity);
            }
        } else {
            Cities.load('tobruk');
        }
    };

    /* ── تصدير واجهة عامة ── */
    return { init };

})();

document.addEventListener('DOMContentLoaded', SolarisSwahili.init);