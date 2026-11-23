/* ==========================================================================
   NOVA ESTATE — UI Rendering & Formatting Helpers (assets/js/ui.js)
   Uses safe DOM creation (textContent) and local SVG sprite icons.
   Matches the Luxury Editorial Mockup Card Anatomy (Gold Price Badge,
   Gold Delivery Badge, Progress Bars, and Tabular Numerals).
   ========================================================================== */

export const PLACEHOLDER_IMAGE = 'assets/images/placeholder-property.svg';

export const TYPE_LABELS = {
  apartment: 'شقة فاخرة',
  villa: 'فيلا مستقلة',
  townhouse: 'تاون هاوس',
  duplex: 'دوبلكس / بنتهاوس',
  commercial: 'وحدة تجارية / إدارية'
};

export const PURPOSE_LABELS = {
  sale: 'للبيع',
  rent: 'للإيجار'
};

export const STATUS_LABELS = {
  available: 'متاح',
  reserved: 'محجوز',
  sold: 'تم البيع'
};

export const STATUS_BADGE_CLASSES = {
  available: 'badge--available',
  reserved: 'badge--reserved',
  sold: 'badge--sold'
};

export const DEVELOPMENT_LABELS = {
  'dev-001': 'أوريليا ريزيدنس',
  'dev-002': 'سولاريس بارك',
  'dev-003': 'فيرتكس كابيتال',
  'dev-004': 'أزور باي رأس الحكمة'
};

const numberFormatter = new Intl.NumberFormat('en-US');

/**
 * Formats a number with standard English thousand separators for tabular alignment.
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return numberFormatter.format(Math.round(num));
}

/**
 * Formats price in EGP (e.g., "8,450,000 EGP").
 * @param {number} priceEGP
 * @param {string} [purpose]
 * @returns {string}
 */
export function formatPriceEGP(priceEGP, purpose = 'sale') {
  const base = `${formatNumber(priceEGP)} EGP`;
  return purpose === 'rent' ? `${base} / سنوياً` : base;
}

/**
 * Creates an SVG icon element referencing assets/icons/sprite.svg.
 * @param {string} iconName e.g. 'icon-bed'
 * @param {string} sizeClass 'icon--sm' | 'icon--md' | 'icon--lg'
 * @returns {SVGSVGElement}
 */
export function createSvgIcon(iconName, sizeClass = 'icon--sm') {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', `icon ${sizeClass}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const use = document.createElementNS(svgNS, 'use');
  use.setAttribute('href', `assets/icons/sprite.svg#${iconName}`);
  svg.appendChild(use);
  return svg;
}

/**
 * Attaches an onerror fallback to an <img> element so broken image URLs
 * degrade cleanly to the local architectural placeholder SVG.
 * @param {HTMLImageElement} imgEl
 */
export function bindImageFallback(imgEl) {
  if (!imgEl) return;
  imgEl.addEventListener(
    'error',
    () => {
      if (imgEl.dataset.fallbackApplied === '1') return;
      imgEl.dataset.fallbackApplied = '1';
      imgEl.src = PLACEHOLDER_IMAGE;
    },
    { once: true }
  );
}

/**
 * Attaches fallback listeners to all images inside a given root element.
 * @param {ParentNode} root
 */
export function attachAllImageFallbacks(root = document) {
  const imgs = root.querySelectorAll('img');
  imgs.forEach((img) => bindImageFallback(img));
}

/**
 * Builds a complete Property Card DOM element matching the uploaded Luxury Design:
 * - Rounded image with circular Favorite button top-left
 * - Status badge top-right
 * - Overlapping Solid Gold Price Pill at bottom-right of image
 * - Right-aligned Title, City/District subtitle, Specs row, and "تفاصيل الوحدة" link
 * @param {Object} property
 * @param {boolean} isFavorite
 * @returns {HTMLElement}
 */
