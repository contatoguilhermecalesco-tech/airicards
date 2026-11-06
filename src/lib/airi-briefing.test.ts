import { test, expect } from "bun:test";
import { dailyFocusFor, briefingDay, briefingKey, shouldShowBriefing } from "./airi-briefing";

test("focus follows the existing weekday study schedule", () => {
  const expected = ["missions_pending", "reading", "listening", "speaking", "grammar", "writing", "missions_pending"];
  expected.forEach((focus, index) => expect(dailyFocusFor(new Date(2026, 10, 1 + index))).toBe(focus));
});
test("briefing appears only once per local day", () => {
  const date = new Date(2026, 10, 6, 13);
  expect(briefingDay(date)).toBe("2026-11-06");
  expect(shouldShowBriefing("guilherme", null, date)).toBe(true);
  expect(shouldShowBriefing("guilherme", "2026-11-06", date)).toBe(false);
  expect(shouldShowBriefing("guilherme", "2026-11-05", date)).toBe(true);
});
test("briefing state is separate per profile and requires a selected profile", () => {
  expect(briefingKey("guilherme")).toBe("airi.daily-briefing.guilherme");
  expect(briefingKey("arlayne")).toBe("airi.daily-briefing.arlayne");
  expect(shouldShowBriefing(undefined, null, new Date(2026, 10, 6))).toBe(false);
});