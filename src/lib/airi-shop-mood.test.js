import { test, expect } from "bun:test";
import { resolveAiriShopMood, missingArlys } from "./airi-shop-mood";

test("under 100 Arlys shows empty pockets", () => {
  expect(resolveAiriShopMood(0)).toBe("broke");
  expect(resolveAiriShopMood(99)).toBe("broke");
  expect(resolveAiriShopMood(100)).toBe("welcome");
});

test("500 or more Arlys makes the seller excited", () => {
  expect(resolveAiriShopMood(499)).toBe("welcome");
  expect(resolveAiriShopMood(500)).toBe("seller");
  expect(resolveAiriShopMood(900)).toBe("seller");
});

test("insufficient funds show only the missing Arlys", () => {
  expect(missingArlys(150, 900)).toBe(750);
  expect(missingArlys(900, 900)).toBe(0);
  expect(missingArlys(1000, 900)).toBe(0);
});