import { test, expect } from "bun:test";
import { resolveAiriShopMood, missingArlys, resolveShopMascotVariant } from "./airi-shop-mood";

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

test("admin can force the Black Friday Airi even without a Black promo", () => {
  expect(resolveShopMascotVariant("black", false)).toBe("black");
});

test("admin can force the normal Airi even with a Black promo active", () => {
  expect(resolveShopMascotVariant("normal", true)).toBe("normal");
});

test("automatic mode follows whether a Black promo is active", () => {
  expect(resolveShopMascotVariant("auto", true)).toBe("black");
  expect(resolveShopMascotVariant("auto", false)).toBe("normal");
});
