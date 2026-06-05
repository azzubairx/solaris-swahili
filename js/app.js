// قائمة المدن
const cities = {
    tobruk: { name: "طبرق", lat: "32.077376", lng: "23.959999" },
    benghazi: { name: "بنغازي", lat: "32.1167", lng: "20.0667" },
    tripoli: { name: "طرابلس", lat: "32.8892", lng: "13.1900" }
};

let currentCity = 'tobruk';
let solarBounds = null;
let clockInterval = null;
let manualThemeOverride = false;

const els = {
    loader: document.getElementById('loader'),
    appContainer: document.getElementById('app-container'),
    citySelector: document.getElementById('city-selector'),
    cityName: document.getElementById('city-name'),
    cityLat: document.getElementById('city-lat'),
    cityLng: document.getElementById('city-lng'),
    hourDisplay: document.getElementById('hour-display'),
    phaseDisplay: document.getElementById('phase-display'),
    metricDisplay: document.getElementById('metric-display'),
    progressArc: document.getElementById('progress-arc'),
    sunIndicator: document.getElementById('sun-indicator'),
    sunriseTime: document.getElementById('sunrise-time'),
    standardTime: document.getElementById('standard-time'),
    sunsetTime: document.getElementById('sunset-time'),
    themeToggle: document.getElementById('theme-toggle'),
    sunIcon: document.getElementById('sun-icon'),
    moonIcon: document.getElementById('moon-icon'),
    addCityForm: document.getElementById('add-city-form')
};

// توليد تواريخ الأيام كمرجعيات
const getLocalDateString = (offsetDays = 0) => {
    const d = new Date(Date.now() + (offsetDays * 86400000));
    return d.toLocaleDateString('en-CA'); 
};

// السحر هنا: تحويل الوقت المحلي للمدينة إلى رقم UTC 절대ي لتلافي أي خطأ في فروق التوقيت
const parseApiTimeToUTC = (dateStr, timeStr, offsetMinutes) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes, seconds] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    const pad = (n) => n.toString().padStart(2, '0');
    
    // نكون التاريخ بتصريح انه UTC (Z)
    const isoStr = `${dateStr}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}Z`;
    const localMs = new Date(isoStr).getTime();
    
    // نطرح انحراف الـ API (بالدقائق) لنحصل على الـ UTC الحقيقي!
    return localMs - (offsetMinutes * 60000);
};

const formatMetric = (h, m, s) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

// جلب البيانات من API الوحيد المعتمد
async function fetchSolarData(cityKey) {
    const city = cities[cityKey];
    const API_BASE = `https://api.sunrisesunset.io/json?lat=${city.lat}&lng=${city.lng}`;
    
    try {
        const dates = {
            yesterday: getLocalDateString(-1),
            today: getLocalDateString(0),
            tomorrow: getLocalDateString(1)
        };

        const fetchDay = async (date) => {
            const res = await fetch(`${API_BASE}&date=${date}`);
            if (!res.ok) throw new Error("API Failure");
            const json = await res.json();
            return json.results;
        };

        const [yData, tData, tmData] = await Promise.all([
            fetchDay(dates.yesterday),
            fetchDay(dates.today),
            fetchDay(dates.tomorrow)
        ]);

        const offset = tData.utc_offset; // API يُرجع الإزاحة بالدقائق

        solarBounds = {
            yesterdaySunset: parseApiTimeToUTC(dates.yesterday, yData.sunset, offset),
            todaySunrise: parseApiTimeToUTC(dates.today, tData.sunrise, offset),
            todaySunset: parseApiTimeToUTC(dates.today, tData.sunset, offset),
            tomorrowSunrise: parseApiTimeToUTC(dates.tomorrow, tmData.sunrise, offset),
            todaySunriseStr: tData.sunrise,
            todaySunsetStr: tData.sunset,
            utcOffsetMinutes: offset
        };
    } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
    }
}

