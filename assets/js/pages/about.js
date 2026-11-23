/* ==========================================================================
   NOVA ESTATE — About Page & FAQ Accordion Controller (assets/js/pages/about.js)
   Loads 8 FAQs from assets/data/faqs.json and builds an accessible Accordion.
   ========================================================================== */

import { getFaqs } from '../data.js';
import { createSvgIcon } from '../ui.js';

export async function initAboutPage() {
  const loadingBox = document.getElementById('faqs-loading-state');
  const errorBox = document.getElementById('faqs-error-state');
  const listEl = document.getElementById('faqs-list');

  if (!listEl) return;

  try {
    const faqs = await getFaqs();
    if (loadingBox) loadingBox.hidden = true;
    if (errorBox) errorBox.hidden = true;

    listEl.innerHTML = '';
    faqs.forEach((faq, index) => {
      const item = document.createElement('article');
      item.className = 'faq-item';

      const panelId = `faq-panel-${faq.id || index}`;
      const triggerId = `faq-trigger-${faq.id || index}`;
      const isInitiallyOpen = index === 0;

      const h3 = document.createElement('h3');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'faq-trigger';
      btn.id = triggerId;
      btn.setAttribute('aria-expanded', isInitiallyOpen ? 'true' : 'false');
      btn.setAttribute('aria-controls', panelId);

      const questionSpan = document.createElement('span');
      questionSpan.textContent = faq.question;

      btn.append(questionSpan, createSvgIcon('icon-chevron-down', 'icon--sm'));
      h3.appendChild(btn);

      const panel = document.createElement('div');
      panel.className = 'faq-panel';
      panel.id = panelId;
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', triggerId);
      panel.hidden = !isInitiallyOpen;

      const answerP = document.createElement('p');
      answerP.textContent = faq.answer;
      panel.appendChild(answerP);

      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        panel.hidden = expanded;
      });

      item.append(h3, panel);
      listEl.appendChild(item);
    });

    listEl.hidden = false;
  } catch {
    if (loadingBox) loadingBox.hidden = true;
    if (errorBox) errorBox.hidden = false;
  }
}
