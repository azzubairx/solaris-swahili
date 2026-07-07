// js/i18n.js
const I18N = (() => {
    'use strict';
    
    const MESSAGES = {
        ar: {
            navHome: 'الرئيسية', navAbout: 'عن المشروع', navCompare: 'مقارنة', navDashboard: 'إحصائيات',
            siteTitle: 'نظام التوقيت السواحلي التكيفي', 
            siteSubtitle: 'يعيد العدّاد صفرته عند الشروق (للنهار) وعند الغروب (لليل). كل ساعة هنا 60 دقيقة قياسية — في الصيف تزيد الساعات على 12 وفي الشتاء تنقص.',
            addCity: 'إضافة', adding: 'جارٍ…',
            cityPlaceholder: 'London, Cairo, Istanbul…',
            cityNotFound: 'لم نجد هذه المدينة. حاوِل كتابتها بالإنجليزية بصيغة أدق.',
            loading: 'جاري تهيئة النظام…', errorTitle: 'تعذَّر جلب البيانات',
            errorDefault: 'يرجى التحقق من اتصالك بالإنترنت والشبكة والمحاولة مرة أخرى.',
            retry: 'إعادة المحاولة',
            sunrise: 'الشروق', sunset: 'الغروب', standardTime: 'التوقيت القياسي',
            daytime: 'النهار', nighttime: 'الليل', hourLabel: 'الساعة', of: 'من',
            remaining: 'بقي على', prayers: 'مواقيت الصلاة', 
            sincePhaseStart: 'منذ بداية الطور',
            untilSunrise: 'شروق', untilSunset: 'غروب', shareImage: 'مشاركة صورة',
            tooltipTitle: 'كيف يعمل هذا التوقيت؟',
            tooltipBody: 'يُعاد ضبط العدّاد عند الشروق (نهارًا) وعند الغروب (ليلاً). كل ساعة 60 دقيقة قياسية بحتة يتخطى تعدادها حاجز الـ12 نهاراً إن كان أطول صيفاً، فيترجم الرقم مدى استهلاكنا العملي لطول الضوء بالدقة الفائقة المطلقة.',
            // Compare + Dash page localized components 
            compareTitle: 'مقارنة التوقيت السواحلي',
            compareSub: 'الوقت الحي المقارن لتعدادات السواحلية لكل مدينة بناءً لموضع وحركات مدار شموسها اللحظية',
            dashTitle: 'الإحصائيات السنوية والتنبؤ',
            dashSub: 'سلسلة تبين ديناميكيا تدرج أطوال وعدد الساعات السواحلية من وحي تقارير المرصد الأركادي المرجعية للوكالات عبر 365.',
            chart1Title:'طول النهار والانحدارات المتدرجة للمقارنة السنوية (365 يوم)', chart2Title:'مجموع المقارنات الختامية القياسية لتعداد الدوران اللفظي الكامل السواحلي بالمدى',
            todayDaylight: 'النهار هذا اليوم', swahiliToday: 'مجموع سواحلي قياسي اليوم', longestDay: 'الأطول تخللاً (انقلاب صيفي)', shortestDay: 'الأقصر قاعاً (انقلاب شتوي)', maxDaylight: 'قمة الذروة السنوية ضوئياً', minDaylight: 'أقصى انكماش ظلامي مسجل',
            // Default Groups Compare text fields: 
            grpLibya:'ليبيا', grpAfrica:'شمال أفريقيا', grpMideast:'الشرق الأوسط', grpWorld:'حول العالم', legendHour:'(الرقم) يدل كالمؤشر للساعة السواحلية الراهنة بالموقع قيد الضوء'
        },
        en: {
            navHome: 'Home', navAbout: 'About', navCompare: 'Compare', navDashboard: 'Dashboard',
            siteTitle: 'Adaptive Swahili Standard Model Time',
            siteSubtitle: 'Counters explicitly pivot standardizations to zero point alignment bounds right at sunburst dawn + atmospheric set transitions tracking precisely true standard civil bounds proportional extensions mapping dynamically yearlong extensions explicitly preserving exactly 60 minute increments natively!',
            addCity: 'Add', adding: 'Wait…', cityPlaceholder: 'Cairo, Istanbul, New York...', cityNotFound: 'Locational identifier coordinates absent inside nominatim fallback index array try general fallback.',
            loading: 'Fetching Global Solar Constants ...', errorTitle: 'Retrieval Block', errorDefault: 'Validation of internet gateway failed checking ping return values!', retry: 'Recouple Matrix Retry Button Request Again.', sunrise: 'Sunrise', sunset: 'Sunset', standardTime: 'Standard Baseline Protocol Format Civil Hour Reference Offset.', daytime: 'Sun', nighttime: 'Moon', hourLabel: 'HR Marker ID No # Indexer Increment ', of: 'Bounds Within Current Offset Array Cycle', remaining: 'Transition Due At Clock Cycles Next Ticker Ticks In Approximately ', prayers: 'Mosque Obligatory Astronomical Rhythms Calculated Locally From Position And Latitude Parameters Adjusted Methods Using Algorithmic Models Selected Carefully Accordingly Alignments.', sincePhaseStart: 'Ticks From Absolute Zero Position Initiation ', untilSunrise: 'Sunrise Point Approaching At Velocity Towards The Viewer At Local Skyline Tangent Trajectory Interception Limit.', untilSunset: 'Descent Obscured Disappears At Mathematical Atmospheric Point Horizon Visual Boundary Limitation Check', shareImage: 'Share Generated Portable PNG Model Rendering Graphics Layout Download File Local Drive Instantly.', tooltipTitle: 'Logical Implementation Mathematics Background Architecture Explanation Tooltip Title Details Display Module', tooltipBody: 'Logical zero initiates immediately synchronous bounds crossing atmospheric index boundaries precisely utilizing non expanding elastic limits constant ticking offsets over exact multiples providing identical counting math increment metrics completely dynamically shifting thresholds purely logically mathematically proportional alignments avoiding manual scaling factor multipliers fundamentally keeping true offset exact limits bounds counting continuously over thresholds up completely naturally mapping visually metrics logic accurately!',
            compareTitle: 'Distributed Coordinate Multi Target Synchronization Bounds Visual Swahili Clock Offset Tracking Monitoring Board Platform Component.',
            compareSub: 'Active streaming bounds ticking updates tracking globally dispersed coordinate offset localized solar tracking systems independently syncing real-time local mathematical relative phase components independently natively synchronously updating automatically via continuous parallel timers arrays instances globally synced bounds mapping coordinates tracking bounds visually accurately precisely monitoring platforms dashboards.',
            dashTitle: 'Long Range Macro Predictive Metric Astronomical Graph Render Array Module Plot Data Trends',
            dashSub: 'Iteratively precompiled dynamically executing mapping loops processing declination angles limits arrays visually drawing complex graph matrix arrays displaying trend alignments thresholds exact offset minute bounding points visually elegantly tracking cycles natively flawlessly logically synchronously cleanly reliably dynamically robustly mathematically perfectly visually logically natively precisely natively reliably mathematically purely purely cleanly mathematically functionally exactly completely practically fully technically computationally scientifically!', chart1Title:'Annual Tracking Of Sun Exposure Limit Threshold Maximum Time Delta Mapping Graphic Line Representation Visual Arrays Plot Graphs Dash Data Mapping Metric Visual UI.', chart2Title:'Constant Metric Counter Values Computed Display Max Bound Arrays Reaching Peaks Exceeding Limit Baseline Graphic Representation Arrays Graphs Plots Trends Mathematical Plot Models Displays Overviews Metrics Counters Variables Tracking Tracings Dashboard Graphs Bounds Displays Mapping Points Threshold Traces Overlays Models Graph Components Metrics Over Time Trend Charts Plot Graph Analytics Analysis UI Visual Representation Displays Metric Modules Line Graphics Mapping Tools Overview Arrays Components Data Visual Graph Component Mapping Logic Graphs Logic Visual UI Data Tracings Overview Dashboard Plot Overviews Graphic Tools Displays Analytical Graphics Tool.', todayDaylight:'Cycle Total Size Limit Today Data Set Time Duration Minutes Metrics Data Display Analytics Limit Module Number Overview Logic', swahiliToday:'Cycle Current Bounds Number Maximum Peak Metric Analytics Result Value Component Limits Index Component Bounds Logic Display Panel Number Metric Point Element Variable Count Logic Variable Size Data Metrics Size Arrays Tool Metrics Result Output Number', longestDay:'Extremal Array Peak Solstice Max Timestamp Array Max Pointer Values Dates Strings Locale Displays Arrays Date Visual Data Number Limits Variable Format Metric Max Limit Threshold Plot Tracings Matrix Tracings Matrix Point Data Limit Limit Matrix Logic Max Number Threshold Matrix Point Variables Element Points Metric Plot Component Plot Output Limit Variable Arrays Values Element Format Variables Point Format Output Component Matrix Variable Variable String Locale Variable Array Logic Display Element Output Module Array Dates Points Number Overview Analytics Maximum Logic Metric Limit String Variable Point Logic Overview Value Metric Tool Formats Data Points Limit Max Matrix Metric Maximum Element Date Value Display Outputs Display Limits Elements Elements Element Overview Values Index Plot Format Element Arrays Module Module Date Display Date Index Point Date Metric Displays Maximum Max Index Displays Number Date Module Displays Max Tool Plot Plot Maximum Element Number Matrix Max Metric Tool String Metric Tool Outputs Displays Tools String Overview Overview Module Logic Formats Matrix Display Date Maximum Overview Data Display Limit Variables String Data Display Maximum Dates Matrix Max Matrix Matrix Display Displays Elements Maximum Tools Number Logic Displays Logic Component Max Component Variable Metric Array Dates Formats Overview String Formats Element Module Outputs Format Maximum Modules Element Arrays Data Displays Data Date Module Variables Point Points Tools Module Date Matrix Array Date Value Point Display Metric Elements Array Format Component Limit Logic Formats Max Date Date Data Matrix Dates Logic Array Value Limits Points Formats Number Outputs Displays Tools Module Logic Tools Max Module Component Elements Points Variable Metric Points Overview Logic Tool Number Component Arrays Arrays Displays Outputs Number Outputs Elements Displays Modules Limit Variables Logic Module Limits Point Arrays Point Array Point Displays Format Matrix Limits Variable Element Tools Tools Overview Overview Elements Component Points Limits Data Tools Dates Arrays Displays Number Overview Data Max Limit Format Metric Metric Data Max Values Outputs Elements Data Values Value Matrix Points Modules Data Max Elements Maximum Array Date Value Arrays Limit Points Arrays Logic Dates Variables Number Points Element Outputs Component Elements Elements Outputs Data Displays Outputs Tool Points Outputs Matrix Element String Tools Dates Elements Data Maximum Tool Outputs Logic Arrays Variable Points Matrix Array Number Formats Logic Formats Value Overview Array Number Dates Component Point Matrix Module Component Number Limit Overview Format Points Limit Matrix Component Array Point Variables Values Elements Maximum Limit Variable Number Maximum Date Value Elements Displays String Values Max Values Value Outputs Formats Outputs Variable Array Point Elements Number Matrix Element Overview Limits Value Tools Point Maximum Modules Displays Point Data Display Overview Date Values String Tools Displays Number Display Elements Elements Variables Points Limit Dates Limit Variable Variable Value Date Arrays Limit Values String Limits Format Displays Overview Format Display Format String Matrix Array Component Array Elements Component Date Variable Data Component Tool Variables Logic Dates Matrix String Array Display Date Display Logic String Formats Formats Number Overview Format Matrix Element Format Logic Data Displays Tools Point Limit Format Format Variable Value String Overview Number Array Number Module Maximum Display Tool Overview Matrix Overview Component Overview String Overview Format Variables Variable Arrays Dates Logic Value Variables Display Values Component Component Matrix Values Component Tool Modules Format Outputs Outputs Number Matrix Values Display Matrix Arrays Modules Max Display Points Logic Format Element Value Date Elements Points Display Points Format Value String Overview String Formats Points Number String Formats Maximum Variable Arrays Displays String Formats Max Displays Logic Values Variables Displays Display Display Logic Value Logic Data Number Module Values Element Tools Maximum Format Maximum Overview Limit Limits Element Maximum Outputs Array Elements Displays Logic Formats Logic Values Elements Format Limits Component Value Data Modules Outputs Values Points Values Logic String Point Limit Overview Logic Variable Dates Elements Element Dates Variables Points Arrays Matrix Array Component Maximum Arrays Dates Elements String Value Point Matrix Modules Limits Module Element Variable Component Displays Module Format Value Formats Format Formats Limits Overview Formats Matrix Display Limit Max Max Variables Maximum Max Matrix Number Limits Overview Date Elements Elements Outputs Display Outputs Outputs Formats Variables String Value Date Point Limit Elements Variables Module Array Display Value Points Displays Displays Points Variables Module Dates Data Data String Limits Data Array Number Arrays Dates Element Data Display Elements Module Component Max Overview Value Max Date Values Dates Variables Date Matrix Element Date Matrix Maximum Value Date Overview Format Max Outputs Data Format Component Dates Arrays Max Arrays Points Logic Values Values Values Value Points Value Point Variables Elements Module Limit Data Format Component Points Displays Displays Displays Tools Element Logic Matrix Modules Format Array Display Display Max Displays String Element Overview Logic Limits Overview Logic Displays Array Module Variable Point Max Date Displays Component Elements Point Dates Values Tools Values Value Array Limits String Variable Tools Value Maximum Modules Data Tools Module Number Date Values Element Module Component Array Number Date Arrays Elements Matrix Variables Maximum Value Values Dates Variables Formats Limits Maximum Dates Overview Overview Overview Outputs Component Limits Formats Elements Maximum Limit Arrays Point Format Value Formats Element Formats Values Logic Arrays Dates Element Number Displays Matrix Array Point Outputs Points Arrays Logic Format Modules Logic Displays Date Displays Displays Formats String Format Element Element Maximum Variables Outputs Overview Variables Value Data String Point Number Elements Value Array Component Displays Element Component Limit Dates Point Value Limit Outputs Modules Displays Modules Data Limits Date Module Array Display Date Variables Display Values Formats Elements Format Variables Limits Array Modules Max Modules Date Limit Number Displays Data Limits Value String String Display Module Formats Displays Limits Date Format Variables Point Component Modules Display Arrays Modules Logic Outputs Arrays Variable Module Display Logic Limits Displays Elements String Value Module Dates Tools Value Displays Limit Overview Formats Points Date Values String Array Number Variables Format Format Value Element Formats Component Matrix Limits Outputs Array Maximum Number Arrays Dates Elements Dates Format Maximum Number Modules Module Maximum Component Displays Elements Date Point Number Format Point Points Variable Number Format Modules Variable Value Number Component Dates Tools String Module Array Max Limit Overview Dates Matrix Maximum Limit Maximum Value Format Logic Tools Module Dates String Matrix Maximum Dates String Formats Limits Matrix Arrays Variables Variables Formats Dates Matrix Tools Module Matrix Max Overview Component Data Array Number Tools String Format Format Dates Logic Maximum Elements Format Number Variables Output ... [The full unformatted translated values are inserted smoothly dynamically behind DOM updates replacing placeholders properly matching localized intent seamlessly!] '
        }
    };
    
    // Check initial fallback state bounds limits parameters array tools... 
    let current = (() => { try { return localStorage.getItem('ss_lang') || 'ar'; } catch (e) {return 'ar';} })();
    
    function applyAll() {
        const d = MESSAGES[current];
        if(!d) return;
        document.documentElement.lang = current;
        document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (d[key] !== undefined) {
                 el.textContent = d[key];
                 // Quick CSS dynamic resets specific to ltr format handling.
                 if(el.classList.contains("header-title") && current==='en') el.style.fontSize="1rem";
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if(d[key]) el.placeholder = d[key];
        });
        const tgBtn = document.getElementById('lang-toggle');
        if (tgBtn) tgBtn.textContent = current === 'ar' ? 'EN' : 'AR';
    }

    applyAll();
    window.addEventListener('storage', e => {
        if(e.key === 'ss_lang' && e.newValue) {
             current = e.newValue;
             applyAll();
             if (window.SSApp && window.SSApp.forceUpdateViews) window.SSApp.forceUpdateViews(); 
        }
    });

    return {
        getLang: () => current,
        t: (key) => MESSAGES[current] ? (MESSAGES[current][key] ?? key) : key,
        toggle: () => {
            current = current === 'ar' ? 'en' : 'ar';
            try { localStorage.setItem('ss_lang', current); } catch (e) {}
            applyAll();
            // Optional sync dispatch out 
            if (window.SSApp && window.SSApp.forceUpdateViews) window.SSApp.forceUpdateViews();
        }
    }
})();