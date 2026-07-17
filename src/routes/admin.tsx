import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, RotateCcw, Shield } from "lucide-react";
import {
  fetchAllProfileSessions,
  resetHomeSessionsForProfile,
  HOME_DAILY_LIMIT,
  type ProfileSessionInfo,
} from "@/lib/flashcards-store";
import { PROFILES, getCurrentProfile } from "@/lib/profile";
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

const ADMIN_PROFILE_ID = "guilherme";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const p = getCurrentProfile();
    if (!p || p.id !== ADMIN_PROFILE_ID) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const [rows, setRows] = useState<ProfileSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetchAllProfileSessions();
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function nameFor(profileId: string) {
    return PROFILES.find((p) => p.id === profileId)?.name ?? profileId;
  }
  function gradientFor(profileId: string) {
    return (
      PROFILES.find((p) => p.id === profileId)?.gradient ??
      "linear-gradient(135deg, oklch(0.6 0.05 260), oklch(0.4 0.05 260))"
    );
  }

  // Merge: show every known profile even if there's no row yet.
  const merged: ProfileSessionInfo[] = PROFILES.map((p) => {
    const found = rows.find((r) => r.profileId === p.id);
    return (
      found ?? { profileId: p.id, day: "", count: 0, reviewed: 0 }
    );
  });
  // Include unknown profile_ids that exist in the DB too.
  rows.forEach((r) => {
    if (!merged.find((m) => m.profileId === r.profileId)) merged.push(r);
  });

  async function handleReset(profileId: string) {
    setBusyId(profileId);
    try {
      await resetHomeSessionsForProfile(profileId);
      await load();
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pt-8 pb-24 sm:pt-14">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Shield className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
            <p className="text-sm text-muted-foreground">
              Gerenciar sessões diárias dos perfis
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground transition hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Voltar
        </Link>
      </div>

      <section className="ios-card rounded-3xl p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Perfis
          </h2>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
            Atualizar
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Carregando…
          </p>
        ) : (
          <ul className="space-y-2">
            {merged.map((r) => (
              <li
                key={r.profileId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{ backgroundImage: gradientFor(r.profileId) }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {nameFor(r.profileId)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {r.count} de {HOME_DAILY_LIMIT} sessões
                      {" · "}
                      {r.reviewed} revisadas
                      {r.day ? ` · ${r.day}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  disabled={busyId === r.profileId}
                  onClick={() => setConfirmId(r.profileId)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Zerar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog
        open={confirmId !== null}
        onOpenChange={(o) => !o && setConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zerar sessões?</AlertDialogTitle>
            <AlertDialogDescription>
              As sessões de hoje de{" "}
              <strong>{confirmId ? nameFor(confirmId) : ""}</strong> voltarão
              para 0 de {HOME_DAILY_LIMIT}. As cartas em si não são afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId && void handleReset(confirmId)}
            >
              Zerar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
