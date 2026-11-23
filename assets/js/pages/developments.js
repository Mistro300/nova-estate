/* ==========================================================================
   NOVA ESTATE — Developments Listing Page Controller (assets/js/pages/developments.js)
   Renders the 4 master developments with dynamically calculated unit counts.
   ========================================================================== */

import { getDevelopments, getProperties, getUnitsByDevelopment } from '../data.js';
import { createDevelopmentCard } from '../ui.js';

export async function initDevelopmentsPage() {
  const retryBtn = document.getElementById('developments-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => loadAndRenderDevelopments(true));
  }

  await loadAndRenderDevelopments(false);
}

async function loadAndRenderDevelopments(forceRefresh = false) {
  const loadingBox = document.getElementById('developments-loading-state');
  const errorBox = document.getElementById('developments-error-state');
  const emptyBox = document.getElementById('developments-empty-state');
  const gridEl = document.getElementById('developments-grid');

  if (loadingBox) loadingBox.hidden = false;
  if (errorBox) errorBox.hidden = true;
  if (emptyBox) emptyBox.hidden = true;
  if (gridEl) gridEl.hidden = true;

  try {
    const [developments, properties] = await Promise.all([
      getDevelopments(forceRefresh),
      getProperties(forceRefresh)
    ]);

    if (loadingBox) loadingBox.hidden = true;

    if (!Array.isArray(developments) || developments.length === 0) {
      if (emptyBox) emptyBox.hidden = false;
      return;
    }

    if (gridEl) {
      gridEl.innerHTML = '';
      developments.forEach((dev) => {
        const unitsCount = getUnitsByDevelopment(properties, dev.id).length;
        gridEl.appendChild(createDevelopmentCard(dev, unitsCount));
      });
      gridEl.hidden = false;
    }
  } catch {
    if (loadingBox) loadingBox.hidden = true;
    if (errorBox) errorBox.hidden = false;
  }
}
