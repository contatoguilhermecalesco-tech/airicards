import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, CheckCheck, ChevronRight, CircleCheck, Inbox } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { iconFromKey } from "@/lib/notification-icons";
import { subscribeProfile } from "@/lib/profile";
import {
  initSystemUpdates,
  markAllSystemUpdatesRead,
  markSystemUpdateRead,
  useSystemUpdates,
  type SystemUpdate,
} from "@/lib/system-updates-store";

const STATUS_LABEL: Record<SystemUpdate["status"], string> = {
  maintenance: "Manutenção",
  offline: "Indisponível",
  degraded: "Instabilidade",
  info: "Informativo",
  resolved: "Normalizado",
};

function relativeDate(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} dia${days > 1 ? "s" : ""}`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function UpdateItem({ update, read, onOpen, last }: { update: SystemUpdate; read: boolean; onOpen: () => void; last: boolean }) {
  const Icon = update.status === "resolved" ? CircleCheck : iconFromKey(update.icon) ?? AlertTriangle;
  return (
    <button type="button" onClick={onOpen} className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.035]">
      <span className="relative flex w-9 shrink-0 justify-center">
        {!last && <span className="absolute left-1/2 top-8 h-[calc(100%+14px)] w-px -translate-x-1/2 bg-white/[0.09]" />}
        <span className="relative z-[1] grid h-9 w-9 place-items-center rounded-full border" style={{ color: update.color, borderColor: `${update.color}55`, backgroundColor: `${update.color}12` }}>
          <Icon className="h-[16px] w-[16px]" strokeWidth={2.1} />
        </span>
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">{update.title}</span>
          {!read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Não lida" />}
        </span>
        <span className="mt-1 block line-clamp-2 text-[11px] leading-[1.55] text-foreground/55">{update.body}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold uppercase tracking-wide">
          <span style={{ color: update.color }}>{STATUS_LABEL[update.status]}</span>
          {update.affected_area && <><span className="text-foreground/25">·</span><span className="text-foreground/40">{update.affected_area}</span></>}
          <span className="text-foreground/30">·</span><span className="font-medium normal-case tracking-normal text-foreground/35">{relativeDate(update.created_at)}</span>
        </span>
      </span>
    </button>
  );
}

export function SystemUpdatesBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { updates, readIds, loading } = useSystemUpdates();
  const unread = useMemo(() => updates.filter((update) => !readIds.has(update.id)).length, [updates, readIds]);
  const activeCount = useMemo(() => updates.filter((item) => ["maintenance", "offline", "degraded"].includes(item.status)).length, [updates]);

  useEffect(() => {
    void initSystemUpdates();
    return subscribeProfile(() => void initSystemUpdates());
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  function openUpdate(update: SystemUpdate) {
    void markSystemUpdateRead(update.id);
    setOpen(false);
    if (update.action_route) void navigate({ to: update.action_route as never });
    else void navigate({ to: "/atualizacoes" });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition ${unread ? "text-foreground hover:bg-accent" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
        aria-label={`Atualizações do sistema${unread ? ` (${unread} não lidas)` : ""}`}
        aria-expanded={open}
      >
        <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={2.2} />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-background" />}
      </button>

      {open && (
        <div className="fixed left-1/2 top-[64px] z-50 flex max-h-[min(78vh,620px)] w-[min(94vw,390px)] -translate-x-1/2 flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[oklch(0.17_0.018_290/0.97)] shadow-[0_24px_70px_-22px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-[min(78vh,620px)] sm:translate-x-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold tracking-tight text-foreground">Atualizações do sistema</p>
              <p className="mt-0.5 text-[11px] text-foreground/50">{loading ? "Sincronizando comunicados…" : unread ? `${unread} aviso${unread === 1 ? "" : "s"} novo${unread === 1 ? "" : "s"}` : "Você está em dia"}</p>
            </div>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllSystemUpdatesRead()} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10.5px] font-medium text-foreground/65 transition hover:bg-white/[0.07] hover:text-foreground">
                <CheckCheck className="h-3.5 w-3.5" /> Marcar tudo
              </button>
            )}
          </div>
          <div className="h-px shrink-0 bg-white/[0.07]" />
          {activeCount > 0 && (
            <div className="flex items-center gap-2 border-b border-white/[0.05] bg-amber-400/[0.045] px-4 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <p className="text-[10px] text-foreground/65">{activeCount} {activeCount === 1 ? "ocorrência ativa" : "ocorrências ativas"} no sistema</p>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {updates.length ? updates.slice(0, 6).map((update, index, list) => (
              <UpdateItem key={update.id} update={update} read={readIds.has(update.id)} last={index === list.length - 1} onOpen={() => openUpdate(update)} />
            )) : (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.07]"><Check className="h-5 w-5 text-emerald-400" /></span>
                <p className="text-[12px] font-semibold text-foreground/90">Tudo tranquilo por aqui</p>
                <p className="text-[11px] text-foreground/45">Manutenções e novidades aparecerão nesta área.</p>
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-white/[0.07] px-3 py-2">
            <Link to="/atualizacoes" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-2 py-2 text-[11px] font-medium text-foreground/65 transition hover:bg-white/[0.045] hover:text-foreground">
              <span className="inline-flex items-center gap-2"><ArrowUpRight className="h-3.5 w-3.5" /> Ver central completa</span>
              <ChevronRight className="h-4 w-4 text-foreground/35" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
