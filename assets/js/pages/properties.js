/* ==========================================================================
   NOVA ESTATE — Properties Listing & Composite Filters (assets/js/pages/properties.js)
   Handles URLSearchParams reading/writing via history.replaceState, smart
   min/max price swapping, Active Filter Chips, Sort, Favorites-only toggle,
   and Mobile Filter Drawer.
   ========================================================================== */

import {
  getProperties,
  normalizeFilterParams,
  filterAndSortProperties
} from '../data.js';
import {
  TYPE_LABELS,
  PURPOSE_LABELS,
  STATUS_LABELS,
  DEVELOPMENT_LABELS,
  formatNumber,
  createSvgIcon,
  createPropertyCard
} from '../ui.js';
import {
  getFavoriteIdsSet,
  isPropertyFavorite,
  refreshAllFavoritesUI
} from '../favorites.js';

let allProperties = [];
let currentFilters = normalizeFilterParams({});
let lastFocusedBeforeFilterDrawer = null;

/**
 * Initializes the Properties Listing page (properties.html).
 */
export async function initPropertiesPage() {
  bindFilterControls();
  bindMobileFilterDrawer();

  // Re-apply filters immediately when favorites change if "Favorites only" is active
  window.addEventListener('nova:favorites-changed', () => {
    if (currentFilters.favorites) {
      applyFiltersAndRender(false);
    }
  });

  // Sync filters when user navigates browser history Back/Forward
  window.addEventListener('popstate', () => {
    if (allProperties.length > 0) {
      readUrlIntoFilterState();
      syncFormWithFilterState();
      applyFiltersAndRender(false);
    }
  });

  await loadCatalogAndRender();
}

/**
 * Loads properties.json and performs the initial filter/sort pass from URL query params.
 * @param {boolean} forceRefresh
 */
async function loadCatalogAndRender(forceRefresh = false) {
  const loadingBox = document.getElementById('properties-loading-state');
  const errorBox = document.getElementById('properties-error-state');
  const emptyBox = document.getElementById('properties-empty-state');
  const gridEl = document.getElementById('properties-grid');

  if (loadingBox) loadingBox.hidden = false;
  if (errorBox) errorBox.hidden = true;
  if (emptyBox) emptyBox.hidden = true;
  if (gridEl) gridEl.hidden = true;

  try {
    allProperties = await getProperties(forceRefresh);
    if (loadingBox) loadingBox.hidden = true;

    readUrlIntoFilterState();
    syncFormWithFilterState();
    applyFiltersAndRender(true);
  } catch {
    if (loadingBox) loadingBox.hidden = true;
    if (errorBox) errorBox.hidden = false;
  }
}

/**
 * Parses window.location.search into normalized filter state.
 */
function readUrlIntoFilterState() {
  const params = new URLSearchParams(window.location.search);
  const raw = {
    q: params.get('q') || '',
    purpose: params.get('purpose') || '',
    city: params.get('city') || '',
    type: params.get('type') || '',
    developmentId: params.get('developmentId') || '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    minArea: params.get('minArea') ?? '',
    bedrooms: params.get('bedrooms') ?? '',
    status: params.get('status') || '',
    favorites: params.get('favorites') || '',
    sort: params.get('sort') || 'newest'
  };

  currentFilters = normalizeFilterParams(raw);
}

/**
 * Reads current DOM form control values into normalized filter state.
 */
function readFormIntoFilterState() {
  const form = document.getElementById('properties-filter-form');
  const sortSelect = document.getElementById('filter-sort');
  const favCheckbox = document.getElementById('filter-favorites-only');

  if (!form) return;
  const fd = new FormData(form);

  currentFilters = normalizeFilterParams({
    q: fd.get('q'),
    purpose: fd.get('purpose'),
    city: fd.get('city'),
    type: fd.get('type'),
    developmentId: fd.get('developmentId'),
    minPrice: fd.get('minPrice'),
    maxPrice: fd.get('maxPrice'),
    minArea: fd.get('minArea'),
    bedrooms: fd.get('bedrooms'),
    status: fd.get('status'),
    favorites: favCheckbox && favCheckbox.checked ? '1' : '',
    sort: sortSelect ? sortSelect.value : 'newest'
  });

  // If minPrice and maxPrice were swapped, reflect swapped values in inputs
  if (currentFilters.priceSwapped) {
    syncFormWithFilterState();
  }
}

