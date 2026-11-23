/* ==========================================================================
   NOVA ESTATE — Property Detail Page Controller (assets/js/pages/property.js)
   Handles property lookup by ?id=, Unknown ID state, auto-calculated
   pricePerSqm, Interactive Gallery & Keyboard Lightbox, Demo Installment
   Calculator, Viewing Appointment Validation (no past dates), & Similar Units.
   ========================================================================== */

import {
  getProperties,
  getDevelopments,
  calculatePricePerSqm,
  calculateInstallments,
  getTodayIsoDate,
  validateViewingForm
} from '../data.js';
import {
  PLACEHOLDER_IMAGE,
  TYPE_LABELS,
  PURPOSE_LABELS,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  formatNumber,
  formatPriceEGP,
  createSvgIcon,
  bindImageFallback,
  createPropertyCard
} from '../ui.js';
import {
  isPropertyFavorite,
  toggleFavorite,
  refreshAllFavoritesUI
} from '../favorites.js';

let currentProperty = null;
let galleryImages = [];
let activeImageIndex = 0;
let lastFocusedBeforeLightbox = null;

/**
 * Initializes the Property Detail page (property.html?id=...).
 */
export async function initPropertyDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const propertyId = (params.get('id') || '').trim();

  const loadingBox = document.getElementById('property-loading-state');
  const errorBox = document.getElementById('property-error-state');
  const contentBox = document.getElementById('property-detail-content');

  if (!propertyId) {
    showPropertyNotFound('لم يتم تحديد معرّف العقار في الرابط (?id=...).');
    return;
  }

  try {
    const [properties, developments] = await Promise.all([
      getProperties(),
      getDevelopments()
    ]);

    const found = properties.find((item) => item && item.id === propertyId);
    if (!found) {
      showPropertyNotFound(
        `المعرّف "${propertyId}" غير موجود في قاعدة بيانات العقارات الحالية.`
      );
      return;
    }

    currentProperty = found;
    const development = developments.find((d) => d && d.id === found.developmentId) || null;

    if (loadingBox) loadingBox.hidden = true;
    if (errorBox) errorBox.hidden = true;
    if (contentBox) contentBox.hidden = false;

    renderPropertyDetails(found, development);
    initGalleryAndLightbox(found);
    initInstallmentCalculator(found);
    initViewingAppointmentForm(found);
    renderSimilarProperties(properties, found);
    refreshAllFavoritesUI();
  } catch {
    showPropertyNotFound(
      'تعذّر تحميل بيانات العقار. تأكد من تشغيل الموقع عبر خادم محلي (http://localhost:5500).'
    );
  }
}

/**
 * Displays the Unknown ID / Error state box safely using textContent.
 * @param {string} message
 */
function showPropertyNotFound(message) {
  const loadingBox = document.getElementById('property-loading-state');
  const errorBox = document.getElementById('property-error-state');
  const errorDesc = document.getElementById('property-error-desc');
  const contentBox = document.getElementById('property-detail-content');

  if (loadingBox) loadingBox.hidden = true;
  if (contentBox) contentBox.hidden = true;
  if (errorDesc) errorDesc.textContent = message;
  if (errorBox) errorBox.hidden = false;
}

/**
 * Renders the main property header, calculated pricePerSqm, specs grid,
 * description, features, and project/map links.
 * @param {Object} property
 * @param {Object|null} development
 */
