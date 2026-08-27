/**
 * Helper utilities for Brazilian Real: input masks, parse, and display (centavos).
 */

export function formatCurrencyBRL(value: string): string {
  if (!value) return '';

  // Remove thousand separator dots (dots followed by 3 or more digits)
  let clean = value.replace(/\.(\d{3,})/g, '$1');

  // Clean value, allow only digits and first comma/dot as decimal separator
  // We replace dots with commas to standardize on Brazilian Real format
  clean = clean.replace(/[^0-9,.]/g, '');
  
  // Standardize decimal separator: replace dot with comma
  clean = clean.replace(/\./g, ',');
  
  // Keep only the first comma, remove any other commas
  const parts = clean.split(',');
  let integerPart = parts[0];
  let decimalPart = parts[1] !== undefined ? parts[1].substring(0, 2) : undefined;
  
  if (parts.length > 2) {
    decimalPart = parts.slice(1).join('').substring(0, 2);
  }

  // Remove leading zeros from integer part, but preserve '0' if it is just '0'
  const cleanInteger = integerPart.replace(/^0+/, '');
  let formattedInteger = '';
  if (cleanInteger) {
    formattedInteger = parseInt(cleanInteger, 10).toLocaleString('pt-BR');
  } else if (integerPart) {
    formattedInteger = '0';
  }

  if (decimalPart !== undefined) {
    return formattedInteger + ',' + decimalPart;
  }
  
  // If the original input had a trailing comma (e.g. "500,"), make sure to keep it
  if (clean.includes(',')) {
    return formattedInteger + ',';
  }

  return formattedInteger;
}

export function autocompleteCurrencyBRL(value: string): string {
  const num = parseCurrencyBRLToFloat(value);
  if (num === 0) return '';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function parseCurrencyBRLToFloat(formattedValue: string): number {
  if (!formattedValue) return 0;
  // Remove all thousands separator dots, then replace comma with dot for JS parseFloat
  const standardized = formattedValue.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(standardized);
  return isNaN(val) ? 0 : val;
}

export function parseCurrencyBRLToCents(formattedValue: string): number {
  return Math.round(parseCurrencyBRLToFloat(formattedValue) * 100);
}

/** CLEAN-01 — display canônico de valores em centavos (pt-BR, 2 casas). */
export function fmtCents(cents: number): string {
  const n = Number(cents);
  const safe = Number.isFinite(n) ? n : 0;
  return (safe / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * CLEAN-02 — saldo pendente em centavos com fallback legado (string `saldoPendiente`).
 * Ordem: saldoPendienteCents → balance → parse de saldoPendiente → 0.
 */
export function resolvePendingCents(sale: {
  saldoPendienteCents?: number | null;
  balance?: number | null;
  saldoPendiente?: string | null;
}): number {
  if (sale.saldoPendienteCents !== undefined && sale.saldoPendienteCents !== null) {
    const n = Number(sale.saldoPendienteCents);
    if (Number.isFinite(n)) return Math.round(n);
  }
  if (sale.balance !== undefined && sale.balance !== null) {
    const n = Number(sale.balance);
    if (Number.isFinite(n)) return Math.round(n);
  }
  if (sale.saldoPendiente) {
    return parseCurrencyBRLToCents(String(sale.saldoPendiente));
  }
  return 0;
}