/**
 * Synchronizes DOM inputs with currentFilters state.
 */
function syncFormWithFilterState() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== null && val !== undefined ? String(val) : '';
  };

  setVal('filter-q', currentFilters.q);
  setVal('filter-purpose', currentFilters.purpose);
  setVal('filter-city', currentFilters.city);
  setVal('filter-type', currentFilters.type);
  setVal('filter-development', currentFilters.developmentId);
  setVal('filter-min-price', currentFilters.minPrice ?? '');
  setVal('filter-max-price', currentFilters.maxPrice ?? '');
  setVal('filter-min-area', currentFilters.minArea ?? '');
  setVal('filter-bedrooms', currentFilters.bedrooms ?? '');
  setVal('filter-status', currentFilters.status);
  setVal('filter-sort', currentFilters.sort);

  const favCheckbox = document.getElementById('filter-favorites-only');
  if (favCheckbox) {
    favCheckbox.checked = Boolean(currentFilters.favorites);
  }

  const swapNotice = document.getElementById('price-swap-notice');
  if (swapNotice) {
    swapNotice.hidden = !currentFilters.priceSwapped;
  }
}

/**
 * Updates browser URL query parameters via history.replaceState without reloading.
 */
function updateUrlQueryParams() {
  const params = new URLSearchParams();

  if (currentFilters.q) params.set('q', currentFilters.q);
  if (currentFilters.purpose) params.set('purpose', currentFilters.purpose);
  if (currentFilters.city) params.set('city', currentFilters.city);
  if (currentFilters.type) params.set('type', currentFilters.type);
  if (currentFilters.developmentId) params.set('developmentId', currentFilters.developmentId);
  if (currentFilters.minPrice !== null) params.set('minPrice', String(currentFilters.minPrice));
  if (currentFilters.maxPrice !== null) params.set('maxPrice', String(currentFilters.maxPrice));
  if (currentFilters.minArea !== null) params.set('minArea', String(currentFilters.minArea));
  if (currentFilters.bedrooms !== null) params.set('bedrooms', String(currentFilters.bedrooms));
  if (currentFilters.status) params.set('status', currentFilters.status);
  if (currentFilters.favorites) params.set('favorites', '1');
  if (currentFilters.sort && currentFilters.sort !== 'newest') {
    params.set('sort', currentFilters.sort);
  }

  const qs = params.toString();
  const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', nextUrl);
}

/**
 * Applies currentFilters to allProperties, updates URL, chips, counter, and grid.
 * @param {boolean} updateUrl
 */
function applyFiltersAndRender(updateUrl = true) {
  if (updateUrl) {
    updateUrlQueryParams();
  }

  const swapNotice = document.getElementById('price-swap-notice');
  if (swapNotice) {
    swapNotice.hidden = !currentFilters.priceSwapped;
  }

  const favSet = getFavoriteIdsSet();
  const results = filterAndSortProperties(allProperties, currentFilters, favSet);

  renderResultsCounter(results.length, allProperties.length);
  renderActiveFilterChips();
  renderPropertiesGrid(results);
}

/**
 * Updates the results counter text using safe DOM nodes.
 * @param {number} matchedCount
 * @param {number} totalCount
 */
function renderResultsCounter(matchedCount, totalCount) {
  const countEl = document.getElementById('properties-results-count');
  if (!countEl) return;

  countEl.innerHTML = '';
  const prefix = document.createTextNode('عرض ');
  const matchedStrong = document.createElement('strong');
  matchedStrong.className = 'num-tabular';
  matchedStrong.textContent = String(matchedCount);

  const mid = document.createTextNode(' من إجمالي ');
  const totalStrong = document.createElement('strong');
  totalStrong.className = 'num-tabular';
  totalStrong.textContent = String(totalCount);

  const suffix = document.createTextNode(' وحدة عقارية');
  countEl.append(prefix, matchedStrong, mid, totalStrong, suffix);
}

/**
 * Builds the list of active filter chips and updates the mobile filter badge count.
 */
