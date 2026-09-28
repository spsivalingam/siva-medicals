import { describe, expect, it } from "vitest";
import { formatTime, isOpenAt, istParts, nextChange, weekRows, type DayHours } from "../../src/lib/hours";

const hours: DayHours[] = [
  { day: 1, open: "08:00", close: "22:30" },
  { day: 0, open: "09:00", close: "13:00" },
  { day: 5, open: "20:00", close: "02:00" }, // Friday overnight
];

// Helper: IST wall-clock → Date (IST = UTC+05:30)
const ist = (iso: string) => new Date(`${iso}+05:30`);

describe("istParts", () => {
  it("converts UTC to IST day/minutes regardless of host TZ", () => {
    // 2026-09-27 (Sunday) 20:00 UTC = Monday 01:30 IST
    expect(istParts(new Date("2026-09-27T20:00:00Z"))).toEqual({ day: 1, minutes: 90 });
  });
});

describe("isOpenAt", () => {
  it("open Monday 10:30 IST", () => expect(isOpenAt(ist("2026-09-28T10:30:00"), hours)).toBe(true));
  it("open at exact opening minute", () => expect(isOpenAt(ist("2026-09-28T08:00:00"), hours)).toBe(true));
  it("closed at exact closing minute", () => expect(isOpenAt(ist("2026-09-28T22:30:00"), hours)).toBe(false));
  it("closed Monday 22:31", () => expect(isOpenAt(ist("2026-09-28T22:31:00"), hours)).toBe(false));
  it("closed Sunday 15:00", () => expect(isOpenAt(ist("2026-09-27T15:00:00"), hours)).toBe(false));
  it("open Sunday 12:59", () => expect(isOpenAt(ist("2026-09-27T12:59:00"), hours)).toBe(true));
  it("closed on a day with no entry (Tuesday)", () =>
    expect(isOpenAt(ist("2026-09-29T11:00:00"), hours)).toBe(false));
  it("overnight: open Friday 23:00", () => expect(isOpenAt(ist("2026-10-02T23:00:00"), hours)).toBe(true));
  it("overnight: open Saturday 01:59", () => expect(isOpenAt(ist("2026-10-03T01:59:00"), hours)).toBe(true));
  it("overnight: closed Saturday 02:00", () => expect(isOpenAt(ist("2026-10-03T02:00:00"), hours)).toBe(false));
  it("uses IST even for a UTC timestamp (Mon 03:00 UTC = 08:30 IST)", () =>
    expect(isOpenAt(new Date("2026-09-28T03:00:00Z"), hours)).toBe(true));
});

describe("formatTime", () => {
  const norm = (s: string) => s.replace(/\s/g, " ").toLowerCase();
  it("formats English 12-hour", () => expect(norm(formatTime("22:30", "en"))).toBe("10:30 pm"));
  it("formats Tamil with day-period words, not AM/PM", () => {
    expect(norm(formatTime("08:00", "ta"))).toBe("காலை 8:00");
    expect(norm(formatTime("13:00", "ta"))).toBe("மதியம் 1:00");
    expect(norm(formatTime("22:30", "ta"))).toBe("இரவு 10:30");
  });
});

describe("weekRows", () => {
  it("orders Monday..Sunday and includes empty days", () => {
    const rows = weekRows(hours);
    expect(rows.map((r) => r.day)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(rows[1].slots).toEqual([]);
    expect(rows[6].slots).toEqual([{ day: 0, open: "09:00", close: "13:00" }]);
  });
});

describe("nextChange", () => {
  const week: DayHours[] = [
    { day: 1, open: "08:00", close: "22:30" },
    { day: 2, open: "08:00", close: "22:30" },
    { day: 0, open: "09:00", close: "13:00" },
  ];
  it("while open, returns today's closing time", () =>
    expect(nextChange(ist("2026-09-28T10:00:00"), week)).toBe("22:30"));
  it("after closing, returns next morning's opening time", () =>
    expect(nextChange(ist("2026-09-28T23:00:00"), week)).toBe("08:00"));
  it("Sunday afternoon, returns Monday's opening time", () =>
    expect(nextChange(ist("2026-09-27T14:00:00"), week)).toBe("08:00"));
  it("is independent of the device time zone (UTC input)", () =>
    expect(nextChange(new Date("2026-09-28T04:30:00Z"), week)).toBe("22:30"));
  it("returns null when the shop never opens", () => expect(nextChange(ist("2026-09-28T10:00:00"), [])).toBeNull());
});
