import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Gift,
  Sparkles,
  Swords,
  Send,
  Check,
  X as XIcon,
  ChevronRight,
  Info,
  Users,
  Target,
  Zap,
  Trophy,
  HelpCircle,
  Flame,
} from "lucide-react";
import { useCurrentProfile } from "@/lib/profile";
import {
  usePendingGifts,
  useSentGifts,
  useActivityFeed,
  useDuelScore,
  useWeeklyDuel,
  otherProfile,
  profileMeta,
  type ProfileId,
} from "@/lib/social-store";
import { GiftInbox } from "@/components/GiftInbox";
import { PresenceCard } from "@/components/PresenceCard";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "Social — airi" },
      { name: "description", content: "Presentes de cartas, atividade da dupla e duelo semanal em um só lugar." },
      { property: "og:title", content: "Social — airi" },
      { property: "og:description", content: "Presentes, atividade e duelo semanal." },
    ],
  }),
  component: SocialPage,
});

type Tab = "inbox" | "activity" | "duel";

function SocialPage() {
  const me = useCurrentProfile();
  const [tab, setTab] = useState<Tab>("inbox");

  if (!me) return null;
  const meId = me.id as ProfileId;
  const oppId = otherProfile(meId);
  const opp = profileMeta(oppId);

  const pending = usePendingGifts(meId);
  const sent = useSentGifts(meId);
  const feed = useActivityFeed(oppId, 8);
  const score = useDuelScore();
  const duel = useWeeklyDuel();

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "inbox", label: "Presentes", icon: <Gift className="h-4 w-4" strokeWidth={2.25} />, badge: pending.length || undefined },
    { id: "activity", label: "Atividade", icon: <Sparkles className="h-4 w-4" strokeWidth={2.25} />, badge: feed.length || undefined },
    { id: "duel", label: "Duelo", icon: <Swords className="h-4 w-4" strokeWidth={2.25} /> },
  ];

  return (
    <div className="mx-auto max-w-3xl px-[clamp(0.75rem,3vw,1.5rem)] pb-24 pt-6 sm:pb-10">
      {/* Header */}
      <header className="animate-fade-in mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Social
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">
          Você & {opp.name}
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Presentes, feed e o duelo da semana.
        </p>
      </header>

      {/* Quick strip */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <StatChip label="Presentes" value={pending.length} accent="from-primary/30 to-primary/5" />
        <StatChip label="Enviados" value={sent.length} accent="from-fuchsia-400/25 to-fuchsia-500/5" />
        <StatChip
          label={`Duelo ${score.g}–${score.a}`}
          value={duel ? (duel.status === "completed" ? "encerrado" : "ativo") : "—"}
          accent="from-amber-300/25 to-amber-500/5"
        />
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Seções sociais"
        className="mb-5 flex gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`tap-target relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium transition ${
                active
                  ? "bg-white/10 text-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge ? (
                <span className="ml-0.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      {tab === "inbox" && (
        <div className="animate-fade-in space-y-6">
          {pending.length === 0 ? (
            <EmptyState
              icon={<Gift className="h-5 w-5 text-primary" strokeWidth={2.25} />}
              title="Sem presentes por agora"
              body={`Quando ${opp.name} enviar uma carta pra você, ela aparece aqui.`}
            />
          ) : (
            <GiftInbox />
          )}

          {sent.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2 px-1">
                <Send className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                  Enviados recentemente
                </h2>
              </div>
              <ul className="space-y-2">
                {sent.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                      {g.status === "imported" ? (
                        <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
                      ) : g.status === "declined" ? (
                        <XIcon className="h-4 w-4 text-destructive" />
                      ) : (
                        <Gift className="h-4 w-4 text-primary" strokeWidth={2.25} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-foreground">{g.front}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{g.back}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {g.status === "pending" ? "pendente" : g.status === "imported" ? "aceita" : "recusada"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="px-1 text-[12px] text-muted-foreground">
            Dica: abra uma carta na Biblioteca e toque no botão de presente para enviar para {opp.name}.
          </p>
        </div>
      )}

      {tab === "activity" && (
        <div className="animate-fade-in">
          {feed.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-5 w-5 text-primary" strokeWidth={2.25} />}
              title={`${opp.name} ainda não tem novidades`}
              body="Conquistas, sequências e duelos aparecem aqui em tempo real."
            />
          ) : (
            <PresenceCard />
          )}
        </div>
      )}

      {tab === "duel" && (
        <DuelPanel meId={meId} oppId={oppId} score={score} duel={duel} />
      )}
    </div>
  );

function DuelPanel({
  meId,
  oppId,
  score,
  duel,
}: {
  meId: ProfileId;
  oppId: ProfileId;
  score: { g: number; a: number };
  duel: ReturnType<typeof useWeeklyDuel>;
}) {
  const [howOpen, setHowOpen] = useState(false);
  const me = profileMeta(meId);
  const opp = profileMeta(oppId);
  const myScore = meId === "guilherme" ? score.g : score.a;
  const oppScore = meId === "guilherme" ? score.a : score.g;
  const isLeading = myScore > oppScore;
  const isTied = myScore === oppScore;

  const status = duel
    ? duel.status === "completed"
      ? { label: "Rodada encerrada", tone: "muted" as const }
      : { label: "Rodada em andamento", tone: "live" as const }
    : { label: "Sem duelo esta semana", tone: "idle" as const };

  const cta =
    duel && duel.status === "active"
      ? "Entrar no duelo"
      : duel && duel.status === "completed"
        ? "Ver resultado da rodada"
        : "Criar duelo desta semana";

  return (
    <div className="animate-fade-in space-y-5">
      {/* Arena — hero card */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-5">
        {/* soft glows */}
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full opacity-40 blur-3xl"
          style={{ background: me.gradient }}
        />
        <div
          className="pointer-events-none absolute -right-16 -bottom-16 h-52 w-52 rounded-full opacity-30 blur-3xl"
          style={{ background: opp.gradient }}
        />

        {/* Status pill */}
        <div className="relative flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status.tone === "live"
                  ? "animate-pulse bg-emerald-400"
                  : status.tone === "muted"
                    ? "bg-muted-foreground/60"
                    : "bg-primary/70"
              }`}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {status.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHowOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
          >
            <HelpCircle className="h-3 w-3" strokeWidth={2.25} />
            Como funciona
          </button>
        </div>

        {/* VS arena */}
        <div className="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Fighter profile={me} score={myScore} winning={isLeading} align="left" />
          <div className="flex flex-col items-center gap-1">
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.1] bg-background/60 backdrop-blur">
              <Swords className="h-5 w-5 text-primary" strokeWidth={2.4} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              vs
            </span>
          </div>
          <Fighter profile={opp} score={oppScore} winning={!isTied && !isLeading} align="right" />
        </div>

        {/* Score summary */}
        <div className="relative mt-5 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-primary/80" strokeWidth={2.25} />
          <span>
            Placar geral{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {score.g}–{score.a}
            </span>{" "}
            <span className="text-muted-foreground/70">· Guilherme vs Arlayne</span>
          </span>
        </div>

        {/* CTA */}
        <Link
          to="/duel"
          className="group relative mt-5 flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.7)] transition active:scale-[0.99]"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Flame className="h-4 w-4" strokeWidth={2.5} />
          {cta}
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>

      {/* Quick tips row */}
      <div className="grid grid-cols-3 gap-2">
        <MiniTip icon={<Users className="h-3.5 w-3.5" />} label="5 cartas" hint="mesmo baralho" />
        <MiniTip icon={<Zap className="h-3.5 w-3.5" />} label="Tempo conta" hint="desempate" />
        <MiniTip icon={<Trophy className="h-3.5 w-3.5" />} label="Semanal" hint="reset toda seg." />
      </div>

      <HowItWorksDialog open={howOpen} onOpenChange={setHowOpen} />
    </div>
  );
}

function Fighter({
  profile,
  score,
  winning,
  align,
}: {
  profile: { name: string; initial: string; gradient: string };
  score: number;
  winning: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 ${
        align === "left" ? "items-start sm:items-center" : "items-end sm:items-center"
      } sm:items-center`}
    >
      <div className="relative">
        <div
          className={`grid h-16 w-16 place-items-center rounded-3xl text-[22px] font-bold text-white shadow-lg transition ${
            winning ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background" : ""
          }`}
          style={{ background: profile.gradient }}
        >
          {profile.initial}
        </div>
        {winning && (
          <div className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground shadow">
            <Trophy className="h-3 w-3" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-[13px] font-semibold text-foreground">{profile.name}</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
          {score} {score === 1 ? "vitória" : "vitórias"}
        </p>
      </div>
    </div>
  );
}

function MiniTip({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
      <div className="mx-auto grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mt-1.5 text-[12px] font-semibold text-foreground">{label}</p>
      <p className="text-[10.5px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function HowItWorksDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-3xl border-white/[0.08] bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[16px]">
            <Info className="h-4 w-4 text-primary" strokeWidth={2.25} />
            Como funciona o duelo
          </DialogTitle>
        </DialogHeader>
        <ol className="mt-2 space-y-3">
          <Step
            n={1}
            icon={<Users className="h-3.5 w-3.5" />}
            title="Um de vocês cria o desafio"
            body="Quem abrir a sala escolhe um baralho próprio. O sistema sorteia 5 cartas — as mesmas para os dois."
          />
          <Step
            n={2}
            icon={<Target className="h-3.5 w-3.5" />}
            title="Cada um joga sozinho"
            body="Você vira a carta, diz se acertou e segue. Não dá para ver a jogada do outro antes da sua vez."
          />
          <Step
            n={3}
            icon={<Zap className="h-3.5 w-3.5" />}
            title="Quem acerta mais, vence"
            body="Em empate, o menor tempo leva. Vencedor ganha +1 vitória no placar geral."
          />
          <Step
            n={4}
            icon={<Trophy className="h-3.5 w-3.5" />}
            title="Nova rodada toda semana"
            body="Toda segunda, qualquer um pode criar um novo desafio."
          />
        </ol>
        <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-2 text-[12px] text-muted-foreground">
          Dica: baralhos com mais cartas dão mais variedade ao sorteio.
        </p>
      </DialogContent>
    </Dialog>
  );
}


function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
          {n}
        </div>
        {n < 4 && <div className="h-full w-px bg-white/[0.06]" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-primary">{icon}</span>
          <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
        </div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-70`} />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
        {icon}
      </div>
      <p className="mt-3 text-[15px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">{body}</p>
    </div>
  );
}
