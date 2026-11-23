/* ==========================================================================
   NOVA ESTATE — Favorites System & Drawer Controller (assets/js/favorites.js)
   Manages favorite IDs in LocalStorage (nova_estate_favorites_v1), cleans
   stale/deleted property IDs automatically, updates aria-pressed buttons,
   live Header badge, and the shared Favorites Drawer.
   ========================================================================== */

import { loadFavoriteIds, saveFavoriteIds, clearFavoriteIds } from './storage.js';
import {
  PLACEHOLDER_IMAGE,
  formatPriceEGP,
  createSvgIcon,
  bindImageFallback
} from './ui.js';

let favoriteIds = loadFavoriteIds();
let catalogById = new Map();
let lastFocusedBeforeDrawer = null;

/**
 * Returns a Set of currently saved favorite property IDs.
 * @returns {Set<string>}
 */
export function getFavoriteIdsSet() {
  return new Set(favoriteIds);
}

/**
 * Checks if a property ID is currently in favorites.
 * @param {string} propertyId
 * @returns {boolean}
 */
export function isPropertyFavorite(propertyId) {
  return favoriteIds.includes(propertyId);
}

/**
 * Synchronizes stored favorite IDs against the live properties.json catalog.
 * Automatically removes any ID that no longer exists in JSON (Edge Case #5).
 * @param {Array} properties
 */
export function syncFavoritesWithCatalog(properties) {
  if (!Array.isArray(properties)) return;

  catalogById = new Map();
  properties.forEach((prop) => {
    if (prop && prop.id) {
      catalogById.set(prop.id, prop);
    }
  });

  // Keep only IDs that exist in the catalog
  const validIds = favoriteIds.filter((id) => catalogById.has(id));
  if (validIds.length !== favoriteIds.length) {
    favoriteIds = saveFavoriteIds(validIds);
  }

  refreshAllFavoritesUI();
}

/**
 * Toggles a property ID in favorites and updates all UI elements immediately.
 * @param {string} propertyId
 * @returns {boolean} New favorite state (true = added, false = removed)
 */
export function toggleFavorite(propertyId) {
  if (!propertyId) return false;

  const exists = favoriteIds.includes(propertyId);
  if (exists) {
    favoriteIds = saveFavoriteIds(favoriteIds.filter((id) => id !== propertyId));
  } else {
    favoriteIds = saveFavoriteIds([...favoriteIds, propertyId]);
  }

  refreshAllFavoritesUI();
  dispatchFavoritesChanged();
  return !exists;
}

/**
 * Removes a specific property ID from favorites.
 * @param {string} propertyId
 */
export function removeFavorite(propertyId) {
  if (!favoriteIds.includes(propertyId)) return;
  favoriteIds = saveFavoriteIds(favoriteIds.filter((id) => id !== propertyId));
  refreshAllFavoritesUI();
  dispatchFavoritesChanged();
}

/**
 * Clears all saved favorites.
 */
export function clearAllFavorites() {
  clearFavoriteIds();
  favoriteIds = [];
  refreshAllFavoritesUI();
  dispatchFavoritesChanged();
}

function dispatchFavoritesChanged() {
  window.dispatchEvent(
    new CustomEvent('nova:favorites-changed', {
      detail: { favoriteIds: [...favoriteIds] }
    })
  );
}

/**
 * Updates the Header badge, all [data-fav-btn] card buttons, the detail page
 * favorite button (#property-fav-btn), and the Favorites Drawer list.
 */
export function refreshAllFavoritesUI() {
  const favSet = getFavoriteIdsSet();

  // 1. Update Header live count badge
  const badgeEl = document.getElementById('favorites-count-badge');
  if (badgeEl) {
    badgeEl.textContent = String(favSet.size);
  }

  // 2. Update all Property Card favorite buttons ([data-fav-btn])
  const cardBtns = document.querySelectorAll('[data-fav-btn]');
  cardBtns.forEach((btn) => {
    const propId = btn.dataset.favBtn;
    const active = favSet.has(propId);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');

    const prop = catalogById.get(propId);
    const title = prop ? prop.title : 'العقار';
    btn.setAttribute(
      'aria-label',
      active ? `إزالة ${title} من المفضلة` : `إضافة ${title} إلى المفضلة`
    );

    const useEl = btn.querySelector('use');
    if (useEl) {
      useEl.setAttribute(
        'href',
        `assets/icons/sprite.svg#${active ? 'icon-heart-filled' : 'icon-heart'}`
      );
    }
  });

  // 3. Update Property Detail Page favorite button (#property-fav-btn) if present
  const detailFavBtn = document.getElementById('property-fav-btn');
  if (detailFavBtn && detailFavBtn.dataset.propertyId) {
    const active = favSet.has(detailFavBtn.dataset.propertyId);
    detailFavBtn.setAttribute('aria-pressed', active ? 'true' : 'false');

    const labelEl = document.getElementById('property-fav-label');
    if (labelEl) {
      labelEl.textContent = active ? 'محفوظ في المفضلة' : 'حفظ في المفضلة';
    }

    const useEl = detailFavBtn.querySelector('use');
    if (useEl) {
      useEl.setAttribute(
        'href',
        `assets/icons/sprite.svg#${active ? 'icon-heart-filled' : 'icon-heart'}`
      );
    }
  }

  // 4. Render Favorites Drawer contents
  renderFavoritesDrawerList();
}

