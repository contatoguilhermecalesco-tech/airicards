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
        <div className="animate-fade-in space-y-5">
          {/* Status card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15">
                <Swords className="h-5 w-5 text-primary" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Duelo semanal
                </p>
                <p className="text-[16px] font-semibold text-foreground">
                  {duel
                    ? duel.status === "completed"
                      ? "Rodada encerrada"
                      : "Rodada em andamento"
                    : "Nenhum duelo esta semana"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Placar
                </p>
                <p className="text-[16px] font-semibold tabular-nums text-foreground">
                  {score.g} <span className="text-muted-foreground">–</span> {score.a}
                </p>
              </div>
            </div>

            <Link
              to="/duel"
              className="mt-5 flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-[14px] font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99]"
            >
              {duel && duel.status === "active" ? "Entrar no duelo" : "Abrir sala do duelo"}
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>

          {/* How it works */}
          <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" strokeWidth={2.25} />
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                Como funciona o duelo
              </h2>
            </div>

            <ol className="space-y-3">
              <Step
                n={1}
                icon={<Users className="h-3.5 w-3.5" />}
                title="Um de vocês cria o desafio"
                body={`Quem abrir a sala escolhe um baralho próprio. O sistema sorteia 5 cartas daquele baralho — as mesmas 5 para os dois.`}
              />
              <Step
                n={2}
                icon={<Target className="h-3.5 w-3.5" />}
                title="Cada um joga a sua rodada sozinho"
                body="Você vira a carta, diz se acertou ou errou, e segue até o fim. Não dá para ver a resposta do outro antes da sua vez."
              />
              <Step
                n={3}
                icon={<Zap className="h-3.5 w-3.5" />}
                title="Quem acerta mais, vence"
                body="Em empate, quem terminou no menor tempo leva. O vencedor fica com +1 vitória no placar geral."
              />
              <Step
                n={4}
                icon={<Trophy className="h-3.5 w-3.5" />}
                title="Nova rodada toda semana"
                body="O duelo vale para a semana atual. Na próxima semana, qualquer um pode criar um novo desafio."
              />
            </ol>
          </section>

          <p className="px-1 text-[12px] text-muted-foreground">
            Dica: baralhos com mais cartas dão mais variedade ao sorteio. Quanto mais você revisa, melhor fica no duelo.
          </p>
        </div>
      )}
    </div>
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
