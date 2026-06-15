/**
 * SolarisSwahili v3.1
 * ساعة التوقيت السواحلي الديناميكية — نظام الساعات المعيارية المُحتسَبة
 *
 * التغييرات الجوهرية في v3.1:
 * ✅ T1 — إلغاء 12/12 النسبي: كل ساعة = 60 دقيقة قياسية حقيقية
 * ✅ T2 — العداد يبدأ من "الساعة 1" عند الشروق (نهار) وعند الغروب (ليل)
 * ✅ T3 — جلب day_length من الـ API مباشرةً بدلاً من الطرح اليدوي
 * ✅ T4 — إصلاح عبور منتصف الليل (Midnight Crossing) للمدن القطبية
 * ✅ T5 — القمر: استبدال <path> بـ <circle> cx="0" cy="0"
 * ✅ T6 — تحديث النصوص التعريفية والـ Tooltip لشرح النظام الجديد
 *
 * الإصلاحات المحمولة من v3.0:
 * ✅ Bug 1  — تحميل المدينة الافتراضية فوراً
 * ✅ Bug 4  — إزالة ?city= من الرابط
 * ✅ Bug 5  — ثغرة منتصف الليل في Clock.run()
 * ✅ Bug 9  — إعادة WakeLock عند عودة التبويب
 * ✅ Bug 13 — مدة انتقال سريعة عند التبديل اليدوي
 * ✅ Bug 15 — طريقة الصلاة حسب رمز الدولة
 * ✅ Bug 23 — كاش genStars
 * ✅ Bug 24 — aria-label + aria-busy على زر الإضافة
 * ✅ Bug 25 — data-i18n-aria="themeToggle"
 * ✅ Bug 26 — حفظ الثيم في localStorage
 * ✅ Bug 34 — معالجة QuotaExceededError
 */

