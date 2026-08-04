import { useState } from "react";
import { Zap, Shield, Sparkles } from "lucide-react";
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
import { useWallet, activatePowerup, consumePowerup, powerupName, powerupDesc } from "@/lib/wallet-store";
import { toast } from "sonner";

export function PowerupShelf({ wallet }: { wallet: ReturnType<typeof useWallet> }) {
  const items = Object.entries(wallet.powerups).filter(([_, count]) => count > 0);
  const activeId = wallet.activePowerup;
  
  // Garantir que o power-up ativo apareça na lista mesmo se o estoque for 0
  const allIds = new Set(items.map(([id]) => id));
  if (activeId && !allIds.has(activeId)) {
    items.push([activeId, 0]);
  }

  const [busy, setBusy] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  return (
    <section className="animate-fade-in space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {items.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-muted-foreground/50">
            <Sparkles className="h-3.5 w-3.5 opacity-30" />
            <span className="text-[11px] font-medium tracking-tight">Lista de Power-ups vazia</span>
          </div>
        )}
        {items.map(([id, count]) => {
          const isActive = wallet.activePowerup === id;
          const label = powerupName(id);
          
          return (
            <button
              key={id}
              disabled={busy !== null || isActive}
              onClick={() => {
                if (isActive) return;
                setActivating(id);
              }}
              className={`group relative flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all active:scale-95 ${
                isActive 
                  ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_-3px_rgba(167,139,250,0.3)] cursor-default" 
                  : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              <div className={`grid h-5 w-5 place-items-center rounded-lg ${isActive ? "bg-primary/20" : "bg-white/10"}`}>
                {(id === "lp_multiplier_2x" || id === "powerup:double_lp" || id === "double_lp") ? (
                  <Zap className={`h-3 w-3 ${isActive ? "text-primary" : "text-white/60"}`} />
                ) : (
                  <Shield className={`h-3 w-3 ${isActive ? "text-primary" : "text-white/60"}`} />
                )}
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold leading-none">{label}</p>
                {!isActive && <p className="mt-0.5 text-[9px] opacity-60">{count} em estoque</p>}
                {isActive && <p className="mt-0.5 text-[9px] font-bold text-primary uppercase tracking-wider">Ativo</p>}
              </div>
            </button>
          );
        })}
      </div>

      <AlertDialog open={!!activating} onOpenChange={(open) => !open && setActivating(null)}>
        <AlertDialogContent className="max-w-[360px] border-white/10 bg-[#0f0720]/95 backdrop-blur-2xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_30px_-5px_rgba(167,139,250,0.4)]">
              <Zap className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold text-foreground">
              Ativar {activating && powerupName(activating)}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground">
              {activating && powerupDesc(activating)}
              <span className="mt-3 block font-medium text-warning/90">
                Uma vez ativado, o item será consumido e não poderá ser desequipado.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-col gap-2">
            <AlertDialogAction
              onClick={async () => {
                if (!activating) return;
                setBusy(activating);
                const id = activating;
                setActivating(null);
                
                const ok = await consumePowerup(id);
                if (ok) {
                  await activatePowerup(id);
                  toast.success(`${powerupName(id)} ativado!`, {
                    description: "O bônus será aplicado na sua próxima revisão.",
                    icon: <Zap className="h-4 w-4 text-primary" />,
                  });
                }
                setBusy(null);
              }}
              className="w-full rounded-xl bg-primary py-6 font-bold text-primary-foreground hover:bg-primary/90"
            >
              Confirmar Ativação
            </AlertDialogAction>
            <AlertDialogCancel className="w-full border-none bg-transparent py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-foreground">
              Agora não
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

