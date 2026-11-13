import { useState } from "react";
import { Loader2, Lock, RotateCcw, Unlock, Zap } from "lucide-react";
import { toast } from "sonner";
import { setSetting, useAppSettings, type LightningMode } from "@/lib/app-settings";

const MODES: { key: LightningMode; label: string; hint: string; Icon: typeof Zap }[] = [
  { key: "auto", label: "Diário", hint: "Normal: cada perfil joga 1x por dia.", Icon: Zap },
  { key: "open", label: "Liberado", hint: "Sem limite: pode jogar quantas vezes quiser.", Icon: Unlock },
  { key: "closed", label: "Fechado", hint: "Ninguém joga até você reabrir.", Icon: Lock },
];

export function LightningAdminSection() {
  const { lightning } = useAppSettings();
  const [busy, setBusy] = useState<string | null>(null);

  async function save(next: typeof lightning, tag: string, msg: string) {
    setBusy(tag);
    try {
      await setSetting("lightning", next);
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Controle total do Desafio Relâmpago para Guilherme e Arlayne. Vale na hora em todos os aparelhos.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {MODES.map((m) => {
          const active = lightning.mode === m.key;
          return (
            <button
              key={m.key}
              disabled={busy !== null}
              onClick={() => !active && save({ ...lightning, mode: m.key }, m.key, `Desafio agora: ${m.label}`)}
              className={`flex min-h-[88px] flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${
                active ? "border-primary bg-primary/15" : "border-border bg-muted/30 hover:border-primary/40"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {busy === m.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <m.Icon className="h-4 w-4 text-primary" />}
                {m.label}
                {active && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">ativo</span>}
              </span>
              <span className="text-[12px] text-muted-foreground">{m.hint}</span>
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-semibold text-foreground">Liberar nova rodada hoje</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          No modo Diário, quem já jogou hoje ganha mais uma tentativa.
          {lightning.releasedAt > 0 && ` Última liberação: ${new Date(lightning.releasedAt).toLocaleString("pt-BR")}.`}
        </p>
        <button
          disabled={busy !== null || lightning.mode !== "auto"}
          onClick={() => save({ ...lightning, releasedAt: Date.now() }, "release", "Nova rodada liberada!")}
          className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {busy === "release" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Liberar rodada
        </button>
      </div>
    </div>
  );
}
