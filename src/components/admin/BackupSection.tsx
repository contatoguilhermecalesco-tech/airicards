import { useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { PROFILES } from "@/lib/profile";
import { cn } from "@/lib/utils";
import {
  adminExportProfileDataFn,
  adminImportProfileDataFn,
} from "@/lib/admin.functions";

export function BackupSection() {
  const [profileId, setProfileId] = useState<string>(PROFILES[0]?.id ?? "");
  const [busy, setBusy] = useState<"idle" | "export" | "import">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<"merge" | "replace">("merge");
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setMsg(null);
    setBusy("export");
    try {
      const backup = await adminExportProfileDataFn({ data: { profileId } });
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `airi-backup-${profileId}-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const decks = backup.data.decks.length;
      const cards = backup.data.cards.length;
      setMsg(`Backup baixado — ${decks} deck(s), ${cards} carta(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao exportar");
    } finally {
      setBusy("idle");
    }
  }

  async function handleImport(file: File) {
    setError(null);
    setMsg(null);
    setBusy("import");
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;
      const result = await adminImportProfileDataFn({
        data: { profileId, payload, strategy },
      });
      setMsg(
        `Import concluído (${strategy}) — ${result.decks} deck(s), ${result.cards} carta(s). Reabra o app para ver.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao importar");
    } finally {
      setBusy("idle");
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-foreground/50">
          Perfil
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROFILES.map((p) => (
            <button
              key={p.id}
              onClick={() => setProfileId(p.id)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-sm transition",
                profileId === p.id
                  ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                  : "border-white/10 bg-white/[0.02] text-foreground/70 hover:bg-white/[0.05]",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Download className="h-4 w-4 text-sky-300" strokeWidth={2.25} />
          Exportar
        </div>
        <p className="mt-1 text-xs text-foreground/55">
          Baixa um JSON com todos os decks e cartas do perfil escolhido.
          Guarde esse arquivo — ele funciona como backup.
        </p>
        <button
          onClick={() => void handleExport()}
          disabled={busy !== "idle"}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/15 disabled:opacity-50"
        >
          {busy === "export" ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Download className="h-4 w-4" strokeWidth={2.25} />
          )}
          Baixar backup
        </button>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Upload className="h-4 w-4 text-emerald-300" strokeWidth={2.25} />
          Importar
        </div>
        <p className="mt-1 text-xs text-foreground/55">
          Envia um JSON de backup para o perfil selecionado. Use{" "}
          <strong>Mesclar</strong> para preservar itens existentes, ou{" "}
          <strong>Substituir</strong> para sobrescrever tudo.
        </p>

        <div className="mt-3 flex gap-2">
          {(["merge", "replace"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStrategy(s)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition",
                strategy === s
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/[0.02] text-foreground/60 hover:bg-white/[0.05]",
              )}
            >
              {s === "merge" ? "Mesclar" : "Substituir"}
            </button>
          ))}
        </div>

        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15">
          {busy === "import" ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Upload className="h-4 w-4" strokeWidth={2.25} />
          )}
          {fileName ? "Trocar arquivo" : "Selecionar JSON"}
          <input
            type="file"
            accept="application/json"
            className="hidden"
            disabled={busy !== "idle"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFileName(f.name);
              void handleImport(f);
              e.target.value = "";
            }}
          />
        </label>
        {fileName && (
          <p className="mt-2 text-[11px] text-foreground/45">
            Último: {fileName}
          </p>
        )}
      </div>

      {msg && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-200">
          {msg}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-rose-400/25 bg-rose-400/[0.08] px-3 py-2 text-xs text-rose-200">
          {error}
        </p>
      )}
    </section>
  );
}
