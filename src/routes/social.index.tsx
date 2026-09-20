import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  BarChart3,
  GraduationCap,
  Skull,
} from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useCurrentProfile } from "@/lib/profile";
import {
  usePendingGifts,
  useSentGifts,
  useActivityFeed,
  useUnifiedFeed,
  useReactionsForEvent,
  toggleReaction,
  useDuelScore,
  useWeeklyDuel,
  otherProfile,
  profileMeta,
  type ProfileId,
  type ActivityEvent,
} from "@/lib/social-store";
import { startSocialStatsSync } from "@/lib/social-stats";
import { GiftInbox } from "@/components/GiftInbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/social/")({
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
  const [tab, setTab] = useState<Tab>("activity");

  // Pre-carrega stats para comparação lado a lado.
  useEffect(() => { startSocialStatsSync(); }, []);

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
    { id: "activity", label: "Feed", icon: <Sparkles className="h-4 w-4" strokeWidth={2.25} />, badge: feed.length || undefined },
    { id: "inbox", label: "Presentes", icon: <Gift className="h-4 w-4" strokeWidth={2.25} />, badge: pending.length || undefined },
    { id: "duel", label: "Duelo", icon: <Swords className="h-4 w-4" strokeWidth={2.25} /> },
  ];

  return (
    <div className="mx-auto max-w-xl px-[clamp(0.75rem,3vw,1.5rem)] pb-24 pt-8 sm:pb-10">
      {/* Header */}
      <header className="animate-fade-in mb-5 flex items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">Social</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Você & {opp.name}
          </p>
        </div>
        <Link
          to="/social/stats"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-foreground transition hover:bg-white/[0.06]"
        >
          <BarChart3 className="h-3.5 w-3.5 text-primary" strokeWidth={2.4} />
          Comparar
        </Link>
      </header>

      {/* Tabs — segmento iOS */}
      <div
        role="tablist"
        aria-label="Seções sociais"
        className="mb-6 flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-1"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`tap-target relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] transition ${
                active
                  ? "bg-primary/25 font-semibold text-foreground shadow-sm"
                  : "font-medium text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge ? (
                <span className="ml-0.5 rounded-full bg-primary/25 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
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
                {sent.map((g) => {
                  const pill =
                    g.status === "imported"
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : g.status === "declined"
                        ? "border-white/[0.06] bg-white/[0.03] text-muted-foreground"
                        : "border-primary/30 bg-primary/10 text-primary";
                  return (
                    <li
                      key={g.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10">
                        {g.status === "imported" ? (
                          <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
                        ) : g.status === "declined" ? (
                          <XIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Gift className="h-4 w-4 text-primary" strokeWidth={2.25} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-foreground">{g.front}</p>
                        <p className="truncate text-[12px] text-muted-foreground">{g.back}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pill}`}
                      >
                        {g.status === "pending" ? "pendente" : g.status === "imported" ? "aceita" : "recusada"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <p className="px-1 text-[12px] text-muted-foreground">
            Dica: abra uma carta na Biblioteca e toque no botão de presente para enviar para {opp.name}.
          </p>
        </div>
      )}

      {tab === "activity" && (
        <div className="animate-fade-in space-y-5">
          <DuelMiniCard meId={meId} oppId={oppId} score={score} duel={duel} />
          <div>
            <h3 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Recentes
            </h3>
            <UnifiedFeed meId={meId} />
          </div>
        </div>
      )}

      {tab === "duel" && (
        <DuelPanel meId={meId} oppId={oppId} score={score} duel={duel} />
      )}
    </div>
  );
}