function renderActiveFilterChips() {
  const barEl = document.getElementById('active-filters-bar');
  const mobileBadge = document.getElementById('mobile-filter-count');

  const chips = [];

  if (currentFilters.q) {
    chips.push({ key: 'q', label: `البحث: ${currentFilters.q}` });
  }
  if (currentFilters.purpose) {
    chips.push({
      key: 'purpose',
      label: `الغرض: ${PURPOSE_LABELS[currentFilters.purpose] || currentFilters.purpose}`
    });
  }
  if (currentFilters.city) {
    chips.push({ key: 'city', label: `المدينة: ${currentFilters.city}` });
  }
  if (currentFilters.type) {
    chips.push({
      key: 'type',
      label: `النوع: ${TYPE_LABELS[currentFilters.type] || currentFilters.type}`
    });
  }
  if (currentFilters.developmentId) {
    chips.push({
      key: 'developmentId',
      label: `المشروع: ${DEVELOPMENT_LABELS[currentFilters.developmentId] || currentFilters.developmentId}`
    });
  }
  if (currentFilters.minPrice !== null) {
    chips.push({
      key: 'minPrice',
      label: `أقل سعر: ${formatNumber(currentFilters.minPrice)} EGP`
    });
  }
  if (currentFilters.maxPrice !== null) {
    chips.push({
      key: 'maxPrice',
      label: `أعلى سعر: ${formatNumber(currentFilters.maxPrice)} EGP`
    });
  }
  if (currentFilters.minArea !== null) {
    chips.push({
      key: 'minArea',
      label: `المساحة: من ${formatNumber(currentFilters.minArea)} m²`
    });
  }
  if (currentFilters.bedrooms !== null) {
    chips.push({
      key: 'bedrooms',
      label: `الغرف: ${currentFilters.bedrooms}+`
    });
  }
  if (currentFilters.status) {
    chips.push({
      key: 'status',
      label: `الحالة: ${STATUS_LABELS[currentFilters.status] || currentFilters.status}`
    });
  }
  if (currentFilters.favorites) {
    chips.push({ key: 'favorites', label: 'المفضلة فقط' });
  }

  if (mobileBadge) {
    mobileBadge.textContent = String(chips.length);
  }

  if (!barEl) return;
  barEl.innerHTML = '';

  if (chips.length === 0) {
    barEl.hidden = true;
    return;
  }

  barEl.hidden = false;

  chips.forEach((chip) => {
    const chipEl = document.createElement('span');
    chipEl.className = 'filter-chip';

    const textSpan = document.createElement('span');
    textSpan.textContent = chip.label;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'filter-chip__remove';
    removeBtn.dataset.removeFilter = chip.key;
    removeBtn.setAttribute('aria-label', `إزالة فلتر ${chip.label}`);
    removeBtn.appendChild(createSvgIcon('icon-x', 'icon--sm'));

    chipEl.append(textSpan, removeBtn);
    barEl.appendChild(chipEl);
  });

  // Add "Clear All" button when 2+ filters are active
  if (chips.length >= 2) {
    const clearAllBtn = document.createElement('button');
    clearAllBtn.type = 'button';
    clearAllBtn.className = 'btn btn--ghost btn--sm';
    clearAllBtn.textContent = 'مسح كل الفلاتر';
    clearAllBtn.addEventListener('click', resetAllFilters);
    barEl.appendChild(clearAllBtn);
  }
}

/**
 * Renders the filtered properties into #properties-grid or shows #properties-empty-state.
 * @param {Array} propertiesList
 */
function renderPropertiesGrid(propertiesList) {
  const gridEl = document.getElementById('properties-grid');
  const emptyBox = document.getElementById('properties-empty-state');

  if (!gridEl || !emptyBox) return;

  gridEl.innerHTML = '';

  if (propertiesList.length === 0) {
    gridEl.hidden = true;
    emptyBox.hidden = false;
    return;
  }

  emptyBox.hidden = true;
  gridEl.hidden = false;

  propertiesList.forEach((prop) => {
    gridEl.appendChild(createPropertyCard(prop, isPropertyFavorite(prop.id)));
  });

  refreshAllFavoritesUI();
}

/**
 * Resets all filters to default state and re-renders all 18 properties.
 */
function resetAllFilters() {
  currentFilters = normalizeFilterParams({});
  syncFormWithFilterState();
  applyFiltersAndRender(true);
}