function renderPropertyDetails(property, development) {
  document.title = `${property.title} | NOVA ESTATE`;

  const breadcrumbCurrent = document.getElementById('breadcrumb-property-title');
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = property.title;
  }

  // Badges
  const badgesEl = document.getElementById('property-badges');
  if (badgesEl) {
    badgesEl.innerHTML = '';

    const purposeBadge = document.createElement('span');
    purposeBadge.className = 'badge badge--purpose';
    purposeBadge.textContent = PURPOSE_LABELS[property.purpose] || 'للبيع';

    const statusBadge = document.createElement('span');
    const statusClass = STATUS_BADGE_CLASSES[property.status] || 'badge--available';
    statusBadge.className = `badge ${statusClass}`;
    statusBadge.textContent = STATUS_LABELS[property.status] || 'متاح';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'badge badge--gold';
    typeBadge.textContent = TYPE_LABELS[property.type] || property.type;

    badgesEl.append(purposeBadge, statusBadge, typeBadge);
  }

  // Title & Location
  const titleEl = document.getElementById('property-title');
  if (titleEl) titleEl.textContent = property.title;

  const locationEl = document.getElementById('property-location');
  if (locationEl) {
    locationEl.textContent = `${property.city} — ${property.district}`;
  }

  // Price & Dynamic Price Per Sqm
  const priceEl = document.getElementById('property-price');
  if (priceEl) {
    priceEl.textContent = formatPriceEGP(property.priceEGP, property.purpose);
  }

  const pricePerSqm = calculatePricePerSqm(property.priceEGP, property.areaSqm);
  const sqmEl = document.getElementById('property-price-per-sqm');
  if (sqmEl) {
    sqmEl.textContent =
      property.purpose === 'rent'
        ? `متوسط إيجار المتر السنوي: ${formatNumber(pricePerSqm)} EGP / m²`
        : `متوسط سعر المتر: ${formatNumber(pricePerSqm)} EGP / m²`;
  }

  // Header Favorite & Share Buttons
  const favBtn = document.getElementById('property-fav-btn');
  if (favBtn) {
    favBtn.dataset.propertyId = property.id;
    favBtn.addEventListener('click', () => {
      toggleFavorite(property.id);
    });
  }

  const shareBtn = document.getElementById('property-share-btn');
  const shareLabel = document.getElementById('property-share-label');
  if (shareBtn && shareLabel) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        shareLabel.textContent = 'تم نسخ الرابط!';
      } catch {
        shareLabel.textContent = 'الرابط جاهز في شريط العنوان';
      }
      setTimeout(() => {
        shareLabel.textContent = 'نسخ الرابط';
      }, 2200);
    });
  }

  // Full Specifications Grid
  const specsGrid = document.getElementById('property-specs-grid');
  if (specsGrid) {
    specsGrid.innerHTML = '';
    const specsData = [
      { label: 'كود الوحدة', value: property.id.toUpperCase(), tabular: true },
      { label: 'نوع العقار', value: TYPE_LABELS[property.type] || property.type },
      {
        label: 'المساحة الإجمالية',
        value: `${formatNumber(property.areaSqm)} m²`,
        tabular: true
      },
      {
        label: 'سعر المتر المربع',
        value: `${formatNumber(pricePerSqm)} EGP / m²`,
        tabular: true
      },
      {
        label: 'غرف النوم',
        value: Number(property.bedrooms) > 0 ? `${property.bedrooms} غرف` : 'وحدة إدارية / تجارية'
      },
      { label: 'عدد الحمامات', value: `${property.bathrooms} حمام` },
      { label: 'مستوى التشطيب', value: property.finishing },
      { label: 'سنة الاستلام', value: String(property.deliveryYear), tabular: true },
      { label: 'نظام السداد', value: property.paymentPlan }
    ];

    specsData.forEach((spec) => {
      const box = document.createElement('div');
      box.className = 'spec-box';

      const lbl = document.createElement('span');
      lbl.className = 'spec-box__label';
      lbl.textContent = spec.label;

      const val = document.createElement('span');
      val.className = spec.tabular ? 'spec-box__value num-tabular' : 'spec-box__value';
      val.textContent = spec.value;

      box.append(lbl, val);
      specsGrid.appendChild(box);
    });
  }

  // Description
  const descEl = document.getElementById('property-description');
  if (descEl) {
    descEl.textContent = property.description;
  }

  // Features List
  const featuresList = document.getElementById('property-features-list');
  if (featuresList) {
    featuresList.innerHTML = '';
    const features = Array.isArray(property.features) ? property.features : [];
    features.forEach((featText) => {
      const li = document.createElement('li');
      li.className = 'feature-item';
      li.appendChild(createSvgIcon('icon-check', 'icon--sm'));
      const span = document.createElement('span');
      span.textContent = featText;
      li.appendChild(span);
      featuresList.appendChild(li);
    });
  }

  // Development & Map Links
  const devSummary = document.getElementById('property-development-summary');
  const devLink = document.getElementById('property-development-link');
  if (development) {
    if (devSummary) {
      devSummary.textContent = `تقع هذه الوحدة ضمن مشروع "${development.name}" في ${development.city} (${development.district}) — نسبة الإنجاز الإنشائي الحالية ${development.progressPercent}%.`;
    }
    if (devLink) {
      devLink.href = `development.html?id=${encodeURIComponent(development.id)}`;
    }
  } else if (devSummary) {
    devSummary.textContent = `الموقع: ${property.city} — ${property.district}`;
  }

  const mapLink = document.getElementById('property-map-link');
  if (mapLink && property.mapUrl) {
    mapLink.href = property.mapUrl;
  }
}

/**
 * Sets up the thumbnail gallery switcher and the keyboard-accessible Lightbox.
 * @param {Object} property
 */
