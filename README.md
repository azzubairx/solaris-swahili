# 🌅 SolarisSwahili
### ساعة التوقيت السواحلي التكيفية بالساعات القياسية

> *«الوقت ليس رقمًا على جدار — إنه مسافة الشمس من أفقك.»*

---

<div align="center">

**[🔴 العرض المباشر](https://azzubairx.github.io/SolarisSwahili/)** &nbsp;|&nbsp;
**[📂 المستودع](https://github.com/AzzubairX/SolarisSwahili)** &nbsp;|&nbsp;
**[📄 الترخيص](#-الترخيص)**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

</div>

---

## 🌙 ما هو التوقيت السواحلي؟

التوقيت السواحلي (Swahili Time / Saa za Kiswahili) نظامٌ توقيتي تقليدي عريق لا يزال حيًّا في مناطق من ليبيا واليمن وشرق أفريقيا. يختلف جوهريًّا عن التوقيت المدني الذي يبدأ يومه من منتصف الليل: بدلًا من ذلك يُعاد ضبط العدّاد عند الشروق.

### نموذجان مختلفان

| الخاصية | التوقيت التقليدي (نسبي) | **هذا التطبيق (تكيفي قياسي)** |
|:---|:---:|:---:|
| نقطة الصفر | الشروق (للنهار) | **الشروق (للنهار)** |
| مدة الساعة | تتغيّر (تمتد وتنكمش) | **ثابتة — 60 دقيقةً دائمًا** |
| عدد ساعات النهار | دائمًا 12 | **يعكس الطول الفعلي للنهار** |
| الساعة 6 | الظهر دائمًا | تعني «6 ساعاتٍ منذ الشروق» |
| مثال صيفي (14 ساعة) | ساعة 12 تُسدَل عند الغروب | **الساعة 14 تُسدَل عند الغروب** |

**مثال:** إذا شرقت الشمس في طبرق عند 06:02، فالساعة 14:00 مدنيًّا تعني الساعة **الثامنة سواحليًّا** — لأن ثماني ساعاتٍ قياسيةً (8 × 60 دقيقةً) مضت منذ الشروق.

---

## ✨ المزايا

### 🕐 النموذج الحسابي
- **ساعاتٌ قياسيةٌ تكيفية** — كل ساعة 60 دقيقةً بالضبط، تُعدّ من الشروق (للنهار) أو من الغروب (لليل). في الصيف قد يبلغ عدد ساعات النهار 15 أو أكثر.
- **بياناتٌ فلكيةٌ حية** — شروقٌ وغروبٌ دقيقٌ من [`Open-Meteo API`](https://open-meteo.com) (أمس + اليوم + الغد في طلبٍ واحد).
- **كاشٌ ذكي** — `localStorage` بمدة صلاحية ست ساعاتٍ يقلّل الطلبات.
- **حماية من السباق** — عدّاد الجيل (generation counter) يمنع تداخل طلبات تبديل المدن السريع.
- **حارس منتصف الليل** — يُعيد تحميل البيانات تلقائيًّا عند تجاوز شروق الغد لضمان صحة الساعة بعد منتصف الليل.

### 🌆 الواجهة
- **سماءٌ حية** — تدرّجٌ لوني يتغيّر كل ثانية: ذهبي الفجر → أزرق الصباح → أبيض الظهر → برتقالي الغروب → كحلي الليل.
- **ثلاثة أثواب تلقائية** — نهاري / ذهبي (45 دقيقةً حول الشروق والغروب) / ليلي.
- **قوسٌ شمسي متحرك** — شمسٌ مُضيئة أو بدرٌ فضي يجري على مسار نصف دائرة بمعادلةٍ مثلثيةٍ دقيقة.
- **مؤشراتٌ للصلاة** — نقاطٌ على القوس مع نبضةٍ للصلاة القادمة.
- **155 نجمةً إجرائية** — توليدٌ برمجي عشوائي حقيقي.

### 🗺 المقارنة متعددة المدن (`compare.html`)
- مقارنةٌ حية لعدة مدن في وقتٍ واحد — تُحدَّث كل ثانية.
- مجموعاتٌ جاهزة: ليبيا، شمال أفريقيا، الشرق الأوسط، العالم.
- إضافة أي مدينةٍ عالميًّا بالاسم الإنجليزي.
- عرضٌ صحيحٌ للساعة بالنموذج التكيفي (بلا حدٍّ أقصى عند 12).

### 📊 الإحصائيات السنوية (`dashboard.html`)
- مخطط طول النهار طوال السنة.
- مخطط **ساعات النهار السواحلية** (لا «مدة الساعة» — مقياسٌ ينتمي للنموذج النسبي).
- جدولٌ شهري بالفارق عن 12 ساعة.
- الأحداث الفلكية: انقلابان واعتدالان.

---

## 🗂 هيكل المشروع

```
SolarisSwahili/
│
├── index.html        # الصفحة الرئيسية — الساعة الحية
├── about.html        # شرح النظام والمقارنة بين النماذج
├── compare.html      # مقارنة حية لعدة مدن
├── dashboard.html    # الإحصائيات الفلكية السنوية
│
├── css/
│   └── style.css     # نظام CSS Variables — ثيمات، حركات، مكوّنات
│
├── js/
│   ├── theme.js      # استعادة الثيم قبل أول رسمة (بلا وميض)
│   ├── i18n.js       # الترجمة المشتركة للصفحات الفرعية
│   └── app.js        # المحرك الكامل (IIFE Module Pattern)
│
└── assets/
    └── logo.svg      # شعار المشروع (SVG نقي)
```

### تفصيل `app.js`

```
app.js
├── I18N        — قواميس AR / EN
├── Lang        — toggle(), t(), apply()
├── CFG         — ثوابت الإعداد
├── S           — الحالة المركزية
├── D           — مراجع DOM
├── Utilities   — pad, fmt, fmtDur, lerpHex, genStars, formatLocal, getCityDateStr
├── Cache       — localStorage + TTL تلقائي (6 ساعات)
├── SolarAPI    — Open-Meteo (sunrise / sunset / daylight_duration)
├── PrayerAPI   — Aladhan (أوقات الصلاة، طريقة رابطة العالم الإسلامي)
├── Sky         — ألوان السماء والثيمات
├── Prayers     — drawMarkers, renderBar, toMS, getNext
├── Clock       — run() — حارس منتصف الليل + عدّاد الساعة التكيفي
├── ShareImage  — Canvas API لصورة قابلة للمشاركة
├── Ambient     — وضع الحائط + WakeLock
├── Cities      — load, buildButtons, removeCustom, searchAndLoad
├── WakeLock    — request / release / reacquire
└── init        — ربط الأحداث + معالجة URL params
```

---

## ⚙️ كيف يعمل

### 1. جلب البيانات الفلكية (Open-Meteo)

```javascript
const url = 'https://api.open-meteo.com/v1/forecast'
          + `?latitude=${lat}&longitude=${lng}`
          + '&daily=sunrise,sunset,daylight_duration'
          + '&timezone=auto&past_days=1&forecast_days=2';
```

يُعيد الـ API أوقات الشروق والغروب بالتوقيت المحلي (سلاسل ISO بدون `Z`) مع `utc_offset_seconds`.

### 2. تحويل الأوقات المحلية إلى UTC

```javascript
// الخطوة 1: عامِل السلسلة المحلية كـ UTC (أضف Z)
// الخطوة 2: اطرح منها الإزاحة → UTC الحقيقي
const parseLocal = str =>
    new Date(str + 'Z').getTime() - offMins * 60_000;
```

**مثال:** شروقٌ محلي `06:02` في طبرق (UTC+2 = 120 دقيقة):
- `new Date("…T06:02Z").getTime()` = 06:02 UTC
- `− 120 × 60_000` = **04:02 UTC** (الشروق الحقيقي) ✓

### 3. حساب الساعة السواحلية التكيفية

```javascript
// الوقت المنقضي منذ بداية الطور
const elapsed = Date.now() - phaseStartMs;

// الساعة الحالية (1-indexed، بلا حدٍّ أقصى عند 12)
const swahiliHour = Math.floor(elapsed / 3_600_000) + 1;
```

### 4. تحريك الجسم السماوي على القوس

```
arc path:  M 20 140 A 130 130 0 0 1 280 140
centre:    (150, 140)    radius: 130
sweep-flag = 1 → ساعة الساعة → القوس العلوي ✓

angle = π × (1 − progress)
cx    = 150 + 130 × cos(angle)
cy    = 140 − 130 × sin(angle)   ← الطرح لأن y يزداد للأسفل في SVG
```

| `progress` | `angle` | الموضع | الحدث |
|:---:|:---:|:---:|:---:|
| 0.00 | π | (20, 140) | الشروق / الغروب |
| 0.50 | π/2 | (150, 10) | الذروة |
| 1.00 | 0 | (280, 140) | الغروب / الشروق |

### 5. الكاش التلقائي

```javascript
// رقم الحاوية — يتغيّر كل 6 ساعاتٍ من نقطة epoch
// يُلغي صلاحية الكاش تلقائيًّا بدون حفظ timestamps
const _bucket = () => Math.floor(Date.now() / CACHE_TTL_MS);
const key     = (prefix, lat, lng) =>
    `ss_${prefix}_${lat}_${lng}_${_bucket()}`;
```

---

## 🚀 التشغيل المحلي

لا يتطلب المشروع أي تثبيتٍ أو أدواتٍ بناء:

```bash
git clone https://github.com/AzzubairX/SolarisSwahili.git
cd SolarisSwahili

# افتح index.html مباشرةً في متصفحٍ حديث
# أو شغّل خادمًا محليًّا (موصى به لتجنّب قيود CORS):
python3 -m http.server 8080
# ثم افتح: http://localhost:8080
```

> **ملاحظة:** WakeLock API و Web Share API يتطلبان HTTPS.
> جميع الـ APIs المستخدمة مجانيةٌ ولا تتطلب مفاتيح.

---

## 🛠 التقنيات المستخدمة

| التقنية | الاستخدام |
|---|---|
| **HTML5** | هيكل التطبيق + SVG القوس الشمسي + meta OG |
| **CSS3 Custom Properties** | نظام الثيمات الثلاثي + الرسوم المتحركة |
| **Vanilla JavaScript (ES2022)** | كامل المنطق — IIFE Module Pattern |
| **Tailwind CSS (CDN)** | التخطيط والمسافات |
| **Google Fonts** | Tajawal (عربي) + JetBrains Mono (أرقام) |
| **Open-Meteo API** | بيانات الشروق والغروب ومدة النهار |
| **Aladhan API** | مواقيت الصلوات الخمسة (رابطة العالم الإسلامي) |
| **Nominatim / OpenStreetMap** | البحث الجغرافي عند إضافة مدن |
| **Canvas API** | صورة المشاركة |
| **WakeLock API** | منع إيقاظ الشاشة في وضع الحائط |
| **Web Share API** | مشاركة الرابط بصورةٍ native |
| **Intl.DateTimeFormat** | التاريخ الهجري + التوقيت المحلي |
| **History API** | تحديث `?city=` بدون إعادة تحميل |

---

## 📁 الـ APIs

| الـ API | الرابط | الغرض | مجاني |
|---|---|---|:---:|
| Open-Meteo | `api.open-meteo.com` | الشروق + الغروب + مدة النهار | ✅ |
| Aladhan | `api.aladhan.com` | مواقيت الصلاة | ✅ |
| Nominatim | `nominatim.openstreetmap.org` | البحث الجغرافي | ✅ |

> **طريقة الصلاة:** يستخدم التطبيق طريقة **رابطة العالم الإسلامي** (Method 3) المناسبة لشمال أفريقيا والمدن الليبية. للمواقيت الرسمية راجع الجهات الدينية المحلية.

---

## 🎨 مبادئ التصميم

### الفلسفة البصرية — «السماء الحية»

| العنصر | المعنى |
|---|---|
| الخلفية | السماء الفعلية بألوانها المتغيّرة كل ثانية |
| القوس | مسار الشمس / القمر فوق الأفق |
| النجوم | تظهر تدريجيًّا ليلًا بالصنف `.stars-visible` (لا inline style) |
| التوهّج | ضوء الشمس والقمر عبر SVG filter |

### إمكانية الوصول (Accessibility)

- `aria-label` على جميع الأزرار التفاعلية.
- `aria-live="polite"` على الساعة والعدّاد والطور.
- `aria-atomic="true"` على مجموعات العرض الزمني.
- `role="alert"` على رسائل الخطأ.
- `role="status"` على شاشة التحميل.
- `sr-only` label على حقل الإدخال.
- `focus-visible` على كل عنصرٍ تفاعلي (لا `outline: none` بدون بديل).
- `touch-action: manipulation` على الأزرار (يُلغي تأخير النقر المزدوج).
- `prefers-reduced-motion` معالَجٌ في CSS لجميع الرسوم المتحركة.
- `font-variant-numeric: tabular-nums` على جميع عروض الوقت.

---

## 🌐 المدن الافتراضية

| المدينة | خط العرض | خط الطول |
|---|---|---|
| طبرق | 32.0773°N | 23.9600°E |
| بنغازي | 32.1167°N | 20.0667°E |
| طرابلس | 32.8892°N | 13.1900°E |

يمكن إضافة **أي مدينةٍ في العالم** بكتابة اسمها بالإنجليزية. تُحفظ المدن المضافة في `localStorage` وتظهر عند إعادة التشغيل.

---

## 📱 مشاركة الرابط

```
https://azzubairx.github.io/SolarisSwahili/?city=Tobruk
https://azzubairx.github.io/SolarisSwahili/?city=Cairo
https://azzubairx.github.io/SolarisSwahili/?city=Istanbul
```

عند فتح الرابط يُحمَّل التطبيق مباشرةً على المدينة المحددة. إن لم تكن في القائمة المحفوظة يبحث عنها تلقائيًّا عبر Nominatim.

---

## 📄 الترخيص

```
Copyright © 2026 Azzubair — جميع الحقوق محفوظة

يُسمح بالاطلاع والدراسة لأغراضٍ شخصيةٍ وتعليمية.
يُمنع إعادة النشر أو التوزيع أو الاستخدام التجاري
دون إذنٍ خطيٍّ صريح من المؤلف.
```

---

## 👤 المؤلف

**الزبير** — مطوّر ومترجم ومعلّم لغةٍ إنجليزية
🌐 [azzubairx.github.io](https://azzubairx.github.io) &nbsp;|&nbsp; 📍 طبرق، ليبيا

---

<div align="center">

*صُنع بحبٍّ للتراث وللبرمجة — طبرق، 2026*

</div>