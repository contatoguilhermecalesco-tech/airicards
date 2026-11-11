import { describe, it, expect } from "vitest";
import { betPayout, isValidBet, resolveDuelMood, headToHead } from "./duel-extras-rules";

const bets = [
  { profileId: "guilherme", amount: 50, payoutClaimed: false },
  { profileId: "arlayne", amount: 30, payoutClaimed: false },
];
describe("aposta", () => {
  it("vencedor leva o pote inteiro", () => expect(betPayout("guilherme", "guilherme", bets)).toBe(80));
  it("perdedor não leva nada", () => expect(betPayout("arlayne", "guilherme", bets)).toBe(0));
  it("sem vencedor devolve a própria aposta", () => expect(betPayout("arlayne", null, bets)).toBe(30));
  it("não resgata duas vezes", () => expect(betPayout("guilherme", "guilherme", [{ ...bets[0], payoutClaimed: true }, bets[1]])).toBe(0));
  it("limites 10–200 e saldo", () => {
    expect(isValidBet(9, 999)).toBe(false);
    expect(isValidBet(201, 999)).toBe(false);
    expect(isValidBet(50, 40)).toBe(false);
    expect(isValidBet(50, 50)).toBe(true);
  });
});
describe("humor da Airi", () => {
  it("rival jogou e eu não → pânico", () => expect(resolveDuelMood({ me: "guilherme", hasActive: true, activeOppPlayed: true, activeIPlayed: false, lastWinner: null })).toBe("panic"));
  it("venci o último → campeã", () => expect(resolveDuelMood({ me: "guilherme", hasActive: false, activeOppPlayed: false, activeIPlayed: false, lastWinner: "guilherme" })).toBe("champion"));
  it("perdi o último → chorando", () => expect(resolveDuelMood({ me: "guilherme", hasActive: false, activeOppPlayed: false, activeIPlayed: false, lastWinner: "arlayne" })).toBe("crying"));
});
it("head-to-head conta só vitórias encerradas", () => {
  expect(headToHead([{ winner: "guilherme", status: "completed" }, { winner: "arlayne", status: "completed" }, { winner: "guilherme", status: "active" }])).toEqual({ guilherme: 1, arlayne: 1 });
});
