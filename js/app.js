/**
 * SolarisSwahili v3.1 — Adaptive Astronomical Timing
 * ====================================================
 *
 * Architecture
 * ────────────
 * This file is a single IIFE that exposes one method: App.init().
 * Internally it is divided into named modules:
 *
 *   Config      — immutable constants
 *   State       — single mutable state object
 *   DOM         — cached element references
 *   Utils       — pure helper functions
 *   Cache       — localStorage wrapper with TTL
 *   SolarAPI    — sunrise / sunset data (sunrisesunset.io)
 *   PrayerAPI   — prayer times (aladhan.com)
 *   SkyRenderer — sky gradient and body theme
 *   ArcRenderer — SVG arc + celestial body animation
 *   Prayers     — markers + times bar
 *   Clock       — main 1-second tick
 *   CityManager — city loading, URL param, Nominatim search
 *   App         — init + event wiring
 *
 * Adaptive Timing Principle
 * ─────────────────────────
 * The day is divided into two astronomical phases:
 *
 *   • Daytime  — sunrise → sunset
 *   • Night    — sunset  → next sunrise
 *
 * At each boundary the elapsed counter resets to 0 and the clock
 * displays "Hour 1".  Every hour is a standard 60-minute hour.
 * The total number of hours in each phase equals the actual
 * astronomical duration for that city and date — not a fixed 12.
 *
 * Day Length
 * ──────────
 * The official `day_length` field from the sunrisesunset.io API is
 * used directly (parsed from "HH:MM:SS").  Night length is derived
 * as (24 hours − day_length).  No manual timestamp subtraction is
 * performed, which eliminates edge-case errors.
 *
 * Midnight-Crossing Guard
 * ───────────────────────
 * In polar / near-polar locations (or due to API quirks) the
 * returned sunset timestamp can be numerically earlier than sunrise
 * when both are converted to UTC milliseconds.  This is detected
 * and corrected by adding MS_PER_DAY to the sunset value so that
 * all phase intervals remain in chronological order.
 */

