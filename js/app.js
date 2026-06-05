// قاعدة بيانات المدن
const cities = {
    tobruk: { name: "طبرق", lat: "32.077376", lng: "23.959999" },
    benghazi: { name: "بنغازي", lat: "32.1167", lng: "20.0667" },
    tripoli: { name: "طرابلس", lat: "32.8892", lng: "13.1900" }
};

const LIBYA_UTC_OFFSET = 2 * 3600 * 1000; // UTC+2 ثابت لليبيا
let currentCity = 'tobruk';
let solarBounds = null;
let clockInterval = null;

// عناصر DOM
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
    sunsetTime: document.getElementById('sunset-time')
};

// --- دوال مساعدة ---
const getLibyaDateString = (offsetDays = 0) => {
    const d = new Date(Date.now() + LIBYA_UTC_OFFSET + (offsetDays * 86400000));
    return d.toISOString().split('T')[0];
};

const parseApiTime = (dateStr, timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes, seconds] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    const pad = (n) => n.toString().padStart(2, '0');
    const isoStr = `${dateStr}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}+02:00`;
    return new Date(isoStr).getTime();
};

const formatMetric = (h, m, s) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const formatStandardLocalTime = (timestamp) => {
    const d = new Date(timestamp + LIBYA_UTC_OFFSET);
    return d.toISOString().substring(11, 19);
};

// --- جلب بيانات API ---
async function fetchSolarData(cityKey) {
    const city = cities[cityKey];
    const API_BASE = `https://api.sunrisesunset.io/json?lat=${city.lat}&lng=${city.lng}`;
    
    try {
        const dates = {
            yesterday: getLibyaDateString(-1),
            today: getLibyaDateString(0),
            tomorrow: getLibyaDateString(1)
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

        solarBounds = {
            yesterdaySunset: parseApiTime(dates.yesterday, yData.sunset),
            todaySunrise: parseApiTime(dates.today, tData.sunrise),
            todaySunset: parseApiTime(dates.today, tData.sunset),
            tomorrowSunrise: parseApiTime(dates.tomorrow, tmData.sunrise),
            todaySunriseStr: tData.sunrise,
            todaySunsetStr: tData.sunset
        };
    } catch (error) {
        console.warn("فشل في الـ API، تم استخدام بيانات احتياطية تقريبية", error);
        // Fallback عشوائي تقريبي في حال فشل API تماماً
        const dates = { yesterday: getLibyaDateString(-1), today: getLibyaDateString(0), tomorrow: getLibyaDateString(1) };
        solarBounds = {
            yesterdaySunset: parseApiTime(dates.yesterday, "7:30:00 PM"),
            todaySunrise: parseApiTime(dates.today, "6:00:00 AM"),
            todaySunset: parseApiTime(dates.today, "7:30:00 PM"),
            tomorrowSunrise: parseApiTime(dates.tomorrow, "6:00:00 AM"),
            todaySunriseStr: "6:00:00 AM",
            todaySunsetStr: "7:30:00 PM"
        };
    }
}

// --- محرك الحسابات وتحديث الواجهة ---
function updateClock() {
    if (!solarBounds) return;

    const timeMs = Date.now();
    const { yesterdaySunset, todaySunrise, todaySunset, tomorrowSunrise } = solarBounds;
    let phase, startMs, endMs;

    // تحديد الفترة الحالية (نهار أم ليل)
    if (timeMs < todaySunrise) {
        phase = 'الليل';
        startMs = yesterdaySunset;
        endMs = todaySunrise;
    } else if (timeMs >= todaySunrise && timeMs < todaySunset) {
        phase = 'النهار';
        startMs = todaySunrise;
        endMs = todaySunset;
    } else {
        phase = 'الليل';
        startMs = todaySunset;
        endMs = tomorrowSunrise;
    }

    // تبديل المظهر التلقائي
    if (phase === 'الليل') document.body.classList.add('theme-night');
    else document.body.classList.remove('theme-night');

    // الحساب النسبي للساعة السواحلية
    const phaseDuration = endMs - startMs;
    const elapsed = timeMs - startMs;
    const progress = elapsed / phaseDuration; 

    const propElapsedMs = progress * (12 * 3600 * 1000); 
    const propH = Math.floor(propElapsedMs / 3600000);
    const propM = Math.floor((propElapsedMs % 3600000) / 60000);
    const propS = Math.floor((propElapsedMs % 60000) / 1000);

    const displayHour = propH + 1; 
    const metricStr = formatMetric(propH, propM, propS);

    // حسابات حركة مؤشر الشمس (SVG Math)
    const arcRadius = 120;
    const arcCenterX = 150;
    const arcCenterY = 140;
    const currentAngle = Math.PI - (progress * Math.PI); 
    const sunX = arcCenterX + arcRadius * Math.cos(currentAngle);
    const sunY = arcCenterY - arcRadius * Math.sin(currentAngle);

    // تحديث الواجهة (DOM)
    els.hourDisplay.textContent = displayHour;
    els.phaseDisplay.textContent = `من ${phase}`;
    els.metricDisplay.textContent = metricStr;
    els.standardTime.textContent = formatStandardLocalTime(timeMs);
    
    els.progressArc.setAttribute('stroke-dashoffset', 100 - (progress * 100));
    els.sunIndicator.setAttribute('cx', sunX);
    els.sunIndicator.setAttribute('cy', sunY);
}

// --- تهيئة التطبيق وإدارة المدن ---
async function loadCity(cityKey) {
    if (clockInterval) clearInterval(clockInterval);
    els.loader.style.opacity = '1';
    els.loader.style.pointerEvents = 'auto';
    els.appContainer.style.opacity = '0';

    currentCity = cityKey;
    const city = cities[cityKey];
    
    // تحديث الأزرار
    document.querySelectorAll('.city-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.city === cityKey);
    });

    els.cityName.textContent = city.name;
    els.cityLat.textContent = `Lat ${city.lat}`;
    els.cityLng.textContent = `Lng ${city.lng}`;

    await fetchSolarData(cityKey);

    els.sunriseTime.textContent = solarBounds.todaySunriseStr.split(' ')[0];
    els.sunsetTime.textContent = solarBounds.todaySunsetStr.split(' ')[0];

    updateClock();
    clockInterval = setInterval(updateClock, 1000);

    // إخفاء التحميل وإظهار التطبيق
    els.loader.style.opacity = '0';
    els.loader.style.pointerEvents = 'none';
    els.appContainer.style.opacity = '1';
}

function initApp() {
    // بناء أزرار المدن
    Object.keys(cities).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'city-btn';
        btn.dataset.city = key;
        btn.textContent = cities[key].name;
        btn.addEventListener('click', () => {
            if(currentCity !== key) loadCity(key);
        });
        els.citySelector.appendChild(btn);
    });

    // تحميل المدينة الافتراضية
    loadCity(currentCity);
}

// تشغيل عند جاهزية المتصفح
document.addEventListener('DOMContentLoaded', initApp);
