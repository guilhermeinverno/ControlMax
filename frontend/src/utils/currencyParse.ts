export function stripNonCurrencyChars(value: string): string {
  return value.replace(/[^\d.,-]/g, '');
}

export function resolveDecimalSeparators(clean: string): string {
  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      return clean.replace(/\./g, '').replace(',', '.');
    }
    return clean.replace(/,/g, '');
  }

  if (lastComma !== -1) {
    return clean.replace(',', '.');
  }

  if (lastDot !== -1 && /^-?\d+\.\d{3}$/.test(clean)) {
    return clean.replace(/\./g, '');
  }

  return clean;
}