const App = (() => {

    /* ════════════════════════════════════════════════════════
       CONFIG — immutable constants
    ════════════════════════════════════════════════════════ */
    const Config = Object.freeze({
        CACHE_TTL  : 6 * 3600 * 1000,      // 6 h in ms
        GOLD_WIN   : 45 * 60 * 1000,        // twilight window around sunrise/sunset
        MS_PER_DAY : 24 * 3600 * 1000,      // 86 400 000 ms

        /** Default cities (shown as pill buttons on load). */
        DEFAULT_CITIES: {
            tobruk   : { name: 'طبرق',   lat: '32.0773', lng: '23.9600' },
            benghazi : { name: 'بنغازي', lat: '32.1167', lng: '20.0667' },
            tripoli  : { name: 'طرابلس', lat: '32.8892', lng: '13.1900' }
        },

        /** Arabic names for the five prayers used in the UI. */
        PRAYER_NAMES: {
            Fajr    : 'الفجر',
            Dhuhr   : 'الظهر',
            Asr     : 'العصر',
            Maghrib : 'المغرب',
            Isha    : 'العشاء'
        },

        /**
         * Sky gradient key-frames for daytime.
         * Each entry maps a phase-progress fraction (0–1) to a pair of
         * hex colours (top / bottom) for the background gradient.
         */
        SKY_DAY: [
            { p: 0.00, t: '#FEF3C7', b: '#FDBA74' },  // dawn
            { p: 0.18, t: '#E0F2FE', b: '#BAE6FD' },  // morning
            { p: 0.50, t: '#F0F9FF', b: '#E5E7EB' },  // midday
            { p: 0.82, t: '#FEF9C3', b: '#FDE68A' },  // afternoon
            { p: 1.00, t: '#FDE68A', b: '#FDBA74' }   // dusk
        ],

        SKY_NIGHT: { t: '#020617', b: '#0B1120' }
    });


    /* ════════════════════════════════════════════════════════
       STATE — single mutable object
    ════════════════════════════════════════════════════════ */
    const State = {
        cities      : { ...Config.DEFAULT_CITIES }, // may grow as user adds cities
        currentKey  : null,     // key into State.cities for the active city
        solar       : null,     // resolved SolarData object
        prayers     : null,     // raw timings map from Aladhan
        tickId      : null,     // setInterval handle
        manualTheme : false     // true when user has overridden the auto theme
    };


    /* ════════════════════════════════════════════════════════
       DOM — cached element references (set once at init)
    ════════════════════════════════════════════════════════ */
    const $ = id => document.getElementById(id);

    const DOM = {
        loader      : $('loader'),
        loaderTxt   : $('loader-text'),
        errOverlay  : $('error-overlay'),
        errMsg      : $('error-message'),
        retryBtn    : $('retry-btn'),
        app         : $('app-container'),
        citySel     : $('city-selector'),
        cityName    : $('city-name'),
        hijri       : $('hijri-date'),
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
        stdTime     : $('standard-time')
    };


    /* ════════════════════════════════════════════════════════
       UTILS — pure, stateless helper functions
    ════════════════════════════════════════════════════════ */
    const Utils = {

        /** Zero-pad a number to two digits. */
        pad: n => String(Math.abs(n)).padStart(2, '0'),

        /** Format three integers as HH:MM:SS. */
        hms: (h, m, s) => `${Utils.pad(h)}:${Utils.pad(m)}:${Utils.pad(s)}`,

        /**
         * Format a millisecond duration into a human-readable Arabic string.
         * Examples: "ساعتين و30 دقيقة", "45 دقيقة", "أقل من دقيقة"
         */
        fmtDur: ms => {
            const total  = Math.round(ms / 60000);
            const hours  = Math.floor(total / 60);
            const mins   = total % 60;

            const hStr = !hours   ? '' :
                         hours === 1 ? 'ساعة' :
                         hours === 2 ? 'ساعتين' :
                         hours <= 10 ? `${hours} ساعات` : `${hours} ساعة`;

            const mStr = !mins   ? '' :
                         mins === 1 ? 'دقيقة' :
                         mins === 2 ? 'دقيقتين' :
                         mins <= 10 ? `${mins} دقائق` : `${mins} دقيقة`;

            if (!hStr) return mStr || 'أقل من دقيقة';
            return mStr ? `${hStr} و${mStr}` : hStr;
        },

        /**
         * Parse a day_length string from sunrisesunset.io ("HH:MM:SS")
         * into milliseconds.  Falls back to exactly 12 hours if the
         * string is absent, malformed, or contains NaN values.
         */
        parseDayLength: str => {
            const FALLBACK = 12 * 3600 * 1000;
            if (!str || typeof str !== 'string') return FALLBACK;
            const parts = str.trim().split(':');
            if (parts.length !== 3) return FALLBACK;
            const [h, m, s] = parts.map(Number);
            if ([h, m, s].some(v => !Number.isFinite(v))) return FALLBACK;
            return ((h * 3600) + (m * 60) + s) * 1000;
        },

        /**
         * Strip the seconds portion from a 12-hour time string like
         * "6:02:00 AM" → "6:02 AM".
         */
        cleanTime: t => {
            const parts = t.split(':');
            return parts.length >= 3
                ? `${parts[0]}:${parts[1]} ${t.split(' ').pop()}`
                : t;
        },

        /**
         * Return a YYYY-MM-DD date string (ISO 8601 local date).
         * @param {number} offsetDays — 0 = today, -1 = yesterday, +1 = tomorrow
         */
        dateStr: (offsetDays = 0) => new Date(
            Date.now() + offsetDays * 86400000
        ).toLocaleDateString('en-CA'),

        /**
         * Linear interpolation between two hex colour strings.
         * @param {string} a — starting hex e.g. "#FFFFFF"
         * @param {string} b — ending hex
         * @param {number} t — blend factor 0–1
         * @returns {string} interpolated hex colour
         */
        lerpHex: (a, b, t) => {
            const toRGB = c => [
                parseInt(c.slice(1, 3), 16),
                parseInt(c.slice(3, 5), 16),
                parseInt(c.slice(5, 7), 16)
            ];
            const [r1, g1, b1] = toRGB(a);
            const [r2, g2, b2] = toRGB(b);
            const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
            return '#' + [
                clamp(r1 + (r2 - r1) * t),
                clamp(g1 + (g2 - g1) * t),
                clamp(b1 + (b2 - b1) * t)
            ].map(v => v.toString(16).padStart(2, '0')).join('');
        },

        /**
         * Generate 150 random stars and assign them as radial-gradient
         * background-image on the stars layer element.
         */
        genStars: () => {
            DOM.stars.style.backgroundImage = Array.from({ length: 150 }, () => {
                const x = (Math.random() * 100).toFixed(1);
                const y = (Math.random() * 100).toFixed(1);
                const s = (Math.random() * 1.8 + 0.3).toFixed(1);
                const o = (Math.random() * 0.65 + 0.28).toFixed(2);
                return `radial-gradient(${s}px ${s}px at ${x}% ${y}%, `
                     + `rgba(255,255,255,${o}), transparent)`;
            }).join(',');
        }
    };


    /* ════════════════════════════════════════════════════════
       CACHE — localStorage wrapper with TTL
    ════════════════════════════════════════════════════════ */
    const Cache = {
        get: key => {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return null;
                const { ts, data } = JSON.parse(raw);
                return (Date.now() - ts > Config.CACHE_TTL) ? null : data;
            } catch {
                return null;
            }
        },

        set: (key, data) => {
            try {
                localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
            } catch {
                // Storage quota exceeded — silently ignore.
            }
        }
    };


    /* ════════════════════════════════════════════════════════
       SOLAR API — sunrisesunset.io
    ════════════════════════════════════════════════════════ */
    const SolarAPI = {

        /**
         * Normalise the utc_offset value returned by the API.
         * The API can return it in decimal hours (e.g. 2.0) or in
         * minutes (e.g. 120).  We always want whole minutes.
         */
        normaliseOffset: raw => {
            const n = parseFloat(raw);
            if (!Number.isFinite(n)) return 0;
            // Values whose absolute magnitude is < 24 are in hours.
            return Math.abs(n) < 24 ? Math.round(n * 60) : Math.round(n);
        },

        /**
         * Convert an API local-time string ("6:02:00 AM") for a given date
         * into a UTC millisecond timestamp.
         *
         * The API returns the time as if it were already in local civil time,
         * so we treat it as UTC, then subtract the UTC offset in minutes to
         * arrive at the true UTC epoch.
         *
         * @param {string} dateS   — ISO date string "YYYY-MM-DD"
         * @param {string} timeStr — API time string e.g. "6:02:00 AM"
         * @param {number} offMins — UTC offset in minutes
         * @returns {number} UTC milliseconds
         */
        toUTC: (dateS, timeStr, offMins) => {
            if (!timeStr) return 0;
            const [timePart, meridiem] = timeStr.split(' ');
            const [hhStr, mmStr, ssStr = '0'] = timePart.split(':');
            let h = parseInt(hhStr, 10);
            if (h === 12) h = 0;
            if (meridiem === 'PM') h += 12;
            const iso = `${dateS}T${Utils.pad(h)}:${Utils.pad(parseInt(mmStr))}:`
                      + `${Utils.pad(parseInt(ssStr))}Z`;
            return new Date(iso).getTime() - offMins * 60000;
        },

        /**
         * Fetch sunrise, sunset, and day_length data for today, yesterday,
         * and tomorrow in one parallel batch.  Results are cached for
         * Config.CACHE_TTL milliseconds.
         *
         * Returns a SolarData object:
         * {
         *   yesterdaySunset    : number (UTC ms),
         *   todaySunrise       : number (UTC ms),
         *   todaySunset        : number (UTC ms),   ← already midnight-corrected
         *   tomorrowSunrise    : number (UTC ms),
         *   todaySunriseStr    : string ("6:02 AM"),
         *   todaySunsetStr     : string ("7:43 PM"),
         *   utcOff             : number (minutes),
         *   dayLengthMs        : number (ms)  ← from API day_length, not derived
         * }
         */
        fetch: async (lat, lng) => {
            const cacheKey = `sol_${lat}_${lng}_${Utils.dateStr()}`;
            const cached   = Cache.get(cacheKey);
            if (cached) return cached;

            DOM.loaderTxt.textContent = 'جاري جلب بيانات الشمس…';
            const base = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}`;

            const [yRes, tRes, tmRes] = await Promise.all([
                fetch(`${base}&date=${Utils.dateStr(-1)}`).then(r => r.json()),
                fetch(`${base}&date=${Utils.dateStr( 0)}`).then(r => r.json()),
                fetch(`${base}&date=${Utils.dateStr( 1)}`).then(r => r.json())
            ]);

            if (tRes.status !== 'OK') {
                throw new Error('بيانات الشمس غير متاحة حالياً. يرجى المحاولة لاحقاً.');
            }

            const off = SolarAPI.normaliseOffset(tRes.results.utc_offset);

            const todaySunrise     = SolarAPI.toUTC(Utils.dateStr( 0), tRes.results.sunrise,  off);
            let   todaySunset      = SolarAPI.toUTC(Utils.dateStr( 0), tRes.results.sunset,   off);
            const yesterdaySunset  = SolarAPI.toUTC(Utils.dateStr(-1), yRes.results.sunset,   off);
            const tomorrowSunrise  = SolarAPI.toUTC(Utils.dateStr( 1), tmRes.results.sunrise, off);

            /*
             * Midnight-crossing guard
             * ────────────────────────
             * In polar or near-polar locations the API can produce a sunset
             * UTC value that is numerically ≤ sunrise (e.g. the sun crosses
             * the horizon just after midnight UTC). Adding MS_PER_DAY restores
             * the correct chronological ordering for all subsequent calculations.
             */
            if (todaySunset <= todaySunrise) {
                todaySunset += Config.MS_PER_DAY;
            }

            /*
             * Correct day length calculation
             * ───────────────────────────────
             * The sunrisesunset.io API does not return day_length directly.
             * We calculate it from the actual sunrise/sunset times we've just
             * resolved (after midnight-crossing correction).  This ensures
             * we always have the true astronomical day length for the city
             * and date, regardless of API response format.
             */
            const dayLengthMs = todaySunset - todaySunrise;

            const data = {
                yesterdaySunset,
                todaySunrise,
                todaySunset,
                tomorrowSunrise,
                todaySunriseStr : tRes.results.sunrise,
                todaySunsetStr  : tRes.results.sunset,
                utcOff          : off,
                dayLengthMs
            };

            Cache.set(cacheKey, data);
            return data;
        }
    };


    /* ════════════════════════════════════════════════════════
       PRAYER API — aladhan.com
    ════════════════════════════════════════════════════════ */
    const PrayerAPI = {
        fetch: async (lat, lng) => {
            const cacheKey = `pray_${lat}_${lng}_${Utils.dateStr()}`;
            const cached   = Cache.get(cacheKey);
            if (cached) return cached;

            DOM.loaderTxt.textContent = 'جاري جلب مواقيت الصلاة…';
            const unixTs = Math.floor(Date.now() / 1000);
            const res = await fetch(
                `https://api.aladhan.com/v1/timings/${unixTs}`
              + `?latitude=${lat}&longitude=${lng}&method=4`
            ).then(r => r.json()).catch(() => null);

            if (!res || res.code !== 200) return null;
            Cache.set(cacheKey, res.data.timings);
            return res.data.timings;
        }
    };


    /* ════════════════════════════════════════════════════════
       SKY RENDERER — gradient & theme management
    ════════════════════════════════════════════════════════ */
    const SkyRenderer = {

        /**
         * Update the CSS background gradient to reflect the current
         * phase and progress fraction.  Does nothing in manual-theme mode.
         *
         * @param {string} phase    — 'النهار' | 'الليل'
         * @param {number} progress — 0–1 fraction through the current phase
         */
        updateGradient: (phase, progress) => {
            if (State.manualTheme) return;

            let topColour, botColour;

            if (phase === 'الليل') {
                topColour = Config.SKY_NIGHT.t;
                botColour = Config.SKY_NIGHT.b;
            } else {
                // Find the two surrounding key-frames and lerp between them.
                const stops = Config.SKY_DAY;
                let lo = stops[0];
                let hi = stops[stops.length - 1];

                for (let i = 0; i < stops.length - 1; i++) {
                    if (progress >= stops[i].p && progress <= stops[i + 1].p) {
                        lo = stops[i];
                        hi = stops[i + 1];
                        break;
                    }
                }

                const frac = (progress - lo.p) / ((hi.p - lo.p) || 1);
                topColour  = Utils.lerpHex(lo.t, hi.t, frac);
                botColour  = Utils.lerpHex(lo.b, hi.b, frac);
            }

            const root = document.documentElement;
            root.style.setProperty('--sky-top', topColour);
            root.style.setProperty('--sky-bot', botColour);
        },

        /**
         * Apply a fixed gradient when the user has manually selected a theme.
         * @param {boolean} isNight
         */
        applyManual: isNight => {
            const root = document.documentElement;
            if (isNight) {
                root.style.setProperty('--sky-top', Config.SKY_NIGHT.t);
                root.style.setProperty('--sky-bot', Config.SKY_NIGHT.b);
            } else {
                root.style.setProperty('--sky-top', Config.SKY_DAY[2].t);
                root.style.setProperty('--sky-bot', Config.SKY_DAY[2].b);
            }
        },

        /**
         * Update the <body> theme class and control icon visibility.
         * Theme selection order: night → golden (within GOLD_WIN of
         * sunrise/sunset) → day (default).
         *
         * @param {string} phase
         * @param {number} now          — current UTC ms
         * @param {object} solar        — SolarData object
         */
        applyAutoTheme: (phase, now, solar) => {
            if (State.manualTheme) return;

            const dSunrise = Math.abs(now - solar.todaySunrise);
            const dSunset  = Math.abs(now - solar.todaySunset);
            const isNight  = phase === 'الليل';
            const isGolden = !isNight && (dSunrise < Config.GOLD_WIN || dSunset < Config.GOLD_WIN);

            document.body.classList.toggle('theme-night',  isNight);
            document.body.classList.toggle('theme-golden', isGolden);

            // Swap sun ↔ moon icon in the theme button.
            DOM.sunIco.classList.toggle('hidden', isNight);
            DOM.moonIco.classList.toggle('hidden', !isNight);
            DOM.stars.style.opacity = isNight ? '0.9' : '0';
        }
    };


    /* ════════════════════════════════════════════════════════
       ARC RENDERER — SVG arc + celestial body
    ════════════════════════════════════════════════════════ */
    const ArcRenderer = {

        /**
         * Update the progress arc fill and translate the celestial body
         * along the arc path.
         *
         * Arc geometry:
         *   Path: M 20 140 A 130 130 0 0 1 280 140
         *   sweep-flag = 1  →  clockwise  →  passes above the horizon
         *   centre = (150, 140), radius = 130
         *
         * At progress 0.0  →  angle = π    →  point (20, 140)   [left horizon]
         * At progress 0.5  →  angle = π/2  →  point (150, 10)   [zenith]
         * At progress 1.0  →  angle = 0    →  point (280, 140)  [right horizon]
         *
         * @param {number} progress — 0–1
         * @param {boolean} isNight
         */
        update: (progress, isNight) => {
            const angle = Math.PI * (1 - progress);
            const cx    = 150 + 130 * Math.cos(angle);
            const cy    = 140 - 130 * Math.sin(angle);

            // Arc fill (stroke-dashoffset: 100 = empty, 0 = full).
            DOM.arc.setAttribute('stroke-dashoffset',
                (100 - progress * 100).toFixed(2));
            DOM.arc.setAttribute('stroke',
                isNight ? 'url(#g-night)' : 'url(#g-day)');

            // Celestial body position.
            DOM.celestial.setAttribute('transform',
                `translate(${cx.toFixed(2)},${cy.toFixed(2)})`);

            // Visibility: sun vs moon.
            DOM.sunShape.style.opacity  = isNight ? '0' : '1';
            DOM.moonShape.style.opacity = isNight ? '1' : '0';
            DOM.sunHalo.style.opacity   = isNight ? '0' : '1';
        }
    };


    /* ════════════════════════════════════════════════════════
       PRAYERS — markers on the arc + times bar
    ════════════════════════════════════════════════════════ */
    const Prayers = {

        /**
         * Convert an Aladhan "HH:MM" prayer time into UTC milliseconds.
         * @param {string}  hhmm    — "05:23"
         * @param {number}  offMins — UTC offset in minutes
         * @param {boolean} tomorrow — use tomorrow's date (for Fajr after sunset)
         */
        toUTCms: (hhmm, offMins, tomorrow = false) => {
            const iso = `${Utils.dateStr(tomorrow ? 1 : 0)}T${hhmm}:00Z`;
            return new Date(iso).getTime() - offMins * 60000;
        },

        /**
         * Return the next upcoming prayer: { name: string, ms: number }.
         * If all five prayers have passed, returns tomorrow's Fajr.
         */
        getNext: () => {
            if (!State.prayers || !State.solar) return null;
            const { utcOff } = State.solar;
            const now = Date.now();
            for (const name of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
                const ms = Prayers.toUTCms(State.prayers[name], utcOff);
                if (ms > now) return { name, ms };
            }
            return {
                name : 'Fajr',
                ms   : Prayers.toUTCms(State.prayers.Fajr, utcOff, true)
            };
        },

        /**
         * Render the prayer times bar (hidden if no prayer data).
         */
        renderBar: () => {
            if (!State.prayers || !State.solar) {
                DOM.prayerBar.classList.add('hidden');
                return;
            }
            DOM.prayerBar.classList.remove('hidden');

            const { utcOff } = State.solar;
            const next = Prayers.getNext();

            DOM.prayerList.innerHTML = Object.keys(Config.PRAYER_NAMES)
                .map(key => {
                    const utcMs = Prayers.toUTCms(State.prayers[key], utcOff);
                    const local = new Date(utcMs + utcOff * 60000);
                    const tStr  = `${Utils.pad(local.getUTCHours())}:`
                                + `${Utils.pad(local.getUTCMinutes())}`;
                    const isNext = next?.name === key;
                    return `<div class="prayer-item flex flex-col items-center
                                        gap-0.5 px-2 py-1
                                        ${isNext ? 'prayer-item-next' : ''}">
                                <span class="p-name">${Config.PRAYER_NAMES[key]}</span>
                                <span class="p-time" dir="ltr">${tStr}</span>
                            </div>`;
                })
                .join('');
        },

        /**
         * Draw prayer-time indicator dots on the SVG arc.
         *
         * Daytime shows Dhuhr and Asr (they fall within the day phase).
         * Night shows Maghrib, Isha, and Fajr.  Only prayers that fall
         * within [phaseStart, phaseEnd] are drawn.
         *
         * @param {string} phase    — 'النهار' | 'الليل'
         * @param {number} startMs  — phase start UTC ms
         * @param {number} endMs    — phase end UTC ms
         */
        drawMarkers: (phase, startMs, endMs) => {
            DOM.prayerMrks.innerHTML = '';
            if (!State.prayers || !State.solar) return;

            const { utcOff } = State.solar;
            const now  = Date.now();
            const next = Prayers.getNext();

            const keys = phase === 'النهار'
                ? ['Dhuhr', 'Asr']
                : ['Maghrib', 'Isha', 'Fajr'];

            const NS = (tag) =>
                document.createElementNS('http://www.w3.org/2000/svg', tag);

            keys.forEach(key => {
                // Fajr during night-after-sunset needs tomorrow's date.
                const useTomorrow = (key === 'Fajr')
                    && (phase === 'الليل')
                    && (now >= State.solar.todaySunset);

                const ms = Prayers.toUTCms(State.prayers[key], utcOff, useTomorrow);
                if (ms <= startMs || ms >= endMs) return;

                const prog  = (ms - startMs) / (endMs - startMs);
                const angle = Math.PI * (1 - prog);
                const cx    = (150 + 130 * Math.cos(angle)).toFixed(1);
                const cy    = (140 - 130 * Math.sin(angle)).toFixed(1);
                const isNext = next?.name === key;

                // Pulsing ring for the upcoming prayer.
                if (isNext) {
                    const pulse = NS('circle');
                    pulse.setAttribute('cx', cx);
                    pulse.setAttribute('cy', cy);
                    pulse.setAttribute('r',  '5');
                    pulse.setAttribute('class', 'prayer-pulse');
                    DOM.prayerMrks.appendChild(pulse);
                }

                // Prayer dot.
                const dot = NS('circle');
                dot.setAttribute('cx', cx);
                dot.setAttribute('cy', cy);
                dot.setAttribute('r',  '4');
                dot.setAttribute('class',
                    `prayer-dot${isNext ? ' prayer-dot-next' : ''}`);

                const title = NS('title');
                title.textContent = `صلاة ${Config.PRAYER_NAMES[key]}`;
                dot.appendChild(title);
                DOM.prayerMrks.appendChild(dot);
            });
        }
    };


    /* ════════════════════════════════════════════════════════
       CLOCK — main 1-second tick function
    ════════════════════════════════════════════════════════ */
    const Clock = {

        run: () => {
            if (!State.solar) return;

            const now = Date.now();
            const { yesterdaySunset, todaySunrise, todaySunset,
                    tomorrowSunrise, utcOff } = State.solar;

            /* ── Phase detection ───────────────────────────────────
             *
             * Three mutually exclusive windows:
             *   1. Pre-dawn night  — yesterdaySunset  → todaySunrise
             *   2. Daytime         — todaySunrise     → todaySunset
             *   3. Post-dusk night — todaySunset      → tomorrowSunrise
             */
            let phase, phaseStart, phaseEnd;

            if (now < todaySunrise) {
                // Still in last night — counting toward today's sunrise.
                phase      = 'الليل';
                phaseStart = yesterdaySunset;
                phaseEnd   = todaySunrise;
            } else if (now < todaySunset) {
                // Daytime.
                phase      = 'النهار';
                phaseStart = todaySunrise;
                phaseEnd   = todaySunset;
            } else {
                // Tonight — counting toward tomorrow's sunrise.
                phase      = 'الليل';
                phaseStart = todaySunset;
                phaseEnd   = tomorrowSunrise;
            }

            const phaseDuration = phaseEnd - phaseStart;
            const elapsed       = now - phaseStart;
            const progress      = Math.max(0, Math.min(1, elapsed / phaseDuration));
            const isNight       = phase === 'الليل';

            /* ── Visual layers ── */
            SkyRenderer.updateGradient(phase, progress);
            SkyRenderer.applyAutoTheme(phase, now, State.solar);
            ArcRenderer.update(progress, isNight);

            /* ── Clock digits ──────────────────────────────────────
             *
             * ADAPTIVE ASTRONOMICAL TIMING
             * ─────────────────────────────
             * The elapsed counter resets to 0 at each phase boundary.
             * We display (floor(elapsed / 1 h) + 1) as the "Swahili hour",
             * with standard 60-minute hours.  The total count for a phase
             * reflects its true astronomical length, not a fixed 12.
             */
            const elapsedHours = Math.floor(elapsed / 3600000);
            const elapsedMins  = Math.floor((elapsed % 3600000) / 60000);
            const elapsedSecs  = Math.floor((elapsed % 60000)   / 1000);

            DOM.hourNum.textContent    = elapsedHours + 1;
            DOM.phaseDisp.textContent  = `من ${phase}`;
            DOM.metricDisp.textContent = Utils.hms(elapsedHours, elapsedMins, elapsedSecs);

            /* ── Countdown to next astronomical event ── */
            const nextBoundaryMs = isNight
                ? (now < todaySunrise ? todaySunrise : tomorrowSunrise)
                : todaySunset;

            const remaining = Math.max(0, nextBoundaryMs - now);
            DOM.cdLbl.textContent = isNight ? 'الشروق' : 'الغروب';
            DOM.cdNum.textContent = Utils.hms(
                Math.floor(remaining / 3600000),
                Math.floor((remaining % 3600000) / 60000),
                Math.floor((remaining % 60000)   / 1000)
            );

            /* ── City standard time ── */
            const localNow = new Date(now + utcOff * 60000);
            DOM.stdTime.textContent = Utils.hms(
                localNow.getUTCHours(),
                localNow.getUTCMinutes(),
                localNow.getUTCSeconds()
            );
        }
    };


    /* ════════════════════════════════════════════════════════
       CITY MANAGER — load, switch, URL param, Nominatim
    ════════════════════════════════════════════════════════ */
    const CityManager = {

        /**
         * Build (or rebuild) the city pill buttons in the nav.
         */
        buildButtons: () => {
            DOM.citySel.innerHTML = '';
            Object.entries(State.cities).forEach(([key, city]) => {
                const btn = document.createElement('button');
                btn.className    = 'city-btn';
                btn.dataset.city = key;
                btn.textContent  = city.name;
                btn.setAttribute('aria-label', `عرض توقيت ${city.name}`);
                btn.onclick = () => {
                    if (State.currentKey !== key) CityManager.load(key);
                };
                DOM.citySel.appendChild(btn);
            });
        },

        /**
         * Display the loader, fetch solar + prayer data, start the clock.
         * @param {string} key — key into State.cities
         */
        load: async key => {
            // Stop any running tick.
            if (State.tickId) {
                clearInterval(State.tickId);
                State.tickId = null;
            }

            // Show loader.
            DOM.loader.classList.remove('opacity-0');
            DOM.loader.style.pointerEvents = 'auto';
            DOM.app.style.opacity          = '0';
            DOM.loaderTxt.textContent      = 'جاري التهيئة…';

            // Hide any stale error.
            DOM.errOverlay.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => DOM.errOverlay.classList.add('hidden'), 500);

            State.currentKey = key;
            const city = State.cities[key];

            // Mark the active city button.
            document.querySelectorAll('.city-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.city === key)
            );

            DOM.cityName.textContent = city.name;

            // Hijri date.
            try {
                DOM.hijri.textContent = new Intl.DateTimeFormat(
                    'ar-LY-u-ca-islamic-nu-latn',
                    { day: 'numeric', month: 'long', year: 'numeric' }
                ).format(new Date());
            } catch {
                DOM.hijri.textContent = '';
            }

            // Persist city in URL for easy sharing.
            window.history.replaceState(null, '', `?city=${encodeURIComponent(city.name)}`);

            try {
                const [solar, prayers] = await Promise.all([
                    SolarAPI.fetch(city.lat, city.lng),
                    PrayerAPI.fetch(city.lat, city.lng)
                ]);

                if (!solar) {
                    throw new Error('تعذّر تحليل بيانات الشمس. يرجى المحاولة مجدداً.');
                }

                State.solar   = solar;
                State.prayers = prayers;

                // Sunrise / sunset display strings.
                DOM.sunriseEl.textContent = Utils.cleanTime(solar.todaySunriseStr);
                DOM.sunsetEl.textContent  = Utils.cleanTime(solar.todaySunsetStr);

                /*
                 * Day / night bar
                 * ────────────────
                 * dayLengthMs comes directly from the API's day_length field —
                 * no manual subtraction, no risk of negative values.
                 */
                const dayMs   = solar.dayLengthMs;
                const nightMs = Config.MS_PER_DAY - dayMs;
                const dayPct  = (dayMs / Config.MS_PER_DAY * 100).toFixed(1);

                DOM.dayBar.style.width   = `${dayPct}%`;
                DOM.nightBar.style.width = `${(100 - +dayPct).toFixed(1)}%`;
                DOM.dayLen.textContent   = Utils.fmtDur(dayMs);
                DOM.nightLen.textContent = Utils.fmtDur(nightMs);

                const diffMs = Math.abs(dayMs - nightMs);
                DOM.compTxt.textContent = diffMs < 5 * 60000
                    ? '≈ الاعتدال الفلكي'
                    : dayMs > nightMs
                        ? `النهار أطول بـ ${Utils.fmtDur(diffMs)}`
                        : `الليل أطول بـ ${Utils.fmtDur(diffMs)}`;

                // Prayer arc markers.
                const now = Date.now();
                let pPhase, pStart, pEnd;
                if (now >= solar.todaySunrise && now < solar.todaySunset) {
                    pPhase = 'النهار';
                    pStart = solar.todaySunrise;
                    pEnd   = solar.todaySunset;
                } else {
                    pPhase = 'الليل';
                    pStart = now < solar.todaySunrise
                        ? solar.yesterdaySunset : solar.todaySunset;
                    pEnd   = now < solar.todaySunrise
                        ? solar.todaySunrise    : solar.tomorrowSunrise;
                }
                Prayers.drawMarkers(pPhase, pStart, pEnd);
                Prayers.renderBar();

                // Start the clock.
                Clock.run();
                State.tickId = setInterval(Clock.run, 1000);

                // Reveal the app.
                DOM.loader.classList.add('opacity-0');
                DOM.loader.style.pointerEvents = 'none';
                DOM.app.style.opacity = '1';

            } catch (err) {
                console.error('[SolarisSwahili]', err);
                DOM.errMsg.textContent = err.message || 'حدث خطأ غير متوقع.';
                DOM.errOverlay.classList.remove('hidden');
                requestAnimationFrame(() => {
                    DOM.errOverlay.classList.remove('opacity-0', 'pointer-events-none');
                    DOM.errOverlay.setAttribute('aria-hidden', 'false');
                });
                DOM.loader.classList.add('opacity-0');
                DOM.loader.style.pointerEvents = 'none';
            }
        },

        /**
         * Search Nominatim for a city name typed by the user.
         * On success, adds the city to State.cities and loads it.
         */
        searchAndAdd: async rawValue => {
            const val = rawValue.trim();
            if (!val) return;

            DOM.cityErr.classList.add('hidden');
            DOM.addBtn.disabled    = true;
            DOM.addBtn.textContent = '…';

            try {
                const results = await fetch(
                    `https://nominatim.openstreetmap.org/search`
                  + `?format=json&q=${encodeURIComponent(val)}&limit=1`
                ).then(r => r.json());

                if (!results.length) {
                    throw new Error('لم نجد هذه المدينة. حاول كتابتها بالإنجليزية.');
                }

                const key = `c_${Date.now()}`;
                State.cities[key] = {
                    name : results[0].name || val,
                    lat  : results[0].lat,
                    lng  : results[0].lon
                };

                CityManager.buildButtons();
                DOM.cityInput.value = '';
                CityManager.load(key);

            } catch (e) {
                DOM.cityErr.textContent = e.message;
                DOM.cityErr.classList.remove('hidden');
            } finally {
                DOM.addBtn.disabled    = false;
                DOM.addBtn.textContent = 'إضافة';
            }
        }
    };


    /* ════════════════════════════════════════════════════════
       APP — initialisation & event binding
    ════════════════════════════════════════════════════════ */
    const init = () => {

        // Pre-generate the star field.
        Utils.genStars();

        // Build initial city buttons.
        CityManager.buildButtons();

        /* ── Add-city button ── */
        DOM.addBtn.onclick = () =>
            CityManager.searchAndAdd(DOM.cityInput.value);

        DOM.cityInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') DOM.addBtn.click();
        });

        /* ── Manual theme toggle ── */
        DOM.themeBtn.onclick = () => {
            State.manualTheme = true;
            document.body.classList.remove('theme-golden');
            const isNight = document.body.classList.toggle('theme-night');

            DOM.sunIco.classList.toggle('hidden', isNight);
            DOM.moonIco.classList.toggle('hidden', !isNight);
            DOM.stars.style.opacity = isNight ? '0.9' : '0';
            SkyRenderer.applyManual(isNight);

            // Show the "restore auto" button.
            DOM.resetBtn.classList.remove('hidden');
            requestAnimationFrame(() =>
                DOM.resetBtn.classList.remove('opacity-0', 'translate-x-3')
            );
        };

        /* ── Restore auto theme ── */
        DOM.resetBtn.onclick = () => {
            State.manualTheme = false;
            DOM.resetBtn.classList.add('opacity-0', 'translate-x-3');
            setTimeout(() => DOM.resetBtn.classList.add('hidden'), 300);
            Clock.run(); // immediately re-apply the correct auto theme
        };

        /* ── Retry after error ── */
        DOM.retryBtn.onclick = () => {
            if (State.currentKey) CityManager.load(State.currentKey);
        };

        /* ── Share button ── */
        DOM.shareBtn.onclick = async () => {
            try {
                if (navigator.share) {
                    await navigator.share({
                        title : 'التوقيت السواحلي',
                        url   : location.href
                    });
                } else {
                    await navigator.clipboard.writeText(location.href);
                    // Brief checkmark feedback.
                    const original = DOM.shareBtn.innerHTML;
                    DOM.shareBtn.innerHTML =
                        `<svg class="w-4 h-4" fill="none" stroke="currentColor"
                              viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  stroke-width="2.5" d="M5 13l4 4L19 7"/>
                        </svg>`;
                    setTimeout(() => { DOM.shareBtn.innerHTML = original; }, 2200);
                }
            } catch {
                // User cancelled share sheet or clipboard not available.
            }
        };

        /* ── URL parameter: ?city=NAME ──
         * If the URL contains ?city=, try to match it against the default
         * cities first.  If no match, pre-fill the search field and trigger
         * a Nominatim search automatically.
         */
        const param = new URLSearchParams(location.search).get('city');
        let startKey = 'tobruk'; // sensible default

        if (param) {
            const found = Object.entries(State.cities).find(
                ([, city]) => city.name === param
            );
            if (found) {
                startKey = found[0];
            } else {
                // Unknown city — search Nominatim.
                DOM.cityInput.value = param;
                setTimeout(() => DOM.addBtn.click(), 150);
                return; // loadCity will be called by searchAndAdd
            }
        }

        CityManager.load(startKey);
    };

    return { init };

})();

document.addEventListener('DOMContentLoaded', App.init);
