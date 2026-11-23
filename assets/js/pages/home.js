/* ==========================================================================
   NOVA ESTATE — Home Page Controller (assets/js/pages/home.js)
   Handles Hero quick search URL routing and hydrates Featured Properties
   and Featured Developments from local JSON files.
   ========================================================================== */

import { getProperties, getDevelopments, getUnitsByDevelopment } from '../data.js';
import { createPropertyCard, createDevelopmentCard } from '../ui.js';
import { isPropertyFavorite, refreshAllFavoritesUI } from '../favorites.js';

/**
 * Initializes the Home page (index.html).
 */
export async function initHomePage() {
  initHeroSearchForm();
  await hydrateHomeShowcases();
}

/**
 * Enhances the Hero quick search form so only non-empty query parameters
 * are serialized into the target URL (properties.html?purpose=...&city=...&type=...).
 */
function initHeroSearchForm() {
  const form = document.getElementById('hero-search-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const params = new URLSearchParams();

    ['purpose', 'city', 'type'].forEach((key) => {
      const value = String(formData.get(key) || '').trim();
      if (value) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    window.location.href = queryString ? `properties.html?${queryString}` : 'properties.html';
  });
}

/**
 * Hydrates Featured Properties (6 units) and Featured Developments (4 projects).
 * Keeps static fallback cards intact if fetch fails offline.
 */
async function hydrateHomeShowcases() {
  const propertiesGrid = document.getElementById('home-featured-properties');
  const developmentsGrid = document.getElementById('home-featured-developments');

  try {
    const [properties, developments] = await Promise.all([
      getProperties(),
      getDevelopments()
    ]);

    if (propertiesGrid && Array.isArray(properties) && properties.length > 0) {
      const featuredList = properties.filter((p) => p.featured).slice(0, 6);
      const listToRender = featuredList.length > 0 ? featuredList : properties.slice(0, 6);

      propertiesGrid.innerHTML = '';
      listToRender.forEach((prop) => {
        propertiesGrid.appendChild(createPropertyCard(prop, isPropertyFavorite(prop.id)));
      });
    }

    if (developmentsGrid && Array.isArray(developments) && developments.length > 0) {
      developmentsGrid.innerHTML = '';
      developments.forEach((dev) => {
        const unitsCount = getUnitsByDevelopment(properties, dev.id).length;
        developmentsGrid.appendChild(createDevelopmentCard(dev, unitsCount));
      });
    }

    refreshAllFavoritesUI();
  } catch {
    // Keep pre-rendered HTML cards visible if local server isn't running
    refreshAllFavoritesUI();
  }
}
