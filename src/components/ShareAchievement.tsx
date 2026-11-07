import { useEffect, useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import {
  TIER_COLORS,
  TIER_LABEL,
  DIVISION_ROMAN,
  isElite,
  type RankState,
} from "@/lib/rank-store";
import type { Profile } from "@/lib/profile";
import type { Streak } from "@/lib/flashcards-store";
import airiRankImg from "@/assets/airi-emotes/airi-rank-flex.png";

let airiImgPromise: Promise<HTMLImageElement | null> | null = null;
function loadAiri(): Promise<HTMLImageElement | null> {
  if (!airiImgPromise) {
    airiImgPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = airiRankImg;
    });
  }
  return airiImgPromise;
}

type Props = {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  rank: RankState;
  streak: Streak;
  cardsMastered: number;
  totalCards: number;
};

/**
 * Card compartilhável 1080x1920 (formato stories).
 * Renderizado em Canvas puro — sem dependências externas, sem risco SSR.
 * Ação: Web Share API no mobile, download PNG como fallback.
 */
export function ShareAchievement({
  open,
  onClose,
  profile,
  rank,
  streak,
  cardsMastered,
  totalCards,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true;
    drawShareCard(canvas, { profile, rank, streak, cardsMastered, totalCards, airi: null });
    loadAiri().then((airi) => {
      if (alive && airi) drawShareCard(canvas, { profile, rank, streak, cardsMastered, totalCards, airi });
    });
    return () => { alive = false; };
  }, [open, profile, rank, streak, cardsMastered, totalCards]);

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png", 0.92),
      );
      if (!blob) throw new Error("no blob");
      const file = new File([blob], `airi-rank-${profile.id}.png`, { type: "image/png" });
      // Try Web Share API with file (mobile-first)
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Meu progresso no airi",
          text: `${profile.name} — ${tierText(rank)} · ${rank.lp} LP · ${streak.current} dias de streak`,
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `airi-rank-${profile.id}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* usuário cancelou ou API falhou — ignorar silenciosamente */
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Compartilhar conquista"
    >
      <div className="glass-panel relative w-full max-w-md rounded-t-3xl border-t border-white/10 p-5 pb-7 sm:rounded-3xl sm:border sm:pb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Compartilhar conquista</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.1] hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Uma imagem no formato stories pronta pra postar.
        </p>

        {/* Preview do canvas — reduzido */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <canvas
            ref={canvasRef}
            width={1080}
            height={1920}
            className="block h-auto w-full"
            aria-label="Prévia da imagem compartilhável"
          />
        </div>

        <button
          onClick={handleShare}
          disabled={busy}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-50"
        >
          {typeof navigator !== "undefined" &&
          (navigator as Navigator & { canShare?: unknown }).canShare ? (
            <>
              <Share2 className="h-4 w-4" strokeWidth={2.5} />
              Compartilhar
            </>
          ) : (
            <>
              <Download className="h-4 w-4" strokeWidth={2.5} />
              Baixar imagem
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function tierText(rank: RankState): string {
  return isElite(rank.tier)
    ? TIER_LABEL[rank.tier]
    : `${TIER_LABEL[rank.tier]} ${DIVISION_ROMAN[rank.division as 1 | 2 | 3 | 4]}`;
}

function drawShareCard(
  canvas: HTMLCanvasElement,
  data: {
    profile: Profile;
    rank: RankState;
    streak: Streak;
    cardsMastered: number;
    totalCards: number;
    airi: HTMLImageElement | null;
  },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const colors = TIER_COLORS[data.rank.tier];

  // Base: gradiente vertical roxo profundo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1a1224");
  bg.addColorStop(0.55, "#0f0a17");
  bg.addColorStop(1, "#050308");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Halo do tier (radial)
  const halo = ctx.createRadialGradient(W / 2, H * 0.32, 20, W / 2, H * 0.32, W * 0.75);
  halo.addColorStop(0, hexToRgba(colors.glow, 0.55));
  halo.addColorStop(0.55, hexToRgba(colors.ring, 0.12));
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // Grid sutil (linhas horizontais)
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let y = 240; y < H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(W - 80, y);
    ctx.stroke();
  }

  // Header: brand "airi"
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 44px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("airi.", 90, 140);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 28px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(new Date().toLocaleDateString("pt-BR"), W - 90, 140);

  // Nome do perfil
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 34px Inter, system-ui, sans-serif";
  ctx.fillText(data.profile.name.toUpperCase(), W / 2, 340);

  // Airi protagonista — halo do tier atrás
  const cx = W / 2;
  const cy = 700;
  const aura = ctx.createRadialGradient(cx, cy, 40, cx, cy, 520);
  aura.addColorStop(0, hexToRgba(colors.glow, 0.55));
  aura.addColorStop(0.6, hexToRgba(colors.ring, 0.14));
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, 520, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(colors.ring, 0.55);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 360, 0, Math.PI * 2);
  ctx.stroke();

  if (data.airi) {
    const iw = 820;
    const ih = (data.airi.height / data.airi.width) * iw;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
    ctx.drawImage(data.airi, cx - iw / 2, cy - ih / 2, iw, ih);
    ctx.restore();
  }

  // Balão de fala
  ctx.textAlign = "center";
  ctx.font = "700 40px Inter, system-ui, sans-serif";
  const quote = "GG fácil. Respeita o elo.";
  const qw = ctx.measureText(quote).width + 80;
  const qy = 1120;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  roundRect(ctx, cx - qw / 2, qy - 50, qw, 80, 40);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 20, qy - 50);
  ctx.lineTo(cx, qy - 78);
  ctx.lineTo(cx + 20, qy - 50);
  ctx.fill();
  ctx.fillStyle = "#1a1224";
  ctx.fillText(quote, cx, qy + 4);

  // Tier label
  ctx.fillStyle = colors.text;
  ctx.font = "700 30px Inter, system-ui, sans-serif";
  ctx.fillText("RANK ATUAL", W / 2, 1210);
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  ctx.font = "800 100px Inter, system-ui, sans-serif";
  ctx.fillText(tierText(data.rank).toUpperCase(), W / 2, 1310);
  ctx.fillStyle = colors.text;
  ctx.font = "600 42px Inter, system-ui, sans-serif";
  ctx.fillText(`${data.rank.lp} LP`, W / 2, 1370);

  // Divisor
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(140, 1420, W - 280, 1);

  // Stat grid — 3 blocos
  drawStat(ctx, W * 0.22, 1560, "STREAK", `${data.streak.current}`, "dias");
  drawStat(ctx, W * 0.5, 1560, "DOMINADAS", `${data.cardsMastered}`, "cartas");
  drawStat(ctx, W * 0.78, 1560, "TOTAL", `${data.totalCards}`, "no baralho");

  // Frase de assinatura
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "500 32px Inter, system-ui, sans-serif";
  ctx.fillText("Aprendendo inglês, um dia de cada vez.", W / 2, 1720);

  // Footer marca
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  ctx.fillText("airi · repetição espaçada", W / 2, 1830);
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  label: string,
  value: string,
  suffix: string,
) {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.fillText(label, cx, cy - 60);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "700 90px Inter, system-ui, sans-serif";
  ctx.fillText(value, cx, cy + 30);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 24px Inter, system-ui, sans-serif";
  ctx.fillText(suffix, cx, cy + 74);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 3 && raw.length !== 6) return hex;
  const expand =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const r = parseInt(expand.slice(0, 2), 16);
  const g = parseInt(expand.slice(2, 4), 16);
  const b = parseInt(expand.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
