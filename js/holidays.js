let holidays = [];

export async function loadHolidays() {
  if (holidays.length) return holidays;
  try {
    const res = await fetch("data/holidays.json");
    if (!res.ok) return holidays;
    const json = await res.json();
    holidays = json.map(h => ({
      ...h,
      dateObj: new Date(h.date + "T00:00:00")
    }));
  } catch (_) {
    // ignore
  }
  return holidays;
}

export function isHoliday(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  const dISO = dateObj.toISOString().slice(0, 10);
  const match = holidays.find(h => h.date === dISO);
  return match || null;
}

export function isDayBeforeOrAfterHoliday(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  const d0 = dateObj.getTime();
  for (const h of holidays) {
    const diffDays = Math.round((h.dateObj.getTime() - d0) / dayMs);
    if (diffDays === 1 || diffDays === -1) return h;
  }
  return null;
}

export function getUpcomingHolidaysWithin(days, fromDate) {
  if (!holidays.length) return [];
  const base = fromDate || new Date();
  const baseMs = base.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return holidays.filter(h => {
    const diff = (h.dateObj.getTime() - baseMs) / dayMs;
    return diff >= 0 && diff <= days;
  });
}

