/* ==========================================================================
   NOVA ESTATE — Contact Page Controller (assets/js/pages/contact.js)
   Validates the Demo inquiry form and displays a browser-only confirmation.
   ========================================================================== */

export function initContactPage() {
  const form = document.getElementById('contact-inquiry-form');
  const confirmationBox = document.getElementById('contact-confirmation');
  const confirmationDetails = document.getElementById('contact-confirmation-details');
  const resetBtn = document.getElementById('contact-reset-btn');

  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(form);

    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const city = String(fd.get('city') || '').trim();
    const subject = String(fd.get('subject') || '').trim();
    const message = String(fd.get('message') || '').trim();

    const errors = {};
    if (name.length < 3) {
      errors.name = 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل).';
    }
    const digitsOnly = phone.replace(/[^\d]/g, '');
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      errors.phone = 'يرجى إدخال رقم هاتف صحيح (8 إلى 15 رقماً).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'يرجى إدخال بريد إلكتروني صحيح.';
    }
    if (message.length < 10) {
      errors.message = 'يرجى كتابة تفاصيل الاستفسار (10 أحرف على الأقل).';
    }

    const fieldMap = [
      { inputId: 'contact-name', errorId: 'contact-name-error', key: 'name' },
      { inputId: 'contact-phone', errorId: 'contact-phone-error', key: 'phone' },
      { inputId: 'contact-email', errorId: 'contact-email-error', key: 'email' },
      { inputId: 'contact-message', errorId: 'contact-message-error', key: 'message' }
    ];

    fieldMap.forEach(({ inputId, errorId, key }) => {
      const inputEl = document.getElementById(inputId);
      const errEl = document.getElementById(errorId);
      const errMsg = errors[key];

      if (inputEl) inputEl.classList.toggle('is-invalid', Boolean(errMsg));
      if (errEl) {
        if (errMsg) {
          errEl.textContent = errMsg;
          errEl.hidden = false;
        } else {
          errEl.hidden = true;
        }
      }
    });

    if (Object.keys(errors).length > 0) return;

    if (confirmationDetails) {
      confirmationDetails.innerHTML = '';
      const rows = [
        ['رقم الاستفسار التجريبي:', `INQ-${Date.now().toString().slice(-5)}`],
        ['الاسم الكامل:', name],
        ['رقم الهاتف:', phone],
        ['البريد الإلكتروني:', email],
        ['الوجهة والغرض:', `${city} — ${subject}`],
        ['ملخص الرسالة:', message]
      ];

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
      if (confirmationBox) confirmationBox.hidden = true;
      form.hidden = false;
    });
  }
}
