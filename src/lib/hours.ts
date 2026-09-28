/** 0 = Sunday … 6 = Saturday. Times are "HH:MM" in IST. close <= open means closing after midnight. */
export type DayHours = { day: 0 | 1 | 2 | 3 | 4 | 5 | 6; open: string; close: string };

const IST_OFFSET_MIN = 330;

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Day-of-week and minutes-since-midnight in IST, independent of the device's time zone. */
export function istParts(date: Date): { day: number; minutes: number } {
  const shifted = new Date(date.getTime() + IST_OFFSET_MIN * 60_000);
  return { day: shifted.getUTCDay(), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

export function isOpenAt(date: Date, hours: readonly DayHours[]): boolean {
  const { day, minutes } = istParts(date);
  const prevDay = (day + 6) % 7;
  return hours.some((h) => {
    const open = toMinutes(h.open);
    const close = toMinutes(h.close);
    if (close > open) return h.day === day && minutes >= open && minutes < close;
    return (h.day === day && minutes >= open) || (h.day === prevDay && minutes < close);
  });
}

export function formatTime(hhmm: string, locale: "en" | "ta"): string {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function weekRows(hours: readonly DayHours[]): { day: number; slots: DayHours[] }[] {
  return WEEK_ORDER.map((day) => ({ day, slots: hours.filter((h) => h.day === day) }));
}
