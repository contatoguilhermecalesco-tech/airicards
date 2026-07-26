import { useSyncStatus, useItemPending, type SyncStatus } from "@/lib/flashcards-store";
import { Check, CloudOff, Loader2, Upload, AlertTriangle } from "lucide-react";

type Meta = {
  label: string;
  short: string;
  Icon: typeof Check;
  tone: string; // classes
  dot: string; // fundo do ponto
  iconColor: string;
};

const META: Record<SyncStatus, Meta> = {
  synced: {
    label: "Sincronizado",
    short: "Sincronizado",
    Icon: Check,
    tone: "text-emerald-300/90 border-emerald-400/20 bg-emerald-400/[0.06]",
    dot: "bg-emerald-400",
    iconColor: "text-emerald-400/70",
  },
  saving: {
    label: "Salvando…",
    short: "Salvando",
    Icon: Loader2,
    tone: "text-primary/90 border-primary/25 bg-primary/[0.08]",
    dot: "bg-primary",
    iconColor: "text-primary/80",
  },
  pending: {
    label: "Pendente",
    short: "Pendente",
    Icon: Upload,
    tone: "text-amber-300/90 border-amber-400/25 bg-amber-400/[0.06]",
    dot: "bg-amber-400",
    iconColor: "text-amber-400/80",
  },
  error: {
    label: "Falha ao sincronizar",
    short: "Falha",
    Icon: AlertTriangle,
    tone: "text-destructive border-destructive/30 bg-destructive/10",
    dot: "bg-destructive",
    iconColor: "text-destructive",
  },
  offline: {
    label: "Offline",
    short: "Offline",
    Icon: CloudOff,
    tone: "text-slate-300/90 border-white/10 bg-white/[0.05]",
    dot: "bg-slate-400",
    iconColor: "text-slate-400",
  },
};

/**
 * Selo global de sincronismo — encaixa no navbar.
 * Em telas pequenas mostra só o ícone; ≥sm mostra o rótulo curto.
 * Para versão minimalista no topo do app, use `minimal`.
 */
export function SyncIndicator({
  compact = false,
  minimal = false,
}: {
  compact?: boolean;
  minimal?: boolean;
}) {
  const status = useSyncStatus();
  const { label, short, Icon, tone, iconColor } = META[status];
  const spinning = status === "saving";

  if (minimal) {
    // Ícone sólido quando há atenção; ponto verde quase invisível quando synced.
    const needsAttention = status === "error" || status === "offline" || status === "saving" || status === "pending";
    if (!needsAttention) {
      return (
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full"
          title={label}
          aria-label={label}
          role="status"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/40" />
        </span>
      );
    }
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${tone} border`}
        title={label}
        aria-label={label}
        role="status"
      >
        <Icon
          className={`h-3 w-3 ${iconColor} ${spinning ? "animate-spin" : ""}`}
          strokeWidth={2.5}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md transition ${tone}`}
      title={label}
      aria-label={label}
      role="status"
    >
      <Icon
        className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`}
        strokeWidth={2.5}
      />
      {!compact && <span className="hidden sm:inline">{short}</span>}
    </span>
  );
}

/**
 * Ponto discreto que aparece SOMENTE quando o item (deck/carta) tem mutação
 * ainda não confirmada no banco. Útil sobre cards da biblioteca e itens de
 * lista de cartas.
 */
export function SyncDot({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const pending = useItemPending(id);
  const status = useSyncStatus();
  if (!pending) return null;
  const meta = META[status === "synced" ? "pending" : status];
  const pulse = status === "saving" || status === "pending";
  return (
    <span
      className={`relative inline-flex h-1.5 w-1.5 shrink-0 ${className}`}
      title={
        status === "error"
          ? "Falha ao salvar — tentando novamente"
          : status === "offline"
            ? "Offline — será enviado ao voltar a rede"
            : "Aguardando confirmação do banco"
      }
      aria-hidden
    >
      {pulse && (
        <span
          className={`absolute inset-0 animate-ping rounded-full opacity-50 ${meta.dot}`}
        />
      )}
      <span className={`relative inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
    </span>
  );
}