const App = (() => {

    /* ═══════════════════════════════════════════════════════
       1.  I18N — نظام الترجمة الثنائي
    ═══════════════════════════════════════════════════════ */
    const I18N = {
        ar: {
            navHome:        'الرئيسية',
            navAbout:       'عن المشروع',
            navCompare:     'مقارنة',
            navDashboard:   'إحصائيات',
            /* ✅ T6 — نص محدَّث يشرح الساعات المعيارية */
            siteTitle:      'النظام السواحلي الغروبي',
            siteSubtitle:   'يبدأ اليوم عند شروق الشمس (الساعة\u00A01). كل ساعة تساوي 60 دقيقة حقيقية — إذا مرّت ثلاث ساعات منذ الشروق فأنت في الساعة الرابعة.',
            addCity:        'إضافة',
            adding:         'جاري...',
            cityPlaceholder:'London, Cairo, Istanbul...',
            cityNotFound:   'لم نجد هذه المدينة. حاول كتابتها بالإنجليزية.',
            detecting:      'جاري تحديد موقعك...',
            yourLocation:   'موقعك',
            gpsLabel:       'GPS',
            loading:        'جاري تهيئة النظام...',
            loadingSun:     'جاري جلب بيانات الشمس...',
            loadingPrayer:  'جاري جلب مواقيت الصلاة...',
            errorTitle:     'تعذر جلب البيانات',
            errorDefault:   'يرجى التحقق من اتصالك بالإنترنت.',
            retry:          'إعادة المحاولة',
            sunrise:        'الشروق',
            sunset:         'الغروب',
            standardTime:   'التوقيت القياسي',
            daytime:        'النهار',
            nighttime:      'الليل',
            hourLabel:      'الساعة',
            of:             'من',
            untilSunrise:   'الشروق',
            untilSunset:    'الغروب',
            remaining:      'بقي على',
            prayers:        'مواقيت الصلاة',
            equinox:        '≈ الاعتدال الفلكي',
            dayLonger:      'النهار أطول بـ',
            nightLonger:    'الليل أطول بـ',
            shareLink:      'نسخ رابط المدينة الحالية',
            shareImage:     'مشاركة صورة',
            ambientMode:    'وضع الحائط',
            themeToggle:    'تبديل الوضع الليلي',
            autoReset:      'إعادة الوضع التلقائي',
            downloadPNG:    'تحميل PNG',
            close:          'إغلاق',
            exitHint:       'ESC للخروج • F للدخول',
            /* ✅ T6 — tooltip محدَّث */
            tooltipTitle:   'كيف تُحسَب الساعة السواحلية؟',
            tooltipBody:    'الساعة 1 تبدأ عند الشروق نهاراً وعند الغروب ليلاً. كل ساعة تساوي 60 دقيقة قياسية — الرقم الذي تراه هو عدد الساعات الحقيقية المنقضية منذ الحدث الفلكي الأخير.',
            Fajr:           'الفجر', Dhuhr: 'الظهر',
            Asr:            'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
            lessMin:        'أقل من دقيقة',
            min1:           'دقيقة', min2: 'دقيقتين',
            minN:           'دقائق', minMany: 'دقيقة',
            hr1:            'ساعة', hr2: 'ساعتين',
            hrN:            'ساعات', hrMany: 'ساعة',
            and:            'و',
            saveError:      'تعذر الحفظ: التخزين ممتلئ.',
        },
        en: {
            navHome:        'Home',
            navAbout:       'About',
            navCompare:     'Compare',
            navDashboard:   'Dashboard',
            /* ✅ T6 — updated subtitle */
            siteTitle:      'Dynamic Swahili Timekeeping',
            siteSubtitle:   'Day begins at sunrise (Hour 1). Each hour equals exactly 60 standard minutes — if three hours have passed since sunrise, you are in Hour 4.',
            addCity:        'Add',
            adding:         'Adding...',
            cityPlaceholder:'London, Cairo, Istanbul...',
            cityNotFound:   'City not found. Try the English spelling.',
            detecting:      'Detecting your location...',
            yourLocation:   'Your Location',
            gpsLabel:       'GPS',
            loading:        'Initialising system...',
            loadingSun:     'Fetching solar data...',
            loadingPrayer:  'Fetching prayer times...',
            errorTitle:     'Failed to fetch data',
            errorDefault:   'Please check your internet connection.',
            retry:          'Retry',
            sunrise:        'Sunrise',
            sunset:         'Sunset',
            standardTime:   'Civil Time',
            daytime:        'Day',
            nighttime:      'Night',
            hourLabel:      'Hour',
            of:             'of',
            untilSunrise:   'Sunrise',
            untilSunset:    'Sunset',
            remaining:      'Until',
            prayers:        'Prayer Times',
            equinox:        '≈ Astronomical Equinox',
            dayLonger:      'Day is longer by',
            nightLonger:    'Night is longer by',
            shareLink:      'Copy city link',
            shareImage:     'Share Image',
            ambientMode:    'Ambient Mode',
            themeToggle:    'Toggle Theme',
            autoReset:      'Reset to Auto',
            downloadPNG:    'Download PNG',
            close:          'Close',
            exitHint:       'ESC to exit • F to enter',
            /* ✅ T6 — updated tooltip */
            tooltipTitle:   'How is the Swahili Hour calculated?',
            tooltipBody:    'Hour 1 starts at sunrise (day) or sunset (night). Every hour equals exactly 60 standard minutes. The number shown is the real count of full hours elapsed since the last astronomical event.',
            Fajr:           'Fajr', Dhuhr: 'Dhuhr',
            Asr:            'Asr',  Maghrib: 'Maghrib', Isha: 'Isha',
            lessMin:        'Less than a minute',
            min1:           'minute', min2: 'minutes',
            minN:           'minutes', minMany: 'minutes',
            hr1:            'hour', hr2:  'hours',
            hrN:            'hours', hrMany: 'hours',
            and:            'and',
            saveError:      'Save failed: storage full.',
        }
    };


    /* ═══════════════════════════════════════════════════════
       2.  LANG — إدارة اللغة
    ═══════════════════════════════════════════════════════ */
    const Lang = {
        current: localStorage.getItem('ss_lang') || 'ar',

        t(key) { return I18N[this.current][key] ?? key; },

        toggle() {
            this.current = this.current === 'ar' ? 'en' : 'ar';
            localStorage.setItem('ss_lang', this.current);
            this.apply();
        },

        apply() {
            const isAr = this.current === 'ar';
            document.documentElement.lang = this.current;
            document.documentElement.dir  = isAr ? 'rtl' : 'ltr';

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.dataset.i18n;
                const val = I18N[this.current][key];
                if (val !== undefined) el.textContent = val;
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.dataset.i18nPlaceholder;
                const val = I18N[this.current][key];
                if (val !== undefined) el.placeholder = val;
            });
            document.querySelectorAll('[data-i18n-aria]').forEach(el => {
                const key = el.dataset.i18nAria;
                const val = I18N[this.current][key];
                if (val !== undefined) el.setAttribute('aria-label', val);
            });

            const lb = document.getElementById('lang-toggle');
            if (lb) lb.textContent = isAr ? 'EN' : 'عر';

            updateDateDisplay();

            if (S.solar) {
                renderDayNightBar();
                Prayers.renderBar();
            }
        }
    };


    /* ═══════════════════════════════════════════════════════
       3.  CONFIG & STATE
    ═══════════════════════════════════════════════════════ */
    const CFG = {
        CACHE_TTL : 6 * 3600 * 1000,
        GOLD_WIN  : 45 * 60 * 1000,
        DEFAULT_KEYS: ['tobruk', 'benghazi', 'tripoli'],
        DEFAULT_CITIES: {
            tobruk:   { name: 'طبرق',   nameEn: 'Tobruk',   country: 'ليبيا',   countryEn: 'Libya',   countryCode: 'LY', lat: '32.0773', lng: '23.9600' },
            benghazi: { name: 'بنغازي', nameEn: 'Benghazi', country: 'ليبيا',   countryEn: 'Libya',   countryCode: 'LY', lat: '32.1167', lng: '20.0667' },
            tripoli:  { name: 'طرابلس', nameEn: 'Tripoli',  country: 'ليبيا',   countryEn: 'Libya',   countryCode: 'LY', lat: '32.8892', lng: '13.1900' }
        },
        PRAYER_KEYS: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
        PRAYER_METHODS: {
            'SA': 4, 'LY': 3, 'EG': 5, 'TR': 13,
            'GB': 3, 'MA': 21, 'DZ': 2, 'DEFAULT': 3
        }
    };

    const S = {
        cities      : {},
        key         : null,
        solar       : null,
        prayers     : null,
        tickId      : null,
        manualTheme : false,
        ambientActive: false,
    };


    /* ═══════════════════════════════════════════════════════
       4.  DOM REFS
    ═══════════════════════════════════════════════════════ */
    const $ = id => document.getElementById(id);
    const D = {
        loader      : $('loader'),
        loaderTxt   : $('loader-text'),
        errOverlay  : $('error-overlay'),
        errMsg      : $('error-message'),
        retryBtn    : $('retry-btn'),
        app         : $('app-container'),
        citySel     : $('city-selector'),
        cityName    : $('city-name'),
        countrySub  : $('country-sub'),
        dateEl      : $('gregorian-date'),
        hourNum     : $('hour-display'),
        phaseDisp   : $('phase-display'),
        metricDisp  : $('metric-display'),
        cdNum       : $('countdown-display'),
        cdLbl       : $('next-event-name'),
        arc         : $('progress-arc'),
        celestial   : $('celestial-body'),
        sunShape    : $('sun-shape'),
        moonShape   : $('moon-shape'),
        sunHalo     : $('sun-halo'),
        prayerMrks  : $('prayer-markers'),
        prayerBar   : $('prayer-bar'),
        prayerList  : $('prayer-list'),
        stars       : $('stars-layer'),
        themeBtn    : $('theme-toggle'),
        resetBtn    : $('theme-auto-reset'),
        sunIco      : $('sun-icon'),
        moonIco     : $('moon-icon'),
        shareBtn    : $('share-btn'),
        shareImgBtn : $('share-img-btn'),
        ambientBtn  : $('ambient-btn'),
        cityInput   : $('city-input'),
        addBtn      : $('add-btn'),
        cityErr     : $('city-error'),
        dayBar      : $('day-bar'),
        nightBar    : $('night-bar'),
        dayLen      : $('day-length'),
        nightLen    : $('night-length'),
        compTxt     : $('comparison-text'),
        sunriseEl   : $('sunrise-time'),
        sunsetEl    : $('sunset-time'),
        stdTime     : $('standard-time'),
        ambOverlay  : $('ambient-overlay'),
    };


    /* ═══════════════════════════════════════════════════════
       5.  UTILITIES
    ═══════════════════════════════════════════════════════ */
    const pad  = n => String(n).padStart(2, '0');
    const fmt  = (h, m, s) => `${pad(h)}:${pad(m)}:${pad(s)}`;

    const fmtDur = ms => {
        const tot = Math.round(ms / 60000);
        const h = Math.floor(tot / 60), m = tot % 60;
        const isEn = Lang.current === 'en';
        if (isEn) {
            const hStr = !h ? '' : `${h} ${h === 1 ? 'hour' : 'hours'}`;
            const mStr = !m ? '' : `${m} ${m === 1 ? 'minute' : 'minutes'}`;
            if (!hStr) return mStr || 'less than a minute';
            return mStr ? `${hStr} and ${mStr}` : hStr;
        }
        const t = Lang.t.bind(Lang);
        const hS = !h ? '' : h === 1 ? t('hr1') : h === 2 ? t('hr2') : h <= 10 ? `${h} ${t('hrN')}` : `${h} ${t('hrMany')}`;
        const mS = !m ? '' : m === 1 ? t('min1') : m === 2 ? t('min2') : m <= 10 ? `${m} ${t('minN')}` : `${m} ${t('minMany')}`;
        if (!hS) return mS || t('lessMin');
        return mS ? `${hS} ${t('and')}${mS}` : hS;
    };

    const cleanTime = t => {
        const p = t.split(':');
        return p.length >= 3 ? `${p[0]}:${p[1]} ${t.split(' ').pop()}` : t;
    };

    const dateStr = (off = 0) =>
        new Date(Date.now() + off * 86400000).toLocaleDateString('en-CA');

    const updateDateDisplay = () => {
        if (!D.dateEl) return;
        const locale = Lang.current === 'ar' ? 'ar-LY' : 'en-GB';
        D.dateEl.textContent = new Intl.DateTimeFormat(locale, {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date());
    };

    /* ✅ Bug 23 — كاش genStars */
    let cachedStarsCSS = null;
    const genStars = (container) => {
        const el = container || D.stars;
        if (!el) return;
        if (!container && cachedStarsCSS) {
            el.style.backgroundImage = cachedStarsCSS;
            return;
        }
        const css = Array.from({ length: 160 }, () => {
            const x = (Math.random() * 100).toFixed(1);
            const y = (Math.random() * 100).toFixed(1);
            const s = (Math.random() * 1.8 + 0.3).toFixed(1);
            const o = (Math.random() * 0.65 + 0.28).toFixed(2);
            return `radial-gradient(${s}px ${s}px at ${x}% ${y}%, rgba(255,255,255,${o}), transparent)`;
        }).join(',');
        if (!container) cachedStarsCSS = css;
        el.style.backgroundImage = css;
    };

    const lerpHex = (a, b, t) => {
        const p = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
        const [r1,g1,b1] = p(a), [r2,g2,b2] = p(b);
        return '#' + [
            Math.round(r1+(r2-r1)*t), Math.round(g1+(g2-g1)*t), Math.round(b1+(b2-b1)*t)
        ].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
    };

    const SKY_DAY = [
        { p: 0.00, t: '#FEF3C7', b: '#FDBA74' },
        { p: 0.18, t: '#E0F2FE', b: '#BAE6FD' },
        { p: 0.50, t: '#F0F9FF', b: '#E5E7EB' },
        { p: 0.82, t: '#FEF9C3', b: '#FDE68A' },
        { p: 1.00, t: '#FDE68A', b: '#FDBA74' },
    ];
    const SKY_NIGHT = { t: '#020617', b: '#0B1120' };

    const updateSky = (phase, progress) => {
        if (S.manualTheme) return;
        let topC, botC;
        if (phase === 'night') {
            topC = SKY_NIGHT.t; botC = SKY_NIGHT.b;
        } else {
            let lo = SKY_DAY[0], hi = SKY_DAY[SKY_DAY.length - 1];
            for (let i = 0; i < SKY_DAY.length - 1; i++) {
                if (progress >= SKY_DAY[i].p && progress <= SKY_DAY[i+1].p) {
                    lo = SKY_DAY[i]; hi = SKY_DAY[i+1]; break;
                }
            }
            const frac = (progress - lo.p) / ((hi.p - lo.p) || 1);
            topC = lerpHex(lo.t, hi.t, frac);
            botC = lerpHex(lo.b, hi.b, frac);
        }
        const root = document.documentElement;
        root.style.setProperty('--sky-top', topC);
        root.style.setProperty('--sky-bot', botC);
        if (D.ambOverlay && S.ambientActive) {
            D.ambOverlay.style.background = `linear-gradient(160deg, ${topC} 0%, ${botC} 100%)`;
        }
    };

    const setSkyManual = isNight => {
        const root = document.documentElement;
        root.style.setProperty('--sky-top', isNight ? SKY_NIGHT.t : SKY_DAY[2].t);
        root.style.setProperty('--sky-bot', isNight ? SKY_NIGHT.b : SKY_DAY[2].b);
    };

    /* ✅ T3 — تحويل day_length بصيغة "HH:MM:SS" إلى مللي ثانية */
    const parseDayLength = str => {
        if (!str || typeof str !== 'string') return null;
        const p = str.split(':');
        if (p.length < 2) return null;
        return (parseInt(p[0], 10) * 3600 + parseInt(p[1], 10) * 60 + parseInt(p[2] || 0, 10)) * 1000;
    };


    /* ═══════════════════════════════════════════════════════
       6.  CITY STORE
    ═══════════════════════════════════════════════════════ */
    const CityStore = {
        load() {
            try {
                const raw = localStorage.getItem('ss_custom_cities');
                return raw ? JSON.parse(raw) : {};
            } catch { return {}; }
        },
        /* ✅ Bug 34 — معالجة QuotaExceededError */
        save() {
            const custom = {};
            Object.keys(S.cities).forEach(k => {
                if (!CFG.DEFAULT_KEYS.includes(k)) custom[k] = S.cities[k];
            });
            try {
                localStorage.setItem('ss_custom_cities', JSON.stringify(custom));
            } catch (e) {
                console.warn('[SolarisSwahili] Could not save cities:', e);
                if (e.name === 'QuotaExceededError' && D.cityErr) {
                    D.cityErr.textContent = Lang.t('saveError');
                    D.cityErr.classList.remove('hidden');
                    setTimeout(() => D.cityErr.classList.add('hidden'), 4000);
                }
            }
        },
        remove(key) {
            if (CFG.DEFAULT_KEYS.includes(key)) return;
            delete S.cities[key];
            this.save();
            buildBtns();
            if (S.key === key) loadCity('tobruk');
        }
    };


    /* ═══════════════════════════════════════════════════════
       7.  CACHE
    ═══════════════════════════════════════════════════════ */
    const Cache = {
        get: k => {
            try {
                const v = localStorage.getItem(k);
                if (!v) return null;
                const { ts, data } = JSON.parse(v);
                return (Date.now() - ts > CFG.CACHE_TTL) ? null : data;
            } catch { return null; }
        },
        set: (k, data) => {
            try { localStorage.setItem(k, JSON.stringify({ ts: Date.now(), data })); } catch {}
        }
    };


    /* ═══════════════════════════════════════════════════════
       8.  GEO DETECT
    ═══════════════════════════════════════════════════════ */
    const GeoDetect = {
        async tryGPS() {
            return new Promise(resolve => {
                if (!('geolocation' in navigator)) return resolve(null);
                navigator.geolocation.getCurrentPosition(
                    p => resolve({ lat: +p.coords.latitude.toFixed(4), lng: +p.coords.longitude.toFixed(4) }),
                    () => resolve(null),
                    { timeout: 6000, maximumAge: 600000 }
                );
            });
        },
        async tryIP() {
            try {
                const d = await fetch('https://ipapi.co/json/').then(r => r.json());
                if (d.latitude) return {
                    lat: +d.latitude.toFixed(4), lng: +d.longitude.toFixed(4),
                    name: d.city || '', country: d.country_name || '',
                    countryEn: d.country_name || '', countryCode: d.country_code || ''
                };
            } catch {}
            return null;
        },
        async reverseGeocode(lat, lng) {
            try {
                const d = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=ar`
                ).then(r => r.json());
                return {
                    name:        d.address?.city || d.address?.town || d.address?.village || '',
                    country:     d.address?.country || '',
                    countryEn:   d.address?.country || '',
                    countryCode: (d.address?.country_code || '').toUpperCase()
                };
            } catch {}
            return { name: '', country: '', countryEn: '', countryCode: '' };
        },
        async detect() {
            const gps = await this.tryGPS();
            if (gps) {
                const geo = await this.reverseGeocode(gps.lat, gps.lng);
                return { ...gps, ...geo, method: 'gps' };
            }
            const ip = await this.tryIP();
            if (ip) return { ...ip, method: 'ip' };
            return null;
        },
        async addAutoCity() {
            const badge = $('gps-badge');
            if (badge) {
                badge.innerHTML = `<span class="gps-dot"></span>${Lang.t('detecting')}`;
                badge.style.pointerEvents = 'none';
            }
            const loc = await this.detect();
            if (loc && loc.lat) {
                const k = 'geo_auto';
                S.cities[k] = {
                    name:        loc.name    || Lang.t('yourLocation'),
                    nameEn:      loc.name    || Lang.t('yourLocation'),
                    country:     loc.country || '',
                    countryEn:   loc.countryEn || loc.country || '',
                    countryCode: loc.countryCode || '',
                    lat:         String(loc.lat),
                    lng:         String(loc.lng),
                    isGeo:       true
                };
                CityStore.save();
                buildBtns();
                loadCity(k);
            }
            if (badge) {
                badge.innerHTML = `<span class="gps-dot"></span>${Lang.t('yourLocation')}`;
                badge.style.pointerEvents = '';
            }
        }
    };


    /* ═══════════════════════════════════════════════════════
       9.  API MODULE
    ═══════════════════════════════════════════════════════ */
    const API = {
        normOff: raw => {
            const n = parseFloat(raw);
            return isNaN(n) ? 0 : Math.abs(n) < 24 ? Math.round(n * 60) : Math.round(n);
        },
        toUTC: (dateS, timeStr, offMins) => {
            if (!timeStr) return 0;
            const [time, mod] = timeStr.split(' ');
            const [hh, mm, ss = '0'] = time.split(':');
            let h = parseInt(hh, 10);
            if (h === 12) h = 0;
            if (mod === 'PM') h += 12;
            const iso = `${dateS}T${pad(h)}:${pad(parseInt(mm))}:${pad(parseInt(ss))}Z`;
            return new Date(iso).getTime() - offMins * 60000;
        },

        fetchSolar: async (lat, lng) => {
            const k = `sol_${lat}_${lng}_${dateStr()}`;
            const cached = Cache.get(k);
            if (cached) return cached;

            D.loaderTxt.textContent = Lang.t('loadingSun');
            const base = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}`;
            const [yR, tR, tmR] = await Promise.all([
                fetch(`${base}&date=${dateStr(-1)}`).then(r => r.json()),
                fetch(`${base}&date=${dateStr( 0)}`).then(r => r.json()),
                fetch(`${base}&date=${dateStr( 1)}`).then(r => r.json()),
            ]);
            if (tR.status !== 'OK')
                throw new Error('بيانات الشمس غير متاحة حالياً. يرجى المحاولة لاحقاً.');

            const off = API.normOff(tR.results.utc_offset);

            /* ✅ T3 — جلب day_length من الـ API مباشرةً */
            const dayLengthStr = tR.results.day_length || null;

            const todaySunriseUTC = API.toUTC(dateStr(0), tR.results.sunrise, off);
            let   todaySunsetUTC  = API.toUTC(dateStr(0), tR.results.sunset,  off);

            /* ✅ T4 — إصلاح عبور منتصف الليل (Midnight Crossing)
             *
             *  في المدن القطبية العالية صيفاً (كأولو/Oulu وتروندهايم)،
             *  قد يقع الغروب عقب منتصف الليل رقمياً قبل الشروق.
             *  مثال: شروق 02:15 UTC، غروب 23:58 UTC (يوم سابق) → رقم الغروب أصغر.
             *  الحل: إضافة 24 ساعة للغروب ليكون بعد الشروق.
             */
            if (todaySunsetUTC <= todaySunriseUTC) {
                todaySunsetUTC += 86400000;
            }

            const data = {
                yesterdaySunset : API.toUTC(dateStr(-1), yR.results.sunset,   off),
                todaySunrise    : todaySunriseUTC,
                todaySunset     : todaySunsetUTC,
                tomorrowSunrise : API.toUTC(dateStr( 1), tmR.results.sunrise, off),
                todaySunriseStr : tR.results.sunrise,
                todaySunsetStr  : tR.results.sunset,
                dayLengthStr    : dayLengthStr,   /* ✅ T3 */
                utcOff          : off,
                /* ✅ Bug 5 — تاريخ الجلب لاكتشاف منتصف الليل */
                _fetchedDate    : dateStr(0)
            };
            Cache.set(k, data);
            return data;
        },

        fetchPrayers: async (lat, lng, countryCode) => {
            const k = `pray_${lat}_${lng}_${dateStr()}`;
            const cached = Cache.get(k);
            if (cached) return cached;
            D.loaderTxt.textContent = Lang.t('loadingPrayer');
            const ts = Math.floor(Date.now() / 1000);
            /* ✅ Bug 15 — طريقة الصلاة حسب رمز الدولة */
            const method = CFG.PRAYER_METHODS[countryCode] || CFG.PRAYER_METHODS.DEFAULT;
            const res = await fetch(
                `https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lng}&method=${method}`
            ).then(r => r.json()).catch(() => null);
            if (!res || res.code !== 200) return null;
            Cache.set(k, res.data.timings);
            return res.data.timings;
        },
    };


    /* ═══════════════════════════════════════════════════════
       10. PRAYER HELPERS
    ═══════════════════════════════════════════════════════ */
    const Prayers = {
        toMS: (hhmm, offMins, tmrw = false) => {
            const iso = `${dateStr(tmrw ? 1 : 0)}T${hhmm}:00Z`;
            return new Date(iso).getTime() - offMins * 60000;
        },
        getNext: () => {
            if (!S.prayers || !S.solar) return null;
            const { utcOff } = S.solar;
            const now = Date.now();
            for (const n of CFG.PRAYER_KEYS) {
                const ms = Prayers.toMS(S.prayers[n], utcOff);
                if (ms > now) return { name: n, ms };
            }
            return { name: 'Fajr', ms: Prayers.toMS(S.prayers.Fajr, utcOff, true) };
        },
        renderBar: () => {
            if (!S.prayers || !S.solar) {
                D.prayerBar.classList.add('hidden');
                return;
            }
            D.prayerBar.classList.remove('hidden');
            const { utcOff } = S.solar;
            const next = Prayers.getNext();
            D.prayerList.innerHTML = CFG.PRAYER_KEYS.map(k => {
                const local = new Date(Prayers.toMS(S.prayers[k], utcOff) + utcOff * 60000);
                const tStr  = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
                const isNxt = next && next.name === k;
                return `<div class="prayer-item flex flex-col items-center gap-0.5 px-2 py-1 ${isNxt ? 'prayer-item-next' : ''}">
                            <span class="p-name">${Lang.t(k)}</span>
                            <span class="p-time" dir="ltr">${tStr}</span>
                        </div>`;
            }).join('');
        },
        drawMarkers: (phase, startMs, endMs) => {
            D.prayerMrks.innerHTML = '';
            if (!S.prayers || !S.solar) return;
            const { utcOff } = S.solar;
            const now  = Date.now();
            const next = Prayers.getNext();
            const keys = phase === 'day' ? ['Dhuhr','Asr'] : ['Maghrib','Isha','Fajr'];
            const NS   = document.createElementNS.bind(document, 'http://www.w3.org/2000/svg');
            keys.forEach(k => {
                const isTmrwFajr = k === 'Fajr' && phase === 'night' && now >= S.solar.todaySunset;
                const ms = Prayers.toMS(S.prayers[k], utcOff, isTmrwFajr);
                if (ms <= startMs || ms >= endMs) return;
                const prog  = (ms - startMs) / (endMs - startMs);
                const angle = Math.PI * (1 - prog);
                const cx    = (150 + 130 * Math.cos(angle)).toFixed(1);
                const cy    = (140 - 130 * Math.sin(angle)).toFixed(1);
                const isNxt = next && next.name === k;
                if (isNxt) {
                    const pulse = NS('circle');
                    pulse.setAttribute('cx', cx); pulse.setAttribute('cy', cy);
                    pulse.setAttribute('r', '5'); pulse.setAttribute('class', 'prayer-pulse');
                    D.prayerMrks.appendChild(pulse);
                }
                const dot = NS('circle');
                dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
                dot.setAttribute('r', '4');
                dot.setAttribute('class', `prayer-dot${isNxt ? ' prayer-dot-next' : ''}`);
                const title = NS('title');
                title.textContent = `${Lang.t('prayers')}: ${Lang.t(k)}`;
                dot.appendChild(title);
                D.prayerMrks.appendChild(dot);
            });
        }
    };


    /* ═══════════════════════════════════════════════════════
       11. SHARE IMAGE
    ═══════════════════════════════════════════════════════ */
    const ShareImage = {
        async generate() {
            await document.fonts.ready;
            const canvas = document.createElement('canvas');
            canvas.width = 900; canvas.height = 600;
            const ctx = canvas.getContext('2d');

            const cs  = getComputedStyle(document.documentElement);
            const get = v => cs.getPropertyValue(v).trim();
            const skyTop  = get('--sky-top');
            const skyBot  = get('--sky-bot');
            const textPri = get('--text-pri');
            const textSec = get('--text-sec');

            const bg = ctx.createLinearGradient(0, 0, 0, 600);
            bg.addColorStop(0, skyTop); bg.addColorStop(1, skyBot);
            ctx.fillStyle = bg; ctx.fillRect(0, 0, 900, 600);

            for (let i = 0; i < 4000; i++) {
                ctx.fillStyle = `rgba(128,128,128,${Math.random() * 0.04})`;
                ctx.fillRect(Math.random()*900, Math.random()*600, 1.5, 1.5);
            }

            const now = Date.now();
            const solar = S.solar;
            let prog = 0.5, isNight = false;
            if (solar) {
                const { todaySunrise, todaySunset, yesterdaySunset, tomorrowSunrise } = solar;
                const phase = now < todaySunrise ? 'night' : now < todaySunset ? 'day' : 'night';
                isNight = phase === 'night';
                const st = phase === 'day' ? todaySunrise : (now < todaySunrise ? yesterdaySunset : todaySunset);
                const en = phase === 'day' ? todaySunset  : (now < todaySunrise ? todaySunrise : tomorrowSunrise);
                prog = Math.max(0, Math.min(1, (now - st) / (en - st)));
            }

            const cardX = 80, cardY = 160, cardW = 740, cardH = 300;
            ctx.save();
            ctx.beginPath();
            const r = 28;
            ctx.moveTo(cardX + r, cardY);
            ctx.lineTo(cardX + cardW - r, cardY);
            ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + r, r);
            ctx.lineTo(cardX + cardW, cardY + cardH - r);
            ctx.arcTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH, r);
            ctx.lineTo(cardX + r, cardY + cardH);
            ctx.arcTo(cardX, cardY + cardH, cardX, cardY + cardH - r, r);
            ctx.lineTo(cardX, cardY + r);
            ctx.arcTo(cardX, cardY, cardX + r, cardY, r);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();

            const CX = 450, CY = 580, R = 290;

            ctx.beginPath(); ctx.arc(CX, CY, R, Math.PI, 0, false);
            ctx.strokeStyle = textSec; ctx.lineWidth = 1.5;
            ctx.setLineDash([6,6]); ctx.globalAlpha = 0.25; ctx.stroke();
            ctx.setLineDash([]); ctx.globalAlpha = 1;

            const endAngle = Math.PI + prog * Math.PI;
            const arcGrad = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
            if (isNight) {
                arcGrad.addColorStop(0, '#3730A3'); arcGrad.addColorStop(0.5, '#818CF8'); arcGrad.addColorStop(1, '#3730A3');
            } else {
                arcGrad.addColorStop(0, '#F59E0B'); arcGrad.addColorStop(0.45, '#38BDF8'); arcGrad.addColorStop(1, '#F97316');
            }
            ctx.beginPath(); ctx.arc(CX, CY, R, Math.PI, endAngle, false);
            ctx.strokeStyle = arcGrad; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();

            const bAngle = Math.PI * (1 - prog);
            const bx = CX + R * Math.cos(bAngle);
            const by = CY - R * Math.sin(bAngle);
            if (!isNight) {
                const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 40);
                glow.addColorStop(0, 'rgba(251,191,36,0.45)'); glow.addColorStop(1, 'transparent');
                ctx.beginPath(); ctx.arc(bx, by, 40, 0, Math.PI*2);
                ctx.fillStyle = glow; ctx.fill();
                ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI*2);
                ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#F59E0B';
                ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
            } else {
                /* ✅ T5 — بدر مكتمل على الـ Canvas */
                const moonGlow = ctx.createRadialGradient(bx, by, 0, bx, by, 28);
                moonGlow.addColorStop(0, 'rgba(129,140,248,0.25)'); moonGlow.addColorStop(1, 'transparent');
                ctx.beginPath(); ctx.arc(bx, by, 28, 0, Math.PI*2);
                ctx.fillStyle = moonGlow; ctx.fill();
                ctx.beginPath(); ctx.arc(bx, by, 11, 0, Math.PI*2);
                ctx.fillStyle = '#F1F5F9'; ctx.strokeStyle = '#818CF8';
                ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
            }

            ctx.beginPath(); ctx.moveTo(CX-R-30, CY); ctx.lineTo(CX+R+30, CY);
            ctx.strokeStyle = textSec; ctx.lineWidth = 1;
            ctx.setLineDash([5,5]); ctx.globalAlpha = 0.2; ctx.stroke();
            ctx.setLineDash([]); ctx.globalAlpha = 1;

            const city = S.cities[S.key];
            const cityName    = (Lang.current === 'en' && city?.nameEn) ? city.nameEn : (city?.name || '');
            const countryName = (Lang.current === 'en' && city?.countryEn) ? city.countryEn : (city?.country || '');
            const hour     = D.hourNum?.textContent || '--';
            const phase    = D.phaseDisp?.textContent || '';
            const std      = D.stdTime?.textContent || '--:--:--';
            const dateText = D.dateEl?.textContent || '';
            const srStr    = D.sunriseEl?.textContent || '--:--';
            const ssStr    = D.sunsetEl?.textContent || '--:--';

            ctx.direction = Lang.current === 'ar' ? 'rtl' : 'ltr';
            ctx.font = `bold 38px 'Tajawal', sans-serif`;
            ctx.fillStyle = textPri; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(cityName, CX, 195);

            ctx.font = `italic 18px 'Tajawal', sans-serif`;
            ctx.fillStyle = textSec; ctx.globalAlpha = 0.55;
            ctx.fillText(countryName, CX, 225);
            ctx.globalAlpha = 1;

            ctx.font = `14px 'Tajawal', sans-serif`;
            ctx.fillStyle = textSec; ctx.globalAlpha = 0.4;
            ctx.fillText(dateText, CX, 250);
            ctx.globalAlpha = 1;

            ctx.font = `bold 120px 'JetBrains Mono', monospace`;
            ctx.direction = 'ltr';
            ctx.fillStyle = textPri; ctx.fillText(hour, CX, 340);

            ctx.direction = Lang.current === 'ar' ? 'rtl' : 'ltr';
            ctx.font = `bold 24px 'Tajawal', sans-serif`;
            ctx.fillStyle = textSec; ctx.globalAlpha = 0.8;
            ctx.fillText(phase, CX, 395);
            ctx.globalAlpha = 1;

            ctx.font = `24px 'JetBrains Mono', monospace`;
            ctx.direction = 'ltr'; ctx.fillStyle = textPri; ctx.globalAlpha = 0.55;
            ctx.fillText(std, CX, 432);
            ctx.globalAlpha = 1;

            ctx.font = `14px 'JetBrains Mono', monospace`;
            ctx.fillStyle = textSec; ctx.globalAlpha = 0.55;
            ctx.fillText(`🌅 ${srStr}`, CX - 100, 460);
            ctx.fillText(`🌆 ${ssStr}`, CX + 100, 460);
            ctx.globalAlpha = 1;

            ctx.font = `700 12px 'JetBrains Mono', monospace`;
            ctx.fillStyle = textSec; ctx.globalAlpha = 0.35;
            ctx.fillText('SolarisSwahili', CX, 580);
            ctx.globalAlpha = 1;

            return canvas.toDataURL('image/png');
        },

        async show() {
            const btn = D.shareImgBtn;
            if (btn) { btn.disabled = true; btn.textContent = '...'; }
            try {
                const dataUrl = await this.generate();
                let modal = $('share-img-modal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'share-img-modal';
                    modal.className = 'share-modal';
                    document.body.appendChild(modal);
                }
                modal.innerHTML = `
                    <div class="share-modal-bg" onclick="document.getElementById('share-img-modal').style.display='none'"></div>
                    <div class="share-modal-card">
                        <img src="${dataUrl}" alt="Swahili Time Share">
                        <div class="share-modal-actions">
                            <a href="${dataUrl}" download="swahili-time.png"
                               class="add-btn text-sm font-bold rounded-full px-5 py-2.5 no-underline">
                               ⬇ ${Lang.t('downloadPNG')}
                            </a>
                            <button class="city-btn text-sm rounded-full px-5 py-2.5"
                               onclick="document.getElementById('share-img-modal').style.display='none'">
                               ${Lang.t('close')}
                            </button>
                        </div>
                    </div>`;
                modal.style.display = 'flex';
            } catch(e) { console.error(e); }
            if (btn) { btn.disabled = false; btn.textContent = `📷 ${Lang.t('shareImage')}`; }
        }
    };


    /* ═══════════════════════════════════════════════════════
       12. AMBIENT MODE
    ═══════════════════════════════════════════════════════ */
    /* ✅ Bug 9 — متغير WakeLock */
    let wakeLock = null;

    const Ambient = {
        async enter() {
            S.ambientActive = true;
            if (!D.ambOverlay) return;
            D.ambOverlay.style.display = 'flex';
            const ambStars = $('amb-stars');
            if (ambStars) genStars(ambStars);
            document.documentElement.requestFullscreen?.().catch(() => {});
            try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
            this.update();
        },
        exit() {
            S.ambientActive = false;
            if (!D.ambOverlay) return;
            D.ambOverlay.style.display = 'none';
            if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
            if (wakeLock) { wakeLock.release?.().catch(() => {}); wakeLock = null; }
        },
        update() {
            if (!S.ambientActive || !S.solar) return;
            const now = Date.now();
            const { todaySunrise, todaySunset, yesterdaySunset, tomorrowSunrise, utcOff } = S.solar;

            const isNight = now < todaySunrise || now >= todaySunset;
            const phase   = isNight ? 'night' : 'day';
            const st = phase === 'day' ? todaySunrise : (now < todaySunrise ? yesterdaySunset : todaySunset);
            const en = phase === 'day' ? todaySunset  : (now < todaySunrise ? todaySunrise : tomorrowSunrise);
            const dur  = en - st;
            const prog = Math.max(0, Math.min(1, (now - st) / dur));

            /* ✅ T1/T2 — الساعات المعيارية المُحتسَبة في Ambient */
            const nowElapsed = Math.max(0, now - st);
            const pH = Math.floor(nowElapsed / 3600000) + 1;
            const pM = Math.floor((nowElapsed % 3600000) / 60000);
            const pS = Math.floor((nowElapsed % 60000) / 1000);

            const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };

            set('amb-hour', pH);
            set('amb-phase', D.phaseDisp?.textContent || '');
            set('amb-metric', `${pad(pH - 1)}:${pad(pM)}:${pad(pS)}`);

            const nextMs = phase === 'day' ? todaySunset : (now < todaySunrise ? todaySunrise : tomorrowSunrise);
            const diff   = Math.max(0, nextMs - now);
            const evtLbl = phase === 'day' ? Lang.t('untilSunset') : Lang.t('untilSunrise');
            set('amb-countdown', `${Lang.t('remaining')} ${evtLbl}: ${pad(Math.floor(diff/3600000))}:${pad(Math.floor((diff%3600000)/60000))}:${pad(Math.floor((diff%60000)/1000))}`);

            const local = new Date(now + utcOff * 60000);
            set('amb-std', `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`);

            const city = S.cities[S.key];
            set('amb-city', (Lang.current === 'en' && city?.nameEn) ? city.nameEn : (city?.name || ''));
            set('amb-country', (Lang.current === 'en' && city?.countryEn) ? city.countryEn : (city?.country || ''));
            set('amb-date', D.dateEl?.textContent || '');

            const ambArc = $('amb-progress-arc');
            if (ambArc) {
                ambArc.setAttribute('stroke-dashoffset', (100 - prog * 100).toFixed(2));
                ambArc.setAttribute('stroke', isNight ? 'url(#amb-g-night)' : 'url(#amb-g-day)');
            }
            const ambBody = $('amb-celestial');
            if (ambBody) {
                const angle = Math.PI * (1 - prog);
                const bx = 300 + 255 * Math.cos(angle);
                const by = 270 - 255 * Math.sin(angle);
                ambBody.setAttribute('transform', `translate(${bx.toFixed(1)},${by.toFixed(1)})`);
            }
            const ambSun  = $('amb-sun');
            const ambMoon = $('amb-moon');
            if (ambSun)  ambSun.style.opacity  = isNight ? '0' : '1';
            if (ambMoon) ambMoon.style.opacity  = isNight ? '1' : '0';

            const ambStars = $('amb-stars');
            if (ambStars) ambStars.style.opacity = isNight ? '0.9' : '0';

            const skyTop = getComputedStyle(document.documentElement).getPropertyValue('--sky-top').trim();
            const skyBot = getComputedStyle(document.documentElement).getPropertyValue('--sky-bot').trim();
            if (D.ambOverlay) D.ambOverlay.style.background = `linear-gradient(160deg, ${skyTop} 0%, ${skyBot} 100%)`;
        }
    };

    /* ✅ Bug 9 — استعادة WakeLock عند عودة التبويب */
    document.addEventListener('visibilitychange', async () => {
        if (S.ambientActive && document.visibilityState === 'visible') {
            try { wakeLock = await navigator.wakeLock?.request('screen'); }
            catch (e) { console.warn('[SS] WakeLock failed:', e); }
        }
    });


    /* ═══════════════════════════════════════════════════════
       13. CLOCK ENGINE — يُستدعى كل ثانية
    ═══════════════════════════════════════════════════════ */
    const Clock = {
        run: () => {
            if (!S.solar) return;

            /* ✅ Bug 5 — فحص تجاوز منتصف الليل */
            const todayStr = new Date().toLocaleDateString('en-CA');
            if (S.solar._fetchedDate && S.solar._fetchedDate !== todayStr) {
                console.log('[SS] Date changed — reloading city data...');
                if (S.tickId) { clearInterval(S.tickId); S.tickId = null; }
                if (S.key) loadCity(S.key);
                return;
            }

            const now = Date.now();
            const { yesterdaySunset, todaySunrise, todaySunset, tomorrowSunrise, utcOff } = S.solar;

            /* تحديد الطور */
            let phase, startMs, endMs;
            if (now < todaySunrise) {
                phase = 'night'; startMs = yesterdaySunset; endMs = todaySunrise;
            } else if (now < todaySunset) {
                phase = 'day';   startMs = todaySunrise;   endMs = todaySunset;
            } else {
                phase = 'night'; startMs = todaySunset;    endMs = tomorrowSunrise;
            }

            const dur  = endMs - startMs;
            /* prog لا يزال ضرورياً لتحريك القوس والجسم السماوي */
            const prog = Math.max(0, Math.min(1, (now - startMs) / dur));

            updateSky(phase, prog);

            /* الثيمات التلقائية */
            if (!S.manualTheme) {
                const dsr = Math.abs(now - todaySunrise);
                const dss = Math.abs(now - todaySunset);
                let theme = 'day';
                if (phase === 'night')                              theme = 'night';
                else if (dsr < CFG.GOLD_WIN || dss < CFG.GOLD_WIN) theme = 'golden';

                document.body.classList.remove('theme-night', 'theme-golden');
                if (theme === 'night')  document.body.classList.add('theme-night');
                if (theme === 'golden') document.body.classList.add('theme-golden');

                const isNight = theme === 'night';
                D.sunIco.classList.toggle('hidden', isNight);
                D.moonIco.classList.toggle('hidden', !isNight);
                D.stars.style.opacity = isNight ? '0.9' : '0';
            }

            const isNight = phase === 'night';
            D.sunShape.style.opacity  = isNight ? '0' : '1';
            D.moonShape.style.opacity = isNight ? '1' : '0';
            D.sunHalo.style.opacity   = isNight ? '0' : '1';
            D.arc.setAttribute('stroke', isNight ? 'url(#g-night)' : 'url(#g-day)');

            /* ══════════════════════════════════════════════════════
             *  ✅ T1 + T2 — الساعات المعيارية المُحتسَبة (60 دقيقة = ساعة واحدة)
             *
             *  المبدأ الجديد:
             *    nowElapsed = ms منقضية منذ بداية الطور (شروق أو غروب)
             *    pH = عدد الساعات الكاملة المنقضية (0-indexed)
             *    displayHour = pH + 1 → "الساعة 1" عند الشروق/الغروب
             *
             *  الفرق عن v3.0:
             *    v3.0 → elapsed = progress × 12 × 3600000  (نسبي)
             *    v3.1 → elapsed = now − startMs            (مطلق)
             * ══════════════════════════════════════════════════════ */
            const nowElapsed = Math.max(0, now - startMs);
            const pH = Math.floor(nowElapsed / 3600000);
            const pM = Math.floor((nowElapsed % 3600000) / 60000);
            const pS = Math.floor((nowElapsed % 60000) / 1000);

            D.hourNum.textContent    = pH + 1;
            const phLbl = isNight ? Lang.t('nighttime') : Lang.t('daytime');
            D.phaseDisp.textContent  = `${Lang.t('of')} ${phLbl}`;
            D.metricDisp.textContent = fmt(pH, pM, pS);

            /* العداد التنازلي */
            const nextMs = phase === 'day' ? todaySunset : (now < todaySunrise ? todaySunrise : tomorrowSunrise);
            const diff   = Math.max(0, nextMs - now);
            D.cdLbl.textContent = phase === 'day' ? Lang.t('untilSunset') : Lang.t('untilSunrise');
            D.cdNum.textContent = fmt(
                Math.floor(diff / 3600000),
                Math.floor((diff % 3600000) / 60000),
                Math.floor((diff % 60000)   / 1000)
            );

            /* التوقيت القياسي */
            const local = new Date(now + utcOff * 60000);
            D.stdTime.textContent = fmt(local.getUTCHours(), local.getUTCMinutes(), local.getUTCSeconds());

            /* تحريك الجسم السماوي على القوس */
            const angle = Math.PI * (1 - prog);
            const cx    = 150 + 130 * Math.cos(angle);
            const cy    = 140 - 130 * Math.sin(angle);
            D.arc.setAttribute('stroke-dashoffset', (100 - prog * 100).toFixed(2));
            D.celestial.setAttribute('transform', `translate(${cx.toFixed(2)},${cy.toFixed(2)})`);

            if (S.ambientActive) Ambient.update();
        }
    };


    /* ═══════════════════════════════════════════════════════
       14. DAY/NIGHT BAR RENDERER
    ═══════════════════════════════════════════════════════ */
    const renderDayNightBar = () => {
        if (!S.solar) return;
        const { todaySunrise, todaySunset, dayLengthStr } = S.solar;

        /* ✅ T3 — استخدام day_length من الـ API بشكل أولوي لتفادي الأرقام السالبة */
        const dayL   = parseDayLength(dayLengthStr) ?? Math.max(0, todaySunset - todaySunrise);
        const nightL = 24 * 3600000 - dayL;
        const dayPct = (dayL / (24 * 3600000) * 100).toFixed(1);
        const diff   = Math.abs(dayL - nightL);

        D.dayBar.style.width   = `${dayPct}%`;
        D.nightBar.style.width = `${(100 - +dayPct).toFixed(1)}%`;
        D.dayLen.textContent   = fmtDur(dayL);
        D.nightLen.textContent = fmtDur(nightL);
        D.compTxt.textContent  = diff < 5 * 60000
            ? Lang.t('equinox')
            : dayL > nightL
                ? `${Lang.t('dayLonger')} ${fmtDur(diff)}`
                : `${Lang.t('nightLonger')} ${fmtDur(diff)}`;
    };


    /* ═══════════════════════════════════════════════════════
       15. CITY LOADER
    ═══════════════════════════════════════════════════════ */
    const loadCity = async key => {
        if (S.tickId) clearInterval(S.tickId);
        D.loader.classList.remove('opacity-0');
        D.loader.style.pointerEvents = 'auto';
        D.app.style.opacity = '0';
        D.loaderTxt.textContent = Lang.t('loading');
        D.errOverlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => D.errOverlay.classList.add('hidden'), 500);

        S.key = key;
        const city = S.cities[key];

        document.querySelectorAll('.city-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.city === key)
        );

        const displayName = (Lang.current === 'en' && city.nameEn) ? city.nameEn : city.name;
        D.cityName.textContent = displayName;
        const countryName = (Lang.current === 'en' && city.countryEn) ? city.countryEn : (city.country || '');
        if (D.countrySub) D.countrySub.textContent = countryName;

        updateDateDisplay();

        try {
            const countryCode = city.countryCode || '';
            const [solar, prayers] = await Promise.all([
                API.fetchSolar(city.lat, city.lng),
                API.fetchPrayers(city.lat, city.lng, countryCode)
            ]);
            if (!solar) throw new Error('تعذر تحليل بيانات الشمس.');
            S.solar = solar; S.prayers = prayers;

            D.sunriseEl.textContent = cleanTime(solar.todaySunriseStr);
            D.sunsetEl.textContent  = cleanTime(solar.todaySunsetStr);

            renderDayNightBar();

            const now = Date.now();
            let pPhase, pStart, pEnd;
            if (now >= solar.todaySunrise && now < solar.todaySunset) {
                pPhase = 'day'; pStart = solar.todaySunrise; pEnd = solar.todaySunset;
            } else {
                pPhase = 'night';
                pStart = now < solar.todaySunrise ? solar.yesterdaySunset : solar.todaySunset;
                pEnd   = now < solar.todaySunrise ? solar.todaySunrise   : solar.tomorrowSunrise;
            }
            Prayers.drawMarkers(pPhase, pStart, pEnd);
            Prayers.renderBar();

            Clock.run();
            S.tickId = setInterval(Clock.run, 1000);

            D.loader.classList.add('opacity-0');
            D.loader.style.pointerEvents = 'none';
            D.app.style.opacity = '1';

        } catch (err) {
            console.error('[SolarisSwahili]', err);
            D.errMsg.textContent = err.message || Lang.t('errorDefault');
            D.errOverlay.classList.remove('hidden');
            requestAnimationFrame(() => {
                D.errOverlay.classList.remove('opacity-0', 'pointer-events-none');
                D.errOverlay.setAttribute('aria-hidden', 'false');
            });
            D.loader.classList.add('opacity-0');
            D.loader.style.pointerEvents = 'none';
        }
    };


    /* ═══════════════════════════════════════════════════════
       16. CITY BUTTONS BUILDER
    ═══════════════════════════════════════════════════════ */
    const buildBtns = () => {
        D.citySel.innerHTML = '';
        Object.keys(S.cities).forEach(k => {
            const city      = S.cities[k];
            const isDefault = CFG.DEFAULT_KEYS.includes(k);
            const label     = (Lang.current === 'en' && city.nameEn) ? city.nameEn : city.name;

            const btn = document.createElement('button');
            btn.className    = 'city-btn';
            btn.dataset.city = k;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = label;
            btn.appendChild(nameSpan);

            if (!isDefault) {
                const del = document.createElement('span');
                del.className   = 'city-del';
                del.textContent = '×';
                del.title       = 'حذف المدينة';
                del.onclick = e => { e.stopPropagation(); CityStore.remove(k); };
                btn.appendChild(del);
            }

            if (city.isGeo) {
                const dot = document.createElement('span');
                dot.className = 'gps-dot';
                dot.style.cssText = 'width:5px;height:5px;display:inline-block;';
                btn.insertBefore(dot, nameSpan);
            }

            btn.onclick = () => { if (S.key !== k) loadCity(k); };
            D.citySel.appendChild(btn);
        });
    };


    /* ═══════════════════════════════════════════════════════
       17. INIT
    ═══════════════════════════════════════════════════════ */
    const init = () => {
        Lang.apply();
        S.cities = { ...CFG.DEFAULT_CITIES, ...CityStore.load() };
        genStars();
        buildBtns();
        updateDateDisplay();

        /* ✅ Bug 26 — استعادة الثيم المحفوظ */
        const savedTheme = localStorage.getItem('ss_theme');
        if (savedTheme === 'night') {
            S.manualTheme = true;
            document.body.classList.add('theme-night');
            D.sunIco.classList.add('hidden');
            D.moonIco.classList.remove('hidden');
            D.stars.style.opacity = '0.9';
            setSkyManual(true);
            D.resetBtn.classList.remove('hidden');
            requestAnimationFrame(() => D.resetBtn.classList.remove('opacity-0', 'translate-x-3'));
        } else if (savedTheme === 'day') {
            S.manualTheme = true;
        }

        /* ✅ Bug 1 — تحميل المدينة الافتراضية فوراً */
        loadCity('tobruk');
        /* ✅ Bug 1 — اكتشاف الموقع غير مانع */
        setTimeout(() => GeoDetect.addAutoCity().catch(() => {}), 1200);

        /* ── إضافة مدينة ── */
        D.addBtn.onclick = async () => {
            const val = D.cityInput.value.trim();
            if (!val) return;
            D.cityErr.classList.add('hidden');
            D.addBtn.disabled = true;
            D.addBtn.textContent = Lang.t('adding');
            /* ✅ Bug 24 */
            D.addBtn.setAttribute('aria-label', `${Lang.t('adding')} ${val}`);
            D.addBtn.setAttribute('aria-busy', 'true');
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=1&addressdetails=1`
                ).then(r => r.json());
                if (!res.length) throw new Error(Lang.t('cityNotFound'));

                const r = res[0];
                const k = `c_${Date.now()}`;
                let nameAr = r.name || val;
                const countryCode = (r.address?.country_code || '').toUpperCase();
                try {
                    const arData = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${r.lat}&lon=${r.lon}&addressdetails=1&accept-language=ar`
                    ).then(x => x.json());
                    nameAr = arData.address?.city || arData.address?.town || arData.address?.village || arData.name || r.name || val;
                } catch {}

                S.cities[k] = {
                    name:        nameAr,
                    nameEn:      r.name || val,
                    country:     r.address?.country || '',
                    countryEn:   r.address?.country || '',
                    countryCode: countryCode,
                    lat:         r.lat,
                    lng:         r.lon
                };
                CityStore.save();
                buildBtns();
                D.cityInput.value = '';
                loadCity(k);
            } catch(e) {
                D.cityErr.textContent = e.message;
                D.cityErr.classList.remove('hidden');
            } finally {
                D.addBtn.disabled = false;
                D.addBtn.textContent = Lang.t('addCity');
                D.addBtn.removeAttribute('aria-busy');
                D.addBtn.removeAttribute('aria-label');
            }
        };

        D.cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') D.addBtn.click(); });

        /* ── تبديل اللغة ── */
        const langBtn = $('lang-toggle');
        if (langBtn) langBtn.onclick = () => {
            Lang.toggle();
            buildBtns();
            if (S.key) {
                const city = S.cities[S.key];
                D.cityName.textContent = (Lang.current === 'en' && city?.nameEn) ? city.nameEn : city?.name || '';
                if (D.countrySub) {
                    D.countrySub.textContent = (Lang.current === 'en' && city?.countryEn) ? city.countryEn : (city?.country || '');
                }
                renderDayNightBar();
                Prayers.renderBar();
            }
        };

        /* ── GPS ── */
        const gpsBadge = $('gps-badge');
        if (gpsBadge) gpsBadge.onclick = () => GeoDetect.addAutoCity();

        /* ── تبديل الثيم ── */
        D.themeBtn.onclick = () => {
            /* ✅ Bug 13 */
            document.body.style.setProperty('--transition-duration', '0.25s');
            setTimeout(() => document.body.style.removeProperty('--transition-duration'), 300);

            S.manualTheme = true;
            document.body.classList.remove('theme-golden');
            const isNight = document.body.classList.toggle('theme-night');
            D.sunIco.classList.toggle('hidden', isNight);
            D.moonIco.classList.toggle('hidden', !isNight);
            D.stars.style.opacity = isNight ? '0.9' : '0';
            setSkyManual(isNight);
            /* ✅ Bug 26 */
            localStorage.setItem('ss_theme', isNight ? 'night' : 'day');
            D.resetBtn.classList.remove('hidden');
            requestAnimationFrame(() => D.resetBtn.classList.remove('opacity-0', 'translate-x-3'));
        };

        D.resetBtn.onclick = () => {
            S.manualTheme = false;
            localStorage.removeItem('ss_theme');
            D.resetBtn.classList.add('opacity-0', 'translate-x-3');
            setTimeout(() => D.resetBtn.classList.add('hidden'), 300);
            Clock.run();
        };

        D.retryBtn.onclick = () => loadCity(S.key);

        /* ── مشاركة الرابط ── */
        D.shareBtn.onclick = async () => {
            try {
                if (navigator.share) {
                    await navigator.share({ title: 'SolarisSwahili', url: location.href });
                } else {
                    await navigator.clipboard.writeText(location.href);
                    const orig = D.shareBtn.innerHTML;
                    D.shareBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
                    setTimeout(() => { D.shareBtn.innerHTML = orig; }, 2200);
                }
            } catch {}
        };

        /* ── مشاركة الصورة ── */
        if (D.shareImgBtn) D.shareImgBtn.onclick = () => ShareImage.show();

        /* ── وضع الحائط ── */
        if (D.ambientBtn) D.ambientBtn.onclick = () => Ambient.enter();
        const ambClose = $('amb-close');
        if (ambClose) ambClose.onclick = () => Ambient.exit();

        document.addEventListener('keydown', e => {
            if (e.key === 'f' || e.key === 'F') {
                if (!S.ambientActive && S.solar) Ambient.enter();
                else if (S.ambientActive) Ambient.exit();
            }
            if (e.key === 'Escape' && S.ambientActive) Ambient.exit();
        });
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);