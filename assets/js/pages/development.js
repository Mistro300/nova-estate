/* ==========================================================================
   NOVA ESTATE — Development Detail Page Controller (assets/js/pages/development.js)
   Handles ?id= lookup, Unknown ID state, progress indicator, gallery,
   amenities, and dynamic listing of all units belonging to the development.
   ========================================================================== */

import {
  getDevelopments,
  getProperties,
  getUnitsByDevelopment
} from '../data.js';
import {
  PLACEHOLDER_IMAGE,
  formatNumber,
  createSvgIcon,
  bindImageFallback,
  createPropertyCard
} from '../ui.js';
import { isPropertyFavorite, refreshAllFavoritesUI } from '../favorites.js';

export async function initDevelopmentDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const devId = (params.get('id') || '').trim();

  if (!devId) {
    showDevelopmentNotFound('لم يتم تحديد معرّف المشروع في الرابط (?id=...).');
    return;
  }

  try {
    const [developments, properties] = await Promise.all([
      getDevelopments(),
      getProperties()
    ]);

    const foundDev = developments.find((item) => item && item.id === devId);
    if (!foundDev) {
      showDevelopmentNotFound(
        `معرّف المشروع "${devId}" غير موجود في قاعدة بيانات المشروعات الحالية.`
      );
      return;
    }

    const units = getUnitsByDevelopment(properties, foundDev.id);

    const loadingBox = document.getElementById('dev-loading-state');
    const errorBox = document.getElementById('dev-error-state');
    const contentBox = document.getElementById('dev-detail-content');

    if (loadingBox) loadingBox.hidden = true;
    if (errorBox) errorBox.hidden = true;
    if (contentBox) contentBox.hidden = false;

    renderDevelopmentDetails(foundDev, units);
    refreshAllFavoritesUI();
  } catch {
    showDevelopmentNotFound(
      'تعذّر تحميل بيانات المشروع العمراني. تأكد من تشغيل الموقع عبر خادم HTTP محلي.'
    );
  }
}

function showDevelopmentNotFound(message) {
  const loadingBox = document.getElementById('dev-loading-state');
  const errorBox = document.getElementById('dev-error-state');
  const errorDesc = document.getElementById('dev-error-desc');
  const contentBox = document.getElementById('dev-detail-content');

  if (loadingBox) loadingBox.hidden = true;
  if (contentBox) contentBox.hidden = true;
  if (errorDesc) errorDesc.textContent = message;
  if (errorBox) errorBox.hidden = false;
}

function renderDevelopmentDetails(dev, units) {
  document.title = `${dev.name} | NOVA ESTATE`;

  const breadcrumbCurrent = document.getElementById('breadcrumb-dev-title');
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = dev.name;

  const coverImg = document.getElementById('dev-cover-img');
  if (coverImg) {
    coverImg.src = dev.cover || PLACEHOLDER_IMAGE;
    coverImg.alt = `صورة مشروع ${dev.name} في ${dev.city}`;
    bindImageFallback(coverImg);
  }

  const cityBadge = document.getElementById('dev-city-badge');
  if (cityBadge) cityBadge.textContent = dev.city;

  const unitsBadge = document.getElementById('dev-units-badge');
  if (unitsBadge) unitsBadge.textContent = `${units.length} وحدات مدرجة`;

  const titleEl = document.getElementById('dev-title');
  if (titleEl) titleEl.textContent = dev.name;

  const locationEl = document.getElementById('dev-location');
  if (locationEl) {
    locationEl.textContent = `${dev.city} — ${dev.district || ''}`;
  }

  const summaryEl = document.getElementById('dev-summary');
  if (summaryEl) summaryEl.textContent = dev.summary;

  // Progress bar
  const pct = Math.min(100, Math.max(0, Number(dev.progressPercent) || 0));
  const progressText = document.getElementById('dev-progress-text');
  const progressBar = document.getElementById('dev-progress-bar');
  const progressFill = document.getElementById('dev-progress-fill');

  if (progressText) progressText.textContent = `${pct}%`;
  if (progressBar) progressBar.setAttribute('aria-valuenow', String(pct));
  if (progressFill) progressFill.style.width = `${pct}%`;

  // Metrics
  const startPriceEl = document.getElementById('dev-starting-price');
  if (startPriceEl) {
    startPriceEl.textContent = `${formatNumber(dev.startingPriceEGP)} EGP`;
  }

  const deliveryYearEl = document.getElementById('dev-delivery-year');
  if (deliveryYearEl) {
    deliveryYearEl.textContent = String(dev.deliveryYear);
  }

  const unitsCountEl = document.getElementById('dev-units-count');
  if (unitsCountEl) {
    unitsCountEl.textContent = `${units.length} وحدات`;
  }

  // Gallery
  const galleryGrid = document.getElementById('dev-gallery-grid');
  if (galleryGrid) {
    galleryGrid.innerHTML = '';
    const images =
      Array.isArray(dev.gallery) && dev.gallery.length > 0
        ? dev.gallery
        : [dev.cover || PLACEHOLDER_IMAGE];

    images.forEach((src, index) => {
      const card = document.createElement('div');
      card.className = 'property-card__media';
      card.style.borderRadius = 'var(--radius-md)';
      card.style.border = '1px solid var(--border-hairline)';

      const img = document.createElement('img');
      img.src = src;
      img.alt = `${dev.name} — صورة ${index + 1}`;
      img.className = 'property-card__img';
      img.width = 800;
      img.height = 600;
      img.loading = 'lazy';
      bindImageFallback(img);

      card.appendChild(img);
      galleryGrid.appendChild(card);
    });
  }

  // Amenities
  const amenitiesGrid = document.getElementById('dev-amenities-grid');
  if (amenitiesGrid) {
    amenitiesGrid.innerHTML = '';
    const amenities = Array.isArray(dev.amenities) ? dev.amenities : [];
    amenities.forEach((amenityText) => {
      const item = document.createElement('div');
      item.className = 'amenity-card';
      item.appendChild(createSvgIcon('icon-check', 'icon--md'));
      const span = document.createElement('span');
      span.textContent = amenityText;
      item.appendChild(span);
      amenitiesGrid.appendChild(item);
    });
  }

  // Filter link to properties.html?developmentId=...
  const filterAllLink = document.getElementById('dev-filter-all-link');
  if (filterAllLink) {
    filterAllLink.href = `properties.html?developmentId=${encodeURIComponent(dev.id)}`;
  }

  // Project Units
  const unitsGrid = document.getElementById('dev-units-grid');
  const unitsEmpty = document.getElementById('dev-units-empty');

  if (unitsGrid && unitsEmpty) {
    unitsGrid.innerHTML = '';
    if (units.length === 0) {
      unitsEmpty.hidden = false;
      unitsGrid.hidden = true;
    } else {
      unitsEmpty.hidden = true;
      unitsGrid.hidden = false;
      units.forEach((prop) => {
        unitsGrid.appendChild(createPropertyCard(prop, isPropertyFavorite(prop.id)));
      });
    }
  }
}
