import { test, expect } from "bun:test";
import { resolveAiriMood } from "./airi-streak-mood";

test("zero-day streak always uses the frozen emote", () => {
  for (const hour of [0, 10, 20, 23]) {
    for (const studiedToday of [false, true]) {
      expect(resolveAiriMood({ current: 0, studiedToday, hour })).toBe("lost");
    }
  }
});

test("active streak celebrates today's study", () => {
  expect(resolveAiriMood({ current: 1, studiedToday: true, hour: 21 })).toBe("done");
});

test("active streak uses running before 20h and urgency from 20h", () => {
  expect(resolveAiriMood({ current: 3, studiedToday: false, hour: 19 })).toBe("pending");
  expect(resolveAiriMood({ current: 3, studiedToday: false, hour: 20 })).toBe("urgent");
});