function updateClock() {
    if (!solarBounds) return;

    const absoluteTimeMs = Date.now(); // التوقيت العالمي الموحد الحالي
    const { yesterdaySunset, todaySunrise, todaySunset, tomorrowSunrise, utcOffsetMinutes } = solarBounds;
    let phase, startMs, endMs;

    if (absoluteTimeMs < todaySunrise) {
        phase = 'الليل'; startMs = yesterdaySunset; endMs = todaySunrise;
    } else if (absoluteTimeMs >= todaySunrise && absoluteTimeMs < todaySunset) {
        phase = 'النهار'; startMs = todaySunrise; endMs = todaySunset;
    } else {
        phase = 'الليل'; startMs = todaySunset; endMs = tomorrowSunrise;
    }

    if (!manualThemeOverride) {
        if (phase === 'الليل') {
            document.body.classList.add('theme-night');
            els.sunIcon.classList.add('hidden'); els.moonIcon.classList.remove('hidden');
        } else {
            document.body.classList.remove('theme-night');
            els.sunIcon.classList.remove('hidden'); els.moonIcon.classList.add('hidden');
        }
    }

    const phaseDuration = endMs - startMs;
    const elapsed = absoluteTimeMs - startMs;
    const progress = Math.max(0, Math.min(1, elapsed / phaseDuration)); 

    const propElapsedMs = progress * (12 * 3600 * 1000); 
    const propH = Math.floor(propElapsedMs / 3600000);
    const propM = Math.floor((propElapsedMs % 3600000) / 60000);
    const propS = Math.floor((propElapsedMs % 60000) / 1000);

    const displayHour = propH + 1; 
    
    // حساب التوقيت المحلي للمدينة المستهدفة
    const targetCityTimeMs = absoluteTimeMs + (utcOffsetMinutes * 60000);
    const localDate = new Date(targetCityTimeMs);
    const standardTimeStr = formatMetric(localDate.getUTCHours(), localDate.getUTCMinutes(), localDate.getUTCSeconds());

    const arcRadius = 130;
    const currentAngle = Math.PI - (progress * Math.PI); 
    const sunX = 150 + arcRadius * Math.cos(currentAngle);
    const sunY = 140 - arcRadius * Math.sin(currentAngle);

    els.hourDisplay.textContent = displayHour;
    els.phaseDisplay.textContent = `من ${phase}`;
    els.metricDisplay.textContent = formatMetric(propH, propM, propS);
    els.standardTime.textContent = standardTimeStr;
    
    els.progressArc.setAttribute('stroke-dashoffset', 100 - (progress * 100));
    els.sunIndicator.setAttribute('cx', sunX);
    els.sunIndicator.setAttribute('cy', sunY);
}

async function loadCity(cityKey) {
    if (clockInterval) clearInterval(clockInterval);
    els.loader.style.opacity = '1';
    els.loader.style.pointerEvents = 'auto';
    els.appContainer.style.opacity = '0';

    currentCity = cityKey;
    const city = cities[cityKey];
    
    document.querySelectorAll('.city-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.city === cityKey);
    });

    els.cityName.textContent = city.name;
    els.cityLat.textContent = `Lat: ${parseFloat(city.lat).toFixed(4)}`;
    els.cityLng.textContent = `Lng: ${parseFloat(city.lng).toFixed(4)}`;
    
    await fetchSolarData(cityKey);

    const cleanTime = (t) => t.replace(/(:\d{2})( \w{2})$/, '$2');
    els.sunriseTime.textContent = cleanTime(solarBounds.todaySunriseStr);
    els.sunsetTime.textContent = cleanTime(solarBounds.todaySunsetStr);

    updateClock();
    clockInterval = setInterval(updateClock, 1000);

    els.loader.style.opacity = '0';
    els.loader.style.pointerEvents = 'none';
    els.appContainer.style.opacity = '1';
}

function createCityButton(key, cityObj) {
    const btn = document.createElement('button');
    btn.className = 'city-btn';
    btn.dataset.city = key;
    btn.textContent = cityObj.name;
    btn.addEventListener('click', () => {
        if(currentCity !== key) loadCity(key);
    });
    els.citySelector.appendChild(btn);
}

// إضافة مدينة يدوياً بناءً على إحداثيات (بدون استخدام خرائط خارجية)
els.addCityForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-city-name').value.trim();
    const lat = document.getElementById('new-city-lat').value.trim();
    const lng = document.getElementById('new-city-lng').value.trim();

    if (name && lat && lng) {
        const cityKey = `city_${Date.now()}`;
        cities[cityKey] = { name, lat, lng };
        createCityButton(cityKey, cities[cityKey]);
        
        document.getElementById('new-city-name').value = '';
        document.getElementById('new-city-lat').value = '';
        document.getElementById('new-city-lng').value = '';
        
        loadCity(cityKey);
    }
});

els.themeToggle.addEventListener('click', () => {
    manualThemeOverride = true;
    const isNight = document.body.classList.toggle('theme-night');
    if (isNight) {
        els.sunIcon.classList.add('hidden'); els.moonIcon.classList.remove('hidden');
    } else {
        els.sunIcon.classList.remove('hidden'); els.moonIcon.classList.add('hidden');
    }
});

function initApp() {
    Object.keys(cities).forEach(key => createCityButton(key, cities[key]));
    loadCity(currentCity);
}

document.addEventListener('DOMContentLoaded', initApp);