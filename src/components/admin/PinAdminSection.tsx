import { useEffect, useState } from "react";
import { LogOut, RotateCcw, Shield } from "lucide-react";
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
import { PROFILES, listProfilesMeta, type ProfileMeta } from "@/lib/profile";
import { adminSetProfilePin, adminUnlinkProfile } from "@/lib/admin-actions";

export function PinAdminSection() {
  const [metas, setMetas] = useState<ProfileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [confirmUnlinkId, setConfirmUnlinkId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const m = await listProfilesMeta();
    setMetas(m);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function setPin(id: string, v: string) {
    setPins((prev) => ({ ...prev, [id]: v.replace(/\D/g, "").slice(0, 8) }));
    setError(null);
    setNotice(null);
  }

  async function handleSetPin(profileId: string) {
    const value = pins[profileId] ?? "";
    if (!/^\d{4,8}$/.test(value)) {
      setError("Use 4 a 8 dígitos numéricos.");
      return;
    }
    setBusyId(profileId);
    setError(null);
    setNotice(null);
    try {
      await adminSetProfilePin(profileId, value);
      setNotice(`PIN de ${nameOf(profileId)} redefinido.`);
      setPins((prev) => ({ ...prev, [profileId]: "" }));
      await load();
    } catch (e) {
      setError((e as Error).message ?? "Falha ao redefinir PIN.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnlink(profileId: string) {
    setBusyId(profileId);
    setError(null);
    setNotice(null);
    try {
      await adminUnlinkProfile(profileId);
      setNotice(
        `${nameOf(profileId)} foi desvinculado. Próximo acesso pedirá novo PIN.`,
      );
      await load();
    } catch (e) {
      setError((e as Error).message ?? "Falha ao desvincular.");
    } finally {
      setBusyId(null);
      setConfirmUnlinkId(null);
    }
  }

  function nameOf(id: string) {
    return PROFILES.find((p) => p.id === id)?.name ?? id;
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-surface/40 p-5">
      <header className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">PINs de acesso</h2>
          <p className="text-xs text-muted-foreground">
            Redefina o PIN de qualquer perfil ou force um novo login.
          </p>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {metas.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface/60 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="h-9 w-14 shrink-0 rounded-lg ring-1 ring-white/10"
                  style={{
                    backgroundImage: PROFILES.find((p) => p.id === m.id)?.gradient,
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{m.displayName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.hasPin ? "PIN definido" : "Sem PIN ainda"} ·{" "}
                    {m.isLinked ? "Vinculado" : "Não vinculado"}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="Novo PIN (4–8 dígitos)"
                  value={pins[m.id] ?? ""}
                  onChange={(e) => setPin(m.id, e.target.value)}
                  className="w-48 rounded-lg border border-white/10 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
                />
                <button
                  onClick={() => handleSetPin(m.id)}
                  disabled={busyId === m.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Redefinir
                </button>
                <button
                  onClick={() => setConfirmUnlinkId(m.id)}
                  disabled={busyId === m.id || !m.isLinked}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-40"
                  title={
                    m.isLinked
                      ? "Zerar vínculo e PIN"
                      : "Perfil já não está vinculado"
                  }
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Desvincular
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={!!confirmUnlinkId}
        onOpenChange={(o) => !o && setConfirmUnlinkId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso limpa o PIN e a sessão vinculada a{" "}
              <strong>{confirmUnlinkId && nameOf(confirmUnlinkId)}</strong>. Os
              dados (decks, arlys, streak) permanecem intactos — no próximo
              acesso será pedido um novo PIN.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmUnlinkId && void handleUnlink(confirmUnlinkId)
              }
            >
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
