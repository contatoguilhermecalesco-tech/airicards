import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Shield,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  Pencil,
  X,
  Wand2,
  Wrench,
} from "lucide-react";
import {
  createChangelogEntry,
  updateChangelogEntry,
  deleteChangelogEntry,
  initChangelog,
  useChangelog,
  type ChangelogCategory,
  type ChangelogEntry,
} from "@/lib/changelog-store";
import { generateChangelogEntry } from "@/lib/changelog-ai.functions";
import { RiotPatchBody, RIOT_NOTES_PLACEHOLDER } from "@/lib/patch-notes";

import {
  type ProfileSessionInfo,
} from "@/lib/flashcards-store";
import {
  adminFetchAllProfileSessionsFn,
  adminResetHomeSessionsFn,
  adminResetExamsFn,
} from "@/lib/admin.functions";
import { useAppSettings, setSetting } from "@/lib/app-settings";
import { useRank, resetRank, tierLabel, TIER_COLORS, readRankForProfile, subscribeAllRanks, type RankState } from "@/lib/rank-store";
import { RankEmblem } from "@/components/RankBadge";

export const NOTIFICATION_ROUTES: { path: string; label: string }[] = [
  { path: "/", label: "Início" },
  { path: "/library", label: "Biblioteca" },
  { path: "/study", label: "Estudos" },
  { path: "/study/reading", label: "Reading" },
  { path: "/study/listening", label: "Listening" },
  { path: "/study/speaking", label: "Speaking" },
  { path: "/study/grammar", label: "Gramática" },
  { path: "/study/writing", label: "Writing" },
  { path: "/study/writing/history", label: "Histórico Writing" },
  { path: "/review", label: "Revisão" },
  { path: "/enemies", label: "Cartas inimigas" },
  { path: "/rank", label: "Rank" },
  { path: "/exam", label: "Prova mensal" },
  { path: "/novidades", label: "Novidades" },
  { path: "/settings", label: "Configurações" },
];

import { PROFILES, getCurrentProfile, useCurrentProfile, useIsAdmin, useProfileHydrated, listProfilesMeta, type ProfileMeta } from "@/lib/profile";
import { adminSetProfilePin, adminUnlinkProfile } from "@/lib/admin-actions";
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
  component: AdminGate,
});

function AdminGate() {
  const hydrated = useProfileHydrated();
  const isAdmin = useIsAdmin();
  const profile = useCurrentProfile();
  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-sm text-muted-foreground">
        Carregando…
      </main>
    );
  }
  if (!profile || !isAdmin) {
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
    return null;
  }
  return <AdminPage />;
}

function AdminPage() {
  const [rows, setRows] = useState<ProfileSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = (await adminFetchAllProfileSessionsFn()).map((r) => ({ profileId: r.profile_id, day: r.home_sessions?.day ?? "", count: r.home_sessions?.count ?? 0, reviewed: r.home_sessions?.reviewed ?? 0 }));
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    void initNotifications();
    void initChangelog();
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
      await adminResetHomeSessionsFn({ data: { profileId } });
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
      <ProfilesRankOverview />

      <div className="h-6" />
      <ExamAdminSection />

      <div className="h-6" />
      <ArlysAdminSection />

      <div className="h-6" />
      <DuelsAdminSection />

      <div className="h-6" />
      <PinAdminSection />

      <div className="h-6" />
      <TagsSection />

      <div className="h-6" />
      <NotificationsSection />

      <div className="h-6" />
      <ChangelogSection />




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

      <RankAdminSection />
    </main>
  );
}

