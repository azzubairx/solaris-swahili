// قائمة المدن الافتراضية
const cities = {
    tobruk: { name: "طبرق", lat: "32.077376", lng: "23.959999" },
    benghazi: { name: "بنغازي", lat: "32.1167", lng: "20.0667" },
    tripoli: { name: "طرابلس", lat: "32.8892", lng: "13.1900" }
};

let currentCity = 'tobruk';
let solarBounds = null;
let clockInterval = null;
let manualThemeOverride = false; // التحكم اليدوي بالثيم

// ربط عناصر واجهة المستخدم
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
    addCityForm: document.getElementById('add-city-form'),
    newCityInput: document.getElementById('new-city-input'),
    apiStatus: document.getElementById('api-status'),
    cityCountry: document.getElementById('city-country')
};

// دوال تحويل التاريخ والوقت المحلي لتبسيط الحسابات
const getLocalDateString = (offsetDays = 0) => {
    const d = new Date(Date.now() + (offsetDays * 86400000));
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
};

// تحويل وقت الـ API إلى Timestamp مطلق
const parseApiTime = (dateStr, timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes, seconds] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    const pad = (n) => n.toString().padStart(2, '0');
    
    // نستخدم التوقيت المحلي للجهاز لتجنب مشاكل المناطق الزمنية
    const localIsoStr = `${dateStr}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return new Date(localIsoStr).getTime();
};

const formatMetric = (h, m, s) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

// جلب بيانات الشروق والغروب من API
async function fetchSolarData(cityKey) {
    const city = cities[cityKey];
    // استخدام tzid=Local ليرجع الـ API التوقيت بناءً على المنطقة الزمنية للمدينة
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

        // إذا كان الـ API يُرجع التوقيتات بصيغة صحيحة (AM/PM)
        solarBounds = {
            yesterdaySunset: parseApiTime(dates.yesterday, yData.sunset),
            todaySunrise: parseApiTime(dates.today, tData.sunrise),
            todaySunset: parseApiTime(dates.today, tData.sunset),
            tomorrowSunrise: parseApiTime(dates.tomorrow, tmData.sunrise),
            todaySunriseStr: tData.sunrise,
            todaySunsetStr: tData.sunset
        };
    } catch (error) {
        console.error("خطأ في جلب بيانات الفلك:", error);
    }
}

// التحديث المستمر للواجهة (كل ثانية)
function updateClock() {
    if (!solarBounds) return;

    const timeMs = Date.now();
    const { yesterdaySunset, todaySunrise, todaySunset, tomorrowSunrise } = solarBounds;
    let phase, startMs, endMs;

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

    // إدارة الثيم (الوضع الليلي/النهاري) تلقائياً إذا لم يتم تدخل المستخدم
    if (!manualThemeOverride) {
        if (phase === 'الليل') {
            document.body.classList.add('theme-night');
            els.sunIcon.classList.add('hidden');
            els.moonIcon.classList.remove('hidden');
        } else {
            document.body.classList.remove('theme-night');
            els.sunIcon.classList.remove('hidden');
            els.moonIcon.classList.add('hidden');
        }
    }

    // الحسابات النسبية
    const phaseDuration = endMs - startMs;
    const elapsed = timeMs - startMs;
    const progress = Math.max(0, Math.min(1, elapsed / phaseDuration)); 

    const propElapsedMs = progress * (12 * 3600 * 1000); 
    const propH = Math.floor(propElapsedMs / 3600000);
    const propM = Math.floor((propElapsedMs % 3600000) / 60000);
    const propS = Math.floor((propElapsedMs % 60000) / 1000);

    const displayHour = propH + 1; 
    const metricStr = formatMetric(propH, propM, propS);

    // حسابات القوس (SVG)
    const arcRadius = 130;
    const arcCenterX = 150;
    const arcCenterY = 140;
    const currentAngle = Math.PI - (progress * Math.PI); 
    const sunX = arcCenterX + arcRadius * Math.cos(currentAngle);
    const sunY = arcCenterY - arcRadius * Math.sin(currentAngle);

    // تحديث الأرقام والنصوص
    els.hourDisplay.textContent = displayHour;
    els.phaseDisplay.textContent = `من ${phase}`;
    els.metricDisplay.textContent = metricStr;
    
    // التوقيت المحلي القياسي
    const d = new Date(timeMs);
    els.standardTime.textContent = d.toLocaleTimeString('en-US', { hour12: false });
    
    // حركة المؤشر
    els.progressArc.setAttribute('stroke-dashoffset', 100 - (progress * 100));
    els.sunIndicator.setAttribute('cx', sunX);
    els.sunIndicator.setAttribute('cy', sunY);
}

// تحميل بيانات مدينة وبناء الواجهة
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
    
    // جلب البيانات
    await fetchSolarData(cityKey);

    // إزالة الثواني من العرض المبسط
    const cleanTime = (t) => t.replace(/(:\d{2})( \w{2})$/, '$2');
    els.sunriseTime.textContent = cleanTime(solarBounds.todaySunriseStr);
    els.sunsetTime.textContent = cleanTime(solarBounds.todaySunsetStr);

    updateClock();
    clockInterval = setInterval(updateClock, 1000);

    els.loader.style.opacity = '0';
    els.loader.style.pointerEvents = 'none';
    els.appContainer.style.opacity = '1';
}

// دالة إضافة مدينة جديدة عبر Geocoding API المجاني (Nominatim)
els.addCityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cityName = els.newCityInput.value.trim();
    if (!cityName) return;

    els.apiStatus.classList.add('hidden');
    const btn = document.getElementById('add-city-btn');
    btn.textContent = "...";
    btn.disabled = true;

    try {
        // الاتصال بـ API الخرائط للبحث عن المدينة
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`);
        const data = await res.json();

        if (data && data.length > 0) {
            const newCityObj = {
                name: cityName,
                lat: data[0].lat,
                lng: data[0].lon
            };
            
            // إضافة مفتاح فريد للمدينة
            const cityKey = `city_${Date.now()}`;
            cities[cityKey] = newCityObj;

            // إنشاء زر جديد
            createCityButton(cityKey, newCityObj);
            
            // تحميل المدينة الجديدة فوراً
            els.newCityInput.value = "";
            loadCity(cityKey);
        } else {
            els.apiStatus.textContent = "لم يتم العثور على المدينة. جرب اسماً آخر.";
            els.apiStatus.classList.remove('hidden');
        }
    } catch (error) {
        els.apiStatus.textContent = "حدث خطأ في الاتصال بالشبكة.";
        els.apiStatus.classList.remove('hidden');
    } finally {
        btn.textContent = "إضافة";
        btn.disabled = false;
    }
});

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

// التحكم اليدوي بالوضع (ليلي/نهاري)
els.themeToggle.addEventListener('click', () => {
    manualThemeOverride = true; // إيقاف التبديل التلقائي
    const isNight = document.body.classList.toggle('theme-night');
    if (isNight) {
        els.sunIcon.classList.add('hidden');
        els.moonIcon.classList.remove('hidden');
    } else {
        els.sunIcon.classList.remove('hidden');
        els.moonIcon.classList.add('hidden');
    }
});

// تهيئة أولية
function initApp() {
    Object.keys(cities).forEach(key => createCityButton(key, cities[key]));
    loadCity(currentCity);
}

document.addEventListener('DOMContentLoaded', initApp);