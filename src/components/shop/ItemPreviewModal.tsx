// Prévia unificada da loja — mostra o cosmético no contexto real onde ele
// aparece (perfil, mesa de revisão, home, arena, duelo) + a arte em alta,
// com compra direta a partir da prévia.
import { useEffect, useMemo, useState } from "react";
import {
  X,
  Check,
  Eye,
  Flame,
  Swords,
  Trophy,
  UserRound,
  Sparkles,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

import { getBundleContents, type ShopItem } from "@/lib/shop";
import { ArlysIcon } from "@/components/StatChip";
import { slotOf } from "@/lib/wallet-store";
import { getShopAssetOverride, getEquippedArt } from "@/lib/shop-asset-overrides";
import { cosmeticArtFor } from "@/lib/cosmetic-art";
import { RarityChip, rarityFor, RARITY_META, visualFor, DiscordAvatar } from "@/components/shop/shop-visuals";
import { getCrownArt, AvatarCrown } from "@/components/profile/AvatarCrown";
import { getCompanion } from "@/lib/companion-assets";
import { CompanionRender } from "@/components/CompanionRender";
import { tableSkinByKey } from "@/lib/table-skins";
import { TableSkinAmbient, TableSkinFlash } from "@/components/review/TableSkinAmbient";
import { TableSkinCardLayer } from "@/components/review/TableSkinCardLayer";
import { CosmeticTitle } from "@/components/profile/CosmeticTitle";
import {
  StreakFlameDemo,
  EnemySealDemo,
  VictorySplashDemo,
} from "@/components/shop/CosmeticSlotPreview";
import {
  STREAK_FLAME_THEMES,
  ENEMY_SEAL_THEMES,
  TITLE_THEMES,
  VICTORY_SPLASH_THEMES,
} from "@/lib/eclipse-cosmetics";

type TabId = "contexto" | "arte";

type Ctx = {
  id: string;
  label: string;
  hint: string;
  Icon: React.ComponentType<LucideProps>;
  node: React.ReactNode;
};

/** Slot canônico (wallet) a partir do payload do item da loja. */
function resolveSlot(item: ShopItem): string {
  const raw = String(item.payload.slot ?? "").toLowerCase();
  const key = String(item.payload.key ?? item.id);
  return slotOf(raw ? `${raw}:${key}` : key);
}

function itemKeyOf(item: ShopItem): string {
  return String(item.payload.key ?? item.id);
}

const SLOT_LABEL: Record<string, string> = {
  decoration: "Aura de avatar",
  nameplate: "Coroa / moldura",
  badge: "Badge de perfil",
  effect: "Cenário de perfil",
  overlay: "Partículas do perfil",
  veil: "Véu do perfil",
  companion: "Companheiro",
  table: "Mesa de revisão",
  streak_flame: "Chama de streak",
  enemy_seal: "Selo das cartas inimigas",
  title: "Título de perfil",
  victory_splash: "Splash de vitória",
};

const SLOT_WHERE: Record<string, string> = {
  decoration: "Aparece girando ao redor da sua foto no perfil.",
  nameplate: "Fica apoiada no topo do seu avatar no perfil.",
  badge: "Selo ao lado do seu nome no perfil.",
  effect: "Substitui o fundo do banner do seu perfil.",
  overlay: "Partículas animadas sobre o banner do perfil.",
  veil: "Camada luminosa sobre o banner do perfil.",
  companion: "Criatura animada no canto do seu perfil.",
  table: "Ambiente completo durante as sessões de revisão.",
  streak_flame: "Substitui a chama do card de sequência na home.",
  enemy_seal: "Marca as cartas inimigas na Arena a cada acerto/erro.",
  title: "Título animado abaixo do seu nome no perfil.",
  victory_splash: "Animação em tela cheia ao vencer um duelo.",
};

export function ItemPreviewModal({
  item,
  owned,
  canAfford,
  busy,
  onBuy,
  onClose,
  initialItemId,
}: {
  item: ShopItem;
  owned: boolean;
  canAfford: boolean;
  busy: boolean;
  busyLabel?: string;
  onBuy: () => void;
  onClose: () => void;
  /** Item do bundle que deve abrir selecionado no provador. */
  initialItemId?: string | null;
}) {
  // Bundles: carrega tudo que vem dentro para o usuário poder provar item por item.
  const [contents, setContents] = useState<ShopItem[]>([]);
  const [selId, setSelId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setContents([]);
    setSelId(null);
    if (item.kind !== "bundle") return;
    void getBundleContents(item).then((rows) => {
      if (!alive) return;
      const cosmetics = rows.filter((r) => r.kind === "cosmetic");
      const list = cosmetics.length ? cosmetics : rows;
      setContents(list);
      setSelId(list.find((r) => r.id === initialItemId)?.id ?? list[0]?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, [item.id, item.kind, initialItemId]);

  const active = useMemo(
    () => contents.find((c) => c.id === selId) ?? (contents[0] || item),
    [contents, selId, item],
  );

  const slot = resolveSlot(active);
  const key = itemKeyOf(active);
  const walletKey = `${slot}:${key}`;
  const rarity = rarityFor(item.price);
  const art =
    getShopAssetOverride(active.id)?.art ??
    cosmeticArtFor(active.payload as Record<string, unknown>) ??
    getEquippedArt(walletKey) ??
    null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);


  const contexts = useMemo<Ctx[]>(() => {
    const list: Ctx[] = [];

    if (slot === "table" && tableSkinByKey(walletKey)) {
      list.push({
        id: "mesa",
        label: "Mesa de revisão",
        hint: SLOT_WHERE.table,
        Icon: Layers,
        node: <TableStage walletKey={walletKey} />,
      });
    }
    if (slot === "streak_flame" && STREAK_FLAME_THEMES[key]) {
      list.push({
        id: "home",
        label: "Home",
        hint: SLOT_WHERE.streak_flame,
        Icon: Flame,
        node: <StreakFlameDemo itemKey={key} />,
      });
    }
    if (slot === "enemy_seal" && ENEMY_SEAL_THEMES[key]) {
      list.push({
        id: "arena",
        label: "Arena",
        hint: SLOT_WHERE.enemy_seal,
        Icon: Swords,
        node: <EnemySealDemo itemKey={key} />,
      });
    }
    if (slot === "victory_splash" && VICTORY_SPLASH_THEMES[key]) {
      list.push({
        id: "duelo",
        label: "Duelo",
        hint: SLOT_WHERE.victory_splash,
        Icon: Trophy,
        node: <VictorySplashDemo itemKey={key} />,
      });
    }
    // Slots que vivem no perfil (inclui título, que também tem prévia no perfil)
    if (
      ["decoration", "nameplate", "badge", "effect", "overlay", "veil", "companion", "title"].includes(
        slot,
      )
    ) {
      list.push({
        id: "perfil",
        label: "Perfil",
        hint: SLOT_WHERE[slot] ?? "Aparece no seu perfil.",
        Icon: UserRound,
        node: <ProfileStage item={active} slot={slot} itemKey={key} art={art} />,
      });
    }

    if (list.length === 0) {
      list.push({
        id: "generico",
        label: "Prévia",
        hint: "Item cosmético exclusivo.",
        Icon: Sparkles,
        node: <ProfileStage item={active} slot={slot} itemKey={key} art={art} />,
      });
    }
    return list;
  }, [slot, key, walletKey, active, art]);

  const [ctxIndex, setCtxIndex] = useState(0);
  useEffect(() => setCtxIndex(0), [active.id]);
  const ctx = contexts[Math.min(ctxIndex, contexts.length - 1)];

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/85 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[28px] border ${rarity && RARITY_META[rarity].border} bg-[oklch(0.13_0.025_300)] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)] sm:rounded-[28px]`}
      >
        {/* grabber mobile */}
        <span
          aria-hidden
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden"
        />

        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-30 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/55 text-white/85 backdrop-blur transition hover:bg-black/75"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pb-3 pt-4">
          {art && (
            <span
              className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10"
              style={{ background: RARITY_META[rarity].gradient }}
            >
              <img
                src={art}
                alt=""
                draggable={false}
                className="h-12 w-12 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
              />
            </span>
          )}
          <div className="min-w-0 flex-1 pr-8">
            <div className="flex flex-wrap items-center gap-1.5">
              <RarityChip rarity={rarity} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {SLOT_LABEL[slot] ?? "Cosmético"}
              </span>
            </div>
            <h3 className="mt-1 truncate text-[19px] font-semibold tracking-tight text-white">
              {active.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-white/50">
              {contents.length > 0
                ? `${item.name} · item ${contents.findIndex((c) => c.id === active.id) + 1} de ${contents.length}`
                : active.description || SLOT_WHERE[slot] || "Item cosmético."}
            </p>
          </div>
        </div>

        {/* Rail de itens do bundle — prova item por item */}
        {contents.length > 1 && (
          <div className="shrink-0 px-5 pb-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
              Todos os itens ({contents.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {contents.map((c) => {
                const cSlot = resolveSlot(c);
                const cArt =
                  getShopAssetOverride(c.id)?.art ??
                  cosmeticArtFor(c.payload as Record<string, unknown>) ??
                  getEquippedArt(`${cSlot}:${itemKeyOf(c)}`) ??
                  null;
                const on = c.id === active.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelId(c.id)}
                    title={c.name}
                    className={`group relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border transition ${
                      on
                        ? "border-violet-300/70 bg-white/[0.12] shadow-[0_0_0_2px_rgba(196,181,253,0.25)]"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.09]"
                    }`}
                  >
                    {cArt ? (
                      <img src={cArt} alt="" draggable={false} className="h-12 w-12 object-contain" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-white/70" strokeWidth={2.5} />
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-1 py-[2px] text-[8px] font-semibold uppercase tracking-wide text-white/70">
                      {(SLOT_LABEL[cSlot] ?? "Item").split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {contexts.map((c, i) => {
            const active2 = tab === "contexto" && i === ctxIndex;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setTab("contexto");
                  setCtxIndex(i);
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition ${
                  active2
                    ? "border-white/25 bg-white/[0.14] text-white"
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
                }`}
              >
                <c.Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {c.label}
              </button>
            );
          })}
          {art && (
            <button
              onClick={() => setTab("arte")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition ${
                tab === "arte"
                  ? "border-white/25 bg-white/[0.14] text-white"
                  : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              Arte
            </button>
          )}
        </div>

        {/* Stage */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {tab === "arte" && art ? (
            <div
              className="grid place-items-center overflow-hidden rounded-2xl border border-white/[0.07] p-6"
              style={{ background: RARITY_META[rarity].gradient }}
            >
              <img
                src={art}
                alt={active.name}
                draggable={false}
                className="max-h-[260px] w-auto object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.6)]"
              />
            </div>
          ) : (
            <>
              <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] text-white/40">
                <Eye className="h-3 w-3" strokeWidth={2.5} />
                {ctx.hint}
              </p>
              {ctx.node}
              {active.description && (
                <p className="mt-3 text-[12px] leading-snug text-white/45">{active.description}</p>
              )}
            </>
          )}
        </div>


        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] bg-black/35 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-white">
            <ArlysIcon className="h-4 w-4 text-violet-300" strokeWidth={2.25} />
            {item.price}
            <span className="text-[11px] font-medium text-white/45">Arlys ✦</span>
          </span>
          <button
            onClick={owned ? onClose : onBuy}
            disabled={busy || (!owned && !canAfford)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition disabled:opacity-40 ${
              owned
                ? "border border-white/12 bg-white/[0.06] text-white/85"
                : "bg-primary text-primary-foreground hover:opacity-95"
            }`}
          >
            {busy ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-pulse" strokeWidth={2.5} />…
              </>
            ) : owned ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                Você já tem
              </>
            ) : canAfford ? (
              "Comprar agora"
            ) : (
              "Arlys insuficiente"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Palco: mesa de revisão ---------------- */

function TableStage({ walletKey }: { walletKey: string }) {
  const skin = tableSkinByKey(walletKey);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [flash]);

  if (!skin) return null;

  return (
    <div className="space-y-3">
      <div className="relative h-[300px] overflow-hidden rounded-2xl border border-white/[0.07]">
        <div className="absolute inset-0">
          <TableSkinAmbient skin={skin} />
        </div>
        <div className="relative z-10 flex h-full items-center justify-center px-5">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[26px] border border-white/10 p-7 text-center">
            <TableSkinCardLayer skin={skin} />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                Prévia
              </p>
              <p className="mt-3 text-lg font-semibold leading-snug text-white">
                it must've felt like a knife in your heart
              </p>
              <p className="mt-3 text-[12.5px] text-white/55">Digite a tradução…</p>
            </div>
          </div>
        </div>
        {flash && <TableSkinFlash skin={skin} tone={flash} />}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setFlash("hit")}
          className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
        >
          Simular acerto
        </button>
        <button
          onClick={() => setFlash("miss")}
          className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
        >
          Simular erro
        </button>
      </div>
    </div>
  );
}

/* ---------------- Palco: perfil ---------------- */

function ProfileStage({
  item,
  slot,
  itemKey,
  art,
}: {
  item: ShopItem;
  slot: string;
  itemKey: string;
  art: string | null;
}) {
  const v = visualFor(item);
  const crown = slot === "nameplate" ? getCrownArt(`nameplate:${itemKey}`) : undefined;
  const companion = slot === "companion" ? getCompanion(itemKey) : null;
  const title = slot === "title" ? (TITLE_THEMES[itemKey] ?? null) : null;

  const bannerArt = slot === "effect" ? art : null;
  const veilArt = slot === "veil" ? art : null;
  const overlayArt = slot === "overlay" ? art : null;
  const auraArt = slot === "decoration" ? art : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/40" style={{ background: "#232428" }}>
      {/* Banner */}
      <div
        className="relative h-[132px] w-full overflow-hidden cosmetic-banner-animated"
        style={{
          background: bannerArt ? "#0b0616" : v.gradient,
        }}
      >
        {bannerArt && (
          <img src={bannerArt} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        )}
        {veilArt && (
          <img
            src={veilArt}
            alt=""
            aria-hidden
            className="cosmetic-veil-float pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen"
          />
        )}
        {overlayArt && (
          <img
            src={overlayArt}
            alt=""
            aria-hidden
            className="cosmetic-veil-float pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
          />
        )}
        <span
          aria-hidden
          className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
          }}
        />
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.12) 60%, transparent)",
          }}
        />
      </div>

      {/* Avatar + companion */}
      <div className="relative px-4">
        <div
          className={`absolute -top-[46px] left-4 rounded-full ${
            slot === "decoration" ? "cosmetic-avatar-float" : ""
          }`}
          style={{ padding: 5, background: "#232428" }}
        >
          {auraArt && (
            <img
              src={auraArt}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -inset-5 h-[calc(100%+2.5rem)] w-[calc(100%+2.5rem)] max-w-none object-contain opacity-90 mix-blend-screen"
              style={{ animation: "spin 24s linear infinite" }}
            />
          )}
          <DiscordAvatar
            size={88}
            ring={v.ring}
            showDecoration={slot === "decoration"}
            auraKey={slot === "decoration" ? itemKey : undefined}
          />
          {crown && <AvatarCrown crown={crown} size={88} />}
        </div>

        {companion && (
          <div className="pointer-events-none absolute -top-[42px] right-3 z-10 h-[84px] w-[84px]" aria-hidden>
            <div
              className="companion-glow absolute inset-0 rounded-full blur-2xl"
              style={{ background: `radial-gradient(circle, ${companion.glow}80, transparent 70%)` }}
            />
            <div className="companion-hop absolute inset-0">
              <CompanionRender companion={companion} />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-12">
        <div className="rounded-xl p-3.5" style={{ background: "#111214" }}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[17px] font-bold leading-tight text-white">Guilherme</p>
            {slot === "badge" && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ background: v.gradient }}
              >
                {item.name}
              </span>
            )}
          </div>
          <p className="text-[12.5px] leading-tight text-white/55">
            <span className="text-white/80">guilherme</span>
            <span className="text-white/40">.airi.com.br</span>
          </p>
          {title && (
            <div className="mt-2">
              <CosmeticTitle theme={title} />
            </div>
          )}
          <div className="mt-3 h-px w-full" style={{ background: "#2b2d31" }} />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-white/55">
            Equipado nesta prévia
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md"
              style={{ background: v.gradient }}
            >
              {art ? (
                <img src={art} alt="" className="h-7 w-7 object-contain" />
              ) : (
                <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">{item.name}</p>
              <p className="truncate text-[11px] text-white/50">{SLOT_LABEL[slot] ?? "Cosmético"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
