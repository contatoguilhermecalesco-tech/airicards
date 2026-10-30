import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Check,
  ChevronRight,
  Flame,
  Gift,
  GraduationCap,
  Heart,
  Home,
  MessageCircle,
  Send,
  Sparkles,
  Swords,
  Trophy,
  X as XIcon,
} from "lucide-react";
import { GiftInbox } from "@/components/GiftInbox";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { useCurrentProfile } from "@/lib/profile";
import {
  addActivityComment,
  otherProfile,
  profileMeta,
  toggleReaction,
  useCommentsForEvent,
  useDuelScore,
  usePendingGifts,
  useReactionsForEvent,
  useSentGifts,
  useUnifiedFeed,
  useWeeklyDuel,
  type ActivityEvent,
  type ProfileId,
} from "@/lib/social-store";

export const Route = createFileRoute("/social/")({
  head: () => ({
    meta: [
      { title: "Comunidade — airi" },
      { name: "description", content: "Conquistas, comentários, presentes e duelo semanal da sua dupla no airi." },
      { property: "og:title", content: "Comunidade — airi" },
      { property: "og:description", content: "Acompanhe e celebre o progresso da sua dupla." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SocialPage,
});

type Section = "feed" | "gifts" | "duel";

function SocialPage() {
  const me = useCurrentProfile();
  const [section, setSection] = useState<Section>("feed");
  if (!me) return null;

  const meId = me.id as ProfileId;
  const friendId = otherProfile(meId);
  const friend = profileMeta(friendId);
  const pending = usePendingGifts(meId);
  const sent = useSentGifts(meId);
  const score = useDuelScore();
  const duel = useWeeklyDuel();

  const nav = [
    { id: "feed" as const, label: "Início", icon: Home },
    { id: "gifts" as const, label: "Presentes", icon: Gift, badge: pending.length },
    { id: "duel" as const, label: "Duelo", icon: Swords },
  ];

  return (
    <main className="mx-auto w-full max-w-[760px] px-4 pb-28 pt-5 sm:px-6 sm:pb-10 sm:pt-7">
      <header className="mb-5 flex items-end justify-between gap-3 pb-2">
        <div className="min-w-0">
          <h1 className="truncate text-[28px] font-semibold tracking-tight text-foreground">Social</h1>
        </div>
        <Link to="/social/stats" className="inline-flex items-center gap-1.5 pb-1 text-[12px] font-medium text-muted-foreground transition hover:text-foreground"><BarChart3 className="h-3.5 w-3.5" /> Comparar</Link>
      </header>

      <div className="mb-5 grid grid-cols-3 border-b border-border/60">
        {nav.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`relative flex h-10 items-center justify-center gap-2 border-b-2 border-transparent text-[12px] font-medium transition ${section === id ? "border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-4 w-4" />{label}
            {badge ? <span className="min-w-4 rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{badge}</span> : null}
            {section === id ? <span className="sr-only">Selecionado</span> : null}
          </button>
        ))}
      </div>

      <section className="mx-auto min-w-0 max-w-[680px]">
        {section === "feed" ? <Feed meId={meId} /> : null}
        {section === "gifts" ? <Gifts pending={pending} sent={sent} friendName={friend.name} /> : null}
        {section === "duel" ? <DuelSection meId={meId} score={score} duel={duel} /> : null}
      </section>
    </main>
  );
}

function Feed({ meId }: { meId: ProfileId }) {
  const rawEvents = useUnifiedFeed(30);
  const [visible, setVisible] = useState(6);
  const events = useMemo(() => consolidateRankEvents(rawEvents), [rawEvents]);

  if (!events.length) return <Empty icon={Sparkles} title="O feed está tranquilo" body="As próximas conquistas de vocês aparecerão aqui." />;

  return (
    <div>
      <div className="mb-2"><h2 className="text-[13px] font-medium text-muted-foreground">Atividades recentes</h2></div>
      <ol className="border-t border-border/50">
        {events.slice(0, visible).map((event) => <FeedPost key={event.id} event={event} meId={meId} />)}
      </ol>
      {visible < events.length ? (
        <Button variant="ghost" onClick={() => setVisible((value) => value + 6)} className="mt-3 w-full text-muted-foreground">Ver mais atividades</Button>
      ) : null}
    </div>
  );
}

function consolidateRankEvents(events: ActivityEvent[]) {
  const hidden = new Set<string>();
  return events.filter((event, index) => {
    if (hidden.has(event.id)) return false;
    if (event.kind !== "rank_up") return true;
    for (let next = index + 1; next < events.length; next += 1) {
      const candidate = events[next];
      if (candidate.profileId === event.profileId && candidate.kind === "rank_up") hidden.add(candidate.id);
    }
    return true;
  });
}

function FeedPost({ event, meId }: { event: ActivityEvent; meId: ProfileId }) {
  const actor = profileMeta(event.profileId);
  const reactions = useReactionsForEvent(event.id);
  const comments = useCommentsForEvent(event.id);
  const [showComments, setShowComments] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const liked = reactions.some((reaction) => reaction.profileId === meId && reaction.emoji === "❤️");

  async function submitComment(eventForm: React.FormEvent) {
    eventForm.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const result = await addActivityComment(event.id, meId, body);
      if (result.ok) {
        setBody("");
        toast.success("Comentário publicado");
      } else {
        toast.error(result.message);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <li className="border-b border-border/50 py-3.5">
      <div className="flex gap-3">
        <ProfileAvatar profileId={event.profileId} initial={actor.initial} gradient={actor.gradient} size={32} />
        <article className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-semibold text-foreground">{event.profileId === meId ? "Você" : actor.name}</p>
            <span className="text-[11px] text-muted-foreground">{timeAgo(event.createdAt)}</span>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-foreground">{eventTitle(event, event.profileId === meId ? "Você" : actor.name)}</p>
          <div className="mt-1.5 flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => toggleReaction(event.id, meId, "❤️")} className={`rounded-full ${liked ? "text-primary" : "text-muted-foreground"}`}>
              <Heart className={liked ? "fill-current" : ""} /> {reactions.filter((reaction) => reaction.emoji === "❤️").length || "Curtir"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowComments((value) => !value)} className="rounded-full text-muted-foreground">
              <MessageCircle /> {comments.length || "Comentar"}
            </Button>
          </div>
          {showComments ? (
            <div className="mt-3 rounded-xl bg-secondary/30 p-3">
              {comments.length === 0 ? <p className="mb-3 text-[12px] text-muted-foreground">Seja o primeiro a comentar.</p> : null}
              {comments.map((comment) => {
                const author = profileMeta(comment.profileId);
                return <div key={comment.id} className="mb-3 flex gap-2"><ProfileAvatar profileId={comment.profileId} initial={author.initial} gradient={author.gradient} size={24} /><div><p className="text-[11px] font-semibold text-foreground">{comment.profileId === meId ? "Você" : author.name}</p><p className="text-[12px] text-muted-foreground">{comment.body}</p></div></div>;
              })}
              <form onSubmit={submitComment} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <input value={body} onChange={(e) => setBody(e.target.value)} maxLength={280} placeholder="Escreva um comentário" className="min-w-0 rounded-lg border border-border/70 bg-background/70 px-3 text-[12px] text-foreground outline-none focus:border-primary" />
                <Button type="submit" size="icon" disabled={!body.trim() || sending} aria-label={sending ? "Enviando comentário" : "Enviar comentário"}><Send /></Button>
              </form>
            </div>
          ) : null}
        </article>
      </div>
    </li>
  );
}

function DuelAvatar({ id, score, label }: { id: ProfileId; score: number; label: string }) {
  const profile = profileMeta(id);
  return <div className="flex items-center gap-2"><ProfileAvatar profileId={id} initial={profile.initial} gradient={profile.gradient} size={34} /><div><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-[16px] font-semibold tabular-nums text-foreground">{score}</p></div></div>;
}

function DuelSection({ meId, score, duel }: { meId: ProfileId; score: { g: number; a: number }; duel: ReturnType<typeof useWeeklyDuel> }) {
  const friendId = otherProfile(meId);
  const mine = meId === "guilherme" ? score.g : score.a;
  const theirs = meId === "guilherme" ? score.a : score.g;
  return <div><div className="mb-5"><h2 className="text-[18px] font-semibold text-foreground">Duelo semanal</h2><p className="text-[12px] text-muted-foreground">As mesmas cartas para os dois. A melhor precisão vence.</p></div><div className="border-y border-border/60 py-7"><div className="mx-auto flex max-w-md items-center justify-between"><DuelAvatarLarge id={meId} score={mine} label="Você" /><div className="text-center"><Swords className="mx-auto h-5 w-5 text-primary" /><p className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">{duel?.status === "active" ? "Ao vivo" : "Semana"}</p></div><DuelAvatarLarge id={friendId} score={theirs} label={profileMeta(friendId).name} /></div></div><Button asChild className="mt-5 w-full"><Link to="/duel">{duel?.status === "active" ? "Continuar duelo" : duel ? "Ver resultado" : "Criar novo duelo"}<ChevronRight /></Link></Button><div className="mt-7 grid grid-cols-3 divide-x divide-border border-y border-border/60 py-4 text-center"><DuelRule value="5" label="cartas" /><DuelRule value="48h" label="prazo" /><DuelRule value="1×" label="por semana" /></div></div>;
}

function DuelAvatarLarge({ id, score, label }: { id: ProfileId; score: number; label: string }) { const p = profileMeta(id); return <div className="text-center"><ProfileAvatar profileId={id} initial={p.initial} gradient={p.gradient} size={58} className="mx-auto" /><p className="mt-2 text-[12px] font-medium text-foreground">{label}</p><p className="text-[24px] font-semibold tabular-nums text-foreground">{score}</p></div>; }
function DuelRule({ value, label }: { value: string; label: string }) { return <div><p className="text-[15px] font-semibold text-foreground">{value}</p><p className="text-[10px] uppercase text-muted-foreground">{label}</p></div>; }

function Gifts({ pending, sent, friendName }: { pending: ReturnType<typeof usePendingGifts>; sent: ReturnType<typeof useSentGifts>; friendName: string }) {
  return <div><div className="mb-5"><h2 className="text-[18px] font-semibold text-foreground">Presentes</h2><p className="text-[12px] text-muted-foreground">Cartas compartilhadas entre você e {friendName}.</p></div>{pending.length ? <GiftInbox /> : <Empty icon={Gift} title="Nenhum presente novo" body={`Quando ${friendName} enviar uma carta, ela aparecerá aqui.`} />}{sent.length ? <section className="mt-7"><h3 className="mb-2 text-[12px] font-semibold uppercase text-muted-foreground">Enviados</h3><ul className="border-t border-border/60">{sent.map((gift) => <li key={gift.id} className="flex items-center gap-3 border-b border-border/60 py-3"><span className="text-muted-foreground">{gift.status === "imported" ? <Check className="h-4 w-4 text-success" /> : gift.status === "declined" ? <XIcon className="h-4 w-4" /> : <Gift className="h-4 w-4 text-primary" />}</span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-foreground">{gift.front}</p><p className="truncate text-[11px] text-muted-foreground">{gift.back}</p></div><span className="text-[10px] uppercase text-muted-foreground">{gift.status === "pending" ? "Pendente" : gift.status === "imported" ? "Aceita" : "Recusada"}</span></li>)}</ul></section> : null}</div>;
}

function eventIcon(kind: ActivityEvent["kind"]) { if (kind === "rank_up") return <Trophy className="h-4 w-4" />; if (kind === "streak_milestone") return <Flame className="h-4 w-4" />; if (kind === "exam_done") return <GraduationCap className="h-4 w-4" />; if (kind === "duel_won") return <Swords className="h-4 w-4" />; return <Sparkles className="h-4 w-4" />; }
function eventTitle(event: ActivityEvent, name: string) { const p = event.payload; if (event.kind === "rank_up") return `${name} chegou ao ${formatRank(p.toTier, p.toDivision)}`; if (event.kind === "streak_milestone") return `${name} completou ${String(p.days ?? "")} dias de sequência`; if (event.kind === "exam_done") return `${name} concluiu a prova mensal`; if (event.kind === "duel_won") return `${name} venceu o duelo da semana`; return `${name} derrotou uma carta inimiga`; }
function eventDescription(event: ActivityEvent) { if (event.kind === "rank_up") return "Uma nova etapa foi alcançada no airi Rank."; if (event.kind === "streak_milestone") return "Consistência que merece ser celebrada."; if (event.kind === "exam_done") return "Mais uma avaliação concluída no plano de estudos."; if (event.kind === "duel_won") return "Rodada finalizada com a melhor pontuação."; return "Mais um desafio removido da Arena."; }
function formatRank(tier: unknown, division: unknown) { const tierText = String(tier ?? "").trim(); const divisionText = String(division ?? "").trim(); const normalized = tierText.charAt(0).toUpperCase() + tierText.slice(1).toLowerCase(); return `${normalized}${divisionText ? ` ${divisionText.toUpperCase()}` : ""}`.trim(); }
function timeAgo(iso: string) { const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000); if (minutes < 1) return "agora"; if (minutes < 60) return `${minutes} min`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h`; return `${Math.floor(hours / 24)}d`; }
function Empty({ icon: Icon, title, body }: { icon: typeof Gift; title: string; body: string }) { return <div className="border-y border-border/60 py-12 text-center"><Icon className="mx-auto h-5 w-5 text-primary" /><p className="mt-3 text-[14px] font-semibold text-foreground">{title}</p><p className="mx-auto mt-1 max-w-xs text-[12px] text-muted-foreground">{body}</p></div>; }
