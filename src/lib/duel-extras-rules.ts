// Regras puras: aposta do duelo, humor da Airi no duelo e carta secreta.
export type PId = "guilherme" | "arlayne";
export const BET_MIN = 10;
export const BET_MAX = 200;
export const SECRET_CARD_REWARD = 20;
/** Carta secreta aparece depois deste número de cartas revisadas. */
export const SECRET_CARD_AFTER = 2;

export type BetRow = { profileId: PId; amount: number; payoutClaimed: boolean };

/** Quanto o perfil pode resgatar quando o duelo termina. */
export function betPayout(me: PId, winner: PId | null, bets: BetRow[]): number {
  const mine = bets.find((b) => b.profileId === me);
  if (!mine || mine.payoutClaimed) return 0;
  if (!winner) return mine.amount; // empate / ninguém jogou: devolve
  if (winner !== me) return 0;
  return bets.reduce((s, b) => s + b.amount, 0);
}

export function isValidBet(amount: number, balance: number): boolean {
  return Number.isInteger(amount) && amount >= BET_MIN && amount <= BET_MAX && amount <= balance;
}

export type DuelMood = "champion" | "crying" | "gg" | "panic" | null;

/**
 * - Duelo ativo, rival já jogou e eu não → pânico "REAGE!"
 * - Duelo ativo, eu já jogei e estou na frente → GG EZ
 * - Último duelo encerrado: venci → campeã com cinturão; perdi → chorando no sorvete
 */
export function resolveDuelMood(opts: {
  me: PId;
  activeIPlayed: boolean;
  activeOppPlayed: boolean;
  lastWinner: PId | null | undefined;
  hasActive: boolean;
}): DuelMood {
  if (opts.hasActive) {
    if (opts.activeOppPlayed && !opts.activeIPlayed) return "panic";
    if (opts.activeIPlayed) return "gg";
  }
  if (!opts.lastWinner) return null;
  return opts.lastWinner === opts.me ? "champion" : "crying";
}

/** Placar head-to-head por vitórias reais (sem penalidade de WO). */
export function headToHead(duels: { winner: PId | null; status: string }[]) {
  let guilherme = 0;
  let arlayne = 0;
  for (const d of duels) {
    if (d.status !== "completed") continue;
    if (d.winner === "guilherme") guilherme++;
    else if (d.winner === "arlayne") arlayne++;
  }
  return { guilherme, arlayne };
}
