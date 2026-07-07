/**
 * SolarisSwahili — js/compare.js
 */
document.addEventListener("DOMContentLoaded", () => {
    'use strict';

    const GROUPS = {
        libya:   [ { id:'tob', lat:32.077, lng:23.96 }, { id:'ben', lat:32.116, lng:20.066 }, { id:'tri', lat:32.889, lng:13.19 } ],
        africa:  [ { id:'cai', lat:30.044, lng:31.235 }, { id:'tun', lat:36.819, lng:10.165 }, { id:'alg', lat:36.753, lng:3.058 } ],
        world:   [ { id:'lon', lat:51.507, lng:-0.127 }, { id:'tok', lat:35.676, lng:139.65 }, { id:'ny', lat:40.712, lng:-74.006 } ]
    };

    let activeCities = [];
    let solarDataCache = {};
    let tickerInterval = null;

    const DOM = {
        grid: document.getElementById('cards-grid'),
        groups: document.getElementById('group-buttons'),
        loader: document.getElementById('global-loader')
    };

    const pad = n => String(n).padStart(2, '0');

    // توليد واجهة أزرار المجموعات ديناميكياً
    const initGroups = () => {
        Object.keys(GROUPS).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'city-btn text-xs font-bold';
            btn.dataset.i18n = `grp_${key}`;
            btn.onclick = () => loadGroup(key, btn);
            DOM.groups.appendChild(btn);
        });
        I18N.applyAll && I18N.applyAll(); // تأكيد الترجمة
        loadGroup('libya', DOM.groups.firstChild);
    };

    // جلب داتا جماعية بالتوازي
    const loadGroup = async (groupKey, btnEl) => {
        if(tickerInterval) clearInterval(tickerInterval);
        
        document.querySelectorAll('#group-buttons .city-btn').forEach(b => b.classList.remove('active'));
        if(btnEl) btnEl.classList.add('active');

        activeCities = GROUPS[groupKey];
        DOM.loader.style.opacity = 1;
        DOM.grid.innerHTML = '';

        try {
            await Promise.all(activeCities.map(async city => {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&daily=sunrise,sunset&timezone=auto&timeformat=unixtime&past_days=1&forecast_days=1`;
                const res = await fetch(url).then(r => r.json());
                solarDataCache[city.id] = {
                    tzOffset: res.utc_offset_seconds,
                    sunrise: res.daily.sunrise[1] * 1000,
                    sunset: res.daily.sunset[1] * 1000,
                    ySunset: res.daily.sunset[0] * 1000
                };
            }));
            startTicker();
        } catch (e) {
            console.error("API Error", e);
        } finally {
            DOM.loader.style.opacity = 0;
        }
    };

    // حلقة الوقت وبناء بطاقات HTML
    const startTicker = () => {
        const tick = () => {
            const now = Date.now();
            DOM.grid.innerHTML = activeCities.map(city => {
                const data = solarDataCache[city.id];
                if (!data) return '';

                let phaseStart = data.sunrise;
                let isNight = false;
                if (now < data.sunrise) { isNight = true; phaseStart = data.ySunset; }
                else if (now >= data.sunset) { isNight = true; phaseStart = data.sunset; }

                const elapsed = now - phaseStart;
                const swahiliHour = Math.floor(elapsed / 3600000) + 1;
                const swahiliMin = Math.floor((elapsed % 3600000) / 60000);
                const swahiliSec = Math.floor((elapsed % 60000) / 1000);

                const localeName = I18N.t(city.id) || city.id;

                return `
                    <article class="compare-card">
                        <div class="compare-city-name">${localeName}</div>
                        <div class="compare-hour text-center my-3" dir="ltr">
                           ${swahiliHour} <span class="text-sm text-[var(--text-sec)]">H</span> ${pad(swahiliMin)}<span class="text-sm text-[var(--text-sec)]">m</span>
                        </div>
                        <div class="text-xs text-center text-[var(--text-sec)]">
                            ${pad(swahiliSec)} ثانية منذ ${isNight ? (I18N.getLang()==='en'?'Sunset':'الغروب') : (I18N.getLang()==='en'?'Sunrise':'الشروق')}
                        </div>
                    </article>
                `;
            }).join('');
        };
        
        tick();
        tickerInterval = setInterval(tick, 1000);
    };

    // ربط الترجمات بأسماء المدن
    I18N.injectMap({
        ar: { grp_libya: "ليبيا", grp_africa: "شمال أفريقيا", grp_world: "حول العالم", tob: "طبرق", ben: "بنغازي", tri: "طرابلس", cai: "القاهرة", tun: "تونس", alg: "الجزائر", lon: "لندن", tok: "طوكيو", ny: "نيويورك"},
        en: { grp_libya: "Libya", grp_africa: "North Africa", grp_world: "World", tob: "Tobruk", ben: "Benghazi", tri: "Tripoli", cai: "Cairo", tun: "Tunis", alg: "Algiers", lon: "London", tok: "Tokyo", ny: "New York"}
    });

    initGroups();
    
    window.SSApp = { forceUpdateViews: startTicker }; // للتحديث عند تغيير اللغة
});