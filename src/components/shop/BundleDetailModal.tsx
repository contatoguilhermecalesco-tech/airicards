// Bundle detail modal — Valorant/LoL-style. Lists everything inside a bundle,
// shows individual total, savings and lets the user buy the whole set at once.
import { useEffect, useState } from "react";
import { Check, Loader2, Share2, Sparkles, X } from "lucide-react";
import { ArlysIcon } from "@/components/StatChip";
import { SakuraPetals } from "@/components/SakuraPetals";
import {
  ICONS,
  MiniProfileCard,
  RARITY_META,
  RarityChip,
  rarityFor,
} from "@/components/shop/shop-visuals";
import { getBundleContents, type ShopItem } from "@/lib/shop";
import { getShopAssetOverride } from "@/lib/shop-asset-overrides";

export function BundleDetailModal({
  bundle,
  wallet,
  ownedIds,
  onClose,
  onBuy,
  busy,
  splashUrl,
  artUrl,
}: {
  bundle: ShopItem;
  wallet: number;
  ownedIds: Set<string>;
  onClose: () => void;
  onBuy: () => void;
  busy: boolean;
  splashUrl?: string | null;
  artUrl?: string | null;
}) {
  const [contents, setContents] = useState<ShopItem[] | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const rarity = RARITY_META[rarityFor(bundle.price)];
  const Icon = ICONS[bundle.icon] ?? Sparkles;

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/b/${bundle.id}` : `/b/${bundle.id}`;
  const shareText = `Olha esse bundle da airi: ${bundle.name} ✦\n${shareUrl}`;

  const onShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `airi — ${bundle.name}`, text: shareText, url: shareUrl });
        return;
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 1800);
    } catch {
      /* ignore */
    }
  };

  const onShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    let alive = true;
    void getBundleContents(bundle).then((r) => {
      if (alive) {
        setContents(r);
        setEnabled(Object.fromEntries(r.map((c) => [c.id, true])));
      }
    });
    return () => {
      alive = false;
    };
  }, [bundle.id]);

  const toggleItem = (id: string) =>
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  const separately = (contents ?? []).reduce((sum, c) => sum + (c.price ?? 0), 0);
  const savings = Math.max(0, separately - bundle.price);
  const savingsPct = separately > 0 ? Math.round((savings / separately) * 100) : 0;
  const allOwned =
    contents !== null &&
    contents.length > 0 &&
    contents.every(
      (c) =>
        c.kind !== "cosmetic" || // powerups always "buyable"
        ownedIds.has(c.id),
    );
  const canAfford = wallet >= bundle.price;

  return (
    <div
      className="fixed inset-0 z-[130] overflow-y-auto bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] shadow-2xl"
        >
          {/* Hero header */}
          <div className="relative isolate overflow-hidden">
            {splashUrl ? (
              <img
                src={splashUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 -z-10 h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{ background: rarity.gradient }}
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
              }}
            />
            {bundle.id === "bundle.florescer_celestial" && (
              <SakuraPetals density="epic" seed={11} withHalo />
            )}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition hover:bg-black/60"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            <div className="flex flex-col gap-4 p-5 pr-14 sm:flex-row sm:items-center sm:gap-6 sm:p-8 sm:pr-8">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <RarityChip rarity={rarityFor(bundle.price)} size="md" />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                    Bundle · {contents?.length ?? "…"} itens
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-3xl">
                  {bundle.name}
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/75">
                  {bundle.description || "Coleção especial airi."}
                </p>
              </div>

              {/* Bundle art / icon */}
              <div className="relative shrink-0">
                {artUrl ? (
                  <div
                    className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border border-white/25 bg-black/40 backdrop-blur sm:h-28 sm:w-28"
                    style={{ boxShadow: `0 20px 50px -20px ${rarity.glow}` }}
                  >
                    <img src={artUrl} alt="" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <span
                    className="grid h-24 w-24 place-items-center rounded-2xl border border-white/25 bg-black/30 text-white shadow-xl backdrop-blur sm:h-28 sm:w-28"
                    style={{ background: rarity.gradient }}
                  >
                    <Icon className="h-10 w-10" strokeWidth={2.25} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live profile preview */}
          {contents && contents.length > 0 && (
            <div className="px-4 pt-4 sm:px-6">
              <BundlePreview contents={contents} bundleId={bundle.id} enabled={enabled} />
            </div>
          )}

          {/* Contents grid */}
          <div className="max-h-[52vh] overflow-y-auto px-4 pb-4 sm:px-6">
            <div className="mb-3 mt-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Itens neste bundle
              </h3>
              {contents && contents.length > 0 && (
                <p className="text-[11px] font-medium text-muted-foreground">
                  Toque para ativar/desativar no preview
                </p>
              )}
            </div>

            {contents === null ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" strokeWidth={2.5} />
              </div>
            ) : contents.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.02] py-6 text-center text-xs text-foreground/50">
                Nenhum item configurado neste bundle ainda.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {contents.map((c) => (
                  <BundleItemRow
                    key={c.id}
                    item={c}
                    owned={ownedIds.has(c.id)}
                    active={enabled[c.id] ?? true}
                    onToggle={() => toggleItem(c.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Footer — pricing + buy */}
          <div className="border-t border-white/[0.06] bg-black/25 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div className="min-w-0">
                {separately > 0 && savings > 0 && (
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-300/90">
                    Economize {savings} ✦ ({savingsPct}%)
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="inline-flex items-center gap-1.5 text-2xl font-bold text-foreground">
                    <ArlysIcon className="h-5 w-5 text-violet-300" strokeWidth={2.5} />
                    <span className="tabular-nums">{bundle.price}</span>
                    <span className="text-sm font-medium text-muted-foreground">✦</span>
                  </span>
                  {separately > 0 && separately !== bundle.price && (
                    <span className="text-[12px] font-medium text-muted-foreground line-through tabular-nums">
                      {separately} ✦
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Seu saldo: <span className="tabular-nums">{wallet} ✦</span>
                </p>
              </div>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button
                  onClick={onClose}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-white/[0.08]"
                >
                  Voltar
                </button>
                <button
                  onClick={onBuy}
                  disabled={busy || allOwned || !canAfford || (contents?.length ?? 0) === 0}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-5"
                >
                  {busy ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" strokeWidth={2.5} />
                      <span className="truncate">Processando…</span>
                    </>
                  ) : allOwned ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2.75} />
                      <span className="truncate">Tudo adquirido</span>
                    </>
                  ) : !canAfford ? (
                    <span className="truncate">Arlys insuficientes</span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                      <span className="truncate">Comprar bundle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BundleItemRow({
  item,
  owned,
  active,
  onToggle,
}: {
  item: ShopItem;
  owned: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  const rarity = RARITY_META[rarityFor(item.price)];
  const Icon = ICONS[item.icon] ?? Sparkles;
  const override = getShopAssetOverride(item.id);
  return (
    <li
      className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border ${rarity.border} bg-white/[0.02] p-2.5 transition ${active ? "opacity-100" : "opacity-55"}`}
    >
      {override?.art ? (
        <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl">
          <img
            src={override.art}
            alt=""
            aria-hidden
            className="h-full w-full object-contain"
          />
        </span>
      ) : (
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg"
          style={{ background: rarity.gradient, boxShadow: `0 8px 22px -12px ${rarity.glow}` }}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <RarityChip rarity={rarityFor(item.price)} />
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {kindLabel(item.kind)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-foreground">
          {item.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <ArlysIcon className="h-3 w-3 text-violet-300" strokeWidth={2.5} />
            {item.price} ✦
          </span>
          {owned && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-200">
              <Check className="h-2.5 w-2.5" strokeWidth={2.75} />
              Já tem
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        aria-label={active ? "Ocultar do preview" : "Mostrar no preview"}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
          active
            ? "border-violet-300/50 bg-gradient-to-r from-violet-500 to-fuchsia-500"
            : "border-white/15 bg-white/10"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
            active ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </li>
  );
}

function kindLabel(k: string): string {
  switch (k) {
    case "pack":
      return "Pack";
    case "cosmetic":
      return "Cosmético";
    case "powerup":
      return "Power-up";
    case "bundle":
      return "Bundle";
    default:
      return k;
  }
}

/* ---------------------- Live profile preview ---------------------- */

type SlotName = "nameplate" | "decoration" | "effect" | "overlay" | "veil" | "companion" | "badge";

function slotOf(item: ShopItem): SlotName | null {
  const raw = String((item.payload as { slot?: string })?.slot ?? "").toLowerCase();
  if (raw === "nameplate" || raw === "frame" || raw === "moldura") return "nameplate";
  if (raw === "decoration" || raw === "aura") return "decoration";
  if (raw === "effect" || raw === "background" || raw === "banner" || raw === "capa") return "effect";
  if (raw === "overlay") return "overlay";
  if (raw === "veil" || raw === "veu") return "veil";
  if (raw === "companion" || raw === "pet") return "companion";
  if (raw === "badge" || raw === "emblem") return "badge";
  // Fallback by id
  const id = item.id.toLowerCase();
  if (id.includes(".aura.")) return "decoration";
  if (id.includes(".frame.")) return "nameplate";
  if (id.includes(".effect.")) return "effect";
  if (id.includes(".overlay.") || id.includes("sakura")) return "overlay";
  if (id.includes(".veil.") || id.includes("veu")) return "veil";
  if (id.includes(".companion.") || id.includes("kitsune")) return "companion";
  if (id.includes(".badge.") || id.includes(".emblem.")) return "badge";
  return null;
}

function BundlePreview({
  contents,
  bundleId,
  enabled,
}: {
  contents: ShopItem[];
  bundleId: string;
  enabled: Record<string, boolean>;
}) {
  const bySlot = new Map<SlotName, ShopItem>();
  for (const c of contents) {
    if (!(enabled[c.id] ?? true)) continue;
    const s = slotOf(c);
    if (s && !bySlot.has(s)) bySlot.set(s, c);
  }

  const artOf = (s: SlotName) => {
    const it = bySlot.get(s);
    if (!it) return null;
    return getShopAssetOverride(it.id)?.art ?? null;
  };

  const effectArt = artOf("effect");
  const overlayArt = artOf("overlay");
  const auraArt = artOf("decoration");
  const frameArt = artOf("nameplate");
  const veilArt = artOf("veil");
  const companionArt = artOf("companion");
  const hasSakuraKeyword =
    (bundleId.includes("florescer") || bySlot.get("overlay")?.id.includes("sakura")) &&
    // only show falling sakura when the overlay slot is actually equipped
    (bySlot.has("overlay") || bySlot.has("effect"));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">
          <Sparkles className="h-3 w-3" strokeWidth={2.75} />
          Preview no perfil
        </p>
        <p className="text-[10px] font-medium text-muted-foreground">
          {bySlot.size} de {contents.length} ativos
        </p>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {/* Banner / capa */}
        <div className="relative h-32 w-full overflow-hidden sm:h-36">
          {effectArt ? (
            <img src={effectArt} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(135deg,#3b0764,#831843)" }} />
          )}
          {overlayArt && (
            <img src={overlayArt} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover mix-blend-screen opacity-90" />
          )}
          {!overlayArt && hasSakuraKeyword && (
            <SakuraPetals density="light" seed={5} />
          )}
          {veilArt && (
            <img src={veilArt} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen" />
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </div>

        {/* Card body — centered avatar + name stacked */}
        <div className="relative flex flex-col items-center px-4 pb-5 pt-0 text-center">
          <div className="relative -mt-12 h-20 w-20">
            {/* Aura glow (behind everything) */}
            {auraArt && (
              <>
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl opacity-60"
                  style={{ background: "radial-gradient(circle, rgba(192,132,252,0.55), transparent 65%)" }}
                />
                <img
                  src={auraArt}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[210%] w-[210%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_0_18px_rgba(192,132,252,0.55)]"
                  style={{ animation: "spin 24s linear infinite" }}
                />
              </>
            )}
            {/* Avatar */}
            <div className="relative mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-white/25 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-bold text-white shadow-xl">
              G
            </div>
            {/* Frame overlay */}
            {frameArt && (
              <img
                src={frameArt}
                alt=""
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[170%] w-[170%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_6px_20px_rgba(192,132,252,0.45)]"
              />
            )}
            {/* Companion */}
            {companionArt && (
              <img
                src={companionArt}
                alt=""
                aria-hidden
                className="pointer-events-none absolute -right-5 -bottom-1 h-11 w-11 object-contain drop-shadow-[0_0_10px_rgba(192,132,252,0.7)]"
              />
            )}
          </div>
          <p className="mt-3 text-sm font-bold text-white">Guilherme</p>
          <p className="text-[11px] text-white/60">
            <span className="text-white/80">guilherme</span>
            <span className="text-white/40">.airi.com.br</span>
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-violet-200/80">
            {bySlot.size} de {contents.length} slots equipados
          </p>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
        Ative ou desative cada item abaixo para simular seu perfil.
      </p>
    </div>
  );
}
