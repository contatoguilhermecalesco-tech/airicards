// Social store — Duelos, Presentes de cartas, Feed de atividade (kudos).
// App familiar de 2 perfis ('guilherme' | 'arlayne'), sem auth.
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PROFILES } from "@/lib/profile";
import { trackDuelWin } from "@/lib/daily-challenges";

export type ProfileId = "guilherme" | "arlayne";

export function otherProfile(id: ProfileId): ProfileId {
  return id === "guilherme" ? "arlayne" : "guilherme";
}

export function profileMeta(id: string) {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}

/** ISO Week key — "2026-W30". */
export function currentWeekKey(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// ============================================================
// Tipos
// ============================================================

export type DuelCardSnapshot = { id: string; front: string; back: string; category?: string };

export type Duel = {
  id: string;
  weekKey: string;
  deckName: string;
  deckSourceId: string | null;
  cardsSnapshot: DuelCardSnapshot[];
  createdBy: ProfileId;
  status: "active" | "completed";
  winner: ProfileId | null;
  forfeitBy: ProfileId | null;
  expiresAt: string;
  remindedAt: string | null;
  createdAt: string;
  completedAt: string | null;
};

/** Prazo da rodada (horas) e antecedência do lembrete. */
export const DUEL_WINDOW_HOURS = 48;
export const DUEL_REMIND_HOURS = 24;

export type DuelResult = {
  id: string;
  duelId: string;
  profileId: ProfileId;
  correct: number;
  total: number;
  timeMs: number;
  accuracy: number;
  completedAt: string;
};

export type CardGift = {
  id: string;
  fromProfile: ProfileId;
  toProfile: ProfileId;
  front: string;
  back: string;
  category: "word" | "phrase" | "expression";
  sourceNote: string | null;
  status: "pending" | "imported" | "declined";
  createdAt: string;
  respondedAt: string | null;
};

export type ActivityKind =
  | "rank_up"
  | "exam_done"
  | "streak_milestone"
  | "enemy_defeated"
  | "duel_won";

export type ActivityEvent = {
  id: string;
  profileId: ProfileId;
  kind: ActivityKind;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type ActivityReaction = {
  id: string;
  eventId: string;
  profileId: ProfileId;
  emoji: string;
  createdAt: string;
};

export type ActivityComment = {
  id: string;
  eventId: string;
  profileId: ProfileId;
  body: string;
  createdAt: string;
};

// ============================================================
// Estado in-memory + pub/sub
// ============================================================

type State = {
  duels: Duel[];
  duelResults: DuelResult[];
  gifts: CardGift[];
  events: ActivityEvent[];
  reactions: ActivityReaction[];
  comments: ActivityComment[];
  loaded: boolean;
};

let state: State = {
  duels: [],
  duelResults: [],
  gifts: [],
  events: [],
  reactions: [],
  comments: [],
  loaded: false,
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function useSocial<T>(selector: (s: State) => T): T {
  const snap = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
  return useMemo(() => selector(snap), [snap, selector]);
}

// ============================================================
// Row → domain mapping
// ============================================================

function mapDuel(row: any): Duel {
  return {
    id: row.id,
    weekKey: row.week_key,
    deckName: row.deck_name,
    deckSourceId: row.deck_source_id,
    cardsSnapshot: (row.cards_snapshot ?? []) as DuelCardSnapshot[],
    createdBy: row.created_by,
    status: row.status,
    winner: row.winner,
    forfeitBy: row.forfeit_by ?? null,
    expiresAt: row.expires_at,
    remindedAt: row.reminded_at ?? null,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}
function mapResult(row: any): DuelResult {
  return {
    id: row.id,
    duelId: row.duel_id,
    profileId: row.profile_id,
    correct: row.correct,
    total: row.total,
    timeMs: row.time_ms,
    accuracy: Number(row.accuracy),
    completedAt: row.completed_at,
  };
}
function mapGift(row: any): CardGift {
  return {
    id: row.id,
    fromProfile: row.from_profile,
    toProfile: row.to_profile,
    front: row.front,
    back: row.back,
    category: row.category,
    sourceNote: row.source_note,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}
function mapEvent(row: any): ActivityEvent {
  return {
    id: row.id,
    profileId: row.profile_id,
    kind: row.kind,
    payload: row.payload ?? {},
    createdAt: row.created_at,
  };
}
function mapReaction(row: any): ActivityReaction {
  return {
    id: row.id,
    eventId: row.event_id,
    profileId: row.profile_id,
    emoji: row.emoji,
    createdAt: row.created_at,
  };
}
function mapComment(row: any): ActivityComment {
  return {
    id: row.id,
    eventId: row.event_id,
    profileId: row.profile_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

// ============================================================
// Bootstrap: fetch inicial + realtime
// ============================================================

let started = false;
let channel: ReturnType<typeof supabase.channel> | null = null;

async function fetchAll() {
  const anySb = supabase as any;
  const [duels, results, gifts, events, reactions, comments] = await Promise.all([
    anySb.from("duels").select("*").order("created_at", { ascending: false }).limit(30),
    anySb.from("duel_results").select("*"),
    anySb.from("card_gifts").select("*").order("created_at", { ascending: false }).limit(50),
    anySb.from("activity_events").select("*").order("created_at", { ascending: false }).limit(30),
    anySb.from("activity_reactions").select("*"),
    anySb.from("activity_comments").select("*").order("created_at", { ascending: true }),
  ]);
  state = {
    duels: (duels.data ?? []).map(mapDuel),
    duelResults: (results.data ?? []).map(mapResult),
    gifts: (gifts.data ?? []).map(mapGift),
    events: (events.data ?? []).map(mapEvent),
    reactions: (reactions.data ?? []).map(mapReaction),
    comments: (comments.data ?? []).map(mapComment),
    loaded: true,
  };
  emit();
}

export function startSocialSync() {
  if (started) return;
  started = true;
  fetchAll()
    .then(() => runDuelMaintenance())
    .catch(() => {});

  channel = supabase
    .channel("social-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "duels" }, () => fetchAll())
    .on("postgres_changes", { event: "*", schema: "public", table: "duel_results" }, () => fetchAll())
    .on("postgres_changes", { event: "*", schema: "public", table: "card_gifts" }, () => fetchAll())
    .on("postgres_changes", { event: "*", schema: "public", table: "activity_events" }, () => fetchAll())
    .on("postgres_changes", { event: "*", schema: "public", table: "activity_reactions" }, () => fetchAll())
    .on("postgres_changes", { event: "*", schema: "public", table: "activity_comments" }, () => fetchAll())
    .subscribe();

  // Verifica prazos a cada 5 minutos.
  if (typeof window !== "undefined") {
    setInterval(() => {
      runDuelMaintenance().catch(() => {});
    }, 5 * 60_000);
  }
}

export function useSocialSync() {
  useEffect(() => {
    startSocialSync();
  }, []);
}

// ============================================================
// DUELOS
// ============================================================

export function useWeeklyDuel(): Duel | null {
  return useSocial((s) => s.duels.find((d) => d.weekKey === currentWeekKey()) ?? null);
}
export function useDuelHistory(): Duel[] {
  return useSocial((s) => s.duels.filter((d) => d.status === "completed").slice(0, 20));
}
export function useDuelResults(duelId: string | undefined): DuelResult[] {
  return useSocial((s) => (duelId ? s.duelResults.filter((r) => r.duelId === duelId) : []));
}
export function useDuelScore(): { g: number; a: number } {
  return useSocial((s) => {
    let g = 0;
    let a = 0;
    for (const d of s.duels) {
      if (d.winner === "guilherme") g++;
      else if (d.winner === "arlayne") a++;
      if (d.forfeitBy === "guilherme") g--;
      else if (d.forfeitBy === "arlayne") a--;
    }
    return { g, a };
  });
}

/** Estado do prazo do duelo. */
export function duelDeadline(duel: Duel | null | undefined) {
  if (!duel) return null;
  const expires = new Date(duel.expiresAt).getTime();
  const now = Date.now();
  const msLeft = expires - now;
  return {
    expiresAt: expires,
    msLeft,
    expired: msLeft <= 0,
    remindWindow: msLeft > 0 && msLeft <= DUEL_REMIND_HOURS * 3600_000,
  };
}

/** Cria o duelo da semana com um baralho aleatório. */
export async function createWeeklyDuel(
  createdBy: ProfileId,
  deck: { id: string; name: string },
  cards: DuelCardSnapshot[],
): Promise<Duel | null> {
  const week = currentWeekKey();
  const pool = [...cards];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const snapshot = pool.slice(0, Math.min(5, pool.length));

  const { data, error } = await (supabase as any)
    .from("duels")
    .insert({
      week_key: week,
      deck_name: deck.name,
      deck_source_id: deck.id,
      cards_snapshot: snapshot,
      created_by: createdBy,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    if ((error as any).code === "23505") {
      const { data: existing } = await (supabase as any)
        .from("duels")
        .select("*")
        .eq("week_key", week)
        .maybeSingle();
      return existing ? mapDuel(existing) : null;
    }
    console.error("createWeeklyDuel", error);
    return null;
  }
  return data ? mapDuel(data) : null;
}

/** Registra resultado; se ambos completaram, define winner. */
export async function submitDuelResult(
  duel: Duel,
  profileId: ProfileId,
  result: { correct: number; total: number; timeMs: number },
): Promise<void> {
  const accuracy = result.total > 0 ? result.correct / result.total : 0;
  const { error } = await (supabase as any).from("duel_results").upsert(
    {
      duel_id: duel.id,
      profile_id: profileId,
      correct: result.correct,
      total: result.total,
      time_ms: result.timeMs,
      accuracy: Number(accuracy.toFixed(4)),
    },
    { onConflict: "duel_id,profile_id" },
  );
  if (error) {
    console.error("submitDuelResult", error);
    return;
  }

  // Provação "Duelista": conta assim que o usuário envia seu resultado,
  // vencendo ou perdendo — desafio do primeiro bundle é leve.
  trackDuelWin();


  const { data: allResults } = await (supabase as any)
    .from("duel_results")
    .select("*")
    .eq("duel_id", duel.id);
  const rows: DuelResult[] = (allResults ?? []).map(mapResult);
  if (rows.length >= 2) {
    const [a, b] = rows.sort((x, y) => {
      if (y.accuracy !== x.accuracy) return y.accuracy - x.accuracy;
      return x.timeMs - y.timeMs;
    });
    const winner: ProfileId | null =
      a.accuracy === b.accuracy && a.timeMs === b.timeMs ? null : a.profileId;

    await (supabase as any)
      .from("duels")
      .update({
        status: "completed",
        winner,
        completed_at: new Date().toISOString(),
      })
      .eq("id", duel.id);

    if (winner) {
      const opp = rows.find((r) => r.profileId !== winner);
      await emitActivity(winner, "duel_won", {
        weekKey: duel.weekKey,
        deckName: duel.deckName,
        accuracy: a.accuracy,
        opponentAccuracy: opp?.accuracy ?? 0,
      });
    }
  }
}


// ============================================================
// PRESENTES
// ============================================================

export function usePendingGifts(toProfile: ProfileId | undefined): CardGift[] {
  return useSocial((s) =>
    toProfile
      ? s.gifts.filter((g) => g.toProfile === toProfile && g.status === "pending")
      : [],
  );
}

export function useSentGifts(fromProfile: ProfileId | undefined): CardGift[] {
  return useSocial((s) =>
    fromProfile ? s.gifts.filter((g) => g.fromProfile === fromProfile).slice(0, 10) : [],
  );
}

export async function sendCardGift(input: {
  from: ProfileId;
  to: ProfileId;
  front: string;
  back: string;
  category?: "word" | "phrase" | "expression";
  note?: string;
}): Promise<void> {
  const { error } = await (supabase as any).from("card_gifts").insert({
    from_profile: input.from,
    to_profile: input.to,
    front: input.front.trim(),
    back: input.back.trim(),
    category: input.category ?? "phrase",
    source_note: input.note?.trim() || null,
    status: "pending",
  });
  if (error) console.error("sendCardGift", error);
}

export async function respondToGift(giftId: string, action: "imported" | "declined"): Promise<void> {
  const { error } = await (supabase as any)
    .from("card_gifts")
    .update({ status: action, responded_at: new Date().toISOString() })
    .eq("id", giftId);
  if (error) console.error("respondToGift", error);
}

// ============================================================
// ATIVIDADE (kudos)
// ============================================================

export function useActivityFeed(otherId: ProfileId | undefined, limit = 8): ActivityEvent[] {
  return useSocial((s) =>
    otherId ? s.events.filter((e) => e.profileId === otherId).slice(0, limit) : [],
  );
}

/** Feed unificado — eventos dos dois perfis, mais recentes primeiro. */
export function useUnifiedFeed(limit = 30): ActivityEvent[] {
  return useSocial((s) => s.events.slice(0, limit));
}

export function useReactionsForEvent(eventId: string): ActivityReaction[] {
  return useSocial((s) => s.reactions.filter((r) => r.eventId === eventId));
}

export function useCommentsForEvent(eventId: string): ActivityComment[] {
  return useSocial((s) => s.comments.filter((comment) => comment.eventId === eventId));
}

export async function addActivityComment(
  eventId: string,
  profileId: ProfileId,
  body: string,
): Promise<boolean> {
  const cleanBody = body.trim().slice(0, 280);
  if (!cleanBody) return false;
  const { error } = await (supabase as any).from("activity_comments").insert({
    event_id: eventId,
    profile_id: profileId,
    body: cleanBody,
  });
  if (error) {
    console.error("addActivityComment", error);
    return false;
  }
  await fetchAll();
  return true;
}

/** Timeline consolidada de um perfil (eventos + duelos + presentes). */
export function useProfileTimeline(profileId: string | undefined) {
  return useSocial((s) => {
    if (!profileId) return { events: [], duels: [], gifts: [] };
    return {
      events: s.events.filter((e) => e.profileId === profileId),
      duels: s.duels.filter(
        (d) =>
          d.status === "completed" &&
          (d.createdBy === profileId ||
            d.winner === profileId ||
            d.forfeitBy === profileId ||
            s.duelResults.some((r) => r.duelId === d.id && r.profileId === profileId)),
      ),
      gifts: s.gifts.filter(
        (g) => g.fromProfile === profileId || g.toProfile === profileId,
      ),
    };
  });
}

let lastEmit: { key: string; at: number } | null = null;
export async function emitActivity(
  profileId: ProfileId,
  kind: ActivityKind,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const key = `${profileId}:${kind}:${JSON.stringify(payload)}`;
  const now = Date.now();
  if (lastEmit && lastEmit.key === key && now - lastEmit.at < 4000) return;
  lastEmit = { key, at: now };

  const { error } = await (supabase as any).from("activity_events").insert({
    profile_id: profileId,
    kind,
    payload,
  });
  if (error) console.error("emitActivity", error);
}

export async function toggleReaction(
  eventId: string,
  profileId: ProfileId,
  emoji: string,
): Promise<void> {
  const existing = state.reactions.find(
    (r) => r.eventId === eventId && r.profileId === profileId && r.emoji === emoji,
  );
  if (existing) {
    await (supabase as any).from("activity_reactions").delete().eq("id", existing.id);
  } else {
    await (supabase as any).from("activity_reactions").insert({
      event_id: eventId,
      profile_id: profileId,
      emoji,
    });
  }
}

// ============================================================
// Manutenção automática de duelos (prazo + lembrete)
// ============================================================

let maintenanceRunning = false;

/**
 * Resolve duelos ativos que já expiraram e envia notificação
 * quando o prazo está próximo do fim.
 */
export async function runDuelMaintenance(): Promise<void> {
  if (maintenanceRunning) return;
  maintenanceRunning = true;
  try {
    const now = Date.now();
    const active = state.duels.filter((d) => d.status === "active");
    for (const d of active) {
      const expires = new Date(d.expiresAt).getTime();
      const results = state.duelResults.filter((r) => r.duelId === d.id);

      // Expirou → resolve por WO.
      if (expires <= now) {
        await resolveExpiredDuel(d, results);
        continue;
      }

      // Faltam < 24h e ainda não jogaram todos → lembrete (uma vez).
      const msLeft = expires - now;
      if (!d.remindedAt && msLeft <= DUEL_REMIND_HOURS * 3600_000) {
        await sendDuelReminder(d, results);
      }
    }
  } finally {
    maintenanceRunning = false;
  }
}

async function resolveExpiredDuel(d: Duel, results: DuelResult[]): Promise<void> {
  const anySb = supabase as any;
  const played = new Set(results.map((r) => r.profileId));
  const opponent: ProfileId = otherProfile(d.createdBy);
  const gPlayed = played.has("guilherme");
  const aPlayed = played.has("arlayne");

  let winner: ProfileId | null = null;
  let forfeit: ProfileId | null = null;

  if (gPlayed && !aPlayed) {
    winner = "guilherme";
    forfeit = "arlayne";
  } else if (aPlayed && !gPlayed) {
    winner = "arlayne";
    forfeit = "guilherme";
  } else if (!gPlayed && !aPlayed) {
    // Ninguém jogou — quem criou leva o WO, sem vencedor.
    winner = null;
    forfeit = d.createdBy;
  } else {
    // Ambos jogaram — cai na lógica normal em submitDuelResult, ignore.
    return;
  }

  await anySb
    .from("duels")
    .update({
      status: "completed",
      winner,
      forfeit_by: forfeit,
      completed_at: new Date().toISOString(),
    })
    .eq("id", d.id)
    .eq("status", "active");

  // Notificação de encerramento.
  const title = winner
    ? `🏆 Duelo encerrado por WO`
    : `⌛ Duelo expirado`;
  const body = winner
    ? `${profileMeta(winner).name} venceu — ${profileMeta(forfeit!).name} não jogou a tempo (−1 no placar).`
    : `Ninguém jogou o duelo desta semana. ${profileMeta(forfeit!).name} leva −1 por abrir e não terminar.`;

  await anySb.from("notifications").insert({
    title,
    body,
    icon: "swords",
    action_label: "Ver duelo",
    action_route: "/duel",
  });

  if (winner) {
    await emitActivity(winner, "duel_won", {
      weekKey: d.weekKey,
      deckName: d.deckName,
      byForfeit: true,
      opponent,
    });
  }
}

async function sendDuelReminder(d: Duel, results: DuelResult[]): Promise<void> {
  const anySb = supabase as any;
  const played = new Set(results.map((r) => r.profileId));
  const missing: ProfileId[] = (["guilherme", "arlayne"] as ProfileId[]).filter(
    (p) => !played.has(p),
  );
  if (missing.length === 0) return;

  const hoursLeft = Math.max(1, Math.round((new Date(d.expiresAt).getTime() - Date.now()) / 3600_000));
  const names = missing.map((p) => profileMeta(p).name).join(" e ");

  await anySb.from("notifications").insert({
    title: `⚔️ Duelo termina em ${hoursLeft}h`,
    body: `${names} ${missing.length === 1 ? "ainda não jogou" : "ainda não jogaram"} o duelo desta semana. Jogue agora ou perde por WO.`,
    icon: "swords",
    action_label: "Jogar agora",
    action_route: "/duel",
  });

  await anySb
    .from("duels")
    .update({ reminded_at: new Date().toISOString() })
    .eq("id", d.id);
}

