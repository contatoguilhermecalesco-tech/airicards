import { useState } from "react";
import { RotateCcw, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRank, resetRank, tierLabel, TIER_COLORS } from "@/lib/rank-store";
import { RankEmblem } from "@/components/RankBadge";

export function RankAdminSection() {
  const rank = useRank();
  const [confirm, setConfirm] = useState(false);
  const colors = TIER_COLORS[rank.tier];
  return (
    <section className="ios-card mt-4 rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: `${colors.glow}`, color: colors.ring }}
        >
          <Shield className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Rank do seu perfil</h2>
          <p className="text-xs text-muted-foreground">
            Rank é armazenado localmente por perfil. Aqui você pode recalibrar o seu.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
        <RankEmblem tier={rank.tier} division={rank.division} size={44} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: colors.text }}>
            {tierLabel(rank)}
          </p>
          <p className="text-xs text-muted-foreground">
            {rank.lp} LP · {rank.totalEarned} LP ganho no total
          </p>
        </div>
        <button
          onClick={() => setConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Recalibrar
        </button>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalibrar rank?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu rank atual e todo o histórico de LP serão zerados. Você volta para Ferro IV.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetRank();
                setConfirm(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
