import { test, expect } from "bun:test";
import { seasonFor, softReset, seasonReward, placementDelta, createSeasonTransition } from "./season-engine";

test("temporadas trimestrais começando em 1º de janeiro", () => {
  expect(seasonFor(new Date(2027, 0, 1)).id).toBe("2027-S1");
  expect(seasonFor(new Date(2027, 2, 31)).id).toBe("2027-S1");
  expect(seasonFor(new Date(2027, 3, 1)).id).toBe("2027-S2");
  expect(seasonFor(new Date(2026, 10, 11)).id).toBe("2026-S4");
});

test("soft reset desce cerca de um tier", () => {
  expect(softReset("challenger")).toEqual({ tier: "diamond", division: 4 });
  expect(softReset("diamond")).toEqual({ tier: "platinum", division: 4 });
  expect(softReset("emerald")).toEqual({ tier: "gold", division: 4 });
  expect(softReset("platinum")).toEqual({ tier: "silver", division: 4 });
  expect(softReset("gold")).toEqual({ tier: "bronze", division: 4 });
  expect(softReset("silver")).toEqual({ tier: "iron", division: 4 });
});

test("recompensa por pico", () => {
  expect(seasonReward("iron")).toBe(50);
  expect(seasonReward("silver")).toBe(100);
  expect(seasonReward("gold")).toBe(180);
  expect(seasonReward("emerald")).toBe(260);
  expect(seasonReward("master")).toBe(400);
});

test("calibração não perde LP e ganha 1.5x", () => {
  expect(placementDelta(-20)).toBe(0);
  expect(placementDelta(20)).toBe(30);
});
