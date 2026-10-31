import { useEffect, useState } from "react";
import { addSmartNotification } from "@/lib/notifications-store";
import { useCurrentProfile } from "@/lib/profile";
import { useStore, useStreak, useCardsReviewedToday, getDueCards } from "@/lib/flashcards-store";
import { useRank, TIER_ORDER, TIER_LABEL, DIVISION_ROMAN } from "@/lib/rank-store";
import { useWallet } from "@/lib/wallet-store";
import { useWeeklyDuel, useDuelResults } from "@/lib/social-store";
import { supabase } from "@/integrations/supabase/client";

function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function rankScore(tier: string, division: number | null) {
  const index = TIER_ORDER.indexOf(tier as (typeof TIER_ORDER)[number]);
  return index * 4 + (division === null ? 4 : 5 - division);
}

function readNumber(key: string, fallback: number) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && localStorage.getItem(key) !== null ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeValue(key: string, value: string | number) {
  try { localStorage.setItem(key, String(value)); } catch { /* storage unavailable */ }
}

/**
 * Gera avisos contextuais, com deduplicação por perfil e período.
 * Os avisos inteligentes ficam neste dispositivo e não alteram o feed global.
 */
export function SmartProgressNotifications() {
  const profile = useCurrentProfile();
  const cards = useStore((s) => s.cards);
  const streak = useStreak();
  const rank = useRank();
  const wallet = useWallet();
  const duel = useWeeklyDuel();
  const duelResults = useDuelResults(duel?.id);
  const reviewedToday = useCardsReviewedToday();
  const [clock, setClock] = useState(() => Date.now());
  const [smartEnabled, setSmartEnabled] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const loadSetting = async () => {
      const { data, error } = await supabase.from("smart_notification_settings").select("enabled").eq("id", true).maybeSingle();
      if (!alive) return;
      setSmartEnabled(!error && data?.enabled === true);
      setSettingsLoaded(true);
    };
    void loadSetting();
    const channel = supabase.channel("smart-notification-settings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "smart_notification_settings" }, () => { void loadSetting(); })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30 * 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile?.id || !wallet.loaded || !settingsLoaded || !smartEnabled) return;
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;

      const prefix = `airi.smartProgress.${profile.id}.`;
      const today = dayKey(new Date(clock));
      const dueCount = getDueCards().length;

      // Cartas pendentes: avisa apenas quando há um volume relevante, no máximo uma vez/dia.
      if (dueCount >= 5) {
        addSmartNotification({
          profileId: profile.id,
          key: `reviews-${today}`,
          title: "🧠 Cartas aguardando revisão",
          body: `Você tem ${dueCount} cartas prontas para revisar. Uma sessão curta já ajuda a manter a memória ativa.`,
          icon: "book",
          action_label: "Revisar agora",
          action_route: "/review",
        });
      }

      // Streak em risco: só alerta no período da noite e se a última revisão foi ontem.
      const now = new Date(clock);
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      if (now.getHours() >= 18 && streak.current > 0 && streak.lastDay === dayKey(yesterday)) {
        addSmartNotification({
          profileId: profile.id,
          key: `streak-risk-${today}`,
          title: "🔥 Seu streak está em risco",
          body: `Você está com ${streak.current} dia(s) de sequência. Faça uma revisão hoje para não perder o ritmo.`,
          icon: "flame",
          action_label: "Manter streak",
          action_route: "/review",
        });
      }

      // Promoção de rank: compara com o último rank já observado neste dispositivo/perfil.
      const rankKey = prefix + "rank-score";
      const score = rankScore(rank.tier, rank.division);
      const previousScore = readNumber(rankKey, score);
      if (score > previousScore) {
        const division = rank.division ? ` ${DIVISION_ROMAN[rank.division]}` : "";
        addSmartNotification({
          profileId: profile.id,
          key: `rank-${today}-${score}`,
          title: "🏆 Novo rank alcançado!",
          body: `Parabéns! Você chegou a ${TIER_LABEL[rank.tier]}${division}.`,
          icon: "trophy",
          action_label: "Ver meu rank",
          action_route: "/rank",
        });
      }
      writeValue(rankKey, Math.max(score, previousScore));

      // Recompensa nova: detecta cosméticos adicionados ao inventário.
      const cosmeticsKey = prefix + "cosmetics";
      const cosmetics = wallet.cosmetics.length;
      const previousCosmetics = readNumber(cosmeticsKey, cosmetics);
      if (cosmetics > previousCosmetics) {
        addSmartNotification({
          profileId: profile.id,
          key: `reward-${today}`,
          title: "🎁 Nova recompensa desbloqueada",
          body: "Um novo item entrou no seu inventário. Confira sua coleção e escolha como usar.",
          icon: "gift",
          action_label: "Ver inventário",
          action_route: "/inventory",
        });
      }
      writeValue(cosmeticsKey, Math.max(cosmetics, previousCosmetics));

      // Recorde pessoal de revisões no dia.
      const recordKey = prefix + "daily-review-record";
      const best = readNumber(recordKey, reviewedToday);
      if (reviewedToday >= 10 && reviewedToday > best) {
        addSmartNotification({
          profileId: profile.id,
          key: `record-${today}`,
          title: "📈 Novo recorde pessoal",
          body: `Você revisou ${reviewedToday} cartas hoje — seu melhor resultado até agora!`,
          icon: "star",
          action_label: "Continuar estudando",
          action_route: "/review",
        });
        writeValue(recordKey, reviewedToday);
      } else if (reviewedToday > best) {
        writeValue(recordKey, reviewedToday);
      }

      // Duelo ativo ainda não respondido por este perfil.
      if (duel?.status === "active" && !duelResults.some((result) => result.profileId === profile.id)) {
        addSmartNotification({
          profileId: profile.id,
          key: `duel-${duel.id}-${profile.id}`,
          title: "⚔️ Novo duelo disponível",
          body: `O desafio da semana está pronto. Encare ${duel.deckName} antes do prazo terminar.`,
          icon: "target",
          action_label: "Abrir duelo",
          action_route: "/duel",
        });
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [
    profile?.id,
    wallet.loaded,
    wallet.cosmetics.length,
    cards,
    streak.current,
    streak.lastDay,
    rank.tier,
    rank.division,
    duel?.id,
    duel?.status,
    duel?.deckName,
    duelResults,
    reviewedToday,
    clock,
  ]);

  return null;
}