function initGalleryAndLightbox(property) {
  galleryImages =
    Array.isArray(property.images) && property.images.length > 0
      ? property.images
      : [PLACEHOLDER_IMAGE];
  activeImageIndex = 0;

  const mainImg = document.getElementById('gallery-main-img');
  const thumbsContainer = document.getElementById('gallery-thumbs');
  const expandBtn = document.getElementById('gallery-expand-btn');

  if (mainImg) {
    bindImageFallback(mainImg);
    mainImg.addEventListener('click', () => openLightbox(activeImageIndex));
  }

  if (expandBtn) {
    expandBtn.addEventListener('click', () => openLightbox(activeImageIndex));
  }

  if (thumbsContainer) {
    thumbsContainer.innerHTML = '';
    galleryImages.forEach((imgSrc, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = idx === 0 ? 'gallery__thumb is-active' : 'gallery__thumb';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', `عرض الصورة رقم ${idx + 1} من ${galleryImages.length}`);

      const thumbImg = document.createElement('img');
      thumbImg.src = imgSrc;
      thumbImg.alt = `${property.title} — صورة ${idx + 1}`;
      thumbImg.width = 200;
      thumbImg.height = 150;
      bindImageFallback(thumbImg);

      btn.appendChild(thumbImg);
      btn.addEventListener('click', () => setActiveGalleryImage(idx));
      thumbsContainer.appendChild(btn);
    });
  }

  setActiveGalleryImage(0);
  bindLightboxControls();
}

function setActiveGalleryImage(index) {
  if (galleryImages.length === 0) return;
  activeImageIndex = (index + galleryImages.length) % galleryImages.length;

  const src = galleryImages[activeImageIndex];
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) {
    delete mainImg.dataset.fallbackApplied;
    mainImg.src = src;
    mainImg.alt = `${currentProperty ? currentProperty.title : 'العقار'} — صورة ${activeImageIndex + 1}`;
  }

  const thumbBtns = document.querySelectorAll('#gallery-thumbs .gallery__thumb');
  thumbBtns.forEach((btn, idx) => {
    btn.classList.toggle('is-active', idx === activeImageIndex);
  });

  // Also update Lightbox if currently open
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCounter = document.getElementById('lightbox-counter');
  if (lightboxImg) {
    delete lightboxImg.dataset.fallbackApplied;
    lightboxImg.src = src;
  }
  if (lightboxCounter) {
    lightboxCounter.textContent = `${activeImageIndex + 1} / ${galleryImages.length}`;
  }
}

function openLightbox(index = 0) {
  const lightbox = document.getElementById('property-lightbox');
  const closeBtn = document.getElementById('lightbox-close-btn');
  if (!lightbox) return;

  lastFocusedBeforeLightbox = document.activeElement;
  setActiveGalleryImage(index);
  lightbox.hidden = false;
  document.body.classList.add('is-scroll-locked');
  if (closeBtn) closeBtn.focus();
}

function closeLightbox() {
  const lightbox = document.getElementById('property-lightbox');
  if (!lightbox || lightbox.hidden) return;

  lightbox.hidden = true;
  document.body.classList.remove('is-scroll-locked');
  if (lastFocusedBeforeLightbox && typeof lastFocusedBeforeLightbox.focus === 'function') {
    lastFocusedBeforeLightbox.focus();
  }
}

