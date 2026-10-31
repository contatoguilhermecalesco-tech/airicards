import { useMemo, useState } from "react";
import { AlertTriangle, Check, Clock3, Loader2, Pencil, Search, Send, Trash2, X } from "lucide-react";
import { NOTIFICATION_ICONS, type NotificationIconKey } from "@/lib/notification-icons";
import {
  createSystemUpdate, deleteSystemUpdate, updateSystemUpdate, useSystemUpdates,
  type SystemUpdate, type SystemUpdateStatus,
} from "@/lib/system-updates-store";
import { NOTIFICATION_ROUTES } from "@/components/admin/NotificationsSection";

const STATUSES: Array<{ key: SystemUpdateStatus; label: string; color: string; icon: NotificationIconKey }> = [
  { key: "maintenance", label: "Manutenção", color: "#f59e0b", icon: "clock" },
  { key: "offline", label: "Indisponível", color: "#f87171", icon: "alert" },
  { key: "degraded", label: "Instável", color: "#fb923c", icon: "zap" },
  { key: "info", label: "Informativo", color: "#60a5fa", icon: "info" },
  { key: "resolved", label: "Normalizado", color: "#34d399", icon: "check" },
];
const AREAS = ["Geral", "Social", "Revisão", "Biblioteca", "Estudos", "Duelos", "Desafios", "Rank", "Conquistas", "Loja", "Inventário", "Inimigos", "Novidades", "Perfil", "Forja", "Configurações"];

function localDateValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function SystemUpdatesSection() {
  const { updates, loading } = useSystemUpdates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = updates.find((item) => item.id === editingId) ?? null;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [affectedArea, setAffectedArea] = useState("Geral");
  const [status, setStatus] = useState<SystemUpdateStatus>("info");
  const [icon, setIcon] = useState<NotificationIconKey>("info");
  const [color, setColor] = useState("#60a5fa");
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionRoute, setActionRoute] = useState("");
  const [relatedUpdateId, setRelatedUpdateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [search, setSearch] = useState("");

  const selectedStatus = useMemo(() => STATUSES.find((item) => item.key === status) ?? STATUSES[3], [status]);
  const activeUpdates = updates.filter((item) => item.status !== "resolved");
  const visibleUpdates = updates.filter((item) => {
    const matchesFilter = filter === "all" || (filter === "active" ? item.status !== "resolved" : item.status === "resolved");
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return matchesFilter && (!term || `${item.title} ${item.body} ${item.affected_area ?? ""}`.toLocaleLowerCase("pt-BR").includes(term));
  });

  function resetForm() {
    setEditingId(null); setTitle(""); setBody(""); setAffectedArea("Geral"); setStatus("info");
    setIcon("info"); setColor("#60a5fa"); setExpectedReturnAt(""); setActionLabel(""); setActionRoute(""); setRelatedUpdateId("");
  }
  function selectStatus(next: typeof STATUSES[number]) {
    setStatus(next.key); setColor(next.color); setIcon(next.icon);
    if (next.key === "resolved" && !relatedUpdateId && activeUpdates.length) setRelatedUpdateId(activeUpdates[0].id);
  }
  function startEdit(update: SystemUpdate) {
    setEditingId(update.id); setTitle(update.title); setBody(update.body);
    setAffectedArea(update.affected_area ?? "Geral"); setStatus(update.status);
    setIcon((update.icon || "info") as NotificationIconKey); setColor(update.color || "#60a5fa");
    setExpectedReturnAt(localDateValue(update.expected_return_at));
    setActionLabel(update.action_label ?? ""); setActionRoute(update.action_route ?? "");
    setRelatedUpdateId(update.related_update_id ?? "");
    setMessage(null);
  }
  async function publish() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true); setMessage(null);
    try {
      const payload = {
        title: title.trim(), body: body.trim(), status,
        affected_area: affectedArea === "Geral" ? null : affectedArea,
        icon, color, action_label: actionLabel.trim() || null, action_route: actionRoute || null,
        expected_return_at: expectedReturnAt ? new Date(expectedReturnAt).toISOString() : null,
        related_update_id: relatedUpdateId || null,
      };
      if (editingId) await updateSystemUpdate(editingId, payload);
      else await createSystemUpdate(payload);
      setMessage(editingId ? "Atualização editada." : "Atualização publicada para os perfis.");
      resetForm();
    } catch (error) {
      setMessage((error as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <section className="space-y-5 py-1">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{editing ? "Editar atualização" : "Publicar atualização"}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Comunique o estado dos recursos. Isso não ativa nem desativa a manutenção.</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((item) => <button key={item.key} type="button" onClick={() => selectStatus(item)} className="rounded-full border px-3 py-1.5 text-xs font-semibold transition" style={{ color: item.color, borderColor: status === item.key ? `${item.color}99` : `${item.color}35`, backgroundColor: status === item.key ? `${item.color}24` : `${item.color}0d` }}>{item.label}</button>)}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Título do comunicado" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={3} placeholder="Explique o que está acontecendo..." className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60" />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">Área afetada<select value={affectedArea} onChange={(e) => setAffectedArea(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground">{AREAS.map((area) => <option key={area}>{area}</option>)}</select></label>
          <label className="space-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> Previsão de retorno (opcional)</span><input type="datetime-local" value={expectedReturnAt} onChange={(e) => setExpectedReturnAt(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground" /></label>
        </div>
        <label className="block space-y-1 text-xs text-muted-foreground">Vincular a uma ocorrência (opcional)<select value={relatedUpdateId} onChange={(e) => setRelatedUpdateId(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground"><option value="">Nova ocorrência / sem vínculo</option>{activeUpdates.filter((item) => item.id !== editingId && !item.related_update_id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><span className="block text-[10px] text-muted-foreground/75">Use o mesmo vínculo para publicar etapas como identificação, investigação e normalização na mesma linha do tempo.</span></label>
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Ícone e cor</p>
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">{NOTIFICATION_ICONS.map((item) => <button type="button" key={item.key} title={item.label} aria-label={item.label} onClick={() => setIcon(item.key)} className="flex aspect-square items-center justify-center rounded-xl border transition" style={{ color: icon === item.key ? color : undefined, borderColor: icon === item.key ? `${color}88` : "color-mix(in oklab, var(--border) 80%, transparent)", backgroundColor: icon === item.key ? `${color}20` : "transparent" }}><item.Icon className="h-4 w-4" /></button>)}</div>
          <div className="mt-2 flex items-center gap-2"><input aria-label="Cor do aviso" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1" /><span className="text-xs text-muted-foreground">{selectedStatus.label} · cor personalizada</span></div>
        </div>
        <div className="rounded-xl border border-white/[0.06] p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Botão opcional</p>
          <input value={actionLabel} onChange={(e) => setActionLabel(e.target.value)} placeholder="Texto do botão" className="mb-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none" />
          <div className="flex flex-wrap gap-1.5">{NOTIFICATION_ROUTES.map((route) => <button type="button" key={route.path} onClick={() => setActionRoute(actionRoute === route.path ? "" : route.path)} className={`rounded-full border px-2.5 py-1 text-xs transition ${actionRoute === route.path ? "border-primary/60 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{route.label}</button>)}</div>
        </div>
        <div className="rounded-xl border border-dashed border-white/10 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prévia para os usuários</p>
          <div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border" style={{ color, borderColor: `${color}55`, backgroundColor: `${color}18` }}><AlertTriangle className="h-4 w-4" /></span><div className="min-w-0"><p className="text-sm font-semibold">{title || "Título do comunicado"}</p><p className="mt-1 text-xs text-muted-foreground">{body || "A descrição aparecerá aqui."}</p><p className="mt-1 text-[10px] font-medium" style={{ color }}>{selectedStatus.label}{affectedArea !== "Geral" ? ` · ${affectedArea}` : ""}{expectedReturnAt ? ` · Previsão: ${dateLabel(new Date(expectedReturnAt).toISOString())}` : ""}</p></div></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-xs text-muted-foreground">{message}</p>
          <div className="flex gap-2">{editing && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs"><X className="h-3.5 w-3.5" /> Cancelar</button>}<button type="button" onClick={() => void publish()} disabled={busy || !title.trim() || !body.trim()} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}{editing ? "Salvar edição" : "Publicar"}</button></div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Gerenciar comunicados</p><p className="text-[11px] text-muted-foreground">{activeUpdates.length} em andamento · {updates.length - activeUpdates.length} normalizados</p></div><div className="flex gap-1">{(["all", "active", "resolved"] as const).map((key) => <button type="button" key={key} onClick={() => setFilter(key)} className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${filter === key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/[0.05]"}`}>{key === "all" ? "Todos" : key === "active" ? "Ativos" : "Normalizados"}</button>)}</div></div>
        <div className="relative mb-3"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, descrição ou área" className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs outline-none focus:border-primary/60" /></div>
        {loading ? <p className="py-5 text-center text-xs text-muted-foreground">Carregando histórico…</p> : visibleUpdates.length ? <ul className="space-y-2">{visibleUpdates.map((update) => {
          const meta = STATUSES.find((item) => item.key === update.status) ?? STATUSES[3];
          const related = update.related_update_id ? updates.find((item) => item.id === update.related_update_id) : null;
          return <li key={update.id} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{update.title}</p><span className="text-[10px] font-semibold" style={{ color: meta.color }}>{meta.label}</span></div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{update.body}</p><p className="mt-1 text-[10px] text-foreground/40">{update.affected_area ?? "Geral"} · {dateLabel(update.created_at)}{update.expected_return_at ? ` · Previsão ${dateLabel(update.expected_return_at)}` : ""}</p>{related && <p className="mt-1 text-[10px] text-primary">Etapa de: {related.title}</p>}</div><button type="button" onClick={() => startEdit(update)} aria-label="Editar atualização" className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => { if (window.confirm("Excluir esta atualização?")) void deleteSystemUpdate(update.id); }} aria-label="Excluir atualização" className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Trash2 className="h-4 w-4" /></button></li>;
        })}</ul> : <div className="flex items-center gap-2 py-5 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4" /> Nenhuma atualização encontrada.</div>}
      </div>
    </section>
  );
}
