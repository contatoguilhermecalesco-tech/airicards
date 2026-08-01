import { useState } from "react";
import { Loader2, Pencil, Send, Sparkles, Trash2, Wand2, Wrench, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  createChangelogEntry,
  updateChangelogEntry,
  deleteChangelogEntry,
  useChangelog,
  type ChangelogCategory,
  type ChangelogEntry,
} from "@/lib/changelog-store";
import { generateChangelogEntry } from "@/lib/changelog-ai.functions";
import { RiotPatchBody, RIOT_NOTES_PLACEHOLDER } from "@/lib/patch-notes";
import { NOTIFICATION_ICONS, resolveNotificationIcon, type NotificationIconKey } from "@/lib/notification-icons";

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

export function ChangelogSection() {
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const isEditing = editingId !== null;

  function resetForm() {
    setTitle("");
    setBody("");
    setNotes("");
    setIdea("");
    setIconKey("");
    setEditingId(null);
    setErr(null);
  }

  function startEditing(entry: ChangelogEntry) {
    setEditingId(entry.id);
    setTitle(entry.title);
    setBody(entry.body);
    setNotes(entry.notes ?? "");
    setCategory(entry.category);
    setIconKey((entry.icon as NotificationIconKey | null) ?? "");
    setIdea("");
    setErr(null);
    setOk(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

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
      if (editingId) {
        await updateChangelogEntry(editingId, {
          title,
          body,
          notes: notes.trim() || null,
          category,
          icon: iconKey || null,
        });
        resetForm();
        setOk("Patch atualizado.");
      } else {
        await createChangelogEntry({
          title,
          body,
          notes: notes.trim() || null,
          category,
          icon: iconKey || null,
        });
        resetForm();
        setOk("Novidade publicada.");
      }
      setTimeout(() => setOk(null), 2000);
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
      <div className="flex items-center gap-3">
        <span
          className="h-4 w-1 rounded-sm"
          style={{ backgroundColor: isEditing ? activeMeta.color : undefined }}
        />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/70">
          {isEditing ? "Editando patch" : "Publicar patch notes"}
        </h2>
        <div className="h-px flex-1 bg-white/[0.06]" />
        {isEditing && (
          <button
            onClick={resetForm}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.2em] text-foreground/60 transition hover:bg-white/[0.08] hover:text-foreground"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
            Cancelar
          </button>
        )}
      </div>

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
            ) : isEditing ? (
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
            {isEditing ? "Salvar edição" : "Publicar patch"}
          </button>
        </div>
      </div>

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
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => startEditing(n)}
                      className="rounded-full p-1.5 text-foreground/40 transition hover:bg-white/[0.06] hover:text-primary"
                      aria-label="Editar"
                      style={
                        editingId === n.id
                          ? { color: meta.color, backgroundColor: `${meta.color}1a` }
                          : undefined
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                    <button
                      onClick={() => {
                        if (editingId === n.id) resetForm();
                        void deleteChangelogEntry(n.id);
                      }}
                      className="rounded-full p-1.5 text-foreground/40 transition hover:bg-white/[0.06] hover:text-red-400"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
