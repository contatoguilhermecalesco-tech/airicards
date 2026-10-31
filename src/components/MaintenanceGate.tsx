import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouterState, Link } from "@tanstack/react-router";
import { Clock3, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type MaintenanceRow = { area_key: string; enabled: boolean; message: string; expected_return_at: string | null };

const ROUTE_AREAS: Array<{ prefix: string; area: string }> = [
  { prefix: "/social", area: "social" },
  { prefix: "/duel", area: "duels" },
  { prefix: "/review", area: "review" },
  { prefix: "/library", area: "library" },
  { prefix: "/study", area: "study" },
  { prefix: "/desafios", area: "challenges" },
  { prefix: "/conquistas", area: "achievements" },
  { prefix: "/rank", area: "rank" },
  { prefix: "/shop", area: "shop" },
  { prefix: "/inventory", area: "inventory" },
  { prefix: "/enemies", area: "enemies" },
  { prefix: "/novidades", area: "news" },
  { prefix: "/perfil", area: "profile" },
  { prefix: "/forja", area: "forge" },
  { prefix: "/settings", area: "settings" },
];

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [rows, setRows] = useState<MaintenanceRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("app_area_maintenance")
        .select("area_key, enabled, message, expected_return_at");
      if (!alive) return;
      if (!error) setRows((data ?? []) as MaintenanceRow[]);
      setLoaded(true);
    };
    void load();
    const channel = supabase
      .channel("app-area-maintenance")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_area_maintenance" }, () => { void load(); })
      .subscribe();
    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const area = ROUTE_AREAS.find((item) => pathname === item.prefix || pathname.startsWith(item.prefix + "/"))?.area;
  const maintenance = useMemo(() => rows.find((row) => row.area_key === area && row.enabled), [rows, area]);

  if (!area || !loaded || !maintenance) return <>{children}</>;

  const expected = maintenance.expected_return_at
    ? new Date(maintenance.expected_return_at)
    : null;
  const expectedLabel = expected && !Number.isNaN(expected.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(expected)
    : null;

  return (
    <main className="relative flex min-h-[calc(100dvh-72px)] items-center justify-center overflow-hidden px-5 py-12">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[100px]" />
      <section className="relative w-full max-w-md rounded-[28px] border border-white/[0.09] bg-gradient-to-b from-white/[0.055] to-white/[0.02] px-7 py-10 text-center shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] sm:px-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_12px_40px_-18px_hsl(var(--primary)/0.6)]">
          <Wrench className="h-7 w-7" strokeWidth={1.7} />
        </div>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-primary/80">Manutenção temporária</p>
        <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground">Estamos trabalhando nisso!</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{maintenance.message}</p>
        {expectedLabel && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" /> Previsão de retorno: {expectedLabel}
          </div>
        )}
        <div className="mt-8 border-t border-white/[0.07] pt-5">
          <p className="text-xs text-muted-foreground">Agradecemos sua compreensão. Esta área estará disponível novamente assim que a manutenção for concluída.</p>
          <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.045] px-5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-white/[0.08]">Voltar ao início</Link>
        </div>
      </section>
    </main>
  );
}
