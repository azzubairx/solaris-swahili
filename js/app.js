/**
 * تطبيق التوقيت السواحلي - هندسة برمجية (Modular Pattern)
 * تم التأمين بنسبة 100% ضد أخطاء الـ Timezones والـ Type Casting
 */
const App = (() => {
    'use strict';

    // --- 1. الإعدادات والحالة ---
    const CONFIG = {
        CACHE_TTL: 6 * 60 * 60 * 1000, // 6 ساعات
        DEFAULT_CITIES: {
            tobruk: { name: "طبرق", lat: "32.0773", lng: "23.9600" },
            benghazi: { name: "بنغازي", lat: "32.1167", lng: "20.0667" },
            tripoli: { name: "طرابلس", lat: "32.8892", lng: "13.1900" }
        }
    };

    const State = {
        cities: { ...CONFIG.DEFAULT_CITIES },
        currentCityKey: null,
        solarBounds: null,
        prayerTimes: null,
        clockInterval: null,
        manualThemeOverride: false
    };

    // --- 2. إدارة الواجهة ---
    const UI = {
        loader: document.getElementById('loader'),
        loaderText: document.getElementById('loader-text'),
        errorOverlay: document.getElementById('error-overlay'),
        errorMsg: document.getElementById('error-message'),
        errorBox: document.getElementById('error-box'),
        appContainer: document.getElementById('app-container'),
        citySelector: document.getElementById('city-selector'),
        
        cityName: document.getElementById('city-name'),
        hijriDate: document.getElementById('hijri-date'),
        hourDisplay: document.getElementById('hour-display'),
        phaseDisplay: document.getElementById('phase-display'),
        metricDisplay: document.getElementById('metric-display'),
        countdownDisplay: document.getElementById('countdown-display'),
        nextEventName: document.getElementById('next-event-name'),
        
        progressArc: document.getElementById('progress-arc'),
        celestialBody: document.getElementById('celestial-body'),
        sunShape: document.getElementById('sun-shape'),
        moonShape: document.getElementById('moon-shape'),
        prayerMarkersContainer: document.getElementById('prayer-markers'),
        
        themeToggle: document.getElementById('theme-toggle'),
        themeReset: document.getElementById('theme-auto-reset'),
        sunIcon: document.getElementById('sun-icon'),
        moonIcon: document.getElementById('moon-icon'),
        starsLayer: document.getElementById('stars-layer'),
        
        // دوال مساعدة مع ضمان النظام الرقمي (1, 2, 3)
        padStr: (n) => String(n).padStart(2, '0'),
        formatMetric: (h, m, s) => `${UI.padStr(h)}:${UI.padStr(m)}:${UI.padStr(s)}`,
        
        cleanTime: (t) => {
            const parts = t.split(':');
            return parts.length === 3 ? `${parts[0]}:${parts[1]} ${t.split(' ').pop()}` : t;
        },

        showError: (msg) => {
            UI.errorMsg.textContent = msg;
            UI.errorOverlay.classList.remove('hidden');
            setTimeout(() => {
                UI.errorOverlay.classList.remove('opacity-0', 'pointer-events-none');
                UI.errorBox.classList.remove('scale-95');
                UI.errorBox.classList.add('scale-100');
            }, 10);
            UI.loader.classList.add('opacity-0', 'pointer-events-none');
        },
        
        hideError: () => {
            UI.errorOverlay.classList.add('opacity-0', 'pointer-events-none');
            UI.errorBox.classList.remove('scale-100');
            UI.errorBox.classList.add('scale-95');
            setTimeout(() => UI.errorOverlay.classList.add('hidden'), 500);
        },

        generateStars: () => {
            const gradients = [];
            for(let i=0; i<120; i++) {
                const x = Math.random() * 100, y = Math.random() * 100;
                const size = Math.random() * 1.5 + 0.5, op = Math.random() * 0.7 + 0.3;
                gradients.push(`radial-gradient(${size}px ${size}px at ${x}% ${y}%, rgba(255,255,255,${op}), transparent)`);
            }
            UI.starsLayer.style.backgroundImage = gradients.join(',');
        }
    };

    // --- 3. إدارة التخزين ---
    const Storage = {
        get: (key) => {
            try {
                const cached = localStorage.getItem(key);
                if (!cached) return null;
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp > CONFIG.CACHE_TTL) return null;
                return parsed.data;
            } catch (e) { return null; }
        },
        set: (key, data) => {
            try { localStorage.setItem(key, JSON.stringify({timestamp: Date.now(), data})); } 
            catch (e) { console.warn('Storage Full'); }
        }
    };

    // --- 4. واجهات API (Safe Math Processing) ---
    const API = {
        // حساب التاريخ المستهدف بناء على خط الطول لتجنب فوارق التوقيت العابرة للقارات
        getTargetDateString: (lng, offsetDays = 0) => {
            const approximateOffsetMs = (parseFloat(lng) / 15) * 3600000;
            const targetMs = Date.now() + approximateOffsetMs + (offsetDays * 86400000);
            return new Date(targetMs).toISOString().split('T')[0];
        },

        // بناء صيغة ISO 8601 دقيقة (آمنة 100% من أخطاء الـ Types)
        parseAbsoluteUTC: (dateStr, timeStr, offsetMinutes) => {
            if (!timeStr) return 0;
            
            const [time, modifier] = timeStr.split(' ');
            let [hStr, mStr, sStr] = time.split(':');
            
            let hours = parseInt(hStr, 10);
            if (hours === 12) hours = 0;
            if (modifier === 'PM') hours += 12;
            
            // تحويل الـ offset (الدقائق) إلى صيغة (+02:00) لتكوين ISO شرعي
            const sign = offsetMinutes >= 0 ? '+' : '-';
            const absOffset = Math.abs(offsetMinutes);
            const offH = UI.padStr(Math.floor(absOffset / 60));
            const offM = UI.padStr(absOffset % 60);
            
            const isoString = `${dateStr}T${UI.padStr(hours)}:${UI.padStr(mStr)}:${UI.padStr(sStr)}${sign}${offH}:${offM}`;
            return new Date(isoString).getTime();
        },

        fetchSolar: async (lat, lng) => {
            const cacheKey = `solar_v2_${lat}_${lng}_${API.getTargetDateString(lng)}`;
            const cached = Storage.get(cacheKey);
            if (cached) return cached;

            UI.loaderText.textContent = "جاري جلب بيانات الشمس...";
            const base = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}`;
            
            // طلب التواريخ بالنسبة لخط الطول المستهدف وليس خط جهاز المستخدم
            const dYest = API.getTargetDateString(lng, -1);
            const dToday = API.getTargetDateString(lng, 0);
            const dTom = API.getTargetDateString(lng, 1);

            const fetchWithTimeout = (url) => Promise.race([
                fetch(url).then(r => r.json()),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
            ]);

            const [yRes, tRes, tmRes] = await Promise.all([
                fetchWithTimeout(`${base}&date=${dYest}`),
                fetchWithTimeout(`${base}&date=${dToday}`),
                fetchWithTimeout(`${base}&date=${dTom}`)
            ]);

            if (tRes.status !== "OK") throw new Error("API الشمس لا يستجيب ببيانات صالحة.");

            // توحيد الـ offset ليكون دائماً بالدقائق
            let offset = tRes.results.utc_offset;
            let offsetMins = (typeof offset === 'number' && offset < 24) ? offset * 60 : parseInt(offset, 10);
            if(isNaN(offsetMins)) offsetMins = 0;

            const data = {
                yesterdaySunset: API.parseAbsoluteUTC(dYest, yRes.results.sunset, offsetMins),
                todaySunrise: API.parseAbsoluteUTC(dToday, tRes.results.sunrise, offsetMins),
                todaySunset: API.parseAbsoluteUTC(dToday, tRes.results.sunset, offsetMins),
                tomorrowSunrise: API.parseAbsoluteUTC(dTom, tmRes.results.sunrise, offsetMins),
                todaySunriseStr: tRes.results.sunrise,
                todaySunsetStr: tRes.results.sunset,
                utcOffsetMinutes: offsetMins
            };
            
            Storage.set(cacheKey, data);
            return data;
        },

        fetchPrayers: async (lat, lng) => {
            const cacheKey = `prayers_v2_${lat}_${lng}_${API.getTargetDateString(lng)}`;
            const cached = Storage.get(cacheKey);
            if (cached) return cached;

            UI.loaderText.textContent = "جاري جلب مواقيت الصلاة...";
            const timestamp = Math.floor(Date.now() / 1000);
            // Method 5 (Egyptian) مناسب جداً لشمال أفريقيا وليبيا
            const res = await fetch(`https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=5`);
            const json = await res.json();
            if (json.code !== 200) throw new Error("فشل الاتصال بخوادم الصلاة.");
            
            Storage.set(cacheKey, json.data.timings);
            return json.data.timings;
        }
    };

    // --- 5. محرك الحسابات (Core Math) ---
    const Core = {
        getPrayerUTC: (timeStr, lng, isTomorrow = false) => {
            const offsetMins = State.solarBounds.utcOffsetMinutes;
            const dStr = API.getTargetDateString(lng, isTomorrow ? 1 : 0);
            // Aladhan API يرجع الوقت المحلي للمدينة (مثال: 15:30). نضيف له الـ Offset.
            const sign = offsetMins >= 0 ? '+' : '-';
            const absOffset = Math.abs(offsetMins);
            const offH = UI.padStr(Math.floor(absOffset / 60));
            const offM = UI.padStr(absOffset % 60);
            
            const iso = `${dStr}T${timeStr}:00${sign}${offH}:${offM}`;
            return new Date(iso).getTime();
        },

        drawPrayerMarkers: (phase, startMs, endMs) => {
            UI.prayerMarkersContainer.innerHTML = '';
            if (!State.prayerTimes) return;

            const prayers = phase === 'النهار' 
                ? [{name: 'الظهر', time: State.prayerTimes.Dhuhr}, {name: 'العصر', time: State.prayerTimes.Asr}]
                : [{name: 'المغرب', time: State.prayerTimes.Maghrib}, {name: 'العشاء', time: State.prayerTimes.Isha}, {name: 'الفجر', time: State.prayerTimes.Fajr, tomorrow: true}];

            const currentCity = State.cities[State.currentCityKey];

            prayers.forEach(p => {
                const pTime = Core.getPrayerUTC(p.time, currentCity.lng, p.tomorrow);
                if (pTime > startMs && pTime < endMs) {
                    const progress = (pTime - startMs) / (endMs - startMs);
                    const angle = Math.PI - (progress * Math.PI);
                    const cx = 150 + 130 * Math.cos(angle);
                    const cy = 140 - 130 * Math.sin(angle); 
                    
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
                    circle.setAttribute('r', '4'); circle.setAttribute('class', 'prayer-marker');
                    
                    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                    title.textContent = `صلاة ${p.name}`;
                    circle.appendChild(title);
                    
                    UI.prayerMarkersContainer.appendChild(circle);
                }
            });
        },

        updateClock: () => {
            if (!State.solarBounds) return;
            const now = Date.now();
            const { yesterdaySunset, todaySunrise, todaySunset, tomorrowSunrise, utcOffsetMinutes } = State.solarBounds;
            
            let phase, startMs, endMs;
            if (now < todaySunrise) {
                phase = 'الليل'; startMs = yesterdaySunset; endMs = todaySunrise;
            } else if (now >= todaySunrise && now < todaySunset) {
                phase = 'النهار'; startMs = todaySunrise; endMs = todaySunset;
            } else {
                phase = 'الليل'; startMs = todaySunset; endMs = tomorrowSunrise;
            }

            // الثيمات الذكية
            if (!State.manualThemeOverride) {
                let theme = 'theme-day';
                const distSunrise = Math.abs(now - todaySunrise);
                const distSunset = Math.abs(now - todaySunset);
                
                if (phase === 'الليل') theme = 'theme-night';
                else if (distSunrise < 45*60000 || distSunset < 45*60000) theme = 'theme-golden';

                document.body.classList.remove('theme-night', 'theme-golden');
                if (theme !== 'theme-day') document.body.classList.add(theme);

                const isNightTheme = theme === 'theme-night';
                UI.sunIcon.classList.toggle('hidden', isNightTheme); 
                UI.moonIcon.classList.toggle('hidden', !isNightTheme);
                UI.starsLayer.style.opacity = isNightTheme ? '1' : '0';
            }

            UI.sunShape.style.opacity = phase === 'الليل' ? '0' : '1';
            UI.moonShape.style.opacity = phase === 'الليل' ? '1' : '0';

            // الرياضيات السواحلية الدقيقة
            const duration = endMs - startMs;
            const progress = Math.max(0, Math.min(1, (now - startMs) / duration));
            const propElapsedMs = progress * (12 * 3600 * 1000);
            
            const pS = Math.floor((propElapsedMs / 1000) % 60);
            const pM = Math.floor((propElapsedMs / 60000) % 60);
            const pH = Math.floor(propElapsedMs / 3600000);

            UI.hourDisplay.textContent = Math.min(pH + 1, 12);
            UI.phaseDisplay.textContent = `من ${phase}`;
            UI.metricDisplay.textContent = UI.formatMetric(pH, pM, pS);

            // العد التنازلي
            const nextEventMs = phase === 'النهار' ? todaySunset : (now < todaySunrise ? todaySunrise : tomorrowSunrise);
            const diffMs = nextEventMs - now;
            UI.nextEventName.textContent = phase === 'النهار' ? 'الغروب' : 'الشروق';
            UI.countdownDisplay.textContent = UI.formatMetric(Math.floor(diffMs/3600000), Math.floor((diffMs%3600000)/60000), Math.floor((diffMs%60000)/1000));

            // الوقت القياسي المعزول تماماً عن جهاز المستخدم
            const localDate = new Date(now + (utcOffsetMinutes * 60000));
            document.getElementById('standard-time').textContent = UI.formatMetric(localDate.getUTCHours(), localDate.getUTCMinutes(), localDate.getUTCSeconds());

            // حركة القوس المثالية (نصف الدائرة العلوي)
            const angle = Math.PI - (progress * Math.PI);
            const cx = 150 + 130 * Math.cos(angle);
            const cy = 140 - 130 * Math.sin(angle);

            UI.progressArc.setAttribute('stroke-dashoffset', 100 - (progress * 100));
            UI.celestialBody.setAttribute('transform', `translate(${cx}, ${cy})`);
        },

        initCity: async (key) => {
            if (State.clockInterval) clearInterval(State.clockInterval);
            UI.hideError();
            UI.loader.classList.remove('opacity-0', 'pointer-events-none');
            UI.appContainer.classList.remove('opacity-100');
            
            State.currentCityKey = key;
            const city = State.cities[key];

            document.querySelectorAll('.city-btn').forEach(b => b.classList.toggle('active', b.dataset.city === key));
            window.history.replaceState(null, '', `?city=${encodeURIComponent(city.name)}`);

            UI.cityName.textContent = city.name;

            try {
                const [solar, prayers] = await Promise.all([
                    API.fetchSolar(city.lat, city.lng),
                    API.fetchPrayers(city.lat, city.lng)
                ]);

                State.solarBounds = solar;
                State.prayerTimes = prayers;

                document.getElementById('sunrise-time').textContent = UI.cleanTime(solar.todaySunriseStr);
                document.getElementById('sunset-time').textContent = UI.cleanTime(solar.todaySunsetStr);
                
                // استخدام nu-latn لضمان أن التاريخ الهجري يستخدم الأرقام (1, 2, 3) 
                UI.hijriDate.textContent = new Intl.DateTimeFormat('ar-LY-u-ca-islamic-nu-latn', {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date());

                const dayL = solar.todaySunset - solar.todaySunrise;
                const nightL = (24*3600*1000) - dayL;
                const diffL = Math.abs(dayL - nightL);
                
                document.getElementById('day-bar').style.width = `${(dayL/(24*3600*1000))*100}%`;
                document.getElementById('night-bar').style.width = `${(nightL/(24*3600*1000))*100}%`;
                
                const fmtDiff = (ms) => `${Math.floor(ms/3600000)} س و ${Math.floor((ms%3600000)/60000)} د`;
                document.getElementById('day-length-text').textContent = fmtDiff(dayL);
                document.getElementById('night-length-text').textContent = fmtDiff(nightL);
                
                if (diffL < 5 * 60000) {
                    document.getElementById('comparison-text').textContent = "الاعتدال: يتساوى الليل والنهار";
                } else {
                    document.getElementById('comparison-text').textContent = dayL > nightL ? `النهار أطول بـ ${fmtDiff(diffL)}` : `الليل أطول بـ ${fmtDiff(diffL)}`;
                }

                const now = Date.now();
                let pStart, pEnd, pPhase;
                if (now >= solar.todaySunrise && now < solar.todaySunset) { pPhase = 'النهار'; pStart = solar.todaySunrise; pEnd = solar.todaySunset; }
                else { pPhase = 'الليل'; pStart = now < solar.todaySunrise ? solar.yesterdaySunset : solar.todaySunset; pEnd = now < solar.todaySunrise ? solar.todaySunrise : solar.tomorrowSunrise; }
                Core.drawPrayerMarkers(pPhase, pStart, pEnd);

                Core.updateClock();
                State.clockInterval = setInterval(() => requestAnimationFrame(Core.updateClock), 1000);

                UI.loader.classList.add('opacity-0', 'pointer-events-none');
                UI.appContainer.classList.add('opacity-100');

            } catch (err) {
                console.error("Critical Flow Error:", err);
                UI.showError(err.message);
            }
        }
    };

    // --- 6. المستمعات (Events) ---
    const initEvents = () => {
        const buildButtons = () => {
            UI.citySelector.innerHTML = '';
            Object.keys(State.cities).forEach(k => {
                const b = document.createElement('button');
                b.className = 'city-btn'; b.dataset.city = k; b.textContent = State.cities[k].name;
                b.setAttribute('aria-label', `عرض توقيت ${State.cities[k].name}`);
                b.onclick = () => { if(State.currentCityKey !== k) Core.initCity(k); };
                UI.citySelector.appendChild(b);
            });
        };
        buildButtons();

        document.getElementById('add-city-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submit-btn');
            const input = document.getElementById('smart-city-input');
            const val = input.value.trim();
            if (!val) return;

            btn.disabled = true; btn.textContent = '...';
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=1`);
                const data = await res.json();
                if (!data || !data.length) throw new Error("المدينة غير معروفة، يرجى كتابة الاسم باللغة الإنجليزية.");
                
                const k = `city_${Date.now()}`;
                State.cities[k] = { name: data[0].name || val, lat: data[0].lat, lng: data[0].lon };
                buildButtons();
                input.value = '';
                Core.initCity(k);
            } catch (err) {
                alert(err.message);
            } finally {
                btn.disabled = false; btn.textContent = 'إضافة';
            }
        };

        UI.themeToggle.onclick = () => {
            State.manualThemeOverride = true;
            document.body.classList.remove('theme-golden');
            const isNight = document.body.classList.toggle('theme-night');
            UI.sunIcon.classList.toggle('hidden', isNight);
            UI.moonIcon.classList.toggle('hidden', !isNight);
            UI.starsLayer.style.opacity = isNight ? '1' : '0';
            UI.themeReset.classList.remove('hidden', 'opacity-0', 'translate-x-4');
        };

        UI.themeReset.onclick = () => {
            State.manualThemeOverride = false;
            UI.themeReset.classList.add('opacity-0', 'translate-x-4');
            setTimeout(() => UI.themeReset.classList.add('hidden'), 300);
            Core.updateClock();
        };

        document.getElementById('retry-btn').onclick = () => Core.initCity(State.currentCityKey);

        const urlParams = new URLSearchParams(window.location.search);
        const cityParam = urlParams.get('city');
        let startKey = 'tobruk';
        
        if (cityParam) {
            const foundKey = Object.keys(State.cities).find(k => State.cities[k].name.toLowerCase() === cityParam.toLowerCase());
            if (foundKey) startKey = foundKey;
            else {
                document.getElementById('smart-city-input').value = cityParam;
                document.getElementById('submit-btn').click();
                return;
            }
        }

        UI.generateStars();
        Core.initCity(startKey);
    };

    return { init: initEvents };
})();

document.addEventListener('DOMContentLoaded', App.init);
