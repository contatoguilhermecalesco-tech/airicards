import { test, expect } from "bun:test";
import { resolveLightning, rewardFor, buildQuestion, lightningAccess, lightningDay } from "./lightning-challenge";

test("5 acertos em até 45s vence", () => {
  expect(resolveLightning(5, 45)).toBe("win");
  expect(resolveLightning(5, 46)).toBe("fail");
  expect(resolveLightning(4, 30)).toBe("fail");
});

test("vitória vale 15 Arlys, derrota vale 0", () => {
  expect(rewardFor("win")).toBe(15);
  expect(rewardFor("fail")).toBe(0);
});

test("pergunta tem 3 alternativas incluindo a certa", () => {
  const pool = [
    { id: "1", front: "dog", back: "cachorro" },
    { id: "2", front: "cat", back: "gato" },
    { id: "3", front: "bird", back: "pássaro" },
  ];
  const q = buildQuestion(pool);
  expect(q.options.length).toBe(3);
  expect(q.options).toContain(q.answer);
  expect(buildQuestion(pool.slice(0, 2))).toBe(null);
});

import { resolveAnswer, msUntilNextChallenge } from "./lightning-challenge";
test("morte súbita: um erro perde na hora", () => {
  expect(resolveAnswer(false, 4, 10)).toBe("fail");
  expect(resolveAnswer(true, 3, 10)).toBe("continue");
  expect(resolveAnswer(true, 5, 20)).toBe("win");
});
test("próximo desafio abre à meia-noite", () => {
  expect(msUntilNextChallenge(new Date(2026, 10, 9, 23, 0, 0))).toBe(3600000);
});

test("admin fecha: ninguém joga; admin abre: joga sempre", () => {
  const today = `${lightningDay()}:win:1000`;
  expect(lightningAccess("closed", 0, null)).toBe("closed");
  expect(lightningAccess("open", 0, today)).toBe("available");
});

test("modo diário: 1x por dia, liberação do admin abre nova rodada", () => {
  const today = `${lightningDay()}:fail:1000`;
  expect(lightningAccess("auto", 0, today)).toBe("played");
  expect(lightningAccess("auto", 2000, today)).toBe("available");
  expect(lightningAccess("auto", 500, today)).toBe("played");
  expect(lightningAccess("auto", 0, "2000-01-01:win:1")).toBe("available");
});
