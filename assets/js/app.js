/* ==========================================================================
   NOVA ESTATE — Main Application Bootstrapper (assets/js/app.js)
   Initializes shared UI (Mobile Navigation, Image Fallbacks, Favorites Drawer
   with automatic deleted-ID cleanup) and routes to the active page module.
   ========================================================================== */

import { getProperties } from './data.js';
import { attachAllImageFallbacks } from './ui.js';
import { initFavoritesSystem, syncFavoritesWithCatalog } from './favorites.js';
import { initHomePage } from './pages/home.js';
import { initPropertiesPage } from './pages/properties.js';
import { initPropertyDetailPage } from './pages/property.js';
import { initDevelopmentsPage } from './pages/developments.js';
import { initDevelopmentDetailPage } from './pages/development.js';
import { initAboutPage } from './pages/about.js';
import { initContactPage } from './pages/contact.js';

/**
 * Initializes mobile navigation toggle and Escape key closure.
 */
function initMobileNavigation() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('main-navigation');

  if (!toggleBtn || !nav) return;

  const setMenuOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    const useEl = toggleBtn.querySelector('use');
    if (useEl) {
      useEl.setAttribute(
        'href',
        `assets/icons/sprite.svg#${open ? 'icon-x' : 'icon-menu'}`
      );
    }
  };

  toggleBtn.addEventListener('click', () => {
    const isOpen = nav.classList.contains('is-open');
    setMenuOpen(!isOpen);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenuOpen(false);
      toggleBtn.focus();
    }
  });
}

/**
 * Syncs LocalStorage favorites against properties.json so any stale/deleted ID
 * is purged immediately on every page load.
 */
async function syncGlobalFavoritesCatalog() {
  try {
    const properties = await getProperties();
    syncFavoritesWithCatalog(properties);
  } catch {
    // Offline/file:// fallback: keep existing favorites without throwing
  }
}

/**
 * Main entry point executed when DOM is ready.
 */
async function bootstrapApp() {
  attachAllImageFallbacks(document);
  initMobileNavigation();
  initFavoritesSystem();

  // Synchronize favorites catalog in parallel with page initialization
  await syncGlobalFavoritesCatalog();

  const pageId = document.body.dataset.page || '';

  switch (pageId) {
    case 'home':
      await initHomePage();
      break;
    case 'properties':
      await initPropertiesPage();
      break;
    case 'property-detail':
      await initPropertyDetailPage();
      break;
    case 'developments':
      await initDevelopmentsPage();
      break;
    case 'development-detail':
      await initDevelopmentDetailPage();
      break;
    case 'about':
      await initAboutPage();
      break;
    case 'contact':
      initContactPage();
      break;
    default:
      break;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
