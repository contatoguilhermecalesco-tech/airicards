import { test, expect } from "bun:test";
import { buildAdminRank, normalizeRankTarget, pickCanonicalRank } from "./rank-override";

test("admin define Diamante II com 40 LP", () => {
  const r = buildAdminRank({ tier: "iron", division: 4, lp: 10, totalEarned: 300 }, { tier: "diamond", division: 2, lp: 40 }, "Diamante II", new Date(2026, 10, 12));
  expect(r.tier).toBe("diamond");
  expect(r.division).toBe(2);
  expect(r.lp).toBe(40);
  expect(r.peakTier).toBe("diamond");
  expect(r.totalEarned).toBe(300);
  expect(r.season).toBe("2026-S4");
});

test("admin pode rebaixar para Ferro IV", () => {
  const r = buildAdminRank({ tier: "diamond", division: 1, lp: 80 }, { tier: "iron", division: 4, lp: 0 }, "Ferro IV");
  expect(r.tier).toBe("iron");
  expect(r.division).toBe(4);
  expect(r.peakTier).toBe("iron");
});

test("elite não tem divisão e LP fica na faixa do tier", () => {
  expect(normalizeRankTarget("grandmaster", 2, 100)).toEqual({ tier: "grandmaster", division: null, lp: 800 });
  expect(normalizeRankTarget("master", null, 5000)).toEqual({ tier: "master", division: null, lp: 799 });
  expect(normalizeRankTarget("gold", 1, 150)).toEqual({ tier: "gold", division: 1, lp: 99 });
});

test("ajuste do admin vence dispositivo com mais LP ganho", () => {
  const stale = { tier: "gold", totalEarned: 5000 };
  const set = { tier: "iron", totalEarned: 100, adminOverrideAt: 1000 };
  expect(pickCanonicalRank(stale, set)).toBe(set);
  expect(pickCanonicalRank(set, stale)).toBe(set);
});
