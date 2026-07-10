import { resolveDecimalSeparators, stripNonCurrencyChars } from './currencyParse';

/**
 * Utility functions for robust currency parsing and formatting.
 * Safe conversion from Brazilian or US formats to numbers, and formatting to BRL.
 */

export function parseCurrencyToNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  const str = String(value).trim();
  if (!str) return 0;

  const normalized = resolveDecimalSeparators(stripNonCurrencyChars(str));
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatToBRL(value: number | string | null | undefined): string {
  const num = typeof value === 'number' ? value : parseCurrencyToNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}
