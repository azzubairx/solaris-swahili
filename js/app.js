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
    celestialBody: document.getElementById('celestial-body'),
    sunShape: document.getElementById('sun-shape'),
    moonShape: document.getElementById('moon-shape'),
    starsLayer: document.getElementById('stars-layer'),
    sunriseTime: document.getElementById('sunrise-time'),
    standardTime: document.getElementById('standard-time'),
    sunsetTime: document.getElementById('sunset-time'),
    themeToggle: document.getElementById('theme-toggle'),
    sunIcon: document.getElementById('sun-icon'),
    moonIcon: document.getElementById('moon-icon'),
    addCityForm: document.getElementById('add-city-form'),
    smartInput: document.getElementById('smart-city-input'),
    errorMsg: document.getElementById('error-msg'),
    submitBtn: document.getElementById('submit-btn'),
    // عناصر شريط المقارنة
    dayBar: document.getElementById('day-bar'),
    nightBar: document.getElementById('night-bar'),
    dayLengthText: document.getElementById('day-length-text'),
    nightLengthText: document.getElementById('night-length-text'),
    comparisonText: document.getElementById('comparison-text')
};

const getLocalDateString = (offsetDays = 0) => {
    const d = new Date(Date.now() + (offsetDays * 86400000));
    return d.toLocaleDateString('en-CA'); 
};

const parseApiTimeToUTC = (dateStr, timeStr, offsetMinutes) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes, seconds] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    const pad = (n) => n.toString().padStart(2, '0');
    
    const isoStr = `${dateStr}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}Z`;
    return new Date(isoStr).getTime() - (offsetMinutes * 60000);
};

const formatMetric = (h, m, s) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

// دالة ذكية لتحويل الميلي ثانية إلى نص عربي دقيق
function formatDurationArabic(ms) {
    const totalMinutes = Math.round(ms / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    let hStr = '';
    if (h === 1) hStr = 'ساعة';
    else if (h === 2) hStr = 'ساعتين';
    else if (h > 2 && h <= 10) hStr = `${h} ساعات`;
    else if (h > 10) hStr = `${h} ساعة`;

    let mStr = '';
    if (m === 1) mStr = 'دقيقة';
    else if (m === 2) mStr = 'دقيقتين';
    else if (m > 2 && m <= 10) mStr = `${m} دقائق`;
    else if (m > 10) mStr = `${m} دقيقة`;

    if (h === 0) return mStr;
    if (m === 0) return hStr;
    return `${hStr} و ${mStr}`;
}

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
            fetchDay(dates.yesterday), fetchDay(dates.today), fetchDay(dates.tomorrow)
        ]);

        const offset = tData.utc_offset; 

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

function updateComparisonBar() {
    if (!solarBounds) return;
    
    const dayLengthMs = solarBounds.todaySunset - solarBounds.todaySunrise;
    const nightLengthMs = (24 * 3600 * 1000) - dayLengthMs;
    
    const dayPct = (dayLengthMs / (24 * 3600 * 1000)) * 100;
    const nightPct = 100 - dayPct;
    
    els.dayBar.style.width = `${dayPct}%`;
    els.nightBar.style.width = `${nightPct}%`;
    
    els.dayLengthText.textContent = formatDurationArabic(dayLengthMs);
    els.nightLengthText.textContent = formatDurationArabic(nightLengthMs);

    const diff = Math.abs(dayLengthMs - nightLengthMs);
    if (dayLengthMs > nightLengthMs) {
        els.comparisonText.textContent = `النهار أطول بـ ${formatDurationArabic(diff)}`;
    } else if (nightLengthMs > dayLengthMs) {
        els.comparisonText.textContent = `الليل أطول بـ ${formatDurationArabic(diff)}`;
    } else {
        els.comparisonText.textContent = `النهار والليل متساويان`;
    }
}

