// Prévia ao vivo dos cosméticos temáticos (streak, selo inimigo, título, splash).
// Mostra o cosmético funcionando no mesmo contexto em que ele aparece no app.
import { useEffect, useState } from "react";
import { X, Flame, Swords, Crown, Trophy, Play } from "lucide-react";
import {
  STREAK_FLAME_THEMES,
  ENEMY_SEAL_THEMES,
  TITLE_THEMES,
  VICTORY_SPLASH_THEMES,
} from "@/lib/eclipse-cosmetics";
import { StreakFlame, streakHalo } from "@/components/StreakFlame";
import { EnemySealSigil, EnemySealStamp } from "@/components/review/EnemySeal";
import { CosmeticTitle } from "@/components/profile/CosmeticTitle";
import { VictorySplash } from "@/components/duel/VictorySplash";
import { ProfileAvatar } from "@/components/ProfileAvatar";

export type PreviewSlot = "streak_flame" | "enemy_seal" | "title" | "victory_splash";

export const PREVIEWABLE_SLOTS: PreviewSlot[] = [
  "streak_flame",
  "enemy_seal",
  "title",
  "victory_splash",
];

export function hasSlotPreview(slot: string, key: string) {
  switch (slot) {
    case "streak_flame":
      return !!STREAK_FLAME_THEMES[key];
    case "enemy_seal":
      return !!ENEMY_SEAL_THEMES[key];
    case "title":
      return !!TITLE_THEMES[key];
    case "victory_splash":
      return !!VICTORY_SPLASH_THEMES[key];
    default:
      return false;
  }
}

const SLOT_INFO: Record<PreviewSlot, { label: string; hint: string; Icon: typeof Flame }> = {
  streak_flame: {
    label: "Chama de streak",
    hint: "Substitui a chama laranja padrão no card de sequência da home.",
    Icon: Flame,
  },
  enemy_seal: {
    label: "Selo das cartas inimigas",
    hint: "Aparece atrás da carta inimiga e estampa cada acerto ou erro.",
    Icon: Swords,
  },
  title: {
    label: "Título de perfil",
    hint: "Título animado exibido logo abaixo do seu nome no perfil.",
    Icon: Crown,
  },
  victory_splash: {
    label: "Splash de vitória",
    hint: "Animação em tela cheia quando você vence um duelo.",
    Icon: Trophy,
  },
};

export function CosmeticSlotPreview({
  slot,
  itemKey,
  name,
  price,
  onClose,
}: {
  slot: PreviewSlot;
  itemKey: string;
  name: string;
  price: number;
  onClose: () => void;
}) {
  const info = SLOT_INFO[slot];
  const Icon = info.Icon;
  const art = cosmeticArtByKey(itemKey);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.13_0.03_300)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white/80 transition hover:bg-black/70"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 px-5 pt-5">
          {art && (
            <span
              className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-rose-400/20"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(244,63,94,0.28), transparent 68%), linear-gradient(135deg,#1a0710,#0b0409)",
                boxShadow: "0 12px 30px -14px rgba(244,63,94,0.6)",
              }}
            >
              <img
                src={art}
                alt=""
                draggable={false}
                className="h-14 w-14 object-contain drop-shadow-[0_6px_16px_rgba(244,63,94,0.45)]"
              />
            </span>
          )}
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-300/80">
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {info.label}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">{name}</h3>
            <p className="mt-1 text-[12.5px] leading-snug text-white/55">{info.hint}</p>
          </div>
        </div>

        <div className="px-5 py-5">
          {slot === "streak_flame" && <StreakFlameDemo itemKey={itemKey} />}
          {slot === "enemy_seal" && <EnemySealDemo itemKey={itemKey} />}
          {slot === "title" && <TitleDemo itemKey={itemKey} />}
          {slot === "victory_splash" && <VictorySplashDemo itemKey={itemKey} />}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/25 px-5 py-3.5">
          <span className="text-sm font-semibold text-white">
            {price} <span className="text-[11px] font-medium text-white/45">Arlys ✦</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/[0.12]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Demos por slot ---------------- */

function DemoFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        {children}
      </div>
    </div>
  );
}

