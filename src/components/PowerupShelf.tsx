function PowerupShelf({ wallet }: { wallet: ReturnType<typeof useWallet> }) {
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
    <section className="animate-fade-in space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Zap className="h-3.5 w-3.5 text-primary/70" strokeWidth={2.5} />
        <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">
          Seu Inventário
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {items.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-muted-foreground/50">
            <Sparkles className="h-3.5 w-3.5 opacity-30" />
            <span className="text-[11px] font-medium tracking-tight">Inventário de Power-ups vazio</span>
          </div>
        )}
        {items.map(([id, count]) => {
          const isActive = wallet.activePowerup === id;
          const label = id === "lp_multiplier_2x" || id === "powerup:double_lp" ? "LP em Dobro" : "Power-up";
          
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
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] cursor-default" 
                  : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              <div className={`grid h-5 w-5 place-items-center rounded-lg ${isActive ? "bg-emerald-500/20" : "bg-white/10"}`}>
                {(id === "lp_multiplier_2x" || id === "powerup:double_lp") ? (
                  <Zap className={`h-3 w-3 ${isActive ? "text-emerald-300" : "text-white/60"}`} />
                ) : (
                  <Shield className="h-3 w-3" />
                )}
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold leading-none">{label}</p>
                {!isActive && <p className="mt-0.5 text-[9px] opacity-60">{count} em estoque</p>}
                {isActive && <p className="mt-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Ativo</p>}
              </div>
            </button>
          );
        })}
      </div>

      <AlertDialog open={!!activating} onOpenChange={(open) => !open && setActivating(null)}>
        <AlertDialogContent className="max-w-[360px] border-white/10 bg-black/60 backdrop-blur-2xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]">
              <Zap className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold text-foreground">
              Ativar {activating && (activating === "lp_multiplier_2x" || activating === "powerup:double_lp" ? "LP em Dobro" : "Power-up")}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground">
              Uma vez ativado, o power-up será consumido e ficará ativo para sua próxima revisão. Não é possível desativar após o uso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={async () => {
                if (!activating) return;
                setBusy(activating);
                const id = activating;
                setActivating(null);
                
                const ok = await consumePowerup(id);
                if (ok) {
                  await activatePowerup(id);
                  toast.success(`${(id === "lp_multiplier_2x" || id === "powerup:double_lp") ? "LP em Dobro" : "Power-up"} ativado!`, {
                    description: "O bônus será aplicado na sua próxima revisão.",
                    icon: <Zap className="h-4 w-4 text-emerald-400" />,
                  });
                }
                setBusy(null);
              }}
              className="w-full rounded-xl bg-emerald-500 py-6 font-bold text-emerald-950 hover:bg-emerald-400"
            >
              Ativar Agora
            </AlertDialogAction>
            <AlertDialogCancel className="w-full border-none bg-transparent py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-foreground">
              Depois
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