function bindLightboxControls() {
  const lightbox = document.getElementById('property-lightbox');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const prevBtn = document.getElementById('lightbox-prev-btn');
  const nextBtn = document.getElementById('lightbox-next-btn');
  const lightboxImg = document.getElementById('lightbox-img');

  if (lightboxImg) bindImageFallback(lightboxImg);
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) {
    prevBtn.addEventListener('click', () => setActiveGalleryImage(activeImageIndex - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => setActiveGalleryImage(activeImageIndex + 1));
  }

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (!lightbox || lightbox.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveGalleryImage(activeImageIndex + 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveGalleryImage(activeImageIndex - 1);
    } else if (event.key === 'Tab') {
      const focusables = [closeBtn, prevBtn, nextBtn].filter(Boolean);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

/**
 * Initializes the interactive Demo Installment Calculator in property.html.
 * @param {Object} property
 */
function initInstallmentCalculator(property) {
  const downRange = document.getElementById('calc-down-range');
  const yearsRange = document.getElementById('calc-years-range');
  const downPercentEl = document.getElementById('calc-down-percent');
  const yearsLabelEl = document.getElementById('calc-years-label');

  const totalEl = document.getElementById('calc-total-price');
  const downAmountEl = document.getElementById('calc-down-amount');
  const remainingEl = document.getElementById('calc-remaining-amount');
  const quarterlyEl = document.getElementById('calc-quarterly-amount');
  const monthlyEl = document.getElementById('calc-monthly-amount');

  if (!downRange || !yearsRange) return;

  const updateCalculation = () => {
    const result = calculateInstallments(
      property.priceEGP,
      Number(downRange.value),
      Number(yearsRange.value)
    );

    if (downPercentEl) downPercentEl.textContent = `${result.downPaymentPercent}%`;
    if (yearsLabelEl) {
      yearsLabelEl.textContent =
        result.years === 1
          ? 'سنة واحدة'
          : result.years === 2
          ? 'سنتان'
          : `${result.years} سنوات`;
    }

    if (totalEl) totalEl.textContent = `${formatNumber(result.totalPrice)} EGP`;
    if (downAmountEl) downAmountEl.textContent = `${formatNumber(result.downPayment)} EGP`;
    if (remainingEl) remainingEl.textContent = `${formatNumber(result.remainingAmount)} EGP`;
    if (quarterlyEl) {
      quarterlyEl.textContent = `${formatNumber(result.quarterlyInstallment)} EGP`;
    }
    if (monthlyEl) {
      monthlyEl.textContent = `${formatNumber(result.monthlyInstallment)} EGP`;
    }
  };

  downRange.addEventListener('input', updateCalculation);
  yearsRange.addEventListener('input', updateCalculation);
  updateCalculation();
}

/**
 * Initializes the Demo Viewing Appointment Form with validation that rejects past dates.
 * @param {Object} property
 */
function initViewingAppointmentForm(property) {
  const form = document.getElementById('viewing-appointment-form');
  const dateInput = document.getElementById('viewing-date');
  const confirmationBox = document.getElementById('viewing-confirmation');
  const confirmationDetails = document.getElementById('viewing-confirmation-details');
  const resetBtn = document.getElementById('viewing-reset-btn');

  if (!form) return;

  const todayIso = getTodayIsoDate();
  if (dateInput) {
    dateInput.min = todayIso;
    if (!dateInput.value) {
      dateInput.value = todayIso;
    }
  }

  const fields = [
    { inputId: 'viewing-name', errorId: 'viewing-name-error', key: 'name' },
    { inputId: 'viewing-phone', errorId: 'viewing-phone-error', key: 'phone' },
    { inputId: 'viewing-email', errorId: 'viewing-email-error', key: 'email' },
    { inputId: 'viewing-date', errorId: 'viewing-date-error', key: 'date' }
  ];

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name') || '').trim(),
      phone: String(fd.get('phone') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      date: String(fd.get('date') || '').trim(),
      timeSlot: String(fd.get('timeSlot') || '').trim(),
      notes: String(fd.get('notes') || '').trim()
    };

    const validation = validateViewingForm(payload, getTodayIsoDate());

    fields.forEach(({ inputId, errorId, key }) => {
      const inputEl = document.getElementById(inputId);
      const errEl = document.getElementById(errorId);
      const errMsg = validation.errors[key];

      if (inputEl) {
        inputEl.classList.toggle('is-invalid', Boolean(errMsg));
      }
      if (errEl) {
        if (errMsg) {
          errEl.textContent = errMsg;
          errEl.hidden = false;
        } else {
          errEl.hidden = true;
        }
      }
    });

    if (!validation.isValid) return;

    // Render Demo Confirmation Summary using safe DOM nodes
    if (confirmationDetails) {
      confirmationDetails.innerHTML = '';
      const rows = [
        ['رقم الطلب التجريبي:', `DEMO-${property.id.toUpperCase()}-${Date.now().toString().slice(-4)}`],
        ['الوحدة العقارية:', `${property.title} (${property.city})`],
        ['الاسم الكامل:', payload.name],
        ['رقم الهاتف:', payload.phone],
        ['البريد الإلكتروني:', payload.email],
        ['موعد المعاينة المفضل:', `${payload.date} — ${payload.timeSlot}`]
      ];
      if (payload.notes) {
        rows.push(['ملاحظات:', payload.notes]);
      }

      rows.forEach(([label, val]) => {
        const p = document.createElement('p');
        p.style.marginBottom = '6px';
        const strong = document.createElement('strong');
        strong.textContent = `${label} `;
        const span = document.createElement('span');
        span.textContent = val;
        p.append(strong, span);
        confirmationDetails.appendChild(p);
      });
    }

    form.hidden = true;
    if (confirmationBox) confirmationBox.hidden = false;
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      if (dateInput) dateInput.value = getTodayIsoDate();
      if (confirmationBox) confirmationBox.hidden = true;
      form.hidden = false;
    });
  }
}

/**
 * Renders up to 3 similar properties from the catalog.
 * @param {Array} allProperties
 * @param {Object} current
 */
function renderSimilarProperties(allProperties, current) {
  const grid = document.getElementById('similar-properties-grid');
  if (!grid || !Array.isArray(allProperties)) return;

  const similar = allProperties
    .filter(
      (item) =>
        item.id !== current.id &&
        (item.city === current.city || item.type === current.type)
    )
    .slice(0, 3);

  grid.innerHTML = '';
  similar.forEach((prop) => {
    grid.appendChild(createPropertyCard(prop, isPropertyFavorite(prop.id)));
  });
}
