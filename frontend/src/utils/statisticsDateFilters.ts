export function filterByDateRange<T>(
  items: T[],
  getDate: (item: T) => Date,
  start: Date,
  end: Date
): T[] {
  return items.filter((item) => {
    const date = getDate(item);
    return date >= start && date <= end;
  });
}