function updateClock() {
    if (!solarBounds) return;

    const absoluteTimeMs = Date.now(); 
    const { yesterdaySunset, todaySunrise, todaySunset, tomorrowSunrise, utcOffsetMinutes } = solarBounds;
    let phase, startMs, endMs;

    if (absoluteTimeMs < todaySunrise) {
        phase = 'الليل'; startMs = yesterdaySunset; endMs = todaySunrise;
    } else if (absoluteTimeMs >= todaySunrise && absoluteTimeMs < todaySunset) {
        phase = 'النهار'; startMs = todaySunrise; endMs = todaySunset;
    } else {
        phase = 'الليل'; startMs = todaySunset; endMs = tomorrowSunrise;
    }

    // إدارة الثيمات المتعددة (نهاري، ذهبي، ليلي)
    let themeClass = 'theme-day';
    const timeToSunrise = Math.abs(absoluteTimeMs - todaySunrise);
    const timeToSunset = Math.abs(absoluteTimeMs - todaySunset);
    
    if (phase === 'الليل') {
        themeClass = 'theme-night';
    } else if (timeToSunrise < 45 * 60000 || timeToSunset < 45 * 60000) {
        // وقت الغسق أو الشروق (45 دقيقة قبل/بعد)
        themeClass = 'theme-golden';
    }

    if (!manualThemeOverride) {
        document.body.classList.remove('theme-night', 'theme-golden');
        if (themeClass !== 'theme-day') document.body.classList.add(themeClass);

        if (phase === 'الليل') {
            els.sunIcon.classList.add('hidden'); els.moonIcon.classList.remove('hidden');
            els.starsLayer.style.opacity = '1';
        } else {
            els.sunIcon.classList.remove('hidden'); els.moonIcon.classList.add('hidden');
            els.starsLayer.style.opacity = '0';
        }
    }

    // تغيير شكل المؤشر من شمس إلى هلال والعكس
    if (phase === 'الليل') {
        els.sunShape.style.opacity = '0';
        els.moonShape.style.opacity = '1';
    } else {
        els.sunShape.style.opacity = '1';
        els.moonShape.style.opacity = '0';
    }

    const phaseDuration = endMs - startMs;
    const elapsed = absoluteTimeMs - startMs;
    const progress = Math.max(0, Math.min(1, elapsed / phaseDuration)); 

    const propElapsedMs = progress * (12 * 3600 * 1000); 
    const propH = Math.floor(propElapsedMs / 3600000);
    const propM = Math.floor((propElapsedMs % 3600000) / 60000);
    const propS = Math.floor((propElapsedMs % 60000) / 1000);

    const displayHour = propH + 1; 
    
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
    
    // تحريك مجموعة الـ (G) بالكامل
    els.celestialBody.setAttribute('transform', `translate(${sunX}, ${sunY})`);
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

    updateComparisonBar(); // تحديث شريط النهار والليل
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

// الإضافة عبر كتابة الاسم بالإنجليزية فقط
els.addCityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.errorMsg.classList.add('hidden');
    const inputVal = els.smartInput.value.trim();
    if (!inputVal) return;

    els.submitBtn.disabled = true;
    els.submitBtn.textContent = 'جاري البحث...';

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputVal)}&limit=1`);
        const data = await res.json();
        
        if (data && data.length > 0) {
            const lat = data[0].lat;
            const lng = data[0].lon;
            const finalName = data[0].name || inputVal;

            const cityKey = `city_${Date.now()}`;
            cities[cityKey] = { name: finalName, lat: lat, lng: lng };
            createCityButton(cityKey, cities[cityKey]);
            
            els.smartInput.value = '';
            loadCity(cityKey);
        } else {
            throw new Error("لم يتم العثور على المدينة. يرجى التأكد من كتابة الاسم بالإنجليزية بشكل صحيح.");
        }
    } catch (err) {
        els.errorMsg.textContent = err.message || "حدث خطأ في الاتصال بالشبكة.";
        els.errorMsg.classList.remove('hidden');
    } finally {
        els.submitBtn.disabled = false;
        els.submitBtn.textContent = 'إضافة المدينة';
    }
});

// التبديل اليدوي للوضع بين النهاري والليلي
els.themeToggle.addEventListener('click', () => {
    manualThemeOverride = true;
    document.body.classList.remove('theme-golden'); // تعطيل المظهر الذهبي عند التدخل اليدوي
    const isNight = document.body.classList.toggle('theme-night');
    
    if (isNight) {
        els.sunIcon.classList.add('hidden'); els.moonIcon.classList.remove('hidden');
        els.starsLayer.style.opacity = '1';
    } else {
        els.sunIcon.classList.remove('hidden'); els.moonIcon.classList.add('hidden');
        els.starsLayer.style.opacity = '0';
    }
});

function initApp() {
    Object.keys(cities).forEach(key => createCityButton(key, cities[key]));
    loadCity(currentCity);
}

document.addEventListener('DOMContentLoaded', initApp);