/**
 * SolarisSwahili v2.0
 * ساعة التوقيت السواحلي الديناميكية — التوقيت الفلكي التكيفي المباشر
 */

const App = (() => {

    /* ═══════════════════════════════════════════════════════
       1.  CONFIG & STATE
    ═══════════════════════════════════════════════════════ */
    const CFG = {
        CACHE_TTL : 6 * 3600 * 1000,       // 6 ساعات
        GOLD_WIN  : 45 * 60 * 1000,         // نافذة الغسق (45 دقيقة)
        CITIES: {
            tobruk:   { name: 'طبرق',   lat: '32.0773', lng: '23.9600' },
            benghazi: { name: 'بنغازي', lat: '32.1167', lng: '20.0667' },
            tripoli:  { name: 'طرابلس', lat: '32.8892', lng: '13.1900' }
        },
        PRAYER_AR: {
            Fajr: 'الفجر', Dhuhr: 'الظهر',
            Asr: 'العصر',  Maghrib: 'المغرب', Isha: 'العشاء'
        }
    };

    const S = {
        cities      : { ...CFG.CITIES },
        key         : null,
        solar       : null,
        prayers     : null,
        tickId      : null,
        manualTheme : false
    };


    /* ═══════════════════════════════════════════════════════
       2.  DOM REFS
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
        stdTime     : $('standard-time'),
    };


    /* ═══════════════════════════════════════════════════════
       3.  UTILITIES
    ═══════════════════════════════════════════════════════ */
    const pad = n => String(n).padStart(2, '0');
    const fmt = (h, m, s) => `${pad(h)}:${pad(m)}:${pad(s)}`;

    const fmtDur = ms => {
        const tot = Math.round(ms / 60000);
        const h = Math.floor(tot / 60), m = tot % 60;
        const hS = !h ? '' : h === 1 ? 'ساعة' : h === 2 ? 'ساعتين'
                           : h <= 10 ? `${h} ساعات` : `${h} ساعة`;
        const mS = !m ? '' : m === 1 ? 'دقيقة' : m === 2 ? 'دقيقتين'
                           : m <= 10 ? `${m} دقائق` : `${m} دقيقة`;
        if (!hS) return mS || 'أقل من دقيقة';
        return mS ? `${hS} و${mS}` : hS;
    };

    const cleanTime = t => {
        const p = t.split(':');
        return p.length >= 3 ? `${p[0]}:${p[1]} ${t.split(' ').pop()}` : t;
    };

    const dateStr = (off = 0) =>
        new Date(Date.now() + off * 86400000).toLocaleDateString('en-CA');

    const genStars = () => {
        D.stars.style.backgroundImage = Array.from({ length: 150 }, () => {
            const x = (Math.random() * 100).toFixed(1);
            const y = (Math.random() * 100).toFixed(1);
            const s = (Math.random() * 1.8 + 0.3).toFixed(1);
            const o = (Math.random() * 0.65 + 0.28).toFixed(2);
            return `radial-gradient(${s}px ${s}px at ${x}% ${y}%, rgba(255,255,255,${o}), transparent)`;
        }).join(',');
    };

    const lerpHex = (a, b, t) => {
        const p = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
        const [r1,g1,b1] = p(a), [r2,g2,b2] = p(b);
        return '#' + [
            Math.round(r1 + (r2-r1) * t),
            Math.round(g1 + (g2-g1) * t),
            Math.round(b1 + (b2-b1) * t)
        ].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2,'0')).join('');
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

        if (phase === 'الليل') {
            topC = SKY_NIGHT.t;
            botC = SKY_NIGHT.b;
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
    };

    const setSkyManual = isNight => {
        const root = document.documentElement;
        if (isNight) {
            root.style.setProperty('--sky-top', SKY_NIGHT.t);
            root.style.setProperty('--sky-bot', SKY_NIGHT.b);
        } else {
            root.style.setProperty('--sky-top', SKY_DAY[2].t);
            root.style.setProperty('--sky-bot', SKY_DAY[2].b);
        }
    };


    /* ═══════════════════════════════════════════════════════
       4.  CACHE 
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
            try {
                localStorage.setItem(k, JSON.stringify({ ts: Date.now(), data }));
            } catch { }
        }
    };


    /* ═══════════════════════════════════════════════════════
       5.  API MODULE
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

            D.loaderTxt.textContent = 'جاري جلب بيانات الشمس...';
            const base = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}`;

            const [yR, tR, tmR] = await Promise.all([
                fetch(`${base}&date=${dateStr(-1)}`).then(r => r.json()),
                fetch(`${base}&date=${dateStr( 0)}`).then(r => r.json()),
                fetch(`${base}&date=${dateStr( 1)}`).then(r => r.json()),
            ]);

            if (tR.status !== 'OK')
                throw new Error('بيانات الشمس غير متاحة حالياً. يرجى المحاولة لاحقاً.');

            const off = API.normOff(tR.results.utc_offset);

            // استخراج طول النهار المعتمد رسمياً من الـ API
            const parseLen = str => {
                if (!str) return 0;
                const p = str.split(':').map(Number);
                return (p[0] || 0) * 3600000 + (p[1] || 0) * 60000 + (p[2] || 0) * 1000;
            };
            const dayLenMs = parseLen(tR.results.day_length);
            const nightLenMs = (24 * 3600000) - dayLenMs;

            let ySunset   = API.toUTC(dateStr(-1), yR.results.sunset,   off);
            let ySunrise  = API.toUTC(dateStr(-1), yR.results.sunrise,  off);
            let tSunrise  = API.toUTC(dateStr( 0), tR.results.sunrise,  off);
            let tSunset   = API.toUTC(dateStr( 0), tR.results.sunset,   off);
            let tmSunrise = API.toUTC(dateStr( 1), tmR.results.sunrise, off);

            /* ── تأمين عبور منتصف الليل للمناطق القطبية والمستثناة ── */
            if (ySunset <= ySunrise) ySunset += 86400000;
            if (tSunset <= tSunrise) tSunset += 86400000;
            
            if (tSunrise < ySunset)  tSunrise  += 86400000;
            if (tmSunrise < tSunset) tmSunrise += 86400000;

            const data = {
                yesterdaySunset : ySunset,
                todaySunrise    : tSunrise,
                todaySunset     : tSunset,
                tomorrowSunrise : tmSunrise,
                todaySunriseStr : tR.results.sunrise,
                todaySunsetStr  : tR.results.sunset,
                dayLengthMs     : dayLenMs,
                nightLengthMs   : nightLenMs,
                utcOff          : off
            };
            Cache.set(k, data);
            return data;
        },

        fetchPrayers: async (lat, lng) => {
            const k = `pray_${lat}_${lng}_${dateStr()}`;
            const cached = Cache.get(k);
            if (cached) return cached;

            D.loaderTxt.textContent = 'جاري جلب مواقيت الصلاة...';
            const ts = Math.floor(Date.now() / 1000);
            const res = await fetch(
                `https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lng}&method=4`
            ).then(r => r.json()).catch(() => null);

            if (!res || res.code !== 200) return null;   
            Cache.set(k, res.data.timings);
            return res.data.timings;
        }
    };


    /* ═══════════════════════════════════════════════════════
       6.  PRAYER HELPERS
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
            for (const n of ['Fajr','Dhuhr','Asr','Maghrib','Isha']) {
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

            D.prayerList.innerHTML = Object.keys(CFG.PRAYER_AR).map(k => {
                const local = new Date(Prayers.toMS(S.prayers[k], utcOff) + utcOff * 60000);
                const tStr  = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
                const isNxt = next && next.name === k;
                return `<div class="prayer-item flex flex-col items-center gap-0.5 px-2 py-1
                                    ${isNxt ? 'prayer-item-next' : ''}">
                            <span class="p-name">${CFG.PRAYER_AR[k]}</span>
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
            const keys = phase === 'النهار' ? ['Dhuhr','Asr'] : ['Maghrib','Isha','Fajr'];

            const NS = document.createElementNS.bind(document, 'http://www.w3.org/2000/svg');

            keys.forEach(k => {
                const isTmrwFajr = k === 'Fajr' && phase === 'الليل' && now >= S.solar.todaySunset;
                const ms = Prayers.toMS(S.prayers[k], utcOff, isTmrwFajr);

                if (ms <= startMs || ms >= endMs) return;   

                const prog  = (ms - startMs) / (endMs - startMs);
                const angle = Math.PI * (1 - prog);
                const cx    = (150 + 130 * Math.cos(angle)).toFixed(1);
                const cy    = (140 - 130 * Math.sin(angle)).toFixed(1); 

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
                title.textContent = `صلاة ${CFG.PRAYER_AR[k]}`;
                dot.appendChild(title);
                D.prayerMrks.appendChild(dot);
            });
        }
    };


    /* ═══════════════════════════════════════════════════════
       7.  CLOCK ENGINE  
    ═══════════════════════════════════════════════════════ */
    const Clock = {
        run: () => {
            if (!S.solar) return;

            const now = Date.now();
            const { yesterdaySunset, todaySunrise, todaySunset,
                    tomorrowSunrise, utcOff } = S.solar;

            /* ── تحديد الطور ── */
            let phase, startMs, endMs;
            if (now < todaySunrise) {
                phase = 'الليل'; startMs = yesterdaySunset; endMs = todaySunrise;
            } else if (now < todaySunset) {
                phase = 'النهار'; startMs = todaySunrise;   endMs = todaySunset;
            } else {
                phase = 'الليل'; startMs = todaySunset;     endMs = tomorrowSunrise;
            }

            const dur  = endMs - startMs;
            const prog = Math.max(0, Math.min(1, (now - startMs) / dur));

            /* ── تحديث لون السماء ── */
            updateSky(phase, prog);

            /* ── الثيمات التلقائية ── */
            if (!S.manualTheme) {
                const dsr = Math.abs(now - todaySunrise);
                const dss = Math.abs(now - todaySunset);
                let theme = 'day';
                if (phase === 'الليل')                                      theme = 'night';
                else if (dsr < CFG.GOLD_WIN || dss < CFG.GOLD_WIN)         theme = 'golden';

                document.body.classList.remove('theme-night', 'theme-golden');
                if (theme === 'night')  document.body.classList.add('theme-night');
                if (theme === 'golden') document.body.classList.add('theme-golden');

                const isNight = theme === 'night';
                D.sunIco.classList.toggle('hidden', isNight);
                D.moonIco.classList.toggle('hidden', !isNight);
                D.stars.style.opacity = isNight ? '0.9' : '0';
            }

            /* ── الجسم السماوي (شمس / قمر) ── */
            const isNight = phase === 'الليل';
            D.sunShape.style.opacity  = isNight ? '0' : '1';
            D.moonShape.style.opacity = isNight ? '1' : '0';
            D.sunHalo.style.opacity   = isNight ? '0' : '1';

            /* ── لون تدرج القوس ── */
            D.arc.setAttribute('stroke', isNight ? 'url(#g-night)' : 'url(#g-day)');

            /* ══ الحساب التكيفي المباشر للساعة (Standard Hours) ══
             *
             *  المبدأ: الساعة مدتها 60 دقيقة قياسية فعلية، والعد يبدأ وتتصفر قيمته من لحظة الشروق والغروب.
             *  عدد الساعات غير مقيد بـ 12، بل يعكس الطول الفعلي للنهار أو الليل.
             */
            const elapsed = now - startMs; 

            const pH = Math.floor(elapsed / 3600000);
            const pM = Math.floor((elapsed % 3600000) / 60000);
            const pS = Math.floor((elapsed % 60000)   / 1000);

            // يبدأ التعداد من الساعة 1
            D.hourNum.textContent   = pH + 1; 
            D.phaseDisp.textContent = `من ${phase}`;
            D.metricDisp.textContent = fmt(pH, pM, pS);

            /* ── العداد التنازلي ── */
            const nextMs = phase === 'النهار' ? todaySunset
                         : now < todaySunrise  ? todaySunrise
                         :                      tomorrowSunrise;
            const diff = Math.max(0, nextMs - now);
            D.cdLbl.textContent = phase === 'النهار' ? 'الغروب' : 'الشروق';
            D.cdNum.textContent = fmt(
                Math.floor(diff / 3600000),
                Math.floor((diff % 3600000) / 60000),
                Math.floor((diff % 60000)   / 1000)
            );

            /* ── التوقيت القياسي للمدينة ── */
            const local = new Date(now + utcOff * 60000);
            D.stdTime.textContent = fmt(
                local.getUTCHours(),
                local.getUTCMinutes(),
                local.getUTCSeconds()
            );

            /* ══ تحريك الجسم السماوي ══ */
            const angle = Math.PI * (1 - prog);
            const cx    = 150 + 130 * Math.cos(angle);
            const cy    = 140 - 130 * Math.sin(angle);  

            D.arc.setAttribute('stroke-dashoffset', (100 - prog * 100).toFixed(2));
            D.celestial.setAttribute('transform', `translate(${cx.toFixed(2)},${cy.toFixed(2)})`);
        }
    };


    /* ═══════════════════════════════════════════════════════
       8.  CITY LOADER
    ═══════════════════════════════════════════════════════ */
    const loadCity = async key => {
        if (S.tickId) clearInterval(S.tickId);

        /* ── إظهار الـ Loader ── */
        D.loader.classList.remove('opacity-0');
        D.loader.style.pointerEvents = 'auto';
        D.app.style.opacity = '0';
        D.loaderTxt.textContent = 'جاري تهيئة النظام...';

        /* ── إخفاء الخطأ السابق ── */
        D.errOverlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => D.errOverlay.classList.add('hidden'), 500);

        S.key = key;
        const city = S.cities[key];

        document.querySelectorAll('.city-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.city === key)
        );

        D.cityName.textContent = city.name;

        /* ── التاريخ الهجري ── */
        try {
            D.hijri.textContent = new Intl.DateTimeFormat(
                'ar-LY-u-ca-islamic-nu-latn',
                { day: 'numeric', month: 'long', year: 'numeric' }
            ).format(new Date());
        } catch { D.hijri.textContent = ''; }

        try {
            const [solar, prayers] = await Promise.all([
                API.fetchSolar(city.lat, city.lng),
                API.fetchPrayers(city.lat, city.lng)
            ]);

            if (!solar)
                throw new Error('تعذر تحليل بيانات الشمس. يرجى المحاولة مجدداً.');

            S.solar   = solar;
            S.prayers = prayers;

            /* ── الشروق والغروب ── */
            D.sunriseEl.textContent = cleanTime(solar.todaySunriseStr);
            D.sunsetEl.textContent  = cleanTime(solar.todaySunsetStr);

            /* ── شريط النهار والليل (بناءً على طول النهار الرسمي من الـ API) ── */
            const dayL   = solar.dayLengthMs;
            const nightL = solar.nightLengthMs;
            const dayPct = (dayL / (24 * 3600000) * 100).toFixed(1);
            const diff   = Math.abs(dayL - nightL);

            D.dayBar.style.width   = `${dayPct}%`;
            D.nightBar.style.width = `${(100 - +dayPct).toFixed(1)}%`;
            D.dayLen.textContent   = fmtDur(dayL);
            D.nightLen.textContent = fmtDur(nightL);

            D.compTxt.textContent = diff < 5 * 60000
                ? '≈ الاعتدال الفلكي'
                : dayL > nightL
                    ? `النهار أطول بـ ${fmtDur(diff)}`
                    : `الليل أطول بـ ${fmtDur(diff)}`;

            /* ── مؤشرات الصلاة ── */
            const now = Date.now();
            let pPhase, pStart, pEnd;
            if (now >= solar.todaySunrise && now < solar.todaySunset) {
                pPhase = 'النهار'; pStart = solar.todaySunrise; pEnd = solar.todaySunset;
            } else {
                pPhase = 'الليل';
                pStart = now < solar.todaySunrise ? solar.yesterdaySunset : solar.todaySunset;
                pEnd   = now < solar.todaySunrise ? solar.todaySunrise   : solar.tomorrowSunrise;
            }
            Prayers.drawMarkers(pPhase, pStart, pEnd);
            Prayers.renderBar();

            /* ── تشغيل الساعة ── */
            Clock.run();
            S.tickId = setInterval(Clock.run, 1000);

            /* ── إخفاء Loader وإظهار التطبيق ── */
            D.loader.classList.add('opacity-0');
            D.loader.style.pointerEvents = 'none';
            D.app.style.opacity = '1';

        } catch (err) {
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
    };


    /* ═══════════════════════════════════════════════════════
       9.  CITY BUTTONS BUILDER
    ═══════════════════════════════════════════════════════ */
    const buildBtns = () => {
        D.citySel.innerHTML = '';
        Object.keys(S.cities).forEach(k => {
            const btn = document.createElement('button');
            btn.className   = 'city-btn';
            btn.dataset.city = k;
            btn.textContent = S.cities[k].name;
            btn.setAttribute('aria-label', `عرض توقيت ${S.cities[k].name}`);
            btn.onclick = () => { if (S.key !== k) loadCity(k); };
            D.citySel.appendChild(btn);
        });
    };


    /* ═══════════════════════════════════════════════════════
       10. INIT 
    ═══════════════════════════════════════════════════════ */
    const init = () => {
        genStars();
        buildBtns();

        D.addBtn.onclick = async () => {
            const val = D.cityInput.value.trim();
            if (!val) return;
            D.cityErr.classList.add('hidden');
            D.addBtn.disabled = true;
            D.addBtn.textContent = '...';

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=1`
                ).then(r => r.json());

                if (!res.length)
                    throw new Error('لم نجد هذه المدينة. حاول كتابتها بالإنجليزية.');

                const k = `c_${Date.now()}`;
                S.cities[k] = { name: res[0].name || val, lat: res[0].lat, lng: res[0].lon };
                buildBtns();
                D.cityInput.value = '';
                loadCity(k);
            } catch (e) {
                D.cityErr.textContent = e.message;
                D.cityErr.classList.remove('hidden');
            } finally {
                D.addBtn.disabled = false;
                D.addBtn.textContent = 'إضافة';
            }
        };

        D.cityInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') D.addBtn.click();
        });

        D.themeBtn.onclick = () => {
            S.manualTheme = true;
            document.body.classList.remove('theme-golden');
            const isNight = document.body.classList.toggle('theme-night');

            D.sunIco.classList.toggle('hidden', isNight);
            D.moonIco.classList.toggle('hidden', !isNight);
            D.stars.style.opacity = isNight ? '0.9' : '0';
            setSkyManual(isNight);  

            D.resetBtn.classList.remove('hidden');
            requestAnimationFrame(() =>
                D.resetBtn.classList.remove('opacity-0', 'translate-x-3')
            );
        };

        D.resetBtn.onclick = () => {
            S.manualTheme = false;
            D.resetBtn.classList.add('opacity-0', 'translate-x-3');
            setTimeout(() => D.resetBtn.classList.add('hidden'), 300);
            Clock.run(); 
        };

        D.retryBtn.onclick = () => loadCity(S.key);

        D.shareBtn.onclick = async () => {
            try {
                if (navigator.share) {
                    await navigator.share({ title: 'التوقيت السواحلي', url: location.href });
                } else {
                    await navigator.clipboard.writeText(location.href);
                    const orig = D.shareBtn.innerHTML;
                    D.shareBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
                    setTimeout(() => { D.shareBtn.innerHTML = orig; }, 2200);
                }
            } catch { }
        };

        // تحميل المدينة الافتراضية مباشرة بدون قراءة الرابط
        loadCity('tobruk');
    };

    return { init };

})();

document.addEventListener('DOMContentLoaded', App.init);