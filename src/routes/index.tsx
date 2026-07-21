import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, Moon } from "lucide-react";
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
import {
  useStore,
  useCardsReviewedToday,
} from "@/lib/flashcards-store";
import { useCurrentProfile } from "@/lib/profile";
import { useCycleWeek, getTodayFocus } from "@/lib/cycle";
import { useExamState, getMonthKey, hasCompletedExamThisMonth, monthLabel } from "@/lib/exam-store";
import { useAppSettings } from "@/lib/app-settings";

export const Route = createFileRoute("/")({
  component: Home,
});

function greetingFor(hour: number): { salute: string; eyebrow: string } {
  if (hour >= 5 && hour < 12) return { salute: "Bom dia", eyebrow: "Bem-vindo de volta" };
  if (hour >= 12 && hour < 18) return { salute: "Boa tarde", eyebrow: "Bem-vindo de volta" };
  if (hour >= 18 && hour < 23) return { salute: "Boa noite", eyebrow: "Bem-vindo de volta" };
  return { salute: "Boa madrugada", eyebrow: "Bem-vindo de volta" };
}

function formatNextIn(ms: number): string {
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1d" : `${days}d`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Home() {
  const profile = useCurrentProfile();
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const reviewedToday = useCardsReviewedToday();
  const now = useMemo(() => Date.now(), [cards]);
  const due = useMemo(() => cards.filter((c) => c.dueAt <= now).length, [cards, now]);
  const pending = useMemo(() => cards.filter((c) => c.dueAt > now).length, [cards, now]);
  const nextDueInMs = useMemo(() => {
    const futures = cards.map((c) => c.dueAt).filter((t) => t > now);
    if (futures.length === 0) return null;
    return Math.min(...futures) - now;
  }, [cards, now]);
  const canStart = due > 0;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const { salute, eyebrow } = greetingFor(hour);
  const name = profile?.name ?? "";
  const cycle = useCycleWeek();
  const todayFocus = getTodayFocus();

  const examState = useExamState();
  const examMonthKey = getMonthKey();
  const examDone = hasCompletedExamThisMonth(examMonthKey);
  const examResult = examState.history.find((h) => h.monthKey === examMonthKey);
  const appSettings = useAppSettings();

  const nextBadge =
    nextDueInMs !== null ? `Próximas: ${formatNextIn(nextDueInMs)}` : "Tudo em dia";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-6 pb-24 sm:max-w-xl">
      {/* Header */}
      <header className="animate-fade-in flex items-end justify-between px-1 pt-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium tracking-tight text-zinc-500">{eyebrow}</p>
          <h1 className="mt-0.5 truncate text-[24px] font-bold tracking-[-0.02em] text-white">
            {salute}
            {name ? `, ${name}.` : "."}
          </h1>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-700 bg-zinc-800 text-[13px] font-semibold text-zinc-300">
          {initialsOf(name) || "·"}
        </div>
      </header>

      {/* Main Session Card */}
      <section
        className="animate-fade-in flex flex-col gap-6 rounded-3xl border border-zinc-800 bg-[#1C1C1E] p-6"
        style={{ animationDelay: "40ms", animationFillMode: "backwards" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[40px] font-bold leading-none tracking-[-0.03em] text-[#A78BFA] tabular-nums">
              {pad2(due)}
            </h2>
            <p className="mt-2 text-[15px] font-medium text-zinc-400">
              {due === 1 ? "carta para revisar agora" : "cartas para revisar agora"}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-zinc-800 px-3 py-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              {nextBadge}
            </p>
          </div>
        </div>

        {cards.length === 0 ? (
          <Link
            to="/library"
            className="w-full rounded-2xl bg-[#A78BFA] py-4 text-center text-[15px] font-bold text-black transition-transform active:scale-[0.98]"
          >
            Ir para a biblioteca
          </Link>
        ) : due === 0 ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 py-4 text-[14px] font-medium text-zinc-400">
            <Moon className="h-4 w-4" strokeWidth={2.25} />
            {nextDueInMs !== null ? `Próxima em ${formatNextIn(nextDueInMs)}` : "Tudo em dia"}
          </div>
        ) : (
          <button
            type="button"
            disabled={!canStart}
            onClick={() => canStart && setConfirmOpen(true)}
            className="w-full rounded-2xl bg-[#A78BFA] py-4 text-[15px] font-bold text-black transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Iniciar sessão
          </button>
        )}

        {(reviewedToday > 0 || pending > 0) && (
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            <span>Hoje: <span className="text-zinc-300 tabular-nums">{reviewedToday}</span></span>
            {pending > 0 && (
              <span>Voltando: <span className="text-zinc-300 tabular-nums">{pending}</span></span>
            )}
          </div>
        )}
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar sessão agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem {due} carta{due === 1 ? "" : "s"} para revisar. As cartas
              voltam de minutos em minutos, então sempre haverá algo novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void navigate({ to: "/review" });
              }}
            >
              Iniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Row */}
      <div
        className="animate-fade-in grid grid-cols-2 gap-4 px-1"
        style={{ animationDelay: "90ms", animationFillMode: "backwards" }}
      >
        <StatCard label="Decks" value={decks.length} />
        <StatCard label="Cartas" value={cards.length} />
      </div>

      {/* RRSLG Section */}
      {cycle && (
        <section
          className="animate-fade-in px-1"
          style={{ animationDelay: "130ms", animationFillMode: "backwards" }}
        >
          <Link
            to="/study"
            className="block overflow-hidden rounded-3xl border border-zinc-800 bg-[#1C1C1E] transition-colors hover:border-zinc-700"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Foco do dia · RRSLG
              </h3>
              <div className="h-2 w-2 rounded-full bg-[#A78BFA]" />
            </div>
            <div className="p-5">
              <h4 className="text-[19px] font-semibold tracking-tight text-white">
                {todayFocus.label}: <span className="text-zinc-300">{todayFocus.focus}</span>
              </h4>
              <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-400">
                Gramática da semana:{" "}
                <span className="text-zinc-200">{cycle.grammar.topic}</span>.
              </p>
            </div>
          </Link>
        </section>
      )}

      {/* Exam */}
      {appSettings.exam_visible && (
        <section
          className="animate-fade-in px-1"
          style={{ animationDelay: "150ms", animationFillMode: "backwards" }}
        >
          <Link
            to="/exam"
            className="flex items-center justify-between rounded-3xl border border-zinc-800 bg-[#1C1C1E] p-5 transition-colors hover:border-zinc-700"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A78BFA]">
                Prova · {monthLabel(examMonthKey)}
              </p>
              <p className="mt-1.5 text-[15px] font-semibold text-white">
                {examDone
                  ? `Nível ${examResult?.level ?? ""} · ${examResult?.percent ?? 0}%`
                  : "25 questões para descobrir seu nível"}
              </p>
              <p className="mt-0.5 text-[12.5px] text-zinc-500">
                {examDone ? "Ver detalhes e revisar" : "Uma vez por mês · gerada por IA"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-600" strokeWidth={2.5} />
          </Link>
        </section>
      )}

      {/* Decks List */}
      {decks.length > 0 && (
        <section
          className="animate-fade-in flex flex-col gap-3 px-1"
          style={{ animationDelay: "180ms", animationFillMode: "backwards" }}
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[13px] font-bold tracking-tight text-zinc-400">Seus decks</h3>
            <Link
              to="/library"
              className="text-[12.5px] font-semibold text-[#A78BFA] transition-opacity hover:opacity-80"
            >
              Ver todos
            </Link>
          </div>

          <div className="space-y-2">
            {decks.slice(0, 5).map((d, i) => {
              const total = cards.filter((c) => c.deckId === d.id).length;
              const dueInDeck = cards.filter(
                (c) => c.deckId === d.id && c.dueAt <= Date.now(),
              ).length;
              const initial = d.name.trim()[0]?.toUpperCase() ?? "•";
              return (
                <Link
                  key={d.id}
                  to="/library/$deckId"
                  params={{ deckId: d.id }}
                  className="animate-fade-in flex items-center justify-between rounded-2xl border border-zinc-800 bg-[#1C1C1E] p-4 transition-colors hover:border-zinc-700"
                  style={{
                    animationDelay: `${210 + i * 40}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[15px] font-bold ${
                        dueInDeck > 0
                          ? "bg-zinc-800 text-[#A78BFA]"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-white">{d.name}</p>
                      <p className="mt-0.5 text-[12px] text-zinc-500 tabular-nums">
                        {total} carta{total === 1 ? "" : "s"}
                        {dueInDeck > 0 && (
                          <span className="text-[#A78BFA]">
                            {" · "}
                            {dueInDeck} para revisar
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-zinc-600" strokeWidth={2.5} />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#1C1C1E] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-[24px] font-bold leading-none text-white tabular-nums">
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}
