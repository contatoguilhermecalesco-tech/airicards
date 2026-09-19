import { Link } from "@tanstack/react-router";
import { Flame, Trophy, GraduationCap, Swords, Skull, ChevronRight } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useCurrentProfile } from "@/lib/profile";
import { useProfileSnapshot } from "@/lib/profile-view";
import { formatPresence } from "@/lib/presence";
import {
  useActivityFeed,
  useReactionsForEvent,
  toggleReaction,
  otherProfile,
  profileMeta,
  type ProfileId,
  type ActivityEvent,
} from "@/lib/social-store";

const REACTIONS = ["🔥", "😂", "💀", "🎯", "👏"];

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

function iconFor(kind: ActivityEvent["kind"]) {
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
  }
}

function labelFor(e: ActivityEvent, name: string): string {
  const p = e.payload as any;
  switch (e.kind) {
    case "rank_up":
      return `${name} subiu para ${p.toTier} ${p.toDivision ?? ""}`.trim();
    case "streak_milestone":
      return `${name} atingiu ${p.days} dias de sequência`;
    case "exam_done":
      return `${name} concluiu a prova mensal · ${p.level ?? ""}`.trim();
    case "duel_won":
      return `${name} venceu o duelo da semana`;
    case "enemy_defeated":
      return `${name} derrotou uma carta inimiga`;
  }
}

export function PresenceCard() {
  const me = useCurrentProfile();
  const otherId = me ? otherProfile(me.id as ProfileId) : undefined;
  const events = useActivityFeed(otherId, 4);
  const { snapshot } = useProfileSnapshot(otherId);
  const presence = formatPresence(snapshot?.lastSeenAt);

  if (!me) return null;
  const other = profileMeta(otherId!);

  return (
    <section
      className="animate-fade-in mt-6"
      style={{ animationDelay: "140ms", animationFillMode: "backwards" }}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <ProfileAvatar
              profileId={otherId}
              initial={other.initial}
              gradient={other.gradient}
              size={24}
              fontScale={0.42}
            />
            {presence.online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-background" />
            )}
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
            {other.name}
          </h2>
          <span
            className={`text-[11px] font-medium ${
              presence.online ? "text-emerald-400" : "text-muted-foreground"
            }`}
          >
            · {presence.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PokeButton targetId={otherId} />
          <Link
            to="/duel"
            className="flex items-center gap-1 text-[13px] font-medium text-primary hover:opacity-80"
          >
            Duelar <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-5 text-center text-[13px] text-muted-foreground">
          Nenhuma atividade recente de {other.name}.
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <EventRow key={e.id} event={e} name={other.name} meId={me.id as ProfileId} />
          ))}
        </ul>
      )}
    </section>
  );
}

function EventRow({
  event,
  name,
  meId,
}: {
  event: ActivityEvent;
  name: string;
  meId: ProfileId;
}) {
  const reactions = useReactionsForEvent(event.id);

  const grouped = REACTIONS.map((emoji) => {
    const list = reactions.filter((r) => r.emoji === emoji);
    const mine = list.some((r) => r.profileId === meId);
    return { emoji, count: list.length, mine };
  });

  return (
    <li className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.06] bg-white/[0.02]">
          {iconFor(event.kind)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-foreground">
            {labelFor(event, name)}
          </p>
          <p className="text-[11px] text-muted-foreground">{timeAgo(event.createdAt)}</p>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
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
