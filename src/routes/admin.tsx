import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Shield,
  Sparkles,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";
import {
  fetchAllProfileSessions,
  resetHomeSessionsForProfile,
  type ProfileSessionInfo,
} from "@/lib/flashcards-store";
import { resetExamsForProfileId } from "@/lib/exam-store";
import { useAppSettings, setSetting } from "@/lib/app-settings";

export const NOTIFICATION_ROUTES: { path: string; label: string }[] = [
  { path: "/", label: "Início" },
  { path: "/library", label: "Biblioteca" },
  { path: "/study", label: "Estudos" },
  { path: "/study/writing", label: "Writing" },
  { path: "/study/grammar", label: "Gramática" },
  { path: "/exam", label: "Prova mensal" },
  { path: "/settings", label: "Configurações" },
];

import { PROFILES, getCurrentProfile } from "@/lib/profile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createNotification,
  createTag,
  deleteNotification,
  deleteTag,
  initNotifications,
  useNotifications,
} from "@/lib/notifications-store";
import { generateNotification } from "@/lib/notifications-ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { NOTIFICATION_ICONS, resolveNotificationIcon, type NotificationIconKey } from "@/lib/notification-icons";

const ADMIN_PROFILE_ID = "guilherme";

const TAG_COLORS = [
  "#a78bfa",
  "#60a5fa",
  "#34d399",
  "#f472b6",
  "#fbbf24",
  "#fb7185",
  "#22d3ee",
  "#c084fc",
];

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const p = getCurrentProfile();
    if (!p || p.id !== ADMIN_PROFILE_ID) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const [rows, setRows] = useState<ProfileSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetchAllProfileSessions();
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    void initNotifications();
  }, []);

  function nameFor(profileId: string) {
    return PROFILES.find((p) => p.id === profileId)?.name ?? profileId;
  }
  function gradientFor(profileId: string) {
    return (
      PROFILES.find((p) => p.id === profileId)?.gradient ??
      "linear-gradient(135deg, oklch(0.6 0.05 260), oklch(0.4 0.05 260))"
    );
  }

  const merged: ProfileSessionInfo[] = PROFILES.map((p) => {
    const found = rows.find((r) => r.profileId === p.id);
    return found ?? { profileId: p.id, day: "", count: 0, reviewed: 0 };
  });
  rows.forEach((r) => {
    if (!merged.find((m) => m.profileId === r.profileId)) merged.push(r);
  });

  async function handleReset(profileId: string) {
    setBusyId(profileId);
    try {
      await resetHomeSessionsForProfile(profileId);
      await load();
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pt-8 pb-24 sm:pt-14">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Shield className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
            <p className="text-sm text-muted-foreground">
              Sessões, tags e notificações
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground transition hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Voltar
        </Link>
      </div>

      <section className="ios-card rounded-3xl p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Perfis
          </h2>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
            Atualizar
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Carregando…
          </p>
        ) : (
          <ul className="space-y-2">
            {merged.map((r) => (
              <li
                key={r.profileId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{ backgroundImage: gradientFor(r.profileId) }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {nameFor(r.profileId)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {r.count} sessões
                      {" · "}
                      {r.reviewed} revisadas
                      {r.day ? ` · ${r.day}` : ""}
                    </p>

                  </div>
                </div>
                <button
                  disabled={busyId === r.profileId}
                  onClick={() => setConfirmId(r.profileId)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Zerar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="h-6" />
      <ExamAdminSection />

      <div className="h-6" />
      <TagsSection />

      <div className="h-6" />
      <NotificationsSection />


      <AlertDialog
        open={confirmId !== null}
        onOpenChange={(o) => !o && setConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zerar sessões?</AlertDialogTitle>
            <AlertDialogDescription>
              O contador de sessões de{" "}
              <strong>{confirmId ? nameFor(confirmId) : ""}</strong> volta para
              zero. As cartas em si não são afetadas.

            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId && void handleReset(confirmId)}
            >
              Zerar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function TagsSection() {
  const { tags } = useNotifications();
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await createTag(name, color);
      setName("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <TagIcon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Tags</h2>
          <p className="text-xs text-muted-foreground">
            Organize as notificações por categoria.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma tag ainda.</p>
        )}
        {tags.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${t.color}22`,
              color: t.color,
              border: `1px solid ${t.color}44`,
            }}
          >
            {t.name}
            <button
              onClick={() => void deleteTag(t.id)}
              className="ml-0.5 rounded-full p-0.5 opacity-70 transition hover:bg-white/10 hover:opacity-100"
              aria-label={`Excluir ${t.name}`}
            >
              <Trash2 className="h-3 w-3" strokeWidth={2.25} />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da tag"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
          onKeyDown={(e) => e.key === "Enter" && void add()}
        />
        <div className="flex items-center gap-1.5">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-background transition ${
                color === c ? "ring-2 ring-white/60" : ""
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
        <button
          onClick={() => void add()}
          disabled={busy || !name.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Adicionar
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </section>
  );
}

function NotificationsSection() {
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
      await createNotification({ title, body, tag_id: tagId || null, icon: iconKey || null });
      setTitle("");
      setBody("");
      setIdea("");
      setIconKey("");
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

      {/* IA input */}
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

      {/* Manual form */}
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

        {/* Icon picker */}
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

      {/* Historic */}
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

function ExamAdminSection() {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleReset(profileId: string) {
    setBusy(profileId);
    try {
      await resetExamsForProfileId(profileId);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
      setConfirmId(null);
    }
  }

  return (
    <section className="glass-panel rounded-3xl border p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
          <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Prova mensal</h2>
          <p className="text-xs text-muted-foreground">
            Zerar histórico libera nova prova imediatamente.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {PROFILES.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                style={{ backgroundImage: p.gradient }}
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">Prova de nivelamento</p>
              </div>
            </div>
            <button
              disabled={busy === p.id}
              onClick={() => setConfirmId(p.id)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
              Zerar
            </button>
          </li>
        ))}
      </ul>

      <AlertDialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zerar histórico de provas?</AlertDialogTitle>
            <AlertDialogDescription>
              Todo o histórico de provas de{" "}
              <strong>{confirmId ? (PROFILES.find((p) => p.id === confirmId)?.name ?? "") : ""}</strong>{" "}
              será removido. O usuário poderá iniciar uma nova prova imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && void handleReset(confirmId)}>
              Zerar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
