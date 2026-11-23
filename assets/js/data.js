/* ==========================================================================
   NOVA ESTATE — Data Layer & Pure Business Logic Functions (assets/js/data.js)
   Includes JSON fetching with caching and pure functions for filtering,
   sorting, price-per-sqm, installment calculation, and form validation.
   ========================================================================== */

const cache = {
  properties: null,
  developments: null,
  faqs: null
};

/**
 * Generic JSON fetcher with HTTP status verification and in-memory cache.
 * @param {string} url Relative path to JSON file
 * @param {string} cacheKey Key in module cache
 * @param {boolean} forceRefresh Bypass cache on retry
 * @returns {Promise<any[]>}
 */
async function fetchJsonData(url, cacheKey, forceRefresh = false) {
  if (!forceRefresh && Array.isArray(cache[cacheKey])) {
    return cache[cacheKey];
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`Invalid JSON root structure in ${url}`);
  }

  cache[cacheKey] = data;
  return data;
}

export function getProperties(forceRefresh = false) {
  return fetchJsonData('assets/data/properties.json', 'properties', forceRefresh);
}

export function getDevelopments(forceRefresh = false) {
  return fetchJsonData('assets/data/developments.json', 'developments', forceRefresh);
}

export function getFaqs(forceRefresh = false) {
  return fetchJsonData('assets/data/faqs.json', 'faqs', forceRefresh);
}

/* --------------------------------------------------------------------------
   PURE FUNCTIONS (Testable & Side-Effect Free)
   -------------------------------------------------------------------------- */

/**
 * Computes the price per square meter rounded to the nearest integer.
 * @param {number} priceEGP
 * @param {number} areaSqm
 * @returns {number}
 */
export function calculatePricePerSqm(priceEGP, areaSqm) {
  const price = Number(priceEGP);
  const area = Number(areaSqm);
  if (!Number.isFinite(price) || !Number.isFinite(area) || price <= 0 || area <= 0) {
    return 0;
  }
  return Math.round(price / area);
}

/**
 * Pure installment calculator for demo payment estimates.
 * @param {number} priceEGP Total unit price in EGP
 * @param {number} downPaymentPercent Down payment percentage (10 to 50)
 * @param {number} years Installment duration in years (1 to 10)
 */
export function calculateInstallments(priceEGP, downPaymentPercent = 15, years = 7) {
  const totalPrice = Math.max(0, Number(priceEGP) || 0);
  const clampedPercent = Math.min(50, Math.max(10, Number(downPaymentPercent) || 15));
  const clampedYears = Math.min(10, Math.max(1, Number(years) || 7));

  const downPayment = Math.round(totalPrice * (clampedPercent / 100));
  const remainingAmount = Math.max(0, totalPrice - downPayment);
  const totalMonths = clampedYears * 12;
  const totalQuarters = clampedYears * 4;

  const monthlyInstallment = Math.round(remainingAmount / totalMonths);
  const quarterlyInstallment = Math.round(remainingAmount / totalQuarters);

  return {
    totalPrice,
    downPaymentPercent: clampedPercent,
    years: clampedYears,
    downPayment,
    remainingAmount,
    monthlyInstallment,
    quarterlyInstallment
  };
}

/**
 * Returns all units belonging to a specific development ID.
 * @param {Array} properties
 * @param {string} developmentId
 * @returns {Array}
 */
export function getUnitsByDevelopment(properties, developmentId) {
  if (!Array.isArray(properties) || !developmentId) {
    return [];
  }
  return properties.filter((item) => item && item.developmentId === developmentId);
}

/**
 * Normalizes and validates filter parameters.
 * Automatically swaps minPrice and maxPrice if minPrice > maxPrice.
 * @param {Object} raw
 */
