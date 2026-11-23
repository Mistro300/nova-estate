# NOVA ESTATE — منصة تسويق واستشارات عقارية فاخرة (Portfolio Concept)

> **نوع المشروع:** Concept / Self-Initiated Portfolio Project (مشروع افتراضي لأغراض عرض الأعمال — غير مرتبط بعميل تجاري حقيقي)  
> **الهوية البصرية:** Luxury Editorial Real Estate (`60% Light` / `30% Brand Navy #12243B` / `10% Accent Gold #B99A57` & `#856A2B`)  
> **التقنيات:** `HTML5 (Semantic RTL)` + `CSS3 (Custom Properties / Grid / Flexbox / clamp())` + `Vanilla JavaScript (ES Modules)` + `Local JSON` + `SVG Sprite (Lucide 1.5px)`

---

## 1) نظرة عامة على المشروع

**NOVA ESTATE** هو تطبيق ويب ثابت (*Static Web Application*) متعدد الصفحات صُمّم وطُوّر لاستعراض تجربة بحث عقاري فاخرة وعملية باللغة العربية (`RTL`) دون الاعتماد على أي إطار عمل خارجي أو خادم خلفي:

- **18 وحدة عقارية مفصلة** موزعة على **4 مدن رئيسية** (القاهرة الجديدة، الشيخ زايد، العاصمة الإدارية، الساحل الشمالي) و**5 أنماط عقارية** (شقة فاخرة، فيلا مستقلة، تاون هاوس، دوبلكس/بنتهاوس، وحدة تجارية/إدارية).
- **4 مشروعات عمرانية كبرى** مع نسب الإنجاز الهندسي (`progressPercent`)، سنة التسليم، المرافق الخدمية، وربط ديناميكي بجميع الوحدات التابعة لكل مشروع.
- **بحث سريع من الـ Hero** في `index.html` يوجّه مباشرةً إلى `properties.html` عبر `URL Query Parameters`.
- **فلترة مركّبة وترتيب متقدم** مرتبطة بعنوان الصفحة عبر `history.replaceState` دون إعادة تحميل، مع شريط **Active Filter Chips**، وتبديل ذكي تلقائي عند إدخال `أقل سعر > أعلى سعر`، وتحول لوحة الفلاتر تلقائياً إلى **Filter Drawer** على شاشات الموبايل (`< 992px`).
- **نظام المفضلة المحفوظ محلياً (`LocalStorage`)** تحت المفتاح `nova_estate_favorites_v1` مع عداد حي في الـ Header، و**Favorites Drawer** مشترك عبر جميع الصفحات السبع، وتنظيف تلقائي لأي معرّف عقار محذوف من ملف البيانات.
- **حاسبة أقساط تفاعلية تجريبية وسعر المتر الفوري** في صفحة تفاصيل كل عقار (`property.html?id=...`).
- **معرض صور تفاعلي وLightbox** يدعم التنقل بلوحة المفاتيح (`ArrowLeft`, `ArrowRight`, `Escape`) مع حجز وإعادة التركيز (`Focus Trap`).
- **نموذج طلب معاينة تجريبي** يتحقق من الحقول ويمنع اختيار تواريخ في الماضي ويعرض بطاقة ملخص تأكيد تجريبية داخل المتصفح.

---

## 2) هيكل الملفات (Project Architecture)

```text
nova-estate/
├── index.html                          # الصفحة الرئيسية + Hero البحث السريع
├── properties.html                     # معرض الـ 18 وحدة + الفلاتر + Filter Drawer للموبايل
├── property.html                       # تفاصيل الوحدة + المعرض + حاسبة الأقساط + طلب المعاينة
├── developments.html                   # قائمة الـ 4 مشروعات العمرانية الكبرى
├── development.html                    # تفاصيل المشروع + المرافق + وحدات المشروع
├── about.html                          # قصة الشركة + منهجية العمل + الفريق + 8 أسئلة شائعة
├── contact.html                        # بيانات التواصل التجريبية + نموذج الاستفسار
├── assets/
│   ├── css/
│   │   ├── tokens.css                  # Design Tokens (60/30/10 Colors, Fonts, Spacing, Radii)
│   │   ├── base.css                    # RTL Reset, Fluid Typography, Tabular Numerals
│   │   ├── components.css              # Header, Footer, Cards, Badges, Drawers, Lightbox
│   │   ├── pages.css                   # Page-specific sections & calculators
│   │   └── responsive.css              # Breakpoints from 1440px down to 330px
│   ├── js/
│   │   ├── app.js                      # Main ES Module bootstrapper
│   │   ├── storage.js                  # Safe LocalStorage wrapper (nova_estate_favorites_v1)
│   │   ├── data.js                     # JSON fetchers & Pure testable business logic functions
│   │   ├── ui.js                       # Safe DOM builders (textContent) & formatters
│   │   ├── favorites.js                # Favorites state, Drawer controller & stale-ID cleanup
│   │   └── pages/
│   │       ├── home.js                 # Home page & Hero search routing
│   │       ├── properties.js           # Composite filtering, URL sync, Chips & Filter Drawer
│   │       ├── property.js             # Property details, Lightbox, Calculator & Viewing form
│   │       ├── developments.js         # Developments list & dynamic unit count
│   │       ├── development.js          # Single development details & project units
│   │       ├── about.js                # Accessible FAQ Accordion (faqs.json)
│   │       └── contact.js              # Contact form validation & Demo confirmation
│   ├── data/
│   │   ├── properties.json             # 18 properties dataset
│   │   ├── developments.json           # 4 master developments dataset
│   │   └── faqs.json                   # 8 FAQs dataset
│   ├── icons/
│   │   └── sprite.svg                  # 27 Lucide linear SVG icons (stroke-width="1.5", zero emojis)
│   └── images/
│       ├── placeholder-property.svg    # Fallback architectural SVG
│       ├── properties/                 # Local property architectural graphics
│       └── developments/               # Local development cover graphics
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── CASE-STUDY.md
└── README.md
```

