import type { Holiday } from '../types/holiday';

export function groupHolidaysByMonth(holidays: Holiday[]): Record<number, Holiday[]> {
  return holidays.reduce((acc: Record<number, Holiday[]>, h) => {
    if (!acc[h.month]) acc[h.month] = [];
    acc[h.month].push(h);
    return acc;
  }, {});
}

export function getUpcomingHolidays(holidays: Holiday[], limit = 5): { holiday: Holiday; nextDate: Date }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const occurrences = holidays
    .filter((h) => h.active)
    .map((h) => {
      let occDate = new Date(today.getFullYear(), h.month - 1, h.day);
      if (occDate < today) {
        occDate = new Date(today.getFullYear() + 1, h.month - 1, h.day);
      }
      return { holiday: h, nextDate: occDate };
    });

  occurrences.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  return occurrences.slice(0, limit);
}

export function sortHolidaysByMonthDay(holidays: Holiday[]): Holiday[] {
  return [...holidays].sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });
}
