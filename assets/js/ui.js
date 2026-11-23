/* ==========================================================================
   NOVA ESTATE — UI Rendering & Formatting Helpers (assets/js/ui.js)
   Uses safe DOM creation (textContent) and local SVG sprite icons.
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
 * Builds a complete Property Card DOM element following the exact Luxury Editorial anatomy.
 * Uses safe textContent assignments for all data fields.
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

  // Badges (Top-Right in RTL)
  const badges = document.createElement('div');
  badges.className = 'property-card__badges';

  const purposeBadge = document.createElement('span');
  purposeBadge.className = 'badge badge--purpose';
  purposeBadge.textContent = PURPOSE_LABELS[property.purpose] || 'للبيع';
  badges.appendChild(purposeBadge);

  const statusBadge = document.createElement('span');
  const statusClass = STATUS_BADGE_CLASSES[property.status] || 'badge--available';
  statusBadge.className = `badge ${statusClass}`;
  statusBadge.textContent = STATUS_LABELS[property.status] || 'متاح';
  badges.appendChild(statusBadge);

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

  article.appendChild(media);

  // 2. Card Body
  const body = document.createElement('div');
  body.className = 'property-card__body';

  // Price Row
  const priceRow = document.createElement('div');
  priceRow.className = 'property-card__price-row';

  const priceEl = document.createElement('span');
  priceEl.className = 'property-card__price';
  priceEl.textContent = formatPriceEGP(property.priceEGP, property.purpose);

  const typeTag = document.createElement('span');
  typeTag.className = 'property-card__type-tag';
  typeTag.textContent = TYPE_LABELS[property.type] || property.type;

  priceRow.append(priceEl, typeTag);
  body.appendChild(priceRow);

  // Title
  const titleEl = document.createElement('h3');
  titleEl.className = 'property-card__title';
  const titleLink = document.createElement('a');
  titleLink.href = detailUrl;
  titleLink.textContent = property.title;
  titleEl.appendChild(titleLink);
  body.appendChild(titleEl);

  // Location
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
    bedText.append(bedNum, ' غرف');
  } else {
    bedText.textContent = 'إداري/تجاري';
  }
  bedItem.appendChild(bedText);

  // Bathrooms
  const bathItem = document.createElement('span');
  bathItem.className = 'property-card__spec-item';
  bathItem.appendChild(createSvgIcon('icon-bath', 'icon--sm'));
  const bathText = document.createElement('span');
  const bathNum = document.createElement('strong');
  bathNum.className = 'num-tabular';
  bathNum.textContent = String(property.bathrooms);
  bathText.append(bathNum, ' حمام');
  bathItem.appendChild(bathText);

  // Area
  const areaItem = document.createElement('span');
  areaItem.className = 'property-card__spec-item';
  areaItem.appendChild(createSvgIcon('icon-area', 'icon--sm'));
  const areaText = document.createElement('span');
  areaText.className = 'num-tabular';
  areaText.textContent = `${formatNumber(property.areaSqm)} m²`;
  areaItem.appendChild(areaText);

  specsEl.append(bedItem, bathItem, areaItem);
  body.appendChild(specsEl);

  // Footer
  const footerEl = document.createElement('div');
  footerEl.className = 'property-card__footer';

  const deliverySpan = document.createElement('span');
  const shortFinishing = String(property.finishing || '').split(' ').slice(0, 3).join(' ');
  deliverySpan.textContent = `استلام ${property.deliveryYear} • ${shortFinishing}`;

  const ctaLink = document.createElement('a');
  ctaLink.href = detailUrl;
  ctaLink.className = 'property-card__cta';
  const ctaText = document.createElement('span');
  ctaText.textContent = 'التفاصيل';
  ctaLink.append(ctaText, createSvgIcon('icon-chevron-left', 'icon--sm'));

  footerEl.append(deliverySpan, ctaLink);
  body.appendChild(footerEl);

  article.appendChild(body);
  return article;
}

/**
 * Builds a Development Card DOM element with dynamic unit count and progress bar.
 * @param {Object} dev
 * @param {number} unitsCount
 * @returns {HTMLElement}
 */
