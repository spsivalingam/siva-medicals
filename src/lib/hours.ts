/** 0 = Sunday … 6 = Saturday. Times are "HH:MM" in IST. close <= open means closing after midnight. */
export type DayHours = { day: 0 | 1 | 2 | 3 | 4 | 5 | 6; open: string; close: string };
