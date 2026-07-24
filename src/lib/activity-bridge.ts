// Emite activity_events a partir dos eventos internos existentes, e concede Lumens ✦.
import { onRankPromotion } from "@/lib/rank-store";
import { onStreakMilestone } from "@/lib/flashcards-store";
import { getCurrentProfile } from "@/lib/profile";
import { emitActivity, type ProfileId } from "@/lib/social-store";
import { earn, amountFor } from "@/lib/wallet-store";

let started = false;

export function startActivityBridge() {
  if (started) return;
  started = true;

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
    const amount = amountFor({ kind: e.kind === "tier" ? "rank_tier" : "rank_division" });
    void earn(amount, e.kind === "tier" ? "Subiu de tier no rank" : "Subiu de divisão");
  });

  onStreakMilestone((e) => {
    const p = getCurrentProfile();
    if (!p) return;
    emitActivity(p.id as ProfileId, "streak_milestone", {
      days: e.days,
      lpGained: e.lpGained,
    });
    void earn(amountFor({ kind: "streak", days: e.days }), `Streak de ${e.days} dias`);
  });
}
