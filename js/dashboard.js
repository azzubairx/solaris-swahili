/**
 * SolarisSwahili — js/dashboard.js
 * NOAA Astronomical computations & High Performance Canvas Plotting
 */
document.addEventListener("DOMContentLoaded", () => {
    'use strict';

    const lat = 32.077; // طبرق افتراضياً
    const canvas = document.getElementById('day-length-chart');
    const ctx = canvas.getContext('2d');

    // الخوارزمية الفلكية بدقة ±1-2 دقيقة للمحاكات الرياضية
    // declination = -23.44 * cos(360/365 * (doy + 10))
    const getDaylightMinutes = (latitude, dayOfYear) => {
        const DEG = Math.PI / 180;
        const decl = -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10)) * DEG;
        const latR = latitude * DEG;
        const cosH = Math.max(-1, Math.min(1, -Math.tan(latR) * Math.tan(decl)));
        return (2 * Math.acos(cosH) / Math.PI) * 12 * 60; // Returns total daylight minutes
    };

    const drawChart = () => {
        // High DPI setup
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentNode.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);

        const colors = {
            line: getComputedStyle(document.body).getPropertyValue('--day-clr').trim(),
            grid: getComputedStyle(document.body).getPropertyValue('--glass-border').trim()
        };

        // رسم المنحنى البياني السلس (365 نقطة x,y)
        ctx.beginPath();
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 3;

        for (let doy = 1; doy <= 365; doy++) {
            const minutes = getDaylightMinutes(lat, doy);
            // تطبيع الوقت الممتد بين أطول يوم وأقصر يوم للارتفاع الشاشوي
            // خط 32 يكون فيه الصيف تقريباً 14 ساعة(840د) والشتاء 10 ساعات(600د)
            const yMap = h - ((minutes - 580) / (860 - 580)) * h;
            const xMap = (doy / 365) * w;
            
            if(doy === 1) ctx.moveTo(xMap, yMap);
            else ctx.lineTo(xMap, yMap);
        }
        ctx.stroke();

        // رسم خط الاعتدال 12 ساعة (720 دقيقة)
        const eqY = h - ((720 - 580) / (860 - 580)) * h;
        ctx.beginPath();
        ctx.moveTo(0, eqY);
        ctx.lineTo(w, eqY);
        ctx.strokeStyle = colors.grid;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.stroke();
    };

    drawChart();

    // Redraw smartly on screen resize without lagging
    let timeout;
    window.addEventListener('resize', () => {
        clearTimeout(timeout);
        timeout = setTimeout(drawChart, 200);
    });
});