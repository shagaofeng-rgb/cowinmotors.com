import assert from "node:assert/strict";
import { test } from "node:test";
import { getAdminDateRange, resolveDateRange } from "../lib/adminDateRange.ts";

function shanghaiDay(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

test("admin presets expose the five requested date choices", () => {
  for (const [input, preset] of [["today", "today"], ["week", "week"], ["month", "month"], ["ninety", "ninety"]]) {
    assert.equal(getAdminDateRange(new URLSearchParams({ range: input })).preset, preset);
  }
  assert.equal(getAdminDateRange(new URLSearchParams({ range: "custom", startDate: "2026-10-01", endDate: "2026-10-10" })).preset, "custom");
});

test("week starts on Monday in the reporting timezone", () => {
  const range = resolveDateRange({ preset: "week", days: 7, endDate: "2026-10-10" });
  assert.equal(shanghaiDay(range.startDate), "2026-10-05");
  assert.equal(shanghaiDay(range.endDate), "2026-10-10");
});

test("month starts on the first local calendar day", () => {
  const range = resolveDateRange({ preset: "month", days: 31, endDate: "2026-10-10" });
  assert.equal(shanghaiDay(range.startDate), "2026-10-01");
});

test("90 days and custom range retain their exact boundaries", () => {
  const ninety = resolveDateRange({ preset: "ninety", days: 90, endDate: "2026-10-10" });
  assert.equal(ninety.rangeDays, 90);
  const custom = resolveDateRange(getAdminDateRange(new URLSearchParams({ range: "custom", startDate: "2026-10-01", endDate: "2026-10-10" })));
  assert.equal(shanghaiDay(custom.startDate), "2026-10-01");
  assert.equal(shanghaiDay(custom.endDate), "2026-10-10");
  assert.equal(custom.rangeDays, 10);
});
