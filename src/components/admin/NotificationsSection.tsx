import { useState } from "react";
import { Bell, Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  createNotification,
  deleteNotification,
  useNotifications,
} from "@/lib/notifications-store";
import { generateNotification } from "@/lib/notifications-ai.functions";
import { NOTIFICATION_ICONS, resolveNotificationIcon, type NotificationIconKey } from "@/lib/notification-icons";

export const NOTIFICATION_ROUTES: { path: string; label: string }[] = [
  { path: "/", label: "Início" },
  { path: "/library", label: "Biblioteca" },
  { path: "/study", label: "Estudos" },
  { path: "/study/reading", label: "Reading" },
  { path: "/study/listening", label: "Listening" },
  { path: "/study/speaking", label: "Speaking" },
  { path: "/study/grammar", label: "Gramática" },
  { path: "/study/writing", label: "Writing" },
  { path: "/study/reading/history", label: "Histórico Reading" },
  { path: "/study/listening/history", label: "Histórico Listening" },
  { path: "/study/speaking/history", label: "Histórico Speaking" },
  { path: "/study/writing/history", label: "Histórico Writing" },
  { path: "/review", label: "Revisão" },
  { path: "/enemies", label: "Cartas inimigas" },
  { path: "/rank", label: "Rank" },
  { path: "/exam", label: "Prova mensal" },
  { path: "/novidades", label: "Novidades" },
  { path: "/perfil", label: "Meu perfil" },
  { path: "/social", label: "Social" },
  { path: "/social/stats", label: "Comparar stats" },
  { path: "/duel", label: "Duelo" },
  { path: "/shop", label: "Loja" },
  { path: "/marketplace", label: "Marketplace" },
  { path: "/settings", label: "Configurações" },
];

export function NotificationsSection() {
  const { notifications, tags } = useNotifications();
  const generate = useServerFn(generateNotification);

  const [idea, setIdea] = useState("");
  const [tagId, setTagId] = useState<string>("");
  const [iconKey, setIconKey] = useState<NotificationIconKey | "">("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionRoute, setActionRoute] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleGenerate() {
    if (!idea.trim()) return;
    setGenBusy(true);
    setErr(null);
    try {
      const tagName = tags.find((t) => t.id === tagId)?.name;
      const draft = await generate({ data: { prompt: idea, tag: tagName } });
      setTitle(draft.title);
      setBody(draft.body);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setGenBusy(false);
    }
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSendBusy(true);
    setErr(null);
    setOk(null);
    try {
      await createNotification({
        title,
        body,
        tag_id: tagId || null,
        icon: iconKey || null,
        action_label: actionLabel || null,
        action_route: actionRoute || null,
      });
      setTitle("");
      setBody("");
      setIdea("");
      setIconKey("");
      setActionLabel("");
      setActionRoute("");
      setOk("Notificação enviada para os perfis.");
      setTimeout(() => setOk(null), 3000);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSendBusy(false);
    }
  }

  const tagMap = new Map(tags.map((t) => [t.id, t]));

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Bell className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Notificações</h2>
          <p className="text-xs text-muted-foreground">
            Escreva manualmente ou peça uma sugestão para a IA.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          Ideia para a IA
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder='ex: lembrar de fazer a revisão da tarde'
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <button
            onClick={() => void handleGenerate()}
            disabled={genBusy || !idea.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
          >
            {genBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
            ) : (
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            )}
            Gerar com IA
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Mensagem"
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Tag:</span>
          <button
            onClick={() => setTagId("")}
            className={`rounded-full border px-2.5 py-1 text-xs transition ${
              tagId === ""
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Sem tag
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => setTagId(t.id)}
              className="rounded-full border px-2.5 py-1 text-xs font-medium transition"
              style={{
                backgroundColor: tagId === t.id ? `${t.color}33` : `${t.color}18`,
                color: t.color,
                borderColor: tagId === t.id ? `${t.color}99` : `${t.color}44`,
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ícone</span>
            {iconKey && (
              <button
                onClick={() => setIconKey("")}
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
            {NOTIFICATION_ICONS.map(({ key, Icon, label }) => {
              const active = iconKey === key;
              const tagColor = tags.find((t) => t.id === tagId)?.color ?? "#a78bfa";
              return (
                <button
                  key={key}
                  onClick={() => setIconKey(active ? "" : key)}
                  title={label}
                  aria-label={label}
                  className={`flex aspect-square items-center justify-center rounded-xl border transition ${
                    active
                      ? "border-primary/60 bg-primary/15"
                      : "border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/15 hover:text-foreground"
                  }`}
                  style={active ? { color: tagColor, borderColor: `${tagColor}88`, backgroundColor: `${tagColor}22` } : undefined}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Sem escolher, o ícone é inferido pela tag/título.
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Botão de ação (opcional)
            </span>
            {(actionRoute || actionLabel) && (
              <button
                onClick={() => {
                  setActionRoute("");
                  setActionLabel("");
                }}
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                Limpar
              </button>
            )}
          </div>
          <input
            value={actionLabel}
            onChange={(e) => setActionLabel(e.target.value)}
            placeholder="Texto do botão (ex.: Fazer a prova)"
            className="mb-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <div className="flex flex-wrap gap-1.5">
            {NOTIFICATION_ROUTES.map((r) => {
              const active = actionRoute === r.path;
              return (
                <button
                  key={r.path}
                  onClick={() => setActionRoute(active ? "" : r.path)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    active
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Ao clicar, o usuário será enviado para essa aba.
          </p>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            onClick={() => void handleSend()}
            disabled={sendBusy || !title.trim() || !body.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {sendBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
            ) : (
              <Send className="h-4 w-4" strokeWidth={2.5} />
            )}
            Enviar
          </button>
        </div>
        {err && <p className="text-xs text-red-400">{err}</p>}
        {ok && <p className="text-xs text-emerald-400">{ok}</p>}
      </div>

      {notifications.length > 0 && (
        <>
          <div className="my-4 h-px bg-border" />
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Últimas enviadas
          </p>
          <ul className="space-y-2">
            {notifications.slice(0, 8).map((n) => {
              const tag = n.tag_id ? tagMap.get(n.tag_id) : null;
              const accent = tag?.color ?? "#a78bfa";
              const Icon = resolveNotificationIcon(n.icon, tag?.name, n.title);
              return (
                <li
                  key={n.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      backgroundColor: `${accent}22`,
                      borderColor: `${accent}44`,
                      color: accent,
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {tag && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${tag.color}22`,
                            color: tag.color,
                            border: `1px solid ${tag.color}44`,
                          }}
                        >
                          {tag.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                  </div>
                  <button
                    onClick={() => void deleteNotification(n.id)}
                    className="rounded-full p-1.5 text-muted-foreground opacity-70 transition hover:bg-accent hover:text-foreground hover:opacity-100"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
