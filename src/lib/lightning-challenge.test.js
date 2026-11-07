import { test, expect } from "bun:test";
import { resolveLightning, rewardFor, buildQuestion } from "./lightning-challenge";

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
