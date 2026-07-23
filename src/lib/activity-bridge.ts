// Emite activity_events reagindo aos eventos internos existentes.
// Iniciado uma vez no __root para o feed de "kudos" ficar vivo.
import { onRankPromotion } from "@/lib/rank-store";
import { onStreakMilestone } from "@/lib/flashcards-store";
import { getCurrentProfile } from "@/lib/profile";
import { emitActivity, type ProfileId } from "@/lib/social-store";

let started = false;

export function startActivityBridge() {
  if (started) return;
  started = true;

  // Subida de rank ou divisão
  onRankPromotion((e) => {
    const p = getCurrentProfile();
    if (!p) return;
    emitActivity(p.id as ProfileId, "rank_up", {
      kind: e.kind,
      fromTier: e.fromTier,
      fromDivision: e.fromDivision,
      toTier: e.toTier,
      toDivision: e.toDivision,
    });
  });

  // Marco de sequência (streak)
  onStreakMilestone((e) => {
    const p = getCurrentProfile();
    if (!p) return;
    emitActivity(p.id as ProfileId, "streak_milestone", {
      days: e.days,
      lpGained: e.lpGained,
    });
  });
}