function RankAdminSection() {
  const rank = useRank();
  const [confirm, setConfirm] = useState(false);
  const colors = TIER_COLORS[rank.tier];
  return (
    <section className="ios-card mt-4 rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: `${colors.glow}`, color: colors.ring }}
        >
          <Shield className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Rank do seu perfil</h2>
          <p className="text-xs text-muted-foreground">
            Rank é armazenado localmente por perfil. Aqui você pode recalibrar o seu.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
        <RankEmblem tier={rank.tier} division={rank.division} size={44} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: colors.text }}>
            {tierLabel(rank)}
          </p>
          <p className="text-xs text-muted-foreground">
            {rank.lp} LP · {rank.totalEarned} LP ganho no total
          </p>
        </div>
        <button
          onClick={() => setConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Recalibrar
        </button>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalibrar rank?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu rank atual e todo o histórico de LP serão zerados. Você volta para Ferro IV.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetRank();
                setConfirm(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function ProfilesRankOverview() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    const unsub = subscribeAllRanks(() => setTick((t) => t + 1));
    return () => {
      window.removeEventListener("focus", onFocus);
      unsub();
    };
  }, []);

  const active = getCurrentProfile();
  const entries: {
    profileId: string;
    name: string;
    gradient: string;
    isActive: boolean;
    rank: RankState | null;
  }[] = PROFILES.map((p) => ({
    profileId: p.id,
    name: p.name,
    gradient: p.gradient,
    isActive: active?.id === p.id,
    rank: readRankForProfile(p.id),
  }));

  // Ordena por LP total ganho (desc), perfis sem histórico ao final.
  entries.sort((a, b) => {
    const la = a.rank?.totalEarned ?? -1;
    const lb = b.rank?.totalEarned ?? -1;
    return lb - la;
  });

  void tick;

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Elo dos usuários
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Ranking atual de cada perfil cadastrado neste dispositivo.
          </p>
        </div>
        <button
          onClick={() => setTick((t) => t + 1)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Atualizar
        </button>
      </div>

      <ol className="space-y-2">
        {entries.map((e, idx) => {
          const rank = e.rank;
          const colors = TIER_COLORS[rank?.tier ?? "iron"];
          const position = rank ? idx + 1 : "—";
          return (
            <li
              key={e.profileId}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
            >
              <span
                aria-hidden
                className="w-6 text-center text-xs font-semibold tabular-nums text-muted-foreground"
              >
                {position}
              </span>
              <span
                aria-hidden
                className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                style={{ backgroundImage: e.gradient }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  {e.isActive && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Você
                    </span>
                  )}
                </div>
                {rank ? (
                  <p
                    className="mt-0.5 text-xs tabular-nums"
                    style={{ color: colors.text }}
                  >
                    {tierLabel(rank)} · {rank.lp} LP
                    <span className="text-muted-foreground">
                      {" · "}+{rank.totalEarned} / −{rank.totalLost}
                    </span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Sem histórico neste dispositivo
                  </p>
                )}
              </div>
              {rank ? (
                <RankEmblem
                  tier={rank.tier}
                  division={rank.division}
                  size={40}
                />
              ) : (
                <span className="h-10 w-10 rounded-full border border-dashed border-white/10" />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        O rank é salvo localmente por perfil. Perfis que ainda não estudaram
        neste navegador aparecem sem histórico.
      </p>
    </section>
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

        {/* Action button (optional) */}
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
  const settings = useAppSettings();
  const [toggling, setToggling] = useState(false);

  async function handleReset(profileId: string) {
    setBusy(profileId);
    try {
      await adminResetExamsFn({ data: { profileId } });
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
      setConfirmId(null);
    }
  }

  async function toggleVisible() {
    setToggling(true);
    try {
      await setSetting("exam_visible", !settings.exam_visible);
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  }

  return (
    <section className="glass-panel rounded-3xl border p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
          <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Prova mensal</h2>
          <p className="text-xs text-muted-foreground">
            Controle a visibilidade e zere o histórico dos perfis.
          </p>
        </div>
      </div>

      {/* Visibility toggle */}
      <button
        onClick={() => void toggleVisible()}
        disabled={toggling}
        className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left transition hover:border-white/10 disabled:opacity-50"
      >
        <div>
          <p className="text-sm font-medium">
            {settings.exam_visible ? "Visível para os usuários" : "Oculta para os usuários"}
          </p>
          <p className="text-xs text-muted-foreground">
            {settings.exam_visible
              ? "A prova aparece na Home e em Estudos."
              : "Ative para liberar a prova no app."}
          </p>
        </div>
        <span
          aria-hidden
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            settings.exam_visible ? "bg-primary" : "bg-white/10"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              settings.exam_visible ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </button>


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

const CHANGELOG_CATEGORIES: {
  key: ChangelogCategory;
  label: string;
  color: string;
  Icon: typeof Sparkles;
}[] = [
  { key: "feature", label: "Novo", color: "#a78bfa", Icon: Sparkles },
  { key: "improvement", label: "Melhoria", color: "#60a5fa", Icon: Wand2 },
  { key: "fix", label: "Ajuste", color: "#34d399", Icon: Wrench },
];

function fmtPatchDay(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    })
      .format(new Date(iso))
      .replace(".", "")
      .toUpperCase();
  } catch {
    return "";
  }
}

function ChangelogSection() {
  const { entries } = useChangelog();
  const generate = useServerFn(generateChangelogEntry);

  const [idea, setIdea] = useState("");
  const [category, setCategory] = useState<ChangelogCategory>("feature");
  const [iconKey, setIconKey] = useState<NotificationIconKey | "">("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const activeMeta =
    CHANGELOG_CATEGORIES.find((c) => c.key === category) ?? CHANGELOG_CATEGORIES[0];

  async function handleGenerate() {
    if (!idea.trim()) return;
    setGenBusy(true);
    setErr(null);
    try {
      const draft = await generate({ data: { prompt: idea, category } });
      setTitle(draft.title);
      setBody(draft.body);
      setNotes(draft.notes ?? "");
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
      await createChangelogEntry({
        title,
        body,
        notes: notes.trim() || null,
        category,
        icon: iconKey || null,
      });
      setTitle("");
      setBody("");
      setNotes("");
      setIdea("");
      setIconKey("");
      setOk("Novidade publicada.");
      setTimeout(() => setOk(null), 3000);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSendBusy(false);
    }
  }

  const canPublish = !!title.trim() && !!body.trim();
  const nextPatchIdx = String(entries.length + 1).padStart(2, "0");
  const nowDate = new Date();
  const patchPreview = `${String(nowDate.getFullYear()).slice(-2)}.${String(
    nowDate.getMonth() + 1,
  ).padStart(2, "0")}.${nextPatchIdx}`;

  return (
    <section className="space-y-4">
      {/* Editorial header — same language as /novidades */}
      <div className="flex items-center gap-3">
        <span className="h-4 w-1 rounded-sm bg-primary" />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/70">
          Publicar patch notes
        </h2>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      {/* LIVE PREVIEW — mirrors the /novidades hero */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0a0a0f]">
        <div
          aria-hidden
          className="absolute inset-0 transition-[background] duration-500"
          style={{
            background: `radial-gradient(120% 90% at 85% 0%, ${activeMeta.color}55 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, #6366f155 0%, transparent 60%), linear-gradient(180deg, #0a0a0f 0%, #050506 100%)`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "38px 38px",
            maskImage: "radial-gradient(70% 60% at 70% 30%, black, transparent)",
          }}
        />
        <div
          aria-hidden
          className="absolute -right-10 top-4 h-[220%] w-[2px] rotate-12"
          style={{
            background: `linear-gradient(180deg, transparent, ${activeMeta.color}, transparent)`,
          }}
        />

        <div className="relative px-5 pb-6 pt-6 sm:px-7">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{
                borderColor: `${activeMeta.color}66`,
                color: activeMeta.color,
                backgroundColor: `${activeMeta.color}18`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: activeMeta.color,
                  boxShadow: `0 0 8px ${activeMeta.color}`,
                }}
              />
              {activeMeta.label}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/40">
              {fmtPatchDay(nowDate.toISOString())}
            </span>
          </div>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40">
            Patch {patchPreview} · Prévia
          </p>
          <h3 className="mt-1.5 text-[22px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[26px]">
            {title.trim() || "Título da novidade"}
          </h3>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-foreground/65">
            {body.trim() || "A descrição aparece aqui — do jeitinho que vai aparecer em /novidades."}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div
              className="h-[3px] w-[80px] rounded-full"
              style={{ backgroundColor: activeMeta.color }}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/45">
              Prévia ao vivo
            </span>
          </div>
        </div>
      </div>

      {/* Category picker — editorial pills */}
      <div className="grid grid-cols-3 gap-2">
        {CHANGELOG_CATEGORIES.map(({ key, label, color, Icon }) => {
          const active = category === key;
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className="group relative flex flex-col items-start gap-1 overflow-hidden rounded-2xl border px-3 py-2.5 text-left transition"
              style={{
                backgroundColor: active ? `${color}18` : "rgba(255,255,255,0.02)",
                borderColor: active ? `${color}66` : "rgba(255,255,255,0.06)",
              }}
            >
              <span
                aria-hidden
                className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full transition"
                style={{
                  backgroundColor: color,
                  opacity: active ? 1 : 0.35,
                  boxShadow: active ? `0 0 10px ${color}88` : undefined,
                }}
              />
              <div className="flex items-center gap-1.5 pl-1.5">
                <Icon
                  className="h-3.5 w-3.5"
                  strokeWidth={2.25}
                  style={{ color }}
                />
                <span
                  className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: active ? color : "rgba(255,255,255,0.5)" }}
                >
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* AI composer */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${activeMeta.color}66, transparent)`,
          }}
        />
        <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/55">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          Prompt para IA
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="ex: refinamos o desing da aba de novidades"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-primary/60"
          />
          <button
            onClick={() => void handleGenerate()}
            disabled={genBusy || !idea.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition disabled:opacity-50"
            style={{
              borderColor: `${activeMeta.color}55`,
              color: activeMeta.color,
              backgroundColor: `${activeMeta.color}14`,
            }}
          >
            {genBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
            Gerar
          </button>
        </div>
      </div>

      {/* Manual fields */}
      <div className="space-y-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div>
          <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.22em] text-foreground/45">
            Título
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Novidades ganharam um novo visual"
            className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm outline-none transition focus:border-primary/60"
          />
        </div>
        <div>
          <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.22em] text-foreground/45">
            Resumo (aparece na listagem)
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Resumo curto — 1 a 2 frases que aparecem no card da lista."
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm leading-relaxed outline-none transition focus:border-primary/60"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-foreground/45">
              Notas completas (Riot style)
            </p>
            <span className="text-[9.5px] uppercase tracking-[0.18em] text-foreground/35">
              renderizado em "Ler notas completas"
            </span>
          </div>

          {/* Cheatsheet de sintaxe */}
          <div className="mb-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-foreground/50">
              Sintaxe
            </p>
            <ul className="mt-1.5 grid gap-1 text-[11px] leading-snug text-foreground/60 sm:grid-cols-2">
              <li>
                <code className="rounded bg-white/[0.06] px-1 py-[1px] text-foreground/80">## Título</code>{" "}
                seção
              </li>
              <li>
                <code className="rounded bg-white/[0.06] px-1 py-[1px] text-foreground/80">### Sub</code>{" "}
                subtítulo
              </li>
              <li>
                <code className="rounded bg-white/[0.06] px-1 py-[1px] text-foreground/80">- item</code>{" "}
                bullet
              </li>
              <li>
                <code className="rounded bg-white/[0.06] px-1 py-[1px] text-foreground/80">**bold**</code>{" "}
                rótulo
              </li>
              <li>
                <code className="rounded bg-white/[0.06] px-1 py-[1px] text-foreground/80">a =&gt; b</code>{" "}
                seta antigo ⇒ novo
              </li>
              <li>
                <code className="rounded bg-white/[0.06] px-1 py-[1px] text-foreground/80">[NOVO] [REMOVIDO] [BUG] [AJUSTE]</code>
              </li>
            </ul>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={RIOT_NOTES_PLACEHOLDER}
            rows={10}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed outline-none transition focus:border-primary/60"
          />
          <p className="mt-1 text-[10px] text-foreground/40">
            Se deixar em branco, o resumo acima será usado como conteúdo da página de detalhe.
          </p>

          {/* Live preview do corpo renderizado */}
          {notes.trim() && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0f]">
              <div
                className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2"
                style={{
                  background: `linear-gradient(90deg, ${activeMeta.color}18, transparent)`,
                }}
              >
                <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-foreground/60">
                  Prévia · notas completas
                </span>
                <span
                  className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: activeMeta.color }}
                >
                  {activeMeta.label}
                </span>
              </div>
              <div className="max-h-[420px] overflow-y-auto px-4 py-4">
                <RiotPatchBody text={notes} accent={activeMeta.color} compact />
              </div>
            </div>
          )}
        </div>



        {/* Icon picker */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-foreground/45">
              Ícone (opcional)
            </p>
            {iconKey && (
              <button
                onClick={() => setIconKey("")}
                className="text-[10px] uppercase tracking-[0.18em] text-foreground/45 transition hover:text-foreground"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
            {NOTIFICATION_ICONS.map(({ key, Icon, label }) => {
              const active = iconKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setIconKey(active ? "" : key)}
                  title={label}
                  aria-label={label}
                  className="flex aspect-square items-center justify-center rounded-xl border transition"
                  style={
                    active
                      ? {
                          color: activeMeta.color,
                          borderColor: `${activeMeta.color}88`,
                          backgroundColor: `${activeMeta.color}22`,
                        }
                      : {
                          borderColor: "rgba(255,255,255,0.06)",
                          backgroundColor: "rgba(255,255,255,0.02)",
                          color: "rgba(255,255,255,0.55)",
                        }
                  }
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="min-h-[16px] flex-1 text-[11px]">
            {err && <span className="text-red-400">{err}</span>}
            {ok && <span className="text-emerald-400">{ok}</span>}
          </div>
          <button
            onClick={() => void handleSend()}
            disabled={sendBusy || !canPublish}
            className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            style={{
              background: canPublish
                ? `linear-gradient(135deg, ${activeMeta.color}, #6366f1)`
                : "rgba(255,255,255,0.08)",
              boxShadow: canPublish
                ? `0 10px 30px -12px ${activeMeta.color}88`
                : undefined,
            }}
          >
            {sendBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
            Publicar patch
          </button>
        </div>
      </div>

      {/* Archive — mirrors /novidades timeline row */}
      {entries.length > 0 && (
        <div className="pt-2">
          <div className="mb-3 flex items-end justify-between border-b border-white/10 pb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/40">
                Arquivo
              </p>
              <h3 className="mt-0.5 text-[15px] font-semibold tracking-tight text-foreground">
                Publicadas
              </h3>
            </div>
            <span className="pb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/35">
              {entries.length} {entries.length === 1 ? "nota" : "notas"}
            </span>
          </div>

          <ul className="space-y-2.5">
            {entries.slice(0, 8).map((n, idx) => {
              const meta =
                CHANGELOG_CATEGORIES.find((c) => c.key === n.category) ??
                CHANGELOG_CATEGORIES[0];
              const Icon = n.icon
                ? resolveNotificationIcon(n.icon, null, n.title)
                : meta.Icon;
              const d = new Date(n.created_at);
              const patch = `${String(d.getFullYear()).slice(-2)}.${String(
                d.getMonth() + 1,
              ).padStart(2, "0")}.${String(idx + 1).padStart(2, "0")}`;
              return (
                <li
                  key={n.id}
                  className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 pl-4"
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full"
                    style={{
                      backgroundColor: meta.color,
                      opacity: 0.7,
                    }}
                  />
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
                    style={{
                      backgroundColor: `${meta.color}18`,
                      borderColor: `${meta.color}3d`,
                      color: meta.color,
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[9.5px] font-semibold tabular-nums uppercase tracking-[0.14em] text-foreground/35">
                        {patch}
                      </span>
                      <span className="text-foreground/20">•</span>
                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-foreground/35">
                        {fmtPatchDay(n.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[13px] font-semibold text-foreground">
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-foreground/55">
                      {n.body}
                    </p>
                  </div>
                  <button
                    onClick={() => void deleteChangelogEntry(n.id)}
                    className="rounded-full p-1.5 text-foreground/40 transition hover:bg-white/[0.06] hover:text-red-400"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

// ============================================================
// Arlys ✦ — conceder / definir saldo
// ============================================================

import {
  adminFetchWallets,
  adminGrantArlys,
  adminSetArlys,
  adminFetchActiveDuels,
  adminForceEndDuel,
  adminCancelDuel,
  type WalletSummary,
  type AdminDuelRow,
} from "@/lib/admin-actions";
import { loadWallet, currentProfileForWallet } from "@/lib/wallet-store";
import { Coins, Gem, Minus, Swords, X as XIcon, Trophy } from "lucide-react";

const QUICK_GRANTS = [50, 100, 250, 500, 1000];

function ArlysAdminSection() {
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<{ id: string; kind: "grant" | "set" | "remove"; amount: number } | null>(null);

  async function load() {
    const rows = await adminFetchWallets();
    setWallets(rows);
  }
  useEffect(() => {
    void load();
  }, []);

  async function refreshCurrent() {
    const cur = currentProfileForWallet();
    if (cur) await loadWallet(cur, true);
  }

  async function handleGrant(profileId: string, amount: number) {
    if (!amount) return;
    setBusy(profileId);
    try {
      await adminGrantArlys(profileId, amount);
      await load();
      await refreshCurrent();
      setFlash({ id: profileId, kind: amount > 0 ? "grant" : "remove", amount: Math.abs(amount) });
      setTimeout(() => setFlash(null), 1600);
    } finally {
      setBusy(null);
    }
  }

  async function handleSet(profileId: string) {
    const raw = customAmount[profileId];
    if (!raw) return;
    const n = Math.max(0, Math.floor(Number(raw)));
    if (!Number.isFinite(n)) return;
    setBusy(profileId);
    try {
      await adminSetArlys(profileId, n);
      await load();
      await refreshCurrent();
      setCustomAmount((m) => ({ ...m, [profileId]: "" }));
      setFlash({ id: profileId, kind: "set", amount: n });
      setTimeout(() => setFlash(null), 1600);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
          <Gem className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Arlys ✦</h2>
          <p className="text-xs text-muted-foreground">
            Conceder, remover ou definir o saldo de cada perfil
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {wallets.map((w) => {
          const profile = PROFILES.find((p) => p.id === w.profileId);
          const isFlashing = flash?.id === w.profileId;
          return (
            <li
              key={w.profileId}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{ backgroundImage: profile?.gradient ?? "linear-gradient(135deg, #333, #111)" }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{profile?.name ?? w.profileId}</p>
                    <p className="flex items-center gap-1 text-xs tabular-nums text-amber-300">
                      <Coins className="h-3 w-3" strokeWidth={2.5} />
                      {w.crystals.toLocaleString("pt-BR")} Arlys
                    </p>
                  </div>
                </div>
                {isFlashing && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      flash!.kind === "remove"
                        ? "bg-rose-500/15 text-rose-300"
                        : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {flash!.kind === "set"
                      ? `= ${flash!.amount}`
                      : flash!.kind === "remove"
                        ? `−${flash!.amount}`
                        : `+${flash!.amount}`}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {QUICK_GRANTS.map((v) => (
                  <button
                    key={v}
                    disabled={busy === w.profileId}
                    onClick={() => void handleGrant(w.profileId, v)}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.75} />
                    {v}
                  </button>
                ))}
                <button
                  disabled={busy === w.profileId || w.crystals <= 0}
                  onClick={() => void handleGrant(w.profileId, -Math.min(100, w.crystals))}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <Minus className="h-3 w-3" strokeWidth={2.75} />
                  100
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Definir saldo exato"
                  value={customAmount[w.profileId] ?? ""}
                  onChange={(e) =>
                    setCustomAmount((m) => ({ ...m, [w.profileId]: e.target.value }))
                  }
                  className="flex-1 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-sm tabular-nums outline-none placeholder:text-muted-foreground/60 focus:border-primary/40"
                />
                <button
                  disabled={busy === w.profileId || !customAmount[w.profileId]}
                  onClick={() => void handleSet(w.profileId)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
                >
                  Definir
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ============================================================
// Duelos — encerrar por WO / cancelar
// ============================================================

function DuelsAdminSection() {
  const [duels, setDuels] = useState<AdminDuelRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const rows = await adminFetchActiveDuels();
      setDuels(rows);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function endWith(duelId: string, winner: string | null, forfeit: string | null) {
    setBusy(duelId);
    try {
      await adminForceEndDuel(duelId, winner, forfeit);
      await load();
    } finally {
      setBusy(null);
    }
  }
  async function cancel(duelId: string) {
    setBusy(duelId);
    try {
      await adminCancelDuel(duelId);
      await load();
    } finally {
      setBusy(null);
    }
  }

  function nameOf(id: string) {
    return PROFILES.find((p) => p.id === id)?.name ?? id;
  }

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
            <Swords className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Duelos ativos</h2>
            <p className="text-xs text-muted-foreground">Encerrar manualmente ou cancelar</p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : duels.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhum duelo ativo no momento.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {duels.map((d) => {
            const opp = d.createdBy === "guilherme" ? "arlayne" : "guilherme";
            const expires = new Date(d.expiresAt);
            const msLeft = expires.getTime() - Date.now();
            const hoursLeft = Math.round(msLeft / 3_600_000);
            const overdue = msLeft <= 0;
            return (
              <li
                key={d.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.deckName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.weekKey} · criado por {nameOf(d.createdBy)}
                    </p>
                    <p
                      className={`mt-1 text-[11px] font-medium tabular-nums ${
                        overdue ? "text-rose-300" : "text-muted-foreground"
                      }`}
                    >
                      {overdue
                        ? `⌛ expirou há ${Math.abs(hoursLeft)}h`
                        : `expira em ${hoursLeft}h`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    ativo
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    disabled={busy === d.id}
                    onClick={() => void endWith(d.id, d.createdBy, opp)}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <Trophy className="h-3 w-3" strokeWidth={2.5} />
                    {nameOf(d.createdBy)} vence (WO)
                  </button>
                  <button
                    disabled={busy === d.id}
                    onClick={() => void endWith(d.id, opp, d.createdBy)}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <Trophy className="h-3 w-3" strokeWidth={2.5} />
                    {nameOf(opp)} vence (WO)
                  </button>
                  <button
                    disabled={busy === d.id}
                    onClick={() => void endWith(d.id, null, null)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/80 transition hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    Empate
                  </button>
                  <button
                    disabled={busy === d.id}
                    onClick={() => void cancel(d.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <XIcon className="h-3 w-3" strokeWidth={2.75} />
                    Cancelar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


// ---------------------------------------------------------------------------
// Painel de PINs — só o admin usa. Permite redefinir o PIN de qualquer perfil
// (via server fn com service role) e desvincular a sessão (força novo PIN + login).
// ---------------------------------------------------------------------------

function PinAdminSection() {
  const [metas, setMetas] = useState<ProfileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [confirmUnlinkId, setConfirmUnlinkId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const m = await listProfilesMeta();
    setMetas(m);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function setPin(id: string, v: string) {
    setPins((prev) => ({ ...prev, [id]: v.replace(/\D/g, "").slice(0, 8) }));
    setError(null);
    setNotice(null);
  }

  async function handleSetPin(profileId: string) {
    const value = pins[profileId] ?? "";
    if (!/^\d{4,8}$/.test(value)) {
      setError("Use 4 a 8 dígitos numéricos.");
      return;
    }
    setBusyId(profileId);
    setError(null);
    setNotice(null);
    try {
      await adminSetProfilePin(profileId, value);
      setNotice(`PIN de ${nameOf(profileId)} redefinido.`);
      setPins((prev) => ({ ...prev, [profileId]: "" }));
      await load();
    } catch (e) {
      setError((e as Error).message ?? "Falha ao redefinir PIN.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnlink(profileId: string) {
    setBusyId(profileId);
    setError(null);
    setNotice(null);
    try {
      await adminUnlinkProfile(profileId);
      setNotice(
        `${nameOf(profileId)} foi desvinculado. Próximo acesso pedirá novo PIN.`,
      );
      await load();
    } catch (e) {
      setError((e as Error).message ?? "Falha ao desvincular.");
    } finally {
      setBusyId(null);
      setConfirmUnlinkId(null);
    }
  }

  function nameOf(id: string) {
    return PROFILES.find((p) => p.id === id)?.name ?? id;
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-surface/40 p-5">
      <header className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            PINs de acesso
          </h2>
          <p className="text-xs text-muted-foreground">
            Redefina o PIN de qualquer perfil ou force um novo login.
          </p>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {metas.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-surface/60 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="h-9 w-14 shrink-0 rounded-lg ring-1 ring-white/10"
                  style={{
                    backgroundImage:
                      PROFILES.find((p) => p.id === m.id)?.gradient,
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {m.displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.hasPin ? "PIN definido" : "Sem PIN ainda"} ·{" "}
                    {m.isLinked ? "Vinculado" : "Não vinculado"}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="Novo PIN (4–8 dígitos)"
                  value={pins[m.id] ?? ""}
                  onChange={(e) => setPin(m.id, e.target.value)}
                  className="w-48 rounded-lg border border-white/10 bg-surface/80 px-3 py-2 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
                />
                <button
                  onClick={() => handleSetPin(m.id)}
                  disabled={busyId === m.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Redefinir
                </button>
                <button
                  onClick={() => setConfirmUnlinkId(m.id)}
                  disabled={busyId === m.id || !m.isLinked}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-40"
                  title={
                    m.isLinked
                      ? "Zerar vínculo e PIN"
                      : "Perfil já não está vinculado"
                  }
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Desvincular
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={!!confirmUnlinkId}
        onOpenChange={(o) => !o && setConfirmUnlinkId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso limpa o PIN e a sessão vinculada a{" "}
              <strong>{confirmUnlinkId && nameOf(confirmUnlinkId)}</strong>. Os
              dados (decks, arlys, streak) permanecem intactos — no próximo
              acesso será pedido um novo PIN.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmUnlinkId && void handleUnlink(confirmUnlinkId)
              }
            >
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
