/**
 * SolarisSwahili — js/app.js
 * Heart of the Adaptive Swahili Timekeeping System
 */
const SolarisSwahili = (() => {
    'use strict';

    // 1. CONFIGURATION
    const CFG = {
        GOLD_WIN_MS: 45 * 60 * 1_000, // 45 minutes for golden hour
        CACHE_TTL: 6 * 60 * 60 * 1_000, // 6 hours
        DEFAULT_CITIES: {
            'c_tobruk': { name: 'طبرق', nameEn: 'Tobruk', country: 'ليبيا', countryEn: 'Libya', lat: 32.0773, lng: 23.9600 },
            'c_cairo': { name: 'القاهرة', nameEn: 'Cairo', country: 'مصر', countryEn: 'Egypt', lat: 30.0444, lng: 31.2357 },
            'c_london': { name: 'لندن', nameEn: 'London', country: 'المملكة المتحدة', countryEn: 'UK', lat: 51.5074, lng: -0.1278 }
        }
    };

    const STATE = {
        cities: { ...CFG.DEFAULT_CITIES },
        activeKey: 'c_tobruk',
        solarData: null,
        tickInterval: null,
        is24Hour: localStorage.getItem('ss_24h') === 'true'
    };

    // Load custom cities from storage
    try {
        const saved = JSON.parse(localStorage.getItem('ss_cities'));
        if (saved) Object.assign(STATE.cities, saved);
    } catch (e) {}

    const DOM = {
        loader: document.getElementById('loader'),
        errorLayer: document.getElementById('error-overlay'),
        citySelect: document.getElementById('city-selector'),
        hourNum: document.getElementById('hour-display'),
        metricNum: document.getElementById('metric-display'),
        phasePill: document.getElementById('phase-display'),
        sunRiseEl: document.getElementById('sunrise-time'),
        sunSetEl: document.getElementById('sunset-time'),
        stdTimeEl: document.getElementById('standard-time'),
        progressArc: document.getElementById('progress-arc'),
        celestialBody: document.getElementById('celestial-body')
    };

    // 2. CORE UTILS
    const pad = n => String(n).padStart(2, '0');
    
    const getLocalTimeFromUnix = (unixMs, tzOffsetMinutes, includeSeconds = false) => {
        const d = new Date(unixMs + tzOffsetMinutes * 60000);
        const h = d.getUTCHours();
        const m = d.getUTCMinutes();
        const s = d.getUTCSeconds();
        if (STATE.is24Hour) return includeSeconds ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`;
        const ampm = h >= 12 ? (document.documentElement.lang === 'en' ? 'PM' : 'م') : (document.documentElement.lang === 'en' ? 'AM' : 'ص');
        return `${pad(h % 12 || 12)}:${pad(m)}${includeSeconds ? ':' + pad(s) : ''} ${ampm}`;
    };

    // 3. API DATA FETCHING (Open-Meteo using Unixtime)
    const fetchSolarData = async (lat, lng, signal) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=sunrise,sunset,daylight_duration&timezone=auto&timeformat=unixtime&past_days=1&forecast_days=2`;
        const res = await fetch(url, { signal }).then(r => r.json());
        
        if (!res || res.error || !res.daily) throw new Error('Data Error');

        const offsetMs = res.utc_offset_seconds * 1000;
        return {
            utcOffsetMinutes: res.utc_offset_seconds / 60,
            ySunset: res.daily.sunset[0] * 1000,
            tSunrise: res.daily.sunrise[1] * 1000,
            tSunset: res.daily.sunset[1] * 1000,
            tmSunrise: res.daily.sunrise[2] * 1000,
            dayDuration: res.daily.daylight_duration[1] * 1000
        };
    };

    // 4. CLOCK ENGINE
    const updateClock = () => {
        if (!STATE.solarData) return;
        const now = Date.now();
        const sol = STATE.solarData;

        // Auto-refresh past midnight bounds
        if (now > sol.tmSunrise + 60000) {
            loadCity(STATE.activeKey);
            return;
        }

        // Determine Phase
        let phase = 'day', phaseStart = sol.tSunrise, phaseEnd = sol.tSunset;
        if (now < sol.tSunrise) {
            phase = 'night'; phaseStart = sol.ySunset; phaseEnd = sol.tSunrise;
        } else if (now >= sol.tSunset) {
            phase = 'night'; phaseStart = sol.tSunset; phaseEnd = sol.tmSunrise;
        }

        const isNight = phase === 'night';
        const elapsed = now - phaseStart;
        const totalDuration = phaseEnd - phaseStart;
        const progress = Math.max(0, Math.min(1, elapsed / totalDuration));

        // Swahili Math (60 minute chunks from phase start, NOT capped at 12)
        const hourCount = Math.floor(elapsed / 3600000);
        const mm = Math.floor((elapsed % 3600000) / 60000);
        const ss = Math.floor((elapsed % 60000) / 1000);

        // Update DOM Text
        const lang = document.documentElement.lang;
        DOM.hourNum.textContent = hourCount + 1; // "Hour 1" starts at 0 minutes
        DOM.phasePill.textContent = (lang === 'en' ? 'Of ' : 'من ') + (isNight ? (lang==='en'?'Night':'الليل') : (lang==='en'?'Day':'النهار'));
        DOM.metricNum.textContent = `${pad(hourCount)}:${pad(mm)}:${pad(ss)}`;
        DOM.stdTimeEl.textContent = getLocalTimeFromUnix(now, sol.utcOffsetMinutes, true);

        // Celestial Body Arc Animation (Trigonometry)
        const angle = Math.PI * (1 - progress);
        const cx = 150 + 130 * Math.cos(angle);
        const cy = 140 - 130 * Math.sin(angle);
        
        DOM.progressArc.setAttribute('stroke-dashoffset', 100 - (progress * 100));
        DOM.celestialBody.setAttribute('transform', `translate(${cx.toFixed(1)},${cy.toFixed(1)})`);

        // Theme and Sun/Moon toggle
        const rootBody = document.body;
        if (!rootBody.classList.contains('manual-theme')) {
            const nearGolden = Math.min(Math.abs(now - sol.tSunrise), Math.abs(now - sol.tSunset)) < CFG.GOLD_WIN_MS;
            rootBody.className = `antialiased min-h-screen flex flex-col items-center px-4 relative ${isNight ? 'theme-night' : nearGolden ? 'theme-golden' : ''}`;
        }
        
        document.getElementById('sun-shape').style.opacity = isNight ? '0' : '1';
        document.getElementById('moon-shape').style.opacity = isNight ? '1' : '0';
    };

    // 5. CITY MANAGER
    const renderCityButtons = () => {
        DOM.citySelect.innerHTML = '';
        Object.entries(STATE.cities).forEach(([key, data]) => {
            const btn = document.createElement('button');
            btn.className = `city-btn ${key === STATE.activeKey ? 'active' : ''}`;
            btn.textContent = document.documentElement.lang === 'en' ? data.nameEn : data.name;
            btn.onclick = () => loadCity(key);
            DOM.citySelect.appendChild(btn);
        });
    };

    const loadCity = async (key) => {
        if(STATE.tickInterval) clearInterval(STATE.tickInterval);
        STATE.activeKey = key;
        const city = STATE.cities[key];
        
        DOM.loader.classList.remove('opacity-0', 'pointer-events-none');
        document.getElementById('city-name').textContent = document.documentElement.lang === 'en' ? city.nameEn : city.name;
        document.getElementById('country-sub').textContent = document.documentElement.lang === 'en' ? city.countryEn : city.country;
        renderCityButtons();

        try {
            const data = await fetchSolarData(city.lat, city.lng);
            STATE.solarData = data;
            
            DOM.sunRiseEl.textContent = getLocalTimeFromUnix(data.tSunrise, data.utcOffsetMinutes);
            DOM.sunSetEl.textContent = getLocalTimeFromUnix(data.tSunset, data.utcOffsetMinutes);

            updateClock();
            STATE.tickInterval = setInterval(updateClock, 1000);
            DOM.errorLayer.classList.add('hidden');
        } catch (e) {
            DOM.errorLayer.classList.remove('hidden');
        } finally {
            DOM.loader.classList.add('opacity-0', 'pointer-events-none');
        }
    };

    // Expose init and utilities globally
    window.SSApp = {
        init: () => loadCity('c_tobruk'),
        forceUpdateViews: () => renderCityButtons() // Triggered when Language changes
    };

    return window.SSApp;
})();

document.addEventListener('DOMContentLoaded', SSApp.init);