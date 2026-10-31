import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCheck, CheckCircle2, ChevronLeft, Clock3, Inbox,
  Search, X, Info, Activity, ArrowUpRight,
} from "lucide-react";
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

type Filter = "all" | "maintenance" | "offline" | "degraded" | "info" | "resolved";
const STATUS: Record<SystemUpdateStatus, { label: string }> = {
  maintenance: { label: "Manutenção" },
  offline: { label: "Indisponível" },
  degraded: { label: "Instável" },
  info: { label: "Informativo" },
  resolved: { label: "Normalizado" },
};
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "maintenance", label: "Manutenção" },
  { key: "offline", label: "Indisponível" },
  { key: "degraded", label: "Instabilidade" },
  { key: "info", label: "Informativos" },
  { key: "resolved", label: "Resolvidos" },
];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}
function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}
function isActiveIssue(update: SystemUpdate) {
  return update.status === "maintenance" || update.status === "offline" || update.status === "degraded";
}
function UpdateIcon({ update, className = "h-5 w-5" }: { update: SystemUpdate; className?: string }) {
  const Icon = iconFromKey(update.icon) ?? AlertTriangle;
  return <Icon className={className} strokeWidth={2.1} />;
}

function UpdateItem({ update, read, onOpen }: { update: SystemUpdate; read: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="group flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-white/[0.035] sm:gap-4 sm:px-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border" style={{ color: update.color, borderColor: `${update.color}42`, backgroundColor: `${update.color}16` }}>
        <UpdateIcon update={update} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold text-foreground">{update.title}</span>
          {!read && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Não lida" />}
        </span>
        <span className="mt-1 block line-clamp-2 text-[12.5px] leading-5 text-foreground/60">{update.body}</span>
        <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-medium text-foreground/40">
          <span style={{ color: update.color }}>{STATUS[update.status].label}</span>
          {update.affected_area && <><span aria-hidden>·</span><span>{update.affected_area}</span></>}
          <span aria-hidden>·</span><span>{dateTimeLabel(update.created_at)}</span>
          {update.expected_return_at && update.status !== "resolved" && <><span aria-hidden>·</span><span>Previsão: {dateTimeLabel(update.expected_return_at)}</span></>}
        </span>
      </span>
      <span className="pt-1 text-foreground/25 transition group-hover:text-foreground/70"><ArrowUpRight className="h-4 w-4" /></span>
    </button>
  );
}

function SystemUpdatesPage() {
  const { updates, readIds, loading } = useSystemUpdates();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => { void initSystemUpdates(); }, []);

  const unread = useMemo(() => updates.filter((update) => !readIds.has(update.id)).length, [updates, readIds]);
  const activeIssues = useMemo(() => updates.filter(isActiveIssue), [updates]);
  const latestIssue = activeIssues[0] ?? null;
  const selected = updates.find((update) => update.id === selectedId) ?? null;
  const relatedUpdate = selected?.related_update_id ? updates.find((item) => item.id === selected.related_update_id) : null;
  const timelineRoot = selected ? (selected.related_update_id ? relatedUpdate : selected) : null;
  const timelineItems = timelineRoot ? updates
    .filter((item) => item.id === timelineRoot.id || item.related_update_id === timelineRoot.id)
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()) : [];

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return updates.filter((update) => {
      const matchesFilter = filter === "all" || update.status === filter;
      const matchesUnread = !unreadOnly || !readIds.has(update.id);
      const searchable = `${update.title} ${update.body} ${update.affected_area ?? ""}`.toLocaleLowerCase("pt-BR");
      return matchesFilter && matchesUnread && (!term || searchable.includes(term));
    });
  }, [filter, search, unreadOnly, updates, readIds]);

  const groups = useMemo(() => {
    const byDate = new Map<string, SystemUpdate[]>();
    filtered.forEach((update) => {
      const key = dateLabel(update.created_at);
      byDate.set(key, [...(byDate.get(key) ?? []), update]);
    });
    return Array.from(byDate.entries());
  }, [filtered]);

  function openUpdate(update: SystemUpdate) {
    setSelectedId(update.id);
    void markSystemUpdateRead(update.id);
  }
  function openAction(update: SystemUpdate) {
    if (update.action_route) void navigate({ to: update.action_route as never });
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Link to="/" aria-label="Voltar" className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground/70 transition hover:bg-white/[0.06] hover:text-foreground"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/45">Central de comunicados</p>
            <h1 className="mt-0.5 text-2xl font-semibold text-foreground sm:text-[28px]">Atualizações do sistema</h1>
            <p className="mt-1 text-[12.5px] text-foreground/55">Acompanhe o funcionamento e as novidades do airi.</p>
          </div>
        </div>
        {unread > 0 && <button type="button" onClick={() => void markAllSystemUpdatesRead()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-foreground/75 transition hover:bg-white/[0.06] hover:text-foreground"><CheckCheck className="h-4 w-4" /><span className="hidden sm:inline">Marcar tudo</span></button>}
      </header>

      <section className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
        <div className="flex items-center gap-2">
          {activeIssues.length ? <><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ backgroundColor: latestIssue?.color }} /><span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: latestIssue?.color }} /></span><span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Atenção no sistema</span></> : <><CheckCircle2 className="h-4 w-4 text-emerald-400" /><span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Status do sistema</span></>}
        </div>
        {activeIssues.length ? (
          <div className="mt-2">
            <p className="text-base font-semibold text-foreground">Temos {activeIssues.length === 1 ? "uma ocorrência ativa" : `${activeIssues.length} ocorrências ativas`}</p>
            <p className="mt-1 text-xs leading-5 text-foreground/55">Acompanhe os comunicados abaixo para consultar áreas afetadas e previsões.</p>
            <div className="mt-3 space-y-2">
              {activeIssues.slice(0, 2).map((issue) => <button key={issue.id} type="button" onClick={() => openUpdate(issue)} className="flex w-full items-center gap-2 rounded-xl bg-white/[0.035] px-3 py-2 text-left text-xs transition hover:bg-white/[0.06]"><span className="shrink-0" style={{ color: issue.color }}><UpdateIcon update={issue} className="h-4 w-4" /></span><span className="min-w-0 flex-1 truncate font-medium text-foreground/85">{issue.title}</span><span className="shrink-0 text-[10px] text-foreground/40">{STATUS[issue.status].label}</span></button>)}
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-base font-semibold text-foreground">Tudo funcionando normalmente</p>
            <p className="mt-1 text-xs leading-5 text-foreground/55">Não há comunicados ativos de manutenção, instabilidade ou indisponibilidade.</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.06] pt-3 text-[10.5px] text-foreground/45">
          <span className="inline-flex items-center gap-1"><Activity className="h-3.5 w-3.5" />{updates.length} comunicados</span>
          <span className="inline-flex items-center gap-1"><Inbox className="h-3.5 w-3.5" />{unread} não {unread === 1 ? "lido" : "lidos"}</span>
        </div>
      </section>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3">
        <Search className="h-4 w-4 shrink-0 text-foreground/35" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, descrição ou área..." className="h-10 min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-foreground/35" aria-label="Buscar atualizações" />
        {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca" className="text-foreground/40 hover:text-foreground"><X className="h-4 w-4" /></button>}
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-white/[0.07] pb-3 scrollbar-hide">
        {FILTERS.map((item) => <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${filter === item.key ? "bg-primary/15 text-primary" : "text-foreground/50 hover:bg-white/[0.04] hover:text-foreground"}`}>{item.label}</button>)}
        <button type="button" onClick={() => setUnreadOnly((value) => !value)} className={`ml-auto shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${unreadOnly ? "bg-primary/15 text-primary" : "text-foreground/50 hover:bg-white/[0.04] hover:text-foreground"}`}>Não lidos</button>
      </div>

      {loading ? <div className="py-16 text-center text-sm text-foreground/45">Carregando atualizações…</div> : groups.length ? (
        <div className="space-y-6">{groups.map(([date, items]) => <section key={date}><p className="mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-wider text-foreground/40">{date}</p><div className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">{items.map((update) => <UpdateItem key={update.id} update={update} read={readIds.has(update.id)} onOpen={() => openUpdate(update)} />)}</div></section>)}</div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04]"><Inbox className="h-5 w-5 text-foreground/40" /></span><p className="mt-3 text-sm font-semibold text-foreground/85">Nenhuma atualização encontrada</p><p className="mt-1 max-w-xs text-xs leading-5 text-foreground/45">Tente outro filtro ou termo de busca.</p></div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="update-dialog-title" className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-white/[0.1] bg-background p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border" style={{ color: selected.color, borderColor: `${selected.color}42`, backgroundColor: `${selected.color}16` }}><UpdateIcon update={selected} /></span>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: selected.color }}>{STATUS[selected.status].label}</span>
                  <h2 id="update-dialog-title" className="mt-1 text-lg font-semibold leading-snug text-foreground">{selected.title}</h2>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Fechar comunicado" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-foreground/50 transition hover:bg-white/[0.07] hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-foreground/75">{selected.body}</p>
            <div className="mt-5 space-y-2 rounded-xl bg-white/[0.035] p-3 text-xs text-foreground/55">
              <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" />Publicado em {dateTimeLabel(selected.created_at)}</p>
              {selected.affected_area && <p className="flex items-center gap-2"><Info className="h-3.5 w-3.5" />Área afetada: {selected.affected_area}</p>}
              {selected.expected_return_at && selected.status !== "resolved" && <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" />Previsão de retorno: {dateTimeLabel(selected.expected_return_at)}</p>}
              {selected.status === "resolved" && relatedUpdate && <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /><span>Este comunicado normaliza: <strong className="font-semibold text-foreground/80">{relatedUpdate.title}</strong></span></p>}
            </div>
            {timelineItems.length > 1 && (
              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><h3 className="text-sm font-semibold text-foreground">Linha do tempo</h3><p className="mt-0.5 text-[11px] text-foreground/45">Acompanhe cada etapa desta ocorrência.</p></div>
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-foreground/50">{timelineItems.length} etapas</span>
                </div>
                <ol className="space-y-0">
                  {timelineItems.map((item, index) => {
                    const isLast = index === timelineItems.length - 1;
                    const isCurrent = item.id === selected.id;
                    return <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {!isLast && <span className="absolute left-[5px] top-3 h-full w-px bg-white/[0.12]" />}
                      <span className="relative z-10 mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2" style={{ borderColor: item.color, backgroundColor: item.status === "resolved" ? item.color : "var(--background)" }} />
                      <div className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 ${isCurrent ? "bg-white/[0.055]" : ""}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className={`text-xs font-semibold ${isCurrent ? "text-foreground" : "text-foreground/80"}`}>{item.title}</p>
                          <span className="text-[10px] text-foreground/40">{dateTimeLabel(item.created_at)}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-foreground/55">{item.body}</p>
                        <p className="mt-1 text-[10px] font-semibold" style={{ color: item.color }}>{STATUS[item.status].label}</p>
                      </div>
                    </li>;
                  })}
                </ol>
              </div>
            )}
            {selected.action_label && selected.action_route && <button type="button" onClick={() => openAction(selected)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">{selected.action_label}<ArrowUpRight className="h-4 w-4" /></button>}
            <button type="button" onClick={() => setSelectedId(null)} className="mt-2 w-full rounded-xl px-4 py-2.5 text-xs font-medium text-foreground/55 transition hover:bg-white/[0.04] hover:text-foreground">Fechar</button>
          </section>
        </div>
      )}
    </main>
  );
}
