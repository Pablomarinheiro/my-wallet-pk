import { describe, expect, it } from "vitest";
import { isInMonth, parseLocalDate, shortDate } from "./format";

describe("parseLocalDate", () => {
  it("keeps the day from a YYYY-MM-DD string instead of shifting to UTC", () => {
    const d = parseLocalDate("2026-09-06");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // setembro, 0-indexado
    expect(d.getDate()).toBe(6);
  });

  it("also works when the string carries a time component", () => {
    const d = parseLocalDate("2026-01-31T00:00:00");
    expect(d.getDate()).toBe(31);
    expect(d.getMonth()).toBe(0);
  });

  it("never regresses to the classic new Date(iso) off-by-one bug", () => {
    // new Date("2026-09-06") is midnight UTC; in any zone behind UTC
    // (e.g. Brazil, UTC-3) that prints as day 05. parseLocalDate must not.
    const buggy = new Date("2026-09-06");
    const fixed = parseLocalDate("2026-09-06");
    expect(fixed.getDate()).toBe(6);
    // Only assert the two differ where the environment actually reproduces
    // the bug (a UTC-negative test runner) — in UTC-run CI they'd coincide.
    if (buggy.getTimezoneOffset() > 0) {
      expect(fixed.getDate()).not.toBe(buggy.getDate());
    }
  });
});

describe("shortDate", () => {
  it("formats a YYYY-MM-DD string as day/month in pt-BR without shifting days", () => {
    expect(shortDate("2026-09-06")).toContain("06");
  });
});

describe("isInMonth", () => {
  it("matches a date within the given local month/year", () => {
    expect(isInMonth("2026-09-06", 8, 2026)).toBe(true);
  });

  it("rejects a date outside the given month", () => {
    expect(isInMonth("2026-09-06", 7, 2026)).toBe(false);
    expect(isInMonth("2026-09-06", 8, 2025)).toBe(false);
  });

  it("does not exclude the first day of the month due to UTC rounding", () => {
    // The historical bug: new Date("2026-09-01") reads as Aug 31 in UTC-3,
    // which would wrongly fall outside September here.
    expect(isInMonth("2026-09-01", 8, 2026)).toBe(true);
  });

  it("does not include the last day of the previous month due to UTC rounding", () => {
    expect(isInMonth("2026-08-31", 8, 2026)).toBe(false);
  });
});
