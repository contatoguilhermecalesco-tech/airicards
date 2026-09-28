import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCheck, ChevronRight, Inbox } from "lucide-react";
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
  degraded: "Instável",
  info: "Informativo",
  resolved: "Normalizado",
};

function UpdateItem({ update, read, onOpen }: { update: SystemUpdate; read: boolean; onOpen: () => void }) {
  const Icon = iconFromKey(update.icon) ?? AlertTriangle;
  return (
    <button onClick={onOpen} className="flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.045]">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border"
        style={{ color: update.color, borderColor: `${update.color}44`, backgroundColor: `${update.color}18` }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-foreground">{update.title}</span>
          {!read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
        </span>
        <span className="mt-0.5 line-clamp-2 text-[11.5px] leading-4 text-foreground/55">{update.body}</span>
        <span className="mt-1 block text-[10px] font-semibold uppercase text-foreground/40">{STATUS_LABEL[update.status]}</span>
      </span>
    </button>
  );
}

export function SystemUpdatesBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { updates, readIds } = useSystemUpdates();
  const unread = useMemo(() => updates.filter((update) => !readIds.has(update.id)).length, [updates, readIds]);

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
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition ${unread ? "text-foreground hover:bg-accent" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
        aria-label={`Atualizações do sistema${unread ? ` (${unread} não lidas)` : ""}`}
      >
        <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={2.2} />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-background" />}
      </button>

      {open && (
        <div className="fixed left-1/2 top-[64px] z-50 w-[min(94vw,400px)] -translate-x-1/2 overflow-hidden rounded-[24px] border border-white/[0.08] bg-[oklch(0.19_0.02_290/0.94)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:translate-x-0">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-[15px] font-semibold text-foreground">Atualizações do sistema</p>
              <p className="mt-0.5 text-[11.5px] text-foreground/55">{unread ? `${unread} aviso${unread > 1 ? "s" : ""} novo${unread > 1 ? "s" : ""}` : "Sistema em dia"}</p>
            </div>
            {unread > 0 && (
              <button onClick={() => void markAllSystemUpdatesRead()} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium text-foreground/75 transition hover:bg-white/[0.06] hover:text-foreground">
                <CheckCheck className="h-3.5 w-3.5" /> Marcar tudo
              </button>
            )}
          </div>
          <div className="h-px bg-white/[0.06]" />
          <div className="max-h-[60vh] overflow-y-auto p-1.5">
            {updates.length ? updates.slice(0, 6).map((update) => (
              <UpdateItem key={update.id} update={update} read={readIds.has(update.id)} onOpen={() => openUpdate(update)} />
            )) : (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04]"><Inbox className="h-5 w-5 text-foreground/45" /></span>
                <p className="text-[13px] font-semibold text-foreground/90">Nenhum aviso no momento</p>
                <p className="text-[11.5px] text-foreground/50">Manutenções e estados do app aparecerão aqui.</p>
              </div>
            )}
          </div>
          <div className="border-t border-white/[0.06] px-3 py-2.5">
            <Link to="/atualizacoes" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-2 py-1.5 text-[12px] font-medium text-foreground/70 transition hover:bg-white/[0.04] hover:text-foreground">
              <span className="inline-flex items-center gap-1.5"><ArrowUpRight className="h-3.5 w-3.5" /> Ver central completa</span>
              <ChevronRight className="h-4 w-4 text-foreground/40" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
