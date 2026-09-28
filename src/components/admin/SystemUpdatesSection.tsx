import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Send, Trash2 } from "lucide-react";
import { NOTIFICATION_ICONS, type NotificationIconKey } from "@/lib/notification-icons";
import {
  createSystemUpdate,
  deleteSystemUpdate,
  useSystemUpdates,
  type SystemUpdateStatus,
} from "@/lib/system-updates-store";
import { NOTIFICATION_ROUTES } from "@/components/admin/NotificationsSection";

const STATUSES: Array<{ key: SystemUpdateStatus; label: string; color: string; icon: NotificationIconKey }> = [
  { key: "maintenance", label: "Manutenção", color: "#f59e0b", icon: "clock" },
  { key: "offline", label: "Indisponível", color: "#f87171", icon: "alert" },
  { key: "degraded", label: "Instável", color: "#fb923c", icon: "zap" },
  { key: "info", label: "Informativo", color: "#60a5fa", icon: "info" },
  { key: "resolved", label: "Normalizado", color: "#34d399", icon: "check" },
];

export function SystemUpdatesSection() {
  const { updates } = useSystemUpdates();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [affectedArea, setAffectedArea] = useState("");
  const [status, setStatus] = useState<SystemUpdateStatus>("info");
  const selectedStatus = useMemo(() => STATUSES.find((item) => item.key === status) ?? STATUSES[3], [status]);
  const [icon, setIcon] = useState<NotificationIconKey>("info");
  const [color, setColor] = useState("#60a5fa");
  const [actionLabel, setActionLabel] = useState("");
  const [actionRoute, setActionRoute] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function selectStatus(next: typeof STATUSES[number]) {
    setStatus(next.key);
    setColor(next.color);
    setIcon(next.icon);
  }

  async function publish() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await createSystemUpdate({
        title: title.trim(), body: body.trim(), status, affected_area: affectedArea.trim() || null,
        icon, color, action_label: actionLabel.trim() || null, action_route: actionRoute || null,
      });
      setTitle(""); setBody(""); setAffectedArea(""); setActionLabel(""); setActionRoute("");
      setMessage("Atualização publicada para os perfis.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5 py-1">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Publicar atualização</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Avise sobre manutenção, instabilidade ou normalização.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <button key={item.key} onClick={() => selectStatus(item)} className="rounded-full border px-3 py-1.5 text-xs font-semibold transition" style={{ color: item.color, borderColor: status === item.key ? `${item.color}99` : `${item.color}35`, backgroundColor: status === item.key ? `${item.color}24` : `${item.color}0d` }}>{item.label}</button>
        ))}
      </div>
      <div className="space-y-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Título" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60" />
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={4} placeholder="Mensagem" className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60" />
        <input value={affectedArea} onChange={(event) => setAffectedArea(event.target.value)} placeholder="Função afetada (ex.: Social)" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60" />
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Ícone e cor</p>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
          {NOTIFICATION_ICONS.map((item) => <button key={item.key} title={item.label} aria-label={item.label} onClick={() => setIcon(item.key)} className="flex aspect-square items-center justify-center rounded-xl border transition" style={{ color: icon === item.key ? color : undefined, borderColor: icon === item.key ? `${color}88` : "color-mix(in oklab, var(--border) 80%, transparent)", backgroundColor: icon === item.key ? `${color}20` : "transparent" }}><item.Icon className="h-4 w-4" /></button>)}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input aria-label="Cor do aviso" type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1" />
          <span className="text-xs text-muted-foreground">{selectedStatus.label} · cor personalizada</span>
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Botão opcional</p>
        <input value={actionLabel} onChange={(event) => setActionLabel(event.target.value)} placeholder="Texto do botão" className="mb-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60" />
        <div className="flex flex-wrap gap-1.5">{NOTIFICATION_ROUTES.map((route) => <button key={route.path} onClick={() => setActionRoute(actionRoute === route.path ? "" : route.path)} className={`rounded-full border px-2.5 py-1 text-xs transition ${actionRoute === route.path ? "border-primary/60 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{route.label}</button>)}</div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{message}</p>
        <button onClick={() => void publish()} disabled={busy || !title.trim() || !body.trim()} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar</button>
      </div>
      {updates.length > 0 && <div className="border-t border-border pt-4"><p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Histórico</p><ul className="space-y-2">{updates.map((update) => <li key={update.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: update.color }} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{update.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{update.body}</p></div><button onClick={() => void deleteSystemUpdate(update.id)} aria-label="Excluir atualização" className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"><Trash2 className="h-4 w-4" /></button></li>)}</ul></div>}
      {!updates.length && <div className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4" /> Nenhuma atualização publicada.</div>}
    </section>
  );
}