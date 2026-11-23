/* ==========================================================================
   NOVA ESTATE — Home Page Controller (assets/js/pages/home.js)
   Handles Hero quick search URL routing and hydrates Featured Properties
   (3 cards) and Featured Developments + Custom Consultation Card.
   ========================================================================== */

import { getProperties, getDevelopments, getUnitsByDevelopment } from '../data.js';
import { createPropertyCard, createDevelopmentCard, createSvgIcon } from '../ui.js';
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
 * Builds the dark navy Custom Consultation CTA column matching Screen 1 mockup.
 * @returns {HTMLElement}
 */
function createHomeConsultationStack() {
  const stack = document.createElement('div');
  stack.className = 'home-consult-stack';

  // Top Navy Card with Gold Border
  const topCard = document.createElement('div');
  topCard.className = 'home-consult-card';

  const title = document.createElement('h3');
  title.className = 'home-consult-card__title';
  title.textContent = 'استشارة عقارية مخصصة';

  const sub = document.createElement('p');
  sub.className = 'home-consult-card__sub';
  sub.textContent = 'نوفا إستيت للعقارات الفاخرة — خطط سداد واستثمار';

  topCard.append(title, sub);

  // Bottom Navy Action Pill Box
  const actionLink = document.createElement('a');
  actionLink.href = 'contact.html';
  actionLink.className = 'home-consult-action';

  const iconBox = document.createElement('span');
  iconBox.className = 'home-consult-action__icon';
  iconBox.appendChild(createSvgIcon('icon-external-link', 'icon--sm'));

  const textWrap = document.createElement('span');
  textWrap.className = 'home-consult-action__text';
  textWrap.textContent = 'استشارة عقارية مخصصة';

  const arrow = createSvgIcon('icon-chevron-left', 'icon--sm');

  actionLink.append(iconBox, textWrap, arrow);
  stack.append(topCard, actionLink);
  return stack;
}

/**
 * Hydrates Featured Properties (3 units) and Featured Developments (2 projects + consultation stack).
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
      const featuredList = properties.filter((p) => p.featured).slice(0, 3);
      const listToRender = featuredList.length > 0 ? featuredList : properties.slice(0, 3);

      propertiesGrid.innerHTML = '';
      listToRender.forEach((prop) => {
        propertiesGrid.appendChild(createPropertyCard(prop, isPropertyFavorite(prop.id)));
      });
    }

    if (developmentsGrid && Array.isArray(developments) && developments.length > 0) {
      developmentsGrid.innerHTML = '';
      developments.slice(0, 2).forEach((dev) => {
        const unitsCount = getUnitsByDevelopment(properties, dev.id).length;
        developmentsGrid.appendChild(createDevelopmentCard(dev, unitsCount));
      });
      developmentsGrid.appendChild(createHomeConsultationStack());
    }

    refreshAllFavoritesUI();
  } catch {
    refreshAllFavoritesUI();
  }
}