export function createPropertyCard(property, isFavorite = false) {
  const article = document.createElement('article');
  article.className = 'property-card';
  article.dataset.propertyId = property.id;

  const detailUrl = `property.html?id=${encodeURIComponent(property.id)}`;
  const primaryImage =
    Array.isArray(property.images) && property.images.length > 0
      ? property.images[0]
      : PLACEHOLDER_IMAGE;

  // 1. Media container
  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'property-card__media-wrap';

  const media = document.createElement('div');
  media.className = 'property-card__media';

  const imgLink = document.createElement('a');
  imgLink.href = detailUrl;
  imgLink.tabIndex = -1;
  imgLink.setAttribute('aria-hidden', 'true');

  const img = document.createElement('img');
  img.src = primaryImage;
  img.alt = `${property.title} — ${property.city}`;
  img.className = 'property-card__img';
  img.width = 800;
  img.height = 600;
  img.loading = 'lazy';
  bindImageFallback(img);
  imgLink.appendChild(img);
  media.appendChild(imgLink);

  // Top-Right Status/Purpose Badges
  const badges = document.createElement('div');
  badges.className = 'property-card__badges';

  const purposeBadge = document.createElement('span');
  purposeBadge.className = 'badge badge--purpose';
  purposeBadge.textContent = PURPOSE_LABELS[property.purpose] || 'للبيع';
  badges.appendChild(purposeBadge);

  if (property.status && property.status !== 'available') {
    const statusBadge = document.createElement('span');
    const statusClass = STATUS_BADGE_CLASSES[property.status] || 'badge--available';
    statusBadge.className = `badge ${statusClass}`;
    statusBadge.textContent = STATUS_LABELS[property.status] || 'متاح';
    badges.appendChild(statusBadge);
  }

  media.appendChild(badges);

  // Favorite Button (Top-Left in RTL)
  const favBtn = document.createElement('button');
  favBtn.type = 'button';
  favBtn.className = 'property-card__fav-btn';
  favBtn.dataset.favBtn = property.id;
  favBtn.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
  favBtn.setAttribute(
    'aria-label',
    isFavorite
      ? `إزالة ${property.title} من المفضلة`
      : `إضافة ${property.title} إلى المفضلة`
  );
  favBtn.appendChild(
    createSvgIcon(isFavorite ? 'icon-heart-filled' : 'icon-heart', 'icon--md')
  );
  media.appendChild(favBtn);

  mediaWrap.appendChild(media);

  // Overlapping Bottom-Right Solid Gold Price Badge
  const pricePill = document.createElement('div');
  pricePill.className = 'property-card__price-pill num-tabular';
  pricePill.textContent = formatPriceEGP(property.priceEGP, property.purpose);
  mediaWrap.appendChild(pricePill);

  article.appendChild(mediaWrap);

  // 2. Card Body
  const body = document.createElement('div');
  body.className = 'property-card__body';

  // Title
  const titleEl = document.createElement('h3');
  titleEl.className = 'property-card__title';
  const titleLink = document.createElement('a');
  titleLink.href = detailUrl;
  titleLink.textContent = property.title;
  titleEl.appendChild(titleLink);
  body.appendChild(titleEl);

  // Location Subtitle
  const locationEl = document.createElement('p');
  locationEl.className = 'property-card__location';
  locationEl.appendChild(createSvgIcon('icon-map-pin', 'icon--sm'));
  const locationText = document.createElement('span');
  locationText.textContent = `${property.city} — ${property.district}`;
  locationEl.appendChild(locationText);
  body.appendChild(locationEl);

  // Specs Row (Bedrooms • Bathrooms • Area m²)
  const specsEl = document.createElement('div');
  specsEl.className = 'property-card__specs';
  specsEl.setAttribute('aria-label', 'مواصفات العقار');

  // Bedrooms
  const bedItem = document.createElement('span');
  bedItem.className = 'property-card__spec-item';
  bedItem.appendChild(createSvgIcon('icon-bed', 'icon--sm'));
  const bedText = document.createElement('span');
  if (Number(property.bedrooms) > 0) {
    const bedNum = document.createElement('strong');
    bedNum.className = 'num-tabular';
    bedNum.textContent = String(property.bedrooms);
    bedText.append(bedNum);
  } else {
    bedText.textContent = 'إداري';
  }
  bedItem.appendChild(bedText);

  // Bathrooms
  const bathItem = document.createElement('span');
  bathItem.className = 'property-card__spec-item';
  bathItem.appendChild(createSvgIcon('icon-bath', 'icon--sm'));
  const bathNum = document.createElement('strong');
  bathNum.className = 'num-tabular';
  bathNum.textContent = String(property.bathrooms);
  bathItem.appendChild(bathNum);

  // Area
  const areaItem = document.createElement('span');
  areaItem.className = 'property-card__spec-item';
  areaItem.appendChild(createSvgIcon('icon-area', 'icon--sm'));
  const areaText = document.createElement('span');
  areaText.className = 'num-tabular';
  areaText.textContent = `area: ${formatNumber(property.areaSqm)} m²`;
  areaItem.appendChild(areaText);

  specsEl.append(bedItem, bathItem, areaItem);
  body.appendChild(specsEl);

  // Footer Link ("تفاصيل الوحدة")
  const footerEl = document.createElement('div');
  footerEl.className = 'property-card__footer';

  const deliverySpan = document.createElement('span');
  deliverySpan.textContent = `${TYPE_LABELS[property.type] || property.type} • ${property.deliveryYear}`;

  const ctaLink = document.createElement('a');
  ctaLink.href = detailUrl;
  ctaLink.className = 'property-card__cta';
  const ctaText = document.createElement('span');
  ctaText.textContent = 'تفاصيل الوحدة';
  ctaLink.append(ctaText);

  footerEl.append(deliverySpan, ctaLink);
  body.appendChild(footerEl);

  article.appendChild(body);
  return article;
}

