// Jornada Compartilhada — o mapa do casal.
// Um único registro compartilhado (`journey_shared.id = 'casal'`) acumula o
// progresso dos DOIS perfis. Não importa quem estudou: tudo soma na mesma
// jornada. Paradas do mapa desbloqueiam diálogos do guia, curiosidades de
// inglês e Arlys ✦ para quem abrir a parada.
//
// Escrita atômica via RPC (`journey_add_progress` / `journey_claim_stop`) para
// evitar corrida quando os dois estudam ao mesmo tempo, e sync em tempo real
// pelo canal do Supabase.
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/lib/profile";
import { earn } from "@/lib/wallet-store";

export type JourneyStopKind = "dialogo" | "curiosidade" | "recompensa";

export type JourneyStop = {
  id: string;
  /** XP acumulado necessário para chegar nessa parada. */
  at: number;
  title: string;
  kind: JourneyStopKind;
  /** Fala do guia da jornada (a Bússola). */
  dialogue: string;
  /** Conteúdo revelado: curiosidade / dica de inglês. */
  insight: string;
  reward: number;
};

export type JourneyState = {
  xp: number;
  contributions: Record<string, number>;
  claimed: string[];
  loaded: boolean;
};

// ---- Mapa ----------------------------------------------------------------

export const JOURNEY_STOPS: JourneyStop[] = [
  {
    id: "porto",
    at: 0,
    title: "Porto das Primeiras Palavras",
    kind: "dialogo",
    dialogue:
      "Vocês dois embarcaram. Eu sou a Bússola — não meço dias de estudo, meço distância percorrida. Se um remar hoje, o barco anda hoje.",
    insight:
      "Inglês não se aprende em maratonas: se aprende em reencontros. Voltar depois de faltar vale mais do que nunca ter faltado.",
    reward: 40,
  },
  {
    id: "farol",
    at: 60,
    title: "Farol das Frases Curtas",
    kind: "curiosidade",
    dialogue:
      "O farol acendeu. Alguém aqui revisou o suficiente para o mar ficar visível.",
    insight:
      "Falantes nativos usam frases curtas o tempo todo. 'I'm on it', 'Got it', 'My bad' — três expressões que resolvem metade das conversas do dia.",
    reward: 60,
  },
  {
    id: "enseada",
    at: 150,
    title: "Enseada dos Falsos Amigos",
    kind: "curiosidade",
    dialogue:
      "Cuidado aqui. Essas águas enganam quem fala português.",
    insight:
      "Falsos cognatos clássicos: 'actually' é na verdade (não atualmente), 'pretend' é finger (não pretender), 'realize' é perceber (não realizar).",
    reward: 80,
  },
  {
    id: "ilha_tempos",
    at: 300,
    title: "Ilha dos Tempos Verbais",
    kind: "dialogo",
    dialogue:
      "Vocês chegaram juntos, mesmo tendo remado em horas diferentes. É assim que funciona.",
    insight:
      "Present Perfect existe para ligar passado e agora: 'I have studied today' = estudei e o dia ainda conta. 'I studied yesterday' = fechado, acabou.",
    reward: 100,
  },
  {
    id: "mercado",
    at: 500,
    title: "Mercado das Expressões",
    kind: "curiosidade",
    dialogue:
      "Aqui se compra fluência com repetição, não com pressa.",
    insight:
      "Phrasal verbs são a moeda local: 'figure out' (descobrir), 'come up with' (inventar), 'run out of' (ficar sem). Um por semana já muda seu inglês.",
    reward: 120,
  },
  {
    id: "ponte",
    at: 750,
    title: "Ponte dos Dias Ruins",
    kind: "recompensa",
    dialogue:
      "Essa ponte só aparece para quem já teve um dia em que não conseguiu estudar — e voltou de todo jeito.",
    insight:
      "Consistência real não é 100%. É voltar rápido. Quem retoma em até 48h mantém quase toda a memória construída.",
    reward: 160,
  },
  {
    id: "montanha",
    at: 1100,
    title: "Montanha da Pronúncia",
    kind: "curiosidade",
    dialogue:
      "Subida boa. Aqui o ouvido muda antes da boca.",
    insight:
      "O som /θ/ de 'think' não existe em português. Coloque a língua entre os dentes e sopre — sem virar 'f' nem 'ti'.",
    reward: 200,
  },
  {
    id: "biblioteca",
    at: 1500,
    title: "Biblioteca Submersa",
    kind: "dialogo",
    dialogue:
      "Contem quantas cartas já viraram naturais. É mais do que vocês imaginam.",
    insight:
      "Leitura extensiva é o atalho mais subestimado: entender 95% de um texto fácil ensina mais do que sofrer com 60% de um difícil.",
    reward: 240,
  },
  {
    id: "tempestade",
    at: 2000,
    title: "Travessia da Tempestade",
    kind: "recompensa",
    dialogue:
      "Vocês atravessaram a parte chata — aquela em que o progresso não aparece. Ela é obrigatória, e vocês passaram.",
    insight:
      "O platô é sinal de consolidação, não de estagnação. O cérebro está trocando 'lembrar' por 'saber'.",
    reward: 300,
  },
  {
    id: "arquipelago",
    at: 2700,
    title: "Arquipélago da Conversa",
    kind: "curiosidade",
    dialogue:
      "Daqui já se ouve gente conversando na outra ilha.",
    insight:
      "Para soar natural, encurte: 'want to' → 'wanna', 'going to' → 'gonna', 'What do you' → 'Whaddya'. Nativos falam ligado, não separado.",
    reward: 360,
  },
  {
    id: "aurora",
    at: 3500,
    title: "Mar da Aurora",
    kind: "dialogo",
    dialogue:
      "Poucos casais chegam aqui. Não porque é difícil — porque é longe. Vocês foram longe.",
    insight:
      "Nesse ponto o inglês para de ser matéria e passa a ser meio: você usa para ver, ouvir e falar algo que te interessa.",
    reward: 450,
  },
  {
    id: "horizonte",
    at: 5000,
    title: "Horizonte Sem Fim",
    kind: "recompensa",
    dialogue:
      "O mapa acaba, a jornada não. A partir daqui vocês navegam sem parada marcada.",
    insight:
      "Fluência não tem linha de chegada. Tem manutenção — e vocês já sabem fazer isso juntos.",
    reward: 600,
  },
];

