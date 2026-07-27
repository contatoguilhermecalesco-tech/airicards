import { useRef, useState } from "react";
import { ImagePlus, Loader2, Package, Pencil, Send, Trash2, Upload, X } from "lucide-react";
import { uploadConceptImage } from "@/lib/bundle-concepts-upload";
import {
  createBundleConcept,
  updateBundleConcept,
  deleteBundleConcept,
  useBundleConcepts,
  type BundleConcept,
} from "@/lib/bundle-concepts-store";
import { RiotPatchBody, RIOT_NOTES_PLACEHOLDER } from "@/lib/patch-notes";

const PALETTE_PRESETS = [
  { name: "Ametista", value: "#a855f7" },
  { name: "Céu", value: "#60a5fa" },
  { name: "Menta", value: "#34d399" },
  { name: "Âmbar", value: "#f59e0b" },
  { name: "Rosé", value: "#f472b6" },
  { name: "Coral", value: "#f87171" },
  { name: "Turquesa", value: "#22d3ee" },
];

function fmtShort(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    })
      .format(new Date(iso))
      .replace(".", "");
  } catch {
    return "";
  }
}

export function BundleConceptsSection() {
  const { items } = useBundleConcepts();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [concept, setConcept] = useState("");
  const [palette, setPalette] = useState("#a855f7");
  const [splashUrl, setSplashUrl] = useState("");
  const [shopBundleId, setShopBundleId] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileSelected(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Selecione um arquivo de imagem.");
      return;
    }
    setUploading(true);
    setErr(null);
    try {
      const url = await uploadConceptImage(file);
      setSplashUrl(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const isEditing = editingId !== null;

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setTagline("");
    setConcept("");
    setPalette("#a855f7");
    setSplashUrl("");
    setShopBundleId("");
    setErr(null);
  }

  function startEditing(entry: BundleConcept) {
    setEditingId(entry.id);
    setTitle(entry.title);
    setTagline(entry.tagline ?? "");
    setConcept(entry.concept);
    setPalette(entry.palette || "#a855f7");
    setSplashUrl(entry.splash_url ?? "");
    setShopBundleId(entry.shop_bundle_id ?? "");
    setErr(null);
    setOk(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSend() {
    if (!title.trim() || !concept.trim()) return;
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const payload = {
        title,
        tagline: tagline.trim() || null,
        concept,
        palette,
        splash_url: splashUrl.trim() || null,
        shop_bundle_id: shopBundleId.trim() || null,
      };
      if (editingId) {
        await updateBundleConcept(editingId, payload);
        setOk("Bundle atualizado.");
      } else {
        await createBundleConcept(payload);
        setOk("Bundle publicado.");
      }
      resetForm();
      setTimeout(() => setOk(null), 3000);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este concept?")) return;
    try {
      await deleteBundleConcept(id);
      if (editingId === id) resetForm();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const canPublish = !!title.trim() && !!concept.trim();

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-4 w-1 rounded-sm" style={{ backgroundColor: palette }} />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/70">
          {isEditing ? "Editando bundle concept" : "Publicar bundle concept"}
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

      {/* Live preview card */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0a0a0f]">
        <div
          aria-hidden
          className="absolute inset-0 transition-[background] duration-500"
          style={{
            background: `radial-gradient(120% 90% at 85% 0%, ${palette}55 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, #6366f155 0%, transparent 60%), linear-gradient(180deg, #0a0a0f 0%, #050506 100%)`,
          }}
        />
        {splashUrl && (
          <div
            aria-hidden
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage: `url(${splashUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.3) 60%, transparent)",
            }}
          />
        )}
        <div className="relative px-5 pb-6 pt-6 sm:px-7">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{
              borderColor: `${palette}66`,
              color: palette,
              backgroundColor: `${palette}18`,
            }}
          >
            <Package className="h-3 w-3" strokeWidth={2.5} />
            Concept
          </span>
          <h3 className="mt-4 text-[22px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[26px]">
            {title.trim() || "Título do bundle"}
          </h3>
          {tagline.trim() && (
            <p className="mt-1.5 text-[13px] italic text-foreground/70">{tagline}</p>
          )}
          <div className="mt-4 h-[3px] w-[80px] rounded-full" style={{ backgroundColor: palette }} />
        </div>
      </div>

      {/* Palette picker */}
      <div className="flex flex-wrap gap-2">
        {PALETTE_PRESETS.map((p) => {
          const active = palette.toLowerCase() === p.value.toLowerCase();
          return (
            <button
              key={p.value}
              onClick={() => setPalette(p.value)}
              className="group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] transition"
              style={{
                borderColor: active ? `${p.value}aa` : "rgba(255,255,255,0.08)",
                backgroundColor: active ? `${p.value}22` : "rgba(255,255,255,0.02)",
                color: active ? p.value : "rgba(255,255,255,0.55)",
              }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: p.value, boxShadow: active ? `0 0 8px ${p.value}` : undefined }}
              />
              {p.name}
            </button>
          );
        })}
        <input
          type="color"
          value={palette}
          onChange={(e) => setPalette(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent"
          aria-label="Cor personalizada"
        />
      </div>

      {/* Fields */}
      <div className="grid gap-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Florescer Celestial"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-foreground focus:border-primary/60 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">Tagline</span>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Uma frase de abertura curta e cinematográfica"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-foreground focus:border-primary/60 focus:outline-none"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">Splash art</span>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelected(e.target.files?.[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] font-semibold text-foreground/90 transition hover:bg-white/[0.08] disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : splashUrl ? <ImagePlus className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando…" : splashUrl ? "Trocar imagem" : "Enviar imagem"}
              </button>
              {splashUrl && (
                <button
                  type="button"
                  onClick={() => setSplashUrl("")}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-foreground/60 hover:text-foreground"
                  title="Remover imagem"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <input
              value={splashUrl}
              onChange={(e) => setSplashUrl(e.target.value)}
              placeholder="ou cole uma URL https://..."
              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-foreground/80 focus:border-primary/60 focus:outline-none"
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">ID do bundle na loja</span>
            <input
              value={shopBundleId}
              onChange={(e) => setShopBundleId(e.target.value)}
              placeholder="opcional — id do shop_item bundle"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[14px] text-foreground focus:border-primary/60 focus:outline-none"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">Concept (Riot-style)</span>
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            rows={12}
            placeholder={RIOT_NOTES_PLACEHOLDER}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-[12.5px] leading-relaxed text-foreground focus:border-primary/60 focus:outline-none"
          />
          <p className="mt-1 text-[10px] text-foreground/40">
            Suporta ## títulos, ### sub, listas com -, **negrito**, [NOVO] [AJUSTE], ⇒/=&gt;/-&gt; e --- divisor.
          </p>
        </label>
      </div>

      {/* Concept preview */}
      {concept.trim() && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/45">
            Prévia do concept
          </p>
          <RiotPatchBody text={concept} accent={palette} compact />
        </div>
      )}

      {err && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
          {err}
        </p>
      )}
      {ok && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
          {ok}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleSend}
          disabled={!canPublish || busy}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
          ) : (
            <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
          {isEditing ? "Salvar alterações" : "Publicar concept"}
        </button>
      </div>

      {/* List */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-4 w-1 rounded-sm bg-white/25" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/60">
            Concepts publicados · {items.length}
          </h3>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-[12px] text-foreground/50">
            Nenhum concept publicado ainda.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3"
              >
                <span
                  aria-hidden
                  className="mt-1 h-8 w-1 shrink-0 rounded-sm"
                  style={{ backgroundColor: it.palette || "#a855f7" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-foreground">{it.title}</p>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/35">
                      {fmtShort(it.created_at)}
                    </span>
                  </div>
                  {it.tagline && (
                    <p className="mt-0.5 line-clamp-1 text-[12px] italic text-foreground/55">
                      {it.tagline}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => startEditing(it)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-foreground/70 transition hover:bg-white/[0.08] hover:text-foreground"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                  <button
                    onClick={() => handleDelete(it.id)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-rose-400/20 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
