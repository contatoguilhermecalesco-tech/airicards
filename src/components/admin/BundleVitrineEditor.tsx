// Editor modal for a bundle's vitrine (featured slot) presentation.
// Uploads splash/art, edits tagline, description override, rarity, dates.
import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { RARITY_META, type Rarity } from "@/components/shop/shop-visuals";
import {
  updateFeaturedSlot,
  uploadSlotAsset,
  type FeaturedSlotRow,
} from "@/lib/featured-slots";

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];

export function BundleVitrineEditor({
  slot,
  bundleName,
  onClose,
  onSaved,
}: {
  slot: FeaturedSlotRow;
  bundleName: string;
  onClose: () => void;
  onSaved: (row: FeaturedSlotRow) => void;
}) {
  const [tagline, setTagline] = useState(slot.tagline ?? "");
  const [desc, setDesc] = useState(slot.description_override ?? "");
  const [rarity, setRarity] = useState<Rarity | "">(slot.rarity_override ?? "");
  const [startsAt, setStartsAt] = useState(slot.starts_at ? toLocalInput(slot.starts_at) : "");
  const [endsAt, setEndsAt] = useState(slot.ends_at ? toLocalInput(slot.ends_at) : "");
  const [splashUrl, setSplashUrl] = useState(slot.splash_url);
  const [artUrl, setArtUrl] = useState(slot.art_url);
  const [uploading, setUploading] = useState<"splash" | "art" | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(variant: "splash" | "art", file: File) {
    setUploading(variant);
    setErr(null);
    try {
      const url = await uploadSlotAsset(slot.id, variant, file);
      if (variant === "splash") setSplashUrl(url);
      else setArtUrl(url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const updated = await updateFeaturedSlot(slot.id, {
        tagline: tagline.trim() || null,
        description_override: desc.trim() || null,
        rarity_override: rarity || null,
        splash_url: splashUrl,
        art_url: artUrl,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      });
      onSaved(updated);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[140] overflow-y-auto bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] p-4 shadow-2xl sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold">Vitrine · {bundleName}</h3>
              <p className="mt-0.5 text-[11px] text-foreground/50">
                Este é o bundle exibido no herói da Loja.
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.1]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-4">
            <UploadField
              label="Splash art (2400 × 1200)"
              hint="Fundo do banner. JPG/PNG até ~800KB. Zona segura de texto: 40% esquerdo."
              previewUrl={splashUrl}
              aspect="2 / 1"
              busy={uploading === "splash"}
              onFile={(f) => void upload("splash", f)}
              onClear={() => setSplashUrl(null)}
            />

            <UploadField
              label="Art do item (1024 × 1024) — opcional"
              hint="PNG transparente do item/personagem no lado direito."
              previewUrl={artUrl}
              aspect="1 / 1"
              busy={uploading === "art"}
              onFile={(f) => void upload("art", f)}
              onClear={() => setArtUrl(null)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                  Tagline
                </span>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={40}
                  placeholder="NOVO · EDIÇÃO LIMITADA · VOLTOU"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                  Raridade (override)
                </span>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value as Rarity | "")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">Automática (pelo preço)</option>
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {RARITY_META[r].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                Descrição (override)
              </span>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                maxLength={240}
                placeholder="Deixe vazio para usar a descrição original do bundle."
                className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                  Início (opcional)
                </span>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                  Fim (opcional)
                </span>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>

            {err && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-200">
                {err}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                onClick={() => void save()}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />}
                Salvar vitrine
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadField({
  label,
  hint,
  previewUrl,
  aspect,
  busy,
  onFile,
  onClear,
}: {
  label: string;
  hint: string;
  previewUrl: string | null;
  aspect: string;
  busy: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const id = `bvu-${label.replace(/\W+/g, "-")}`;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
          {label}
        </span>
        {previewUrl && (
          <button
            onClick={onClear}
            className="text-[10.5px] font-semibold text-red-300 hover:text-red-200"
          >
            remover
          </button>
        )}
      </div>
      <label
        htmlFor={id}
        className="relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.02] transition hover:border-primary/50 hover:bg-white/[0.04]"
        style={{ aspectRatio: aspect }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center gap-1 text-foreground/50">
            <Upload className="h-5 w-5" strokeWidth={2} />
            <span className="text-[11px]">Escolher imagem</span>
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={2.5} />
          </span>
        )}
        <input
          id={id}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.currentTarget.value = "";
          }}
          className="hidden"
        />
      </label>
      <p className="mt-1 text-[10.5px] text-foreground/45">{hint}</p>
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