export function createDevelopmentCard(dev, unitsCount = 0) {
  const article = document.createElement('article');
  article.className = 'dev-card';
  article.dataset.developmentId = dev.id;

  const detailUrl = `development.html?id=${encodeURIComponent(dev.id)}`;

  // Media
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

  const badges = document.createElement('div');
  badges.className = 'dev-card__overlay-badges';

  const cityBadge = document.createElement('span');
  cityBadge.className = 'badge badge--purpose';
  cityBadge.textContent = dev.city;

  const unitsBadge = document.createElement('span');
  unitsBadge.className = 'badge badge--gold';
  unitsBadge.textContent = `${unitsCount} وحدات مدرجة`;

  badges.append(cityBadge, unitsBadge);
  media.appendChild(badges);
  article.appendChild(media);

  // Body
  const body = document.createElement('div');
  body.className = 'dev-card__body';

  const titleEl = document.createElement('h3');
  titleEl.className = 'dev-card__title';
  const titleLink = document.createElement('a');
  titleLink.href = detailUrl;
  titleLink.textContent = dev.name;
  titleEl.appendChild(titleLink);
  body.appendChild(titleEl);

  const summaryEl = document.createElement('p');
  summaryEl.className = 'dev-card__summary';
  summaryEl.textContent = dev.summary;
  body.appendChild(summaryEl);

  // Progress bar
  const progressWrap = document.createElement('div');
  progressWrap.className = 'dev-card__progress';

  const progressHeader = document.createElement('div');
  progressHeader.className = 'dev-card__progress-header';
  const progressLabel = document.createElement('span');
  progressLabel.textContent = 'نسبة الإنجاز الإنشائي';
  const progressVal = document.createElement('span');
  progressVal.className = 'num-tabular';
  progressVal.textContent = `${dev.progressPercent}%`;
  progressHeader.append(progressLabel, progressVal);

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

  progressWrap.append(progressHeader, bar);
  body.appendChild(progressWrap);

  // Meta Footer
  const meta = document.createElement('div');
  meta.className = 'dev-card__meta';

  const priceMeta = document.createElement('div');
  priceMeta.className = 'dev-card__meta-item';
  const priceLabel = document.createElement('span');
  priceLabel.className = 'dev-card__meta-label';
  priceLabel.textContent = 'السعر الابتدائي';
  const priceVal = document.createElement('span');
  priceVal.className = 'dev-card__meta-val num-tabular';
  priceVal.textContent = `${formatNumber(dev.startingPriceEGP)} EGP`;
  priceMeta.append(priceLabel, priceVal);

  const yearMeta = document.createElement('div');
  yearMeta.className = 'dev-card__meta-item';
  const yearLabel = document.createElement('span');
  yearLabel.className = 'dev-card__meta-label';
  yearLabel.textContent = 'سنة التسليم';
  const yearVal = document.createElement('span');
  yearVal.className = 'dev-card__meta-val num-tabular';
  yearVal.textContent = String(dev.deliveryYear);
  yearMeta.append(yearLabel, yearVal);

  const actionMeta = document.createElement('div');
  actionMeta.className = 'dev-card__meta-item';
  const actionLabel = document.createElement('span');
  actionLabel.className = 'dev-card__meta-label';
  actionLabel.textContent = 'استكشاف';
  const actionLink = document.createElement('a');
  actionLink.href = detailUrl;
  actionLink.className = 'property-card__cta';
  const actionText = document.createElement('span');
  actionText.textContent = 'وحدات المشروع';
  actionLink.append(actionText, createSvgIcon('icon-chevron-left', 'icon--sm'));
  actionMeta.append(actionLabel, actionLink);

  meta.append(priceMeta, yearMeta, actionMeta);
  body.appendChild(meta);

  article.appendChild(body);
  return article;
}