export const JOURNEY_TOTAL_XP = JOURNEY_STOPS[JOURNEY_STOPS.length - 1]!.at;

// ---- Estado reativo ------------------------------------------------------

const empty = (): JourneyState => ({
  xp: 0,
  contributions: {},
  claimed: [],
  loaded: false,
});

let state: JourneyState = empty();
const listeners = new Set<() => void>();
function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getJourney(): JourneyState {
  return state;
}

export function useJourney(): JourneyState {
  return useSyncExternalStore(subscribe, () => state, () => empty());
}

type JourneyRow = {
  xp: number | null;
  contributions: Record<string, number> | null;
  claimed: string[] | null;
};

function apply(row: JourneyRow | null) {
  state = {
    xp: row?.xp ?? 0,
    contributions:
      row?.contributions && typeof row.contributions === "object" ? row.contributions : {},
    claimed: Array.isArray(row?.claimed) ? row!.claimed! : [],
    loaded: true,
  };
  emit();
}

export async function fetchJourney() {
  const { data, error } = await (supabase as any)
    .from("journey_shared")
    .select("xp, contributions, claimed")
    .eq("id", "casal")
    .maybeSingle();
  if (error) {
    console.error("[airi] journey fetch error", error);
    return;
  }
  apply((data as JourneyRow) ?? null);
}

let started = false;
export function startJourneySync() {
  if (started || typeof window === "undefined") return;
  started = true;
  void fetchJourney();
  supabase
    .channel("journey-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "journey_shared" },
      () => void fetchJourney(),
    )
    .subscribe();
}

export function useJourneySync() {
  useEffect(() => {
    startJourneySync();
  }, []);
}

// ---- Progresso ------------------------------------------------------------

// Cada revisão soma pouco; acertos somam mais. Agrupamos as chamadas em uma
// janela curta para não bombardear o banco durante uma sessão rápida.
let pending = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushProgress() {
  flushTimer = null;
  const amount = pending;
  pending = 0;
  if (amount <= 0) return;
  if (!getCurrentProfile()) return;
  // Otimista: mostra o barco andando na hora.
  const pid = getCurrentProfile()!.id;
  state = {
    ...state,
    xp: state.xp + amount,
    contributions: {
      ...state.contributions,
      [pid]: (state.contributions[pid] ?? 0) + amount,
    },
  };
  emit();
  const { data, error } = await (supabase as any).rpc("journey_add_progress", {
    _amount: Math.min(amount, 500),
  });
  if (error) {
    console.error("[airi] journey progress error", error);
    void fetchJourney();
    return;
  }
  if (data) apply(data as JourneyRow);
}

/** Soma progresso na jornada do casal (debounced). */
export function addJourneyProgress(amount: number) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(amount) || amount <= 0) return;
  pending += Math.round(amount);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flushProgress(), 2500);
}

export const JOURNEY_XP = {
  review: 1,
  correctBonus: 2,
  enemyDefeated: 5,
  duelWin: 15,
  studySession: 8,
} as const;

/** Revisão de carta: sempre conta, acerto conta mais. */
export function trackJourneyReview(correct: boolean) {
  addJourneyProgress(JOURNEY_XP.review + (correct ? JOURNEY_XP.correctBonus : 0));
}
export function trackJourneyEnemyDefeated() {
  addJourneyProgress(JOURNEY_XP.enemyDefeated);
}
export function trackJourneyDuelWin() {
  addJourneyProgress(JOURNEY_XP.duelWin);
}
export function trackJourneyStudySession() {
  addJourneyProgress(JOURNEY_XP.studySession);
}

// ---- Paradas --------------------------------------------------------------

export function stopStatus(
  stop: JourneyStop,
  s: JourneyState,
): "locked" | "available" | "opened" {
  if (s.claimed.includes(stop.id)) return "opened";
  return s.xp >= stop.at ? "available" : "locked";
}

export function journeyProgressPct(s: JourneyState): number {
  return Math.max(0, Math.min(100, (s.xp / JOURNEY_TOTAL_XP) * 100));
}

export function nextStop(s: JourneyState): JourneyStop | null {
  return JOURNEY_STOPS.find((st) => st.at > s.xp) ?? null;
}

export async function claimJourneyStop(stopId: string): Promise<boolean> {
  const stop = JOURNEY_STOPS.find((s) => s.id === stopId);
  if (!stop) return false;
  if (stopStatus(stop, state) !== "available") return false;
  const { data, error } = await (supabase as any).rpc("journey_claim_stop", {
    _stop_id: stopId,
  });
  if (error) {
    console.error("[airi] journey claim error", error);
    return false;
  }
  const payload = data as (JourneyRow & { ok?: boolean }) | null;
  if (payload) apply(payload);
  if (payload && payload.ok === false) return false;
  await earn(stop.reward, `Jornada: ${stop.title}`);
  return true;
}
