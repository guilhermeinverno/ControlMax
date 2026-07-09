/** Converte valor de `<select>` para union type de estado tipado. */
export function selectValue<T extends string>(value: string): T {
  return value as T;
}