/**
 * Binds filter form submit, live select/checkbox changes, sort dropdown,
 * chip removal delegation, and reset buttons.
 */
function bindFilterControls() {
  const form = document.getElementById('properties-filter-form');
  const sortSelect = document.getElementById('filter-sort');
  const resetBtn = document.getElementById('filter-reset-btn');
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  const retryBtn = document.getElementById('properties-retry-btn');
  const chipsBar = document.getElementById('active-filters-bar');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      readFormIntoFilterState();
      applyFiltersAndRender(true);
      setMobileFilterDrawerOpen(false);
    });

    // Live filtering when selects or checkboxes change
    form.addEventListener('change', (event) => {
      const target = event.target;
      if (
        target.matches('select') ||
        target.matches('input[type="checkbox"]') ||
        target.matches('input[type="number"]')
      ) {
        readFormIntoFilterState();
        applyFiltersAndRender(true);
      }
    });

    // Live search input with debounce
    let searchTimeout = null;
    const searchInput = document.getElementById('filter-q');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          readFormIntoFilterState();
          applyFiltersAndRender(true);
        }, 180);
      });
    }
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      readFormIntoFilterState();
      applyFiltersAndRender(true);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetAllFilters();
      setMobileFilterDrawerOpen(false);
    });
  }

  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', resetAllFilters);
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => loadCatalogAndRender(true));
  }

  if (chipsBar) {
    chipsBar.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('[data-remove-filter]');
      if (!removeBtn) return;

      const key = removeBtn.dataset.removeFilter;
      if (key === 'minPrice' || key === 'maxPrice' || key === 'minArea' || key === 'bedrooms') {
        currentFilters[key] = null;
      } else if (key === 'favorites') {
        currentFilters.favorites = false;
      } else if (key in currentFilters) {
        currentFilters[key] = '';
      }
      currentFilters.priceSwapped = false;
      syncFormWithFilterState();
      applyFiltersAndRender(true);
    });
  }
}

/**
 * Opens or closes the Mobile Filter Drawer (< 992px).
 * @param {boolean} open
 */
function setMobileFilterDrawerOpen(open) {
  const drawer = document.getElementById('filter-drawer');
  const backdrop = document.getElementById('filter-backdrop');
  const openBtn = document.getElementById('filter-open-btn');
  const closeBtn = document.getElementById('filter-close-btn');

  if (!drawer || !backdrop) return;

  if (open) {
    window.dispatchEvent(new CustomEvent('nova:filter-drawer-opening'));
    lastFocusedBeforeFilterDrawer = document.activeElement;
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add('is-open');
      drawer.classList.add('is-open');
    });
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-scroll-locked');
    if (closeBtn) closeBtn.focus();
  } else {
    backdrop.classList.remove('is-open');
    drawer.classList.remove('is-open');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-scroll-locked');
    setTimeout(() => {
      if (!drawer.classList.contains('is-open')) {
        backdrop.hidden = true;
      }
    }, 200);
    if (
      lastFocusedBeforeFilterDrawer &&
      typeof lastFocusedBeforeFilterDrawer.focus === 'function'
    ) {
      lastFocusedBeforeFilterDrawer.focus();
    }
  }
}

function bindMobileFilterDrawer() {
  const openBtn = document.getElementById('filter-open-btn');
  const closeBtn = document.getElementById('filter-close-btn');
  const backdrop = document.getElementById('filter-backdrop');
  const drawer = document.getElementById('filter-drawer');

  if (openBtn) {
    openBtn.addEventListener('click', () => setMobileFilterDrawerOpen(true));
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => setMobileFilterDrawerOpen(false));
  }
  if (backdrop) {
    backdrop.addEventListener('click', () => setMobileFilterDrawerOpen(false));
  }

  document.addEventListener('keydown', (event) => {
    if (!drawer || !drawer.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setMobileFilterDrawerOpen(false);
      return;
    }

    if (event.key === 'Tab') {
      const focusables = Array.from(
        drawer.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.closest('[hidden]') && el.offsetParent !== null);

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

  window.addEventListener('nova:favorites-drawer-opening', () => {
    if (drawer && drawer.classList.contains('is-open')) {
      setMobileFilterDrawerOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992 && drawer && drawer.classList.contains('is-open')) {
      setMobileFilterDrawerOpen(false);
    }
  });
}