/**
 * Builds a Development Card DOM element matching the uploaded Developments Mockup:
 * - Architectural image with overlapping Gold Delivery Year Badge (2026 / 2027)
 * - Project Name & City subtitle
 * - Starting Price row with Gold price value
 * - Gold Progress Bar with percentage on the right/left
 * - Full-width Gold CTA button "وحدات المشروع"
 * @param {Object} dev
 * @param {number} unitsCount
 * @returns {HTMLElement}
 */
export function createDevelopmentCard(dev, unitsCount = 0) {
  const article = document.createElement('article');
  article.className = 'dev-card';
  article.dataset.developmentId = dev.id;

  const detailUrl = `development.html?id=${encodeURIComponent(dev.id)}`;

  // Media Wrapper
  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'dev-card__media-wrap';

  const media = document.createElement('div');
  media.className = 'dev-card__media';

  const imgLink = document.createElement('a');
  imgLink.href = detailUrl;
  imgLink.tabIndex = -1;
  imgLink.setAttribute('aria-hidden', 'true');

  const img = document.createElement('img');
  img.src = dev.cover || PLACEHOLDER_IMAGE;
  img.alt = `مشروع ${dev.name} في ${dev.city}`;
  img.className = 'dev-card__img';
  img.width = 800;
  img.height = 450;
  img.loading = 'lazy';
  bindImageFallback(img);
  imgLink.appendChild(img);
  media.appendChild(imgLink);

  // Units count badge top-right
  const unitsBadge = document.createElement('span');
  unitsBadge.className = 'dev-card__units-tag';
  unitsBadge.textContent = `${unitsCount} وحدات`;
  media.appendChild(unitsBadge);

  mediaWrap.appendChild(media);

  // Overlapping Gold Delivery Year Pill
  const yearPill = document.createElement('span');
  yearPill.className = 'dev-card__year-pill num-tabular';
  yearPill.textContent = String(dev.deliveryYear);
  mediaWrap.appendChild(yearPill);

  article.appendChild(mediaWrap);

  // Body
  const body = document.createElement('div');
  body.className = 'dev-card__body';

  // Extract clean Arabic title
  const cleanTitle = String(dev.name).split('—')[0].trim();

  const titleEl = document.createElement('h3');
  titleEl.className = 'dev-card__title';
  const titleLink = document.createElement('a');
  titleLink.href = detailUrl;
  titleLink.textContent = cleanTitle;
  titleEl.appendChild(titleLink);
  body.appendChild(titleEl);

  const cityEl = document.createElement('p');
  cityEl.className = 'dev-card__city';
  cityEl.textContent = dev.city;
  body.appendChild(cityEl);

  // Starting Price Row
  const priceRow = document.createElement('div');
  priceRow.className = 'dev-card__price-row';

  const priceLabel = document.createElement('span');
  priceLabel.className = 'dev-card__price-label';
  priceLabel.textContent = 'السعر المبدئي';

  const priceVal = document.createElement('span');
  priceVal.className = 'dev-card__price-val num-tabular';
  priceVal.textContent = `${formatNumber(dev.startingPriceEGP)} EGP`;

  priceRow.append(priceLabel, priceVal);
  body.appendChild(priceRow);

  // Progress bar row (Percentage + Bar inline like mockup)
  const progressRow = document.createElement('div');
  progressRow.className = 'dev-card__progress-row';

  const pctVal = document.createElement('span');
  pctVal.className = 'dev-card__progress-pct num-tabular';
  pctVal.textContent = `${dev.progressPercent}%`;

  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuenow', String(dev.progressPercent));
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-label', `نسبة إنجاز ${dev.name}`);

  const fill = document.createElement('div');
  fill.className = 'progress-bar__fill';
  fill.style.width = `${Math.min(100, Math.max(0, Number(dev.progressPercent) || 0))}%`;
  bar.appendChild(fill);

  progressRow.append(pctVal, bar);
  body.appendChild(progressRow);

  // Full-width Gold CTA button
  const ctaBtn = document.createElement('a');
  ctaBtn.href = detailUrl;
  ctaBtn.className = 'btn btn--primary btn--full dev-card__btn';
  ctaBtn.textContent = 'وحدات المشروع';
  body.appendChild(ctaBtn);

  article.appendChild(body);
  return article;
}