/**
 * Renders the list of saved properties inside the Favorites Drawer.
 */
function renderFavoritesDrawerList() {
  const emptyState = document.getElementById('favorites-empty-state');
  const listEl = document.getElementById('favorites-drawer-list');
  const footerEl = document.getElementById('favorites-drawer-footer');

  if (!emptyState || !listEl || !footerEl) return;

  listEl.innerHTML = '';

  const validItems = favoriteIds
    .map((id) => catalogById.get(id))
    .filter(Boolean);

  if (validItems.length === 0) {
    emptyState.hidden = false;
    listEl.hidden = true;
    footerEl.hidden = true;
    return;
  }

  emptyState.hidden = true;
  listEl.hidden = false;
  footerEl.hidden = false;

  validItems.forEach((prop) => {
    const li = document.createElement('li');
    li.className = 'fav-item';

    const detailUrl = `property.html?id=${encodeURIComponent(prop.id)}`;
    const thumbSrc =
      Array.isArray(prop.images) && prop.images.length > 0
        ? prop.images[0]
        : PLACEHOLDER_IMAGE;

    const img = document.createElement('img');
    img.src = thumbSrc;
    img.alt = prop.title;
    img.className = 'fav-item__img';
    img.width = 84;
    img.height = 64;
    bindImageFallback(img);

    const info = document.createElement('div');
    info.className = 'fav-item__info';

    const titleLink = document.createElement('a');
    titleLink.href = detailUrl;
    titleLink.className = 'fav-item__title';
    titleLink.textContent = prop.title;

    const meta = document.createElement('p');
    meta.className = 'fav-item__meta';
    meta.textContent = `${prop.city} • ${prop.areaSqm} m²`;

    const price = document.createElement('span');
    price.className = 'fav-item__price';
    price.textContent = formatPriceEGP(prop.priceEGP, prop.purpose);

    info.append(titleLink, meta, price);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'fav-item__remove';
    removeBtn.dataset.removeFav = prop.id;
    removeBtn.setAttribute('aria-label', `إزالة ${prop.title} من المفضلة`);
    removeBtn.appendChild(createSvgIcon('icon-trash', 'icon--sm'));

    li.append(img, info, removeBtn);
    listEl.appendChild(li);
  });
}

/**
 * Opens or closes the shared Favorites Drawer with keyboard focus management.
 * @param {boolean} open
 */
export function setFavoritesDrawerOpen(open) {
  const drawer = document.getElementById('favorites-drawer');
  const backdrop = document.getElementById('favorites-backdrop');
  const toggleBtn = document.getElementById('favorites-toggle-btn');
  const closeBtn = document.getElementById('favorites-close-btn');

  if (!drawer || !backdrop) return;

  if (open) {
    window.dispatchEvent(new CustomEvent('nova:favorites-drawer-opening'));
    lastFocusedBeforeDrawer = document.activeElement;
    backdrop.hidden = false;
    // Allow layout paint before adding transition class
    requestAnimationFrame(() => {
      backdrop.classList.add('is-open');
      drawer.classList.add('is-open');
    });
    drawer.setAttribute('aria-hidden', 'false');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-scroll-locked');
    if (closeBtn) closeBtn.focus();
  } else {
    backdrop.classList.remove('is-open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-scroll-locked');
    setTimeout(() => {
      if (!drawer.classList.contains('is-open')) {
        backdrop.hidden = true;
      }
    }, 200);
    if (lastFocusedBeforeDrawer && typeof lastFocusedBeforeDrawer.focus === 'function') {
      lastFocusedBeforeDrawer.focus();
    }
  }
}

/**
 * Initializes event delegation for favorite toggle buttons and Favorites Drawer controls.
 */
export function initFavoritesSystem() {
  refreshAllFavoritesUI();

  const toggleBtn = document.getElementById('favorites-toggle-btn');
  const closeBtn = document.getElementById('favorites-close-btn');
  const backdrop = document.getElementById('favorites-backdrop');
  const clearBtn = document.getElementById('favorites-clear-btn');
  const drawer = document.getElementById('favorites-drawer');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer && drawer.classList.contains('is-open');
      setFavoritesDrawerOpen(!isOpen);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => setFavoritesDrawerOpen(false));
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => setFavoritesDrawerOpen(false));
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearAllFavorites();
    });
  }

  // Event delegation for card favorite buttons and drawer item removal
  document.addEventListener('click', (event) => {
    const favBtn = event.target.closest('[data-fav-btn]');
    if (favBtn) {
      event.preventDefault();
      toggleFavorite(favBtn.dataset.favBtn);
      return;
    }

    const removeBtn = event.target.closest('[data-remove-fav]');
    if (removeBtn) {
      event.preventDefault();
      removeFavorite(removeBtn.dataset.removeFav);
    }
  });

  // Close drawer on Escape key and trap Tab focus inside drawer when open
  document.addEventListener('keydown', (event) => {
    if (!drawer || !drawer.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setFavoritesDrawerOpen(false);
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

  window.addEventListener('nova:filter-drawer-opening', () => {
    if (drawer && drawer.classList.contains('is-open')) {
      setFavoritesDrawerOpen(false);
    }
  });
}
