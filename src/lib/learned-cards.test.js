import { test, expect } from "bun:test";
import { isDueForReview, isLearned } from "./flashcards-store";

const base = { id: "1", deckId: "d", front: "dog", back: "cachorro", ease: 2.5, interval: 0, reps: 0, dueAt: 1000, createdAt: 0 };

test("carta aprendida não entra na revisão mesmo vencida", () => {
  expect(isDueForReview({ ...base, learnedAt: 500 }, 2000)).toBe(false);
  expect(isLearned({ ...base, learnedAt: 500 })).toBe(true);
});

test("carta normal vencida entra na revisão", () => {
  expect(isDueForReview(base, 2000)).toBe(true);
  expect(isDueForReview(base, 500)).toBe(false);
});
