import { test, expect } from "bun:test";
import { resolveLightning, rewardFor, buildQuestion, lightningAccess, lightningDay, gradeFor, lpFor, comboMultiplier, nextFastStreak } from "./lightning-challenge";

test("5 acertos em até 45s vence", () => {
  expect(resolveLightning(5, 45)).toBe("win");
  expect(resolveLightning(5, 46)).toBe("fail");
  expect(resolveLightning(4, 30)).toBe("fail");
});

test("vitória vale 15 Arlys, derrota vale 0", () => {
  expect(rewardFor("win")).toBe(15);
  expect(rewardFor("fail")).toBe(0);
});

test("pergunta tem 4 alternativas incluindo a certa; precisa de 4 cartas", () => {
  const pool = [
    { id: "1", front: "dog", back: "cachorro" },
    { id: "2", front: "cat", back: "gato" },
    { id: "3", front: "bird", back: "pássaro" },
    { id: "4", front: "fish", back: "peixe" },
  ];
  const q = buildQuestion(pool);
  expect(q.options.length).toBe(4);
  expect(q.options).toContain(q.answer);
  expect(buildQuestion(pool.slice(0, 3))).toBe(null);
});

test("sentido duplo: PT->EN pergunta em português e responde em inglês", () => {
  const pool = [
    { id: "1", front: "dog", back: "cachorro" },
    { id: "2", front: "cat", back: "gato" },
    { id: "3", front: "bird", back: "pássaro" },
    { id: "4", front: "fish", back: "peixe" },
  ];
  const q = buildQuestion(pool, () => 0, "pt-en");
  expect(q.direction).toBe("pt-en");
  expect(q.prompt).toBe("cachorro");
  expect(q.answer).toBe("dog");
  expect(q.options.sort()).toEqual(["bird", "cat", "dog", "fish"]);
});

test("graus: S <15s = 30 Arlys/6 LP, A <25s = 22/4, B até 45s = 15/2", () => {
  expect(gradeFor(14.9)).toBe("S");
  expect(rewardFor("win", 14.9)).toBe(30);
  expect(lpFor("win", 14.9)).toBe(6);
  expect(gradeFor(15)).toBe("A");
  expect(rewardFor("win", 24.9)).toBe(22);
  expect(lpFor("win", 20)).toBe(4);
  expect(gradeFor(25)).toBe("B");
  expect(rewardFor("win", 40)).toBe(15);
  expect(lpFor("win", 40)).toBe(2);
  expect(lpFor("fail", 10)).toBe(0);
  expect(rewardFor("fail", 10)).toBe(0);
});

test("combo: resposta <3s acumula 1.5x e depois 2x; lenta zera", () => {
  expect(comboMultiplier(0)).toBe(1);
  let s = nextFastStreak(0, 2.5);
  expect(comboMultiplier(s)).toBe(1.5);
  s = nextFastStreak(s, 1);
  expect(comboMultiplier(s)).toBe(2);
  s = nextFastStreak(s, 3.2);
  expect(comboMultiplier(s)).toBe(1);
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
