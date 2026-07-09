/**
 * Utility functions for robust currency parsing and formatting.
 * Safe conversion from Brazilian or US formats to numbers, and formatting to BRL.
 */

/**
 * Parses a string or number representation of currency into a clean number.
 * Safely handles empty values, non-string/non-number parameters,
 * and Brazilian/American formatting (e.g., "1.200,00", "1,200.00", "700,00", "500").
 * Returns 0 as a fallback instead of NaN.
 */
export function parseCurrencyToNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  const str = String(value).trim();
  if (!str) {
    return 0;
  }

  // Remove any non-numeric characters except dots, commas, and negative signs
  let clean = str.replace(/[^\d.,-]/g, '');

  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');

  if (lastComma !== -1 && lastDot !== -1) {
    // Both comma and dot exist (e.g. "1.200,50" or "1,200.50")
    if (lastComma > lastDot) {
      // Brazilian style: "1.200,50"
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // American style: "1,200.50"
      clean = clean.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    // Only commas exist (e.g. "1200,50" or "700,00")
    clean = clean.replace(',', '.');
  } else if (lastDot !== -1) {
    // Only dots exist (e.g. "1200.50" or thousands separator "1.200")
    // If the dot is followed by exactly 3 digits, we treat it as a BRL thousands separator
    const matchThousands = clean.match(/^-?\d+\.\d{3}$/);
    if (matchThousands) {
      clean = clean.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a numeric value or parsable string into a Brazilian Real currency string.
 * Uses native Intl.NumberFormat API.
 */
export function formatToBRL(value: number | string | null | undefined): string {
  const num = typeof value === 'number' ? value : parseCurrencyToNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}
