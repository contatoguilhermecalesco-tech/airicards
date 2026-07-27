import { useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
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
import { PROFILES } from "@/lib/profile";
import { useAppSettings, setSetting } from "@/lib/app-settings";
import { adminResetExamsFn } from "@/lib/admin.functions";

export function ExamAdminSection() {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const settings = useAppSettings();
  const [toggling, setToggling] = useState(false);

  async function handleReset(profileId: string) {
    setBusy(profileId);
    try {
      await adminResetExamsFn({ data: { profileId } });
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
      setConfirmId(null);
    }
  }

  async function toggleVisible() {
    setToggling(true);
    try {
      await setSetting("exam_visible", !settings.exam_visible);
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  }

  return (
    <section className="glass-panel rounded-3xl border p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
          <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Prova mensal</h2>
          <p className="text-xs text-muted-foreground">
            Controle a visibilidade e zere o histórico dos perfis.
          </p>
        </div>
      </div>

      <button
        onClick={() => void toggleVisible()}
        disabled={toggling}
        className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left transition hover:border-white/10 disabled:opacity-50"
      >
        <div>
          <p className="text-sm font-medium">
            {settings.exam_visible ? "Visível para os usuários" : "Oculta para os usuários"}
          </p>
          <p className="text-xs text-muted-foreground">
            {settings.exam_visible
              ? "A prova aparece na Home e em Estudos."
              : "Ative para liberar a prova no app."}
          </p>
        </div>
        <span
          aria-hidden
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            settings.exam_visible ? "bg-primary" : "bg-white/10"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              settings.exam_visible ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </button>

      <ul className="space-y-2">
        {PROFILES.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                style={{ backgroundImage: p.gradient }}
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">Prova de nivelamento</p>
              </div>
            </div>
            <button
              disabled={busy === p.id}
              onClick={() => setConfirmId(p.id)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
              Zerar
            </button>
          </li>
        ))}
      </ul>

      <AlertDialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zerar histórico de provas?</AlertDialogTitle>
            <AlertDialogDescription>
              Todo o histórico de provas de{" "}
              <strong>{confirmId ? (PROFILES.find((p) => p.id === confirmId)?.name ?? "") : ""}</strong>{" "}
              será removido. O usuário poderá iniciar uma nova prova imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && void handleReset(confirmId)}>
              Zerar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
