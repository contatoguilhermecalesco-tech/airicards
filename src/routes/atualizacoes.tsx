import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCheck, ChevronLeft, Inbox } from "lucide-react";
import { iconFromKey } from "@/lib/notification-icons";
import {
  initSystemUpdates,
  markAllSystemUpdatesRead,
  markSystemUpdateRead,
  useSystemUpdates,
  type SystemUpdate,
  type SystemUpdateStatus,
} from "@/lib/system-updates-store";

export const Route = createFileRoute("/atualizacoes")({
  head: () => ({
    meta: [
      { title: "Atualizações do sistema — airi" },
      { name: "description", content: "Acompanhe manutenções, instabilidades e normalizações dos recursos do airi." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Atualizações do sistema — airi" },
      { property: "og:description", content: "Acompanhe manutenções, instabilidades e normalizações dos recursos do airi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SystemUpdatesPage,
});

type Filter = "all" | SystemUpdateStatus;

const STATUS: Record<SystemUpdateStatus, { label: string }> = {
  maintenance: { label: "Manutenção" },
  offline: { label: "Indisponível" },
  degraded: { label: "Instável" },
  info: { label: "Informativo" },
  resolved: { label: "Normalizado" },
};

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Tudo" },
  { key: "maintenance", label: "Manutenção" },
  { key: "offline", label: "Indisponível" },
  { key: "degraded", label: "Instável" },
  { key: "resolved", label: "Normalizado" },
];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function UpdateRow({ update, read }: { update: SystemUpdate; read: boolean }) {
  const navigate = useNavigate();
  const Icon = iconFromKey(update.icon) ?? AlertTriangle;

  function openUpdate() {
    void markSystemUpdateRead(update.id);
    if (update.action_route) void navigate({ to: update.action_route as never });
  }

  return (
    <button type="button" onClick={openUpdate} className="group flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-white/[0.035] sm:gap-4 sm:px-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border" style={{ color: update.color, borderColor: `${update.color}42`, backgroundColor: `${update.color}16` }}>
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold text-foreground">{update.title}</span>
          {!read && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Não lida" />}
        </span>
        <span className="mt-1 block text-[12.5px] leading-5 text-foreground/60">{update.body}</span>
        <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-medium text-foreground/40">
          <span style={{ color: update.color }}>{STATUS[update.status].label}</span>
          {update.affected_area && <><span aria-hidden>·</span><span>{update.affected_area}</span></>}
          <span aria-hidden>·</span><span>{timeLabel(update.created_at)}</span>
          {update.action_label && <><span aria-hidden>·</span><span className="text-primary">{update.action_label}</span></>}
        </span>
      </span>
    </button>
  );
}

function SystemUpdatesPage() {
  const { updates, readIds, loading } = useSystemUpdates();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => { void initSystemUpdates(); }, []);

  const unread = useMemo(() => updates.filter((update) => !readIds.has(update.id)).length, [updates, readIds]);
  const filtered = useMemo(() => filter === "all" ? updates : updates.filter((update) => update.status === filter), [filter, updates]);
  const groups = useMemo(() => {
    const byDate = new Map<string, SystemUpdate[]>();
    filtered.forEach((update) => {
      const key = dateLabel(update.created_at);
      byDate.set(key, [...(byDate.get(key) ?? []), update]);
    });
    return Array.from(byDate.entries());
  }, [filtered]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link to="/" aria-label="Voltar" className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground/70 transition hover:bg-white/[0.06] hover:text-foreground"><ChevronLeft className="h-5 w-5" /></Link>
          <div>
            <p className="text-[11px] font-semibold uppercase text-foreground/45">Status do airi</p>
            <h1 className="mt-0.5 text-2xl font-semibold text-foreground sm:text-[28px]">Atualizações do sistema</h1>
            <p className="mt-1 text-[12.5px] text-foreground/55">Manutenções, indisponibilidades e normalizações.</p>
          </div>
        </div>
        {unread > 0 && <button type="button" onClick={() => void markAllSystemUpdatesRead()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-foreground/75 transition hover:bg-white/[0.06] hover:text-foreground"><CheckCheck className="h-4 w-4" /><span className="hidden sm:inline">Marcar tudo</span></button>}
      </header>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-white/[0.07] pb-3 scrollbar-hide">
        {FILTERS.map((item) => <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${filter === item.key ? "bg-primary/15 text-primary" : "text-foreground/50 hover:bg-white/[0.04] hover:text-foreground"}`}>{item.label}</button>)}
      </div>

      {loading ? <div className="py-16 text-center text-sm text-foreground/45">Carregando atualizações…</div> : groups.length ? (
        <div className="space-y-6">{groups.map(([date, items]) => <section key={date}><p className="mb-2 px-1 text-[10.5px] font-semibold uppercase text-foreground/40">{date}</p><div className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">{items.map((update) => <UpdateRow key={update.id} update={update} read={readIds.has(update.id)} />)}</div></section>)}</div>
      ) : <div className="flex flex-col items-center py-20 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04]"><Inbox className="h-5 w-5 text-foreground/40" /></span><p className="mt-3 text-sm font-semibold text-foreground/85">Nenhuma atualização</p><p className="mt-1 max-w-xs text-xs leading-5 text-foreground/45">Não há comunicados para este filtro.</p></div>}
    </main>
  );
}