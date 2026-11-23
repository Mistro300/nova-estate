# Case Study: NOVA ESTATE — شركة تسويق واستشارات عقارية فاخرة

- **العنوان:** `NOVA ESTATE — شركة تسويق عقاري`
- **النوع:** `Concept / Self-initiated Project` — مشروع مفهومي ذاتي المبادرة لم يُنفَّذ لصالح عميل تجاري حقيقي.
- **المجال:** Luxury Editorial Real Estate Web Application
- **اللغة والاتجاه:** العربية (`RTL`) مع تنسيق لاتيني ورقمي دقيق (`Playfair Display` + `Inter tabular-nums` + `IBM Plex Sans Arabic`).

---

## 1) المشكلة والهدف (The Challenge & Solution)

### المشكلة:
تعاني كثير من منصات العرض العقاري من تشتت البيانات وصعوبة المقارنة المباشرة بين الوحدات من حيث **سعر المتر الفعلي**، **تقدير الأقساط الشهرية وربع السنوية**، **حالة التوفر** (متاح / محجوز / تم البيع)، و**نسبة الإنجاز الهندسي للمشروعات**، فضلاً عن ضياع معايير البحث عند مشاركة الروابط أو تصفح الموقع عبر الهاتف المحمول.

### الحل الهندسي والتصميمي:
بناء منصة عقارية ثابتة عالية الأداء تضم **18 وحدة عقارية** و**4 مشروعات عمرانية**، وتوفّر رحلة مستخدم متكاملة:
1. **بحث سريع من الـ Hero** ينقل المستخدم مباشرةً إلى صفحة النتائج المفلترة عبر `URL Query Parameters`.
2. **محرك فلترة مركّب مرتبط بالـ URL (`history.replaceState`)** يدعم التصفية بالكلمة المفتاحية، الغرض، المدينة، النوع، المشروع، النطاق السعري (مع تبديل ذكي تلقائي عند إدخال `أقل سعر > أعلى سعر`)، المساحة، الغرف، الحالة، والمفضلة فقط، مع عرض **Active Filter Chips** قابلة للإزالة بضغطة واحدة، وتحول الشريط الجانبي إلى **Filter Drawer** على الموبايل (`< 992px`).
3. **درج مفضلة مشترك (`Favorites Drawer`)** يعمل عبر جميع الصفحات السبع بالاعتماد على `LocalStorage` (`nova_estate_favorites_v1`) مع تنظيف تلقائي لأي معرّف عقار محذوف من ملف البيانات.
4. **حاسبة أقساط تفاعلية وحساب فوري لسعر المتر (`pricePerSqm`)** عبر دوال JavaScript نقية (`Pure Functions`).
5. **معرض صور تفاعلي مع Lightbox** يدعم التنقل الكامل بلوحة المفاتيح (`ArrowLeft`, `ArrowRight`, `Escape`) وإدارة التركيز (`Focus Trap`).

---

## 2) دوري في المشروع (My Role)

- **UI/UX Design & Design System:**
  - تصميم نظام ألوان `60 / 30 / 10` (`#FFFFFF` & `#F4F6F8` للسطوح، `#12243B` للكحلي المؤسسي، `#B99A57` للذهبي التمييزي، و`#856A2B` للنصوص الذهبية على الخلفيات الفاتحة بتباين `5.13:1` المتوافق مع **WCAG 2.1 AA**).
  - بناء نظام أيقونات خطي محلي بالكامل (`assets/icons/sprite.svg`) بأسلوب **Lucide Icons** (`stroke-width="1.5"`) مع منع استخدام الـ Emojis نهائياً.
- **Frontend Architecture & Development:**
  - تطوير 7 صفحات HTML5 دلالية متجاوبة من `1440px` حتى `330px`.
  - كتابة 12 وحدة `Vanilla JavaScript (ES Modules)` مقسّمة بين طبقة البيانات النقية (`data.js`)، التخزين الآمن (`storage.js`)، بناء عناصر الواجهة الآمن ضد XSS (`ui.js`)، إدارة المفضلة (`favorites.js`)، ووحدات الصفحات (`pages/*.js`).
- **Data Modeling, QA & Deployment:**
  - هيكلة ملفات البيانات (`properties.json`, `developments.json`, `faqs.json`) واختبار الحالات الحدية والنشر عبر GitHub وCloudflare Pages.

---

## 3) التقنيات والأدوات المستخدمة (Tech Stack)

- **الواجهة الأمامية:** `HTML5`, `CSS3` (`Custom Properties`, `CSS Grid`, `Flexbox`, `clamp()`), `Vanilla JavaScript (ES6+ Modules)`
- **البيانات والأصول:** `Local JSON` (`fetch()`), `Local SVG Sprite` (`assets/icons/sprite.svg`), `Local Architectural SVGs`
- **الخطوط:** `Playfair Display` + `Inter (tabular-nums)` + `IBM Plex Sans Arabic`
- **إدارة النسخ والاستضافة:** `Git`, `GitHub`, `Cloudflare Pages`

---

## 4) شاشات العرض المقترحة للبورتفوليو (Showcase Screens)

عند إدراج هذا المشروع في معرض أعمالك، التقط الصور التالية:
1. **Desktop Home (`1440px`):** تُبرز الـ Header الكحلي، شعار `NOVA ESTATE`، نموذج بحث الـ Hero السريع، وبطاقات العقارات المختارة.
2. **Mobile Listings + Filter Drawer (`375px`):** تُظهر شريط **Active Filter Chips** وانزلاق **Filter Drawer** على الموبايل.
3. **Property Detail + Installment Calculator (`1440px`):** تُظهر معرض الصور، سعر المتر المحسوب تلقائياً، حاسبة الأقساط التفاعلية، ونموذج طلب المعاينة التجريبي.
4. **Favorites Drawer (Desktop أو Mobile):** تُظهر درج المفضلة مفتوحاً مع الوحدات المحفوظة في `LocalStorage` وعداد الـ Header الحي.

---

## 5) الأدلة والروابط (Links & Performance Evidence)

> *(استبدل القيم التالية بالروابط الحقيقية ونتيجة فحص Lighthouse الفعلية بعد النشر)*

- **رابط المعاينة الحية (Live Demo HTTPS):** https://nova-estate.pages.dev/
- **رابط الكود المصدري (GitHub Repository):** `https://github.com/Mistro300/nova-estate`
- **تقرير أداء Lighthouse:**
  - *تاريخ وظروف الاختبار:* يُسجَّل بعد تشغيل Lighthouse في نافذة Chrome Incognito على رابط الإنتاج الفعلي (Desktop / Mobile).

---

## 6) الحدود وإخلاء المسؤولية (Scope & Boundaries)

- هذا المشروع مصمم كتطبيق واجهة أمامية ثابت (*Static Frontend Portfolio Concept*) دون خادم خلفي أو قاعدة بيانات.
- نماذج طلب المعاينة والاستفسار وحاسبة الأقساط تعمل بالكامل داخل المتصفح لأغراض المحاكاة التجريبية (*Demo*)، ولا تقوم بحفظ بيانات شخصية على أي خادم أو إجراء حجوزات أو عمليات دفع حقيقية.
