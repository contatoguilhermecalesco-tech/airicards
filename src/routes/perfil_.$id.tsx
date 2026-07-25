import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Flame,
  
  Sparkles,
  Star,
  Swords,
  Trophy,
  UserRound,
  BookOpen,
  Zap,
  Crown,
  Shield,
  Palette,
  Plane,
  Briefcase,
  Plus,
  Moon,
  Sun,
  Target,
  Heart,
  Gift,
} from "lucide-react";
import { StatChip, ArlysIcon } from "@/components/StatChip";
import { PROFILES } from "@/lib/profile";
import { useProfileSnapshot } from "@/lib/profile-view";
import { listShopItems, type ShopItem } from "@/lib/shop";
import { slotOf, type CosmeticSlot } from "@/lib/wallet-store";
import { TIER_LABEL, DIVISION_ROMAN, TIER_COLORS } from "@/lib/rank-store";
import { RankEmblem } from "@/components/RankBadge";
import { ProfileActivityFeed } from "@/components/ProfileActivityFeed";
import { formatPresence } from "@/lib/presence";

export const Route = createFileRoute("/perfil_/$id")({
  head: () => ({
    meta: [
      { title: "Perfil — airi" },
      { name: "description", content: "Veja o perfil airi do outro estudante: rank, streak, bio e cosméticos equipados." },
      { property: "og:title", content: "Perfil — airi" },
      { property: "og:description", content: "Perfil compartilhado no airi." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilViewer,
});

// ---------- palette (Discord-inspired) — mirror perfil.tsx ----------
const DISCORD_PALETTE: Record<string, { gradient: string; ring: string; tag: string }> = {
  sky: { gradient: "linear-gradient(135deg,#38bdf8 0%,#0ea5e9 45%,#1e3a8a 100%)", ring: "#38bdf8", tag: "Ártico" },
  amber: { gradient: "linear-gradient(135deg,#fde68a 0%,#f59e0b 45%,#b45309 100%)", ring: "#f59e0b", tag: "Solar" },
  pink: { gradient: "linear-gradient(135deg,#fbcfe8 0%,#ec4899 40%,#831843 100%)", ring: "#f472b6", tag: "Blossom" },
  violet: { gradient: "linear-gradient(135deg,#c4b5fd 0%,#8b5cf6 40%,#4c1d95 100%)", ring: "#a78bfa", tag: "Nebulosa" },
  emerald: { gradient: "linear-gradient(135deg,#a7f3d0 0%,#10b981 40%,#065f46 100%)", ring: "#34d399", tag: "Bosque" },
  lavender: { gradient: "linear-gradient(135deg,#e0e7ff 0%,#818cf8 40%,#3730a3 100%)", ring: "#a5b4fc", tag: "Lilás" },
};

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  plane: Plane, briefcase: Briefcase, sparkles: Sparkles, crown: Crown, shield: Shield,
  zap: Zap, plus: Plus, palette: Palette, flame: Flame, moon: Moon, sun: Sun,
  book: BookOpen, swords: Swords, star: Star, target: Target, trophy: Trophy,
  heart: Heart, gift: Gift,
};

function paletteFor(accent: string) {
  return DISCORD_PALETTE[accent] ?? DISCORD_PALETTE.violet;
}
function keyOf(item: ShopItem) {
  return `${String(item.payload.slot ?? "cosmetic")}:${String(item.payload.key ?? item.id)}`;
}

function PerfilViewer() {
  const { id } = useParams({ from: "/perfil_/$id" });
  const profile = useMemo(() => PROFILES.find((p) => p.id === id) ?? null, [id]);
  const { snapshot, loading } = useProfileSnapshot(profile?.id);
  const [items, setItems] = useState<ShopItem[] | null>(null);

  useEffect(() => {
    listShopItems().then(setItems);
  }, []);

  const byKey = useMemo(() => {
    const m = new Map<string, ShopItem>();
    (items ?? []).filter((i) => i.kind === "cosmetic").forEach((i) => m.set(keyOf(i), i));
    return m;
  }, [items]);

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-white/60">Perfil não encontrado.</p>
        <Link to="/perfil" className="mt-4 inline-block text-violet-300 hover:text-violet-200">
          ← Voltar ao meu perfil
        </Link>
      </main>
    );
  }

  const equipped = snapshot?.wallet.equipped ?? {};
  const equippedItems: Partial<Record<CosmeticSlot, ShopItem>> = {};
  (Object.keys(equipped) as CosmeticSlot[]).forEach((s) => {
    const k = equipped[s];
    if (k) {
      const it = byKey.get(k);
      if (it) equippedItems[s] = it;
    }
  });

  const nameplate = equippedItems.nameplate;
  const decoration = equippedItems.decoration;
  const badge = equippedItems.badge;
  const effect = equippedItems.effect;
  const heroItem = nameplate ?? effect ?? decoration ?? badge;
  const heroPalette = heroItem ? paletteFor(heroItem.accent) : DISCORD_PALETTE.violet;
  const showBanner = !!nameplate || !!effect;
  const showDecoration = !!decoration;
  const decorationPalette = decoration ? paletteFor(decoration.accent) : heroPalette;
  const badgePalette = badge ? paletteFor(badge.accent) : heroPalette;
  const BadgeIcon = badge ? (ICONS[badge.icon] ?? Sparkles) : Sparkles;

  const initial = profile.name.charAt(0).toUpperCase();
  const handleUser = profile.name.toLowerCase().replace(/\s+/g, "");
  const handleSuffix = ".airi.com.br";
  // `rank` pode chegar como `{}` quando o perfil existe em profile_data mas
  // ainda não iniciou o ranqueado — trate como "sem rank" para não quebrar
  // a leitura de TIER_COLORS[tier].ring.
  const rawRank = snapshot?.rank;
  const rank = rawRank && rawRank.tier && (rawRank.tier in TIER_COLORS) ? rawRank : null;
  const streak = snapshot?.streak;
  const bio = snapshot?.wallet.bio?.trim();


  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-24 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/perfil"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Meu perfil
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
          Visualização
        </span>
      </div>

      {/* HERO */}
      <section className="overflow-hidden rounded-3xl border border-white/10" style={{ background: "#1e1f22" }}>
        <div
          className="relative h-28"
          style={{
            background: showBanner ? heroPalette.gradient : "linear-gradient(135deg,#2b2d31,#1e1f22)",
          }}
        >
          {effect && <div className="cosmetic-sparkle absolute inset-0 opacity-70" />}
        </div>

        <div className="relative px-5 pb-5">
          <div className="-mt-12 flex items-end justify-between">
            <div className="relative grid place-items-center" style={{ width: 88, height: 88 }}>
              {showDecoration && (
                <>
                  <span
                    className="cosmetic-ring-spin absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from 0deg, ${decorationPalette.ring}, transparent 35%, ${decorationPalette.ring} 65%, transparent 100%)`,
                    }}
                  />
                  <span className="absolute inset-[3px] rounded-full" style={{ background: "#1e1f22" }} />
                </>
              )}
              <div
                className="relative grid place-items-center overflow-hidden rounded-full text-white font-semibold ring-4"
                style={{
                  width: showDecoration ? 78 : 88,
                  height: showDecoration ? 78 : 88,
                  backgroundImage: snapshot?.wallet.avatarUrl ? undefined : profile.gradient,
                  background: snapshot?.wallet.avatarUrl ? "#000" : undefined,
                  fontSize: 34,
                  boxShadow: showDecoration ? `0 0 14px ${decorationPalette.ring}55` : "none",
                }}
              >
                {snapshot?.wallet.avatarUrl ? (
                  <img
                    src={snapshot.wallet.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  initial
                )}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold text-white">{profile.name}</h1>
              {badge && (
                <span
                  className="relative inline-flex items-center gap-1 overflow-hidden rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: badgePalette.gradient }}
                >
                  <BadgeIcon className="relative h-3 w-3" strokeWidth={2.75} />
                  <span className="relative">{badgePalette.tag.toUpperCase()}</span>
                </span>
              )}
              {(() => {
                const pres = formatPresence(snapshot?.lastSeenAt);
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      pres.online
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.04] text-white/50"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        pres.online ? "bg-emerald-400 animate-pulse" : "bg-white/40"
                      }`}
                    />
                    {loading ? "…" : pres.label}
                  </span>
                );
              })()}
            </div>
            <p className="text-[13px] leading-tight text-white/60">
              <span className="text-white/80">{handleUser}</span>
              <span className="text-white/40">{handleSuffix}</span>
            </p>

            <div className="mt-3 h-px w-full" style={{ background: "#2b2d31" }} />

            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/80">Sobre</p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-snug text-white/80">
              {loading ? "Carregando…" : bio || "Este perfil ainda não escreveu uma bio."}
            </p>

            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/80">Membro airi</p>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatChip
                label={rank ? TIER_LABEL[rank.tier] : "Sem rank"}
                value={rank && rank.division !== null ? DIVISION_ROMAN[rank.division] : ""}
                color={rank ? TIER_COLORS[rank.tier].ring : "#fbbf24"}
                accent
                render={
                  rank ? (
                    <RankEmblem tier={rank.tier} division={rank.division} size={44} />
                  ) : null
                }
              />
              <StatChip icon={ArlysIcon} label="Arlys ✦" value={(snapshot?.wallet.crystals ?? 0).toString()} color="#a78bfa" accent />
              <StatChip
                icon={Flame}
                label="Streak"
                value={streak ? `${streak.current}d` : "—"}
                color="#f87171"
              />
              <StatChip
                icon={Sparkles}
                label="Cosméticos"
                value={`${snapshot?.wallet.cosmetics.length ?? 0}`}
                color="#38bdf8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* STUDY STATS */}
      <section className="mt-5 grid grid-cols-3 gap-2">
        <MiniStat icon={BookOpen} label="Cartas" value={snapshot?.cardsTotal ?? 0} tone="#a78bfa" />
        <MiniStat icon={Star} label="Domínio" value={snapshot?.mastered ?? 0} tone="#34d399" />
        <MiniStat icon={Swords} label="Inimigas" value={snapshot?.enemies ?? 0} tone="#f87171" />
      </section>

      {/* EQUIPPED SHOWCASE */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Cosméticos equipados</p>
        <ul className="mt-3 space-y-2">
          {(["nameplate", "decoration", "badge", "effect"] as CosmeticSlot[]).map((s) => {
            const it = equippedItems[s];
            const label =
              s === "nameplate" ? "Nameplate" : s === "decoration" ? "Decoração" : s === "badge" ? "Badge" : "Efeito";
            if (!it) {
              return (
                <li key={s} className="flex items-center justify-between rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-white/50">
                  <span>{label}</span>
                  <span>Nada equipado</span>
                </li>
              );
            }
            const p = paletteFor(it.accent);
            const Icon = ICONS[it.icon] ?? Sparkles;
            return (
              <li
                key={s}
                className="flex items-center gap-3 rounded-xl p-2.5"
                style={{ background: p.gradient }}
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-black/25 text-white">
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/85">{label}</p>
                  <p className="truncate text-[13px] font-semibold text-white">{it.name}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6">
        <div className="mb-3">
          <h2 className="text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]">
            Atividade recente
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Últimos passos de {profile.name} no airi.
          </p>
        </div>
        <ProfileActivityFeed profileId={id} />
      </section>



      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
            <UserRound className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Perfil compartilhado</p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              Você está vendo o perfil airi de {profile.name}. Dados de estudo, cosméticos e bio são
              públicos entre vocês dois. Para comparar estatísticas lado a lado, veja também /social/stats.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}




function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; color?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} color={tone} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</span>
      </div>
      <p className="mt-1 text-[20px] font-semibold text-white">{value}</p>
    </div>
  );
}


// silence unused
void slotOf;
