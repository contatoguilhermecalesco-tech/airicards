import { useState } from "react";
import { Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { createTag, deleteTag, useNotifications } from "@/lib/notifications-store";

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

export function TagsSection() {
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