---

## 3) التشغيل المحلي (Local Development)

> **مهم:** يعتمد الموقع على `fetch()` لقراءة ملفات JSON وعلى `<use href="assets/icons/sprite.svg#...">`؛ لذلك **لا تفتح الملفات عبر بروتوكول `file://` مباشرةً**، بل شغّل خادم HTTP محلياً من جذر المشروع.

### باستخدام Python (موصى به):
```bash
python -m http.server 5500
```
*(أو على Windows إذا لم يكن الأمر `python` مضافاً: `py -m http.server 5500`)*

ثم افتح المتصفح على الرابط:
```text
http://localhost:5500/
```

---

## 4) القيم التي يجب استبدالها قبل أو فور النشر النهائي

| العنصر / الملف | القيمة الافتراضية الحالية | ما يجب استبداله عند النشر |
|---|---|---|
| أوامر `git remote` في التوثيق | `GITHUB_USERNAME` | اسم حسابك الفعلي على GitHub |
| `robots.txt` و `sitemap.xml` | `https://nova-estate.pages.dev` | رابط الإنتاج الفعلي بعد أول نشر على Cloudflare Pages أو GitHub Pages |
| `CASE-STUDY.md` | `[LIVE_DEMO_URL]` و `[GITHUB_REPO_URL]` | رابط الـ Live Demo النهائي ورابط مستودع GitHub ونتيجة فحص Lighthouse الفعلية |
| `assets/images/properties/*` | رسوم معمارية SVG محلية (`prop-exterior.svg` إلخ) | يمكنك الإبقاء عليها أو استبدالها بصور WebP فوتوغرافية مرخصة بنفس المسارات أو تحديثها في `properties.json` |
| بيانات التواصل في الـ Footer و`contact.html` | `+20 (2) 2614-9000` / `concierge@nova-estate.demo` | أرقام/بريد العرض التي تفضّلها (مع الإبقاء على وسم المشروع كـ Demo Concept) |

---

## 5) خطوات النشر عبر GitHub + Cloudflare Pages

### 5.1 رفع المشروع إلى GitHub
نفّذ الأوامر التالية داخل مجلد `nova-estate` (بعد استبدال `GITHUB_USERNAME` باسم حسابك):

```bash
git init
git add .
git commit -m "Initial release of NOVA ESTATE luxury real estate portfolio demo"
git branch -M main
git remote add origin https://github.com/Mistro300/nova-estate.git
git push -u origin main
```

### 5.2 الربط مع Cloudflare Pages
1. سجّل الدخول إلى [Cloudflare Dashboard](https://dash.cloudflare.com/) وانتقل إلى **Workers & Pages** ثم اضغط **Create application → Pages → Connect to Git**.
2. اختر مستودع `nova-estate` وحدّد الفرع `main` كفرع الإنتاج (**Production branch**).
3. اضبط إعدادات البناء لموقع ثابت بدون أداة بناء:
   - **Framework preset:** `None`
   - **Build command:** *(اتركه فارغاً)*
   - **Build output directory:** `.` *(أو `/` حسب واجهة Cloudflare لأن `index.html` في الجذر)*
4. اضغط **Save and Deploy** وانتظر اكتمال النشر (عادةً أقل من 30 ثانية)، ثم افتح رابط HTTPS الناتج في نافذة تصفح خاصة (Incognito).

### 5.3 نشر التحديثات اللاحقة
أي تعديل تدفعه إلى الفرع `main` سيُنشر تلقائياً على Cloudflare Pages:
```bash
git add .
git commit -m "Update domain in sitemap.xml and robots.txt"
git push
```

---

## 6) إخلاء المسؤولية (Demo Disclaimer)

جميع الأسماء، المشروعات، الأسعار، أرقام التواصل، وحسابات الأقساط في هذا المشروع هي بيانات تمثيلية (*Demo Data*) لأغراض استعراض مهارات هندسة الواجهات الأمامية وتجربة المستخدم فقط، ولا تمثل عروضاً تجارية أو عقارية حقيقية.