export function normalizeFilterParams(raw = {}) {
  const cleanStr = (val) => (typeof val === 'string' ? val.trim() : '');
  const parsePositiveNumber = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isFinite(num) && num >= 0 ? num : null;
  };

  let minPrice = parsePositiveNumber(raw.minPrice);
  let maxPrice = parsePositiveNumber(raw.maxPrice);
  let priceSwapped = false;

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    const temp = minPrice;
    minPrice = maxPrice;
    maxPrice = temp;
    priceSwapped = true;
  }

  const minArea = parsePositiveNumber(raw.minArea);
  const bedrooms = parsePositiveNumber(raw.bedrooms);

  const allowedSorts = ['newest', 'price-asc', 'price-desc', 'area-desc', 'area-asc'];
  const sort = allowedSorts.includes(raw.sort) ? raw.sort : 'newest';

  return {
    q: cleanStr(raw.q),
    purpose: cleanStr(raw.purpose),
    city: cleanStr(raw.city),
    type: cleanStr(raw.type),
    developmentId: cleanStr(raw.developmentId),
    minPrice,
    maxPrice,
    minArea,
    bedrooms,
    status: cleanStr(raw.status),
    favorites: raw.favorites === '1' || raw.favorites === true,
    sort,
    priceSwapped
  };
}

/**
 * Pure composite filter and sort function for properties.
 * @param {Array} properties Full array of property objects
 * @param {Object} normalizedFilters Result from normalizeFilterParams()
 * @param {Set<string>} favoriteIdsSet Set of currently saved favorite property IDs
 * @returns {Array} Filtered and sorted copy of properties
 */
export function filterAndSortProperties(properties, normalizedFilters, favoriteIdsSet = new Set()) {
  if (!Array.isArray(properties)) return [];

  const f = normalizedFilters || normalizeFilterParams({});
  const query = (f.q || '').toLowerCase();

  const filtered = properties.filter((prop) => {
    if (!prop || typeof prop !== 'object') return false;

    // 1. Keyword search across title, city, district, description, and ID
    if (query) {
      const haystack = [
        prop.id,
        prop.title,
        prop.city,
        prop.district,
        prop.description,
        prop.finishing
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    // 2. Exact match filters
    if (f.purpose && prop.purpose !== f.purpose) return false;
    if (f.city && prop.city !== f.city) return false;
    if (f.type && prop.type !== f.type) return false;
    if (f.developmentId && prop.developmentId !== f.developmentId) return false;
    if (f.status && prop.status !== f.status) return false;

    // 3. Numeric range filters
    const price = Number(prop.priceEGP) || 0;
    if (f.minPrice !== null && price < f.minPrice) return false;
    if (f.maxPrice !== null && price > f.maxPrice) return false;

    const area = Number(prop.areaSqm) || 0;
    if (f.minArea !== null && area < f.minArea) return false;

    const beds = Number(prop.bedrooms) || 0;
    if (f.bedrooms !== null && beds < f.bedrooms) return false;

    // 4. Favorites-only filter
    if (f.favorites && !favoriteIdsSet.has(prop.id)) return false;

    return true;
  });

  // Sort a copy of the filtered array
  return [...filtered].sort((a, b) => {
    switch (f.sort) {
      case 'price-asc':
        return (Number(a.priceEGP) || 0) - (Number(b.priceEGP) || 0);
      case 'price-desc':
        return (Number(b.priceEGP) || 0) - (Number(a.priceEGP) || 0);
      case 'area-desc':
        return (Number(b.areaSqm) || 0) - (Number(a.areaSqm) || 0);
      case 'area-asc':
        return (Number(a.areaSqm) || 0) - (Number(b.areaSqm) || 0);
      case 'newest':
      default:
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    }
  });
}

/**
 * Returns today's local date in YYYY-MM-DD format.
 * @param {Date} now
 * @returns {string}
 */
export function getTodayIsoDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pure validation function for the viewing appointment form.
 * Strictly blocks past dates (date < todayIso).
 * @param {{name: string, phone: string, email: string, date: string}} formData
 * @param {string} todayIso YYYY-MM-DD
 */
export function validateViewingForm(formData, todayIso = getTodayIsoDate()) {
  const errors = {};
  const name = String(formData.name || '').trim();
  const phone = String(formData.phone || '').trim();
  const email = String(formData.email || '').trim();
  const date = String(formData.date || '').trim();

  if (name.length < 3) {
    errors.name = 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل).';
  }

  const digitsOnly = phone.replace(/[^\d]/g, '');
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    errors.phone = 'يرجى إدخال رقم هاتف صحيح (8 إلى 15 رقماً).';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.email = 'يرجى إدخال بريد إلكتروني صحيح.';
  }

  if (!date || date < todayIso) {
    errors.date = 'يرجى اختيار تاريخ اليوم أو تاريخ مستقبلي (لا يُسمح بتواريخ ماضية).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