// Card de duelo compacto fixado no topo do feed.
function DuelMiniCard({
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
  const me = profileMeta(meId);
  const opp = profileMeta(oppId);
  const myScore = meId === "guilherme" ? score.g : score.a;
  const oppScore = meId === "guilherme" ? score.a : score.g;
  const status =
    duel && duel.status === "active"
      ? "Em andamento"
      : duel && duel.status === "completed"
        ? "Encerrado"
        : "Sem rodada";

  return (
    <Link
      to="/duel"
      className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-5 shadow-[0_16px_40px_-16px_hsl(var(--primary)/0.6)] transition active:scale-[0.99]"
    >
      <div className="pointer-events-none absolute -right-6 -top-8 opacity-15">
        <Swords className="h-24 w-24 text-primary-foreground" strokeWidth={1.5} />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground/70">
          Duelo da semana
        </span>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
          {status}
        </span>
      </div>
      <div className="relative flex items-center justify-between">
        <div className="flex flex-col items-center gap-1.5">
          <ProfileAvatar
            profileId={me.id}
            initial={me.initial}
            gradient={me.gradient}
            size={52}
            radius={18}
            fontScale={0.34}
            className="ring-2 ring-white/30 shadow-lg"
          />
          <p className="text-[11px] font-semibold text-primary-foreground">{me.name}</p>
          <p className="text-[20px] font-bold leading-none text-primary-foreground tabular-nums">{myScore}</p>
        </div>
        <span className="text-[18px] font-black italic text-primary-foreground/50">VS</span>
        <div className="flex flex-col items-center gap-1.5">
          <ProfileAvatar
            profileId={opp.id}
            initial={opp.initial}
            gradient={opp.gradient}
            size={52}
            radius={18}
            fontScale={0.34}
            className="ring-2 ring-white/30 shadow-lg"
          />
          <p className="text-[11px] font-semibold text-primary-foreground">{opp.name}</p>
          <p className="text-[20px] font-bold leading-none text-primary-foreground tabular-nums">{oppScore}</p>
        </div>
      </div>
    </Link>
  );
}


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
  profile: { id: string; name: string; initial: string; gradient: string };
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
        <ProfileAvatar
          profileId={profile.id}
          initial={profile.initial}
          gradient={profile.gradient}
          size={64}
          radius={22}
          fontScale={0.34}
          className={winning ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background shadow-lg" : "shadow-lg"}
        />
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
            title="Prazo de 48h · WO"
            body="Faltando 24h avisamos por notificação. Se um não jogar no prazo, perde por WO (−1) e o outro vence. Se ninguém jogar, quem criou leva o −1."
          />
          <Step
            n={5}
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
        {n < 5 && <div className="h-full w-px bg-white/[0.06]" />}
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

// ============================================================
// Feed unificado — eventos dos dois perfis em uma timeline só.
// ============================================================

const FEED_REACTIONS = ["🔥", "😂", "💀", "🎯", "👏"];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

function iconForKind(kind: ActivityEvent["kind"]) {
  switch (kind) {
    case "rank_up":
      return <Trophy className="h-4 w-4 text-amber-300" strokeWidth={2.25} />;
    case "streak_milestone":
      return <Flame className="h-4 w-4 text-orange-400" strokeWidth={2.25} />;
    case "exam_done":
      return <GraduationCap className="h-4 w-4 text-primary" strokeWidth={2.25} />;
    case "duel_won":
      return <Swords className="h-4 w-4 text-primary" strokeWidth={2.25} />;
    case "enemy_defeated":
      return <Skull className="h-4 w-4 text-destructive" strokeWidth={2.25} />;
    default:
      return <Sparkles className="h-4 w-4 text-primary" strokeWidth={2.25} />;
  }
}

function labelForEvent(e: ActivityEvent, actorName: string): string {
  const p = e.payload as Record<string, unknown>;
  switch (e.kind) {
    case "rank_up":
      return `${actorName} subiu para ${String(p.toTier ?? "")} ${String(p.toDivision ?? "")}`.trim();
    case "streak_milestone":
      return `${actorName} atingiu ${String(p.days ?? "")} dias de sequência`;
    case "exam_done":
      return `${actorName} concluiu a prova mensal · ${String(p.level ?? "")}`.trim();
    case "duel_won":
      return `${actorName} venceu o duelo da semana${p.byForfeit ? " por WO" : ""}`;
    case "enemy_defeated":
      return `${actorName} derrotou uma carta inimiga`;
  }
}

function UnifiedFeed({ meId }: { meId: ProfileId }) {
  const events = useUnifiedFeed(30);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5 text-primary" strokeWidth={2.25} />}
        title="Nenhuma novidade ainda"
        body="Conquistas, sequências, provas e duelos aparecem aqui — dos dois perfis, em tempo real."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <FeedRow key={e.id} event={e} meId={meId} />
      ))}
    </ul>
  );
}

function FeedRow({ event, meId }: { event: ActivityEvent; meId: ProfileId }) {
  const actor = profileMeta(event.profileId);
  const isMe = event.profileId === meId;
  const actorName = isMe ? "Você" : actor.name;
  const reactions = useReactionsForEvent(event.id);

  const grouped = FEED_REACTIONS.map((emoji) => {
    const list = reactions.filter((r) => r.emoji === emoji);
    const mine = list.some((r) => r.profileId === meId);
    return { emoji, count: list.length, mine };
  });

  return (
    <li
      className={`rounded-2xl border p-3 transition ${
        isMe
          ? "border-primary/20 bg-primary/[0.04]"
          : "border-white/[0.06] bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <ProfileAvatar
          profileId={event.profileId}
          initial={actor.initial}
          gradient={actor.gradient}
          size={36}
          fontScale={0.36}
          className="shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-foreground">
            {labelForEvent(event, actorName)}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {iconForKind(event.kind)}
            <span>{timeAgo(event.createdAt)}</span>
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {grouped.map((r) => (
          <button
            key={r.emoji}
            onClick={() => toggleReaction(event.id, meId, r.emoji)}
            className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[12px] tabular-nums transition ${
              r.mine
                ? "border-primary/40 bg-primary/15 text-foreground"
                : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.12] hover:text-foreground"
            }`}
          >
            <span>{r.emoji}</span>
            {r.count > 0 && <span className="text-[11px]">{r.count}</span>}
          </button>
        ))}
      </div>
    </li>
  );
}
