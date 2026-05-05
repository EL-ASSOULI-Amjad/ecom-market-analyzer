/**
 * Robust price parser that handles:
 *  - MAD / Arabic locale:  "1 499 Dh"   →  1499
 *  - European:             "1.499,99 €"  →  1500
 *  - French decimal:       "14,99 €"     →    15
 *  - US / UK:              "$1,499.99"   →  1500
 *  - Plain decimal:        "14.99"       →    15
 *  - Plain integer:        "1499"        →  1499
 *
 * Always returns a rounded integer (store as whole currency unit).
 */
export function parsePrice(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();

  // Strip currency symbols, letters, and extra chars — keep digits, space, comma, dot
  s = s.replace(/[^\d\s.,]/g, '').trim();
  if (!s) return null;

  // Collapse all whitespace (used as thousands separator in FR/AR locales)
  s = s.replace(/\s+/g, '');
  if (!s) return null;

  // 1. Plain integer: "1499"
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return n > 0 ? n : null;
  }

  // 2. European thousands + decimal: "1.499,99" or "2.000,00"
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) {
    const clean = s.replace(/\./g, '').replace(',', '.');
    const n = Math.round(parseFloat(clean));
    return n > 0 ? n : null;
  }

  // 3. US/UK thousands + decimal: "1,499.99" or "1,499"
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s)) {
    const clean = s.replace(/,/g, '');
    const n = Math.round(parseFloat(clean));
    return n > 0 ? n : null;
  }

  // 4. French/Spanish decimal only: "14,99" or "1499,99"
  if (/^\d+,\d{1,2}$/.test(s)) {
    const n = Math.round(parseFloat(s.replace(',', '.')));
    return n > 0 ? n : null;
  }

  // 5. Standard decimal: "14.99" or "1499.99"
  if (/^\d+\.\d{1,2}$/.test(s)) {
    const n = Math.round(parseFloat(s));
    return n > 0 ? n : null;
  }

  // 6. Fallback: strip everything non-digit and parseInt
  const fallback = parseInt(s.replace(/[^\d]/g, ''), 10);
  return isNaN(fallback) || fallback <= 0 ? null : fallback;
}