function StreakFlameDemo({ itemKey }: { itemKey: string }) {
  const theme = STREAK_FLAME_THEMES[itemKey] ?? null;
  const [streak, setStreak] = useState(12);

  return (
    <div className="space-y-3">
      <DemoFrame label="Card de sequência · home">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-6 -top-8 h-32 w-32 opacity-80"
          style={{ background: streakHalo("alive", theme) }}
        />
        <div className="relative flex items-center gap-4">
          <StreakFlame state="alive" studiedToday theme={theme} streak={streak} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight text-white">{streak}</span>
              <span className="text-[13px] text-white/55">dias seguidos</span>
            </div>
            <p className="text-[12px] text-white/40">Estudou hoje · sequência viva</p>
          </div>
        </div>
      </DemoFrame>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Intensidade da streak
          </p>
          <span className="text-[12px] font-semibold text-white/80">{streak} dias</span>
        </div>
        <input
          type="range"
          min={1}
          max={60}
          value={streak}
          onChange={(e) => setStreak(Number(e.target.value))}
          className="mt-2 w-full accent-rose-400"
        />
        <p className="mt-1 text-[11px] text-white/40">
          Arraste para ver a chama ficar mais intensa conforme os dias sobem.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["alive", "risk", "ashes"] as const).map((state) => (
          <div
            key={state}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-3"
          >
            <StreakFlame
              state={state}
              studiedToday={state === "alive"}
              theme={theme}
              streak={streak}
            />
            <span className="text-[10px] uppercase tracking-wider text-white/40">
              {state === "alive" ? "Viva" : state === "risk" ? "Em risco" : "Cinzas"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnemySealDemo({ itemKey }: { itemKey: string }) {
  const theme = ENEMY_SEAL_THEMES[itemKey];
  const [tone, setTone] = useState<"hit" | "miss" | null>(null);

  useEffect(() => {
    if (!tone) return;
    const t = setTimeout(() => setTone(null), 900);
    return () => clearTimeout(t);
  }, [tone]);

  if (!theme) return null;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-black/50 px-5 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 50%, transparent 45%, rgba(244,63,94,0.22) 100%)",
          }}
        />
        <EnemySealSigil theme={theme} />
        <div className="relative z-10 text-center">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: theme.color }}
          >
            Carta inimiga
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">to look forward to</p>
          <p className="mt-2 text-[12px] text-white/45">Digite a tradução…</p>
        </div>
        {tone && <EnemySealStamp theme={theme} tone={tone} contained />}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setTone("hit")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
        >
          <Play className="h-3.5 w-3.5" strokeWidth={2.5} /> Ver acerto
        </button>
        <button
          onClick={() => setTone("miss")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
        >
          <Play className="h-3.5 w-3.5" strokeWidth={2.5} /> Ver erro
        </button>
      </div>
    </div>
  );
}

function TitleDemo({ itemKey }: { itemKey: string }) {
  const theme = TITLE_THEMES[itemKey];
  if (!theme) return null;

  return (
    <DemoFrame label="Cabeçalho do perfil">
      <div className="flex items-center gap-3.5">
        <ProfileAvatar
          profileId="guilherme"
          initial="G"
          gradient="linear-gradient(135deg,#7f1027,#ff5a6e)"
          size={56}
        />
        <div className="min-w-0">
          <p className="text-[19px] font-semibold leading-tight text-white">Guilherme</p>
          <p className="text-[12.5px] leading-tight text-white/55">
            <span className="text-white/80">guilherme</span>
            <span className="text-white/40">.airi.com.br</span>
          </p>
          <div className="mt-1.5">
            <CosmeticTitle theme={theme} />
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

function VictorySplashDemo({ itemKey }: { itemKey: string }) {
  const theme = VICTORY_SPLASH_THEMES[itemKey];
  const [playing, setPlaying] = useState(false);
  if (!theme) return null;

  return (
    <div className="space-y-3">
      <div
        className="relative grid h-[170px] place-items-center overflow-hidden rounded-2xl border border-white/[0.07]"
        style={{
          background: `radial-gradient(80% 60% at 50% 45%, ${theme.color}33, ${theme.accent}f2 60%, #05030a 100%)`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 motion-safe:animate-[victoryRays_18000ms_linear_infinite]"
          style={{
            background: `repeating-conic-gradient(from 0deg at 50% 50%, ${theme.color}22 0deg 6deg, transparent 6deg 16deg)`,
          }}
        />
        <div className="relative text-center">
          <p
            className="text-3xl font-black tracking-[0.16em] text-white"
            style={{ textShadow: `0 0 26px ${theme.color}` }}
          >
            {theme.headline}
          </p>
          <p className="mt-1 text-[12px] text-white/60">{theme.subline}</p>
        </div>
      </div>

      <button
        onClick={() => setPlaying(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
      >
        <Play className="h-3.5 w-3.5" strokeWidth={2.5} /> Reproduzir em tela cheia
      </button>

      {playing && <VictorySplash theme={theme} onDone={() => setPlaying(false)} />}
    </div>
  );
}
