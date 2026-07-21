import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Volume2, Smartphone, Star, Moon, Bell, Play } from "lucide-react";
import {
  DEFAULT_PREFS,
  setPrefs,
  useNotificationPrefs,
  isQuietNow,
} from "@/lib/notification-prefs";
import { playChime, vibratePulse } from "@/lib/notification-sound";
import { useCurrentProfile } from "@/lib/profile";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Preferências — airi" },
      { name: "description", content: "Personalize sons, vibração e horário silencioso das notificações." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[28px] w-[46px] shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-primary" : "bg-white/[0.12]"
      }`}
    >
      <span
        className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-transform duration-200 ${
          checked ? "translate-x-[21px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

function Row({
  icon,
  title,
  subtitle,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
        onClick ? "transition-colors hover:bg-white/[0.03]" : ""
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-[12px] leading-snug text-foreground/60">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </Comp>
  );
}

function Group({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      {label && (
        <p className="mb-2 px-4 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-foreground/45">
          {label}
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
        {children}
      </div>
    </section>
  );
}

function SettingsPage() {
  const profile = useCurrentProfile();
  const prefs = useNotificationPrefs();
  const quiet = isQuietNow(prefs);

  const testNotification = () => {
    if (prefs.sound) playChime();
    if (prefs.vibration) vibratePulse();
  };

  const reset = () => {
    setPrefs(DEFAULT_PREFS);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-white/[0.06] hover:text-foreground"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
            {profile?.name ?? "Perfil"}
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
            Preferências
          </h1>
        </div>
      </div>

      {/* Status card */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-primary/[0.12] via-white/[0.02] to-transparent p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Bell className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground">
                Notificações {quiet ? "em silêncio" : "ativas"}
              </p>
              <p className="mt-0.5 text-[12px] text-foreground/60">
                {quiet
                  ? "Modo silencioso está no ar agora."
                  : `${prefs.sound ? "Som" : "Sem som"} · ${prefs.vibration ? "vibração" : "sem vibração"}`}
              </p>
            </div>
          </div>
          <button
            onClick={testNotification}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12px] font-semibold text-foreground/85 transition hover:bg-white/[0.1]"
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
            Testar
          </button>
        </div>
      </div>

      {/* Alerts */}
      <Group label="Alertas">
        <Row
          icon={<Volume2 className="h-4 w-4" strokeWidth={2.25} />}
          title="Som"
          subtitle="Toca um chime discreto ao receber notificações."
        >
          <Toggle
            id="sound"
            checked={prefs.sound}
            onChange={(v) => setPrefs({ sound: v })}
          />
        </Row>
        <Row
          icon={<Smartphone className="h-4 w-4" strokeWidth={2.25} />}
          title="Vibração"
          subtitle="Pulso curto no celular (quando o aparelho suporta)."
        >
          <Toggle
            id="vibration"
            checked={prefs.vibration}
            onChange={(v) => setPrefs({ vibration: v })}
          />
        </Row>
        <Row
          icon={<Star className="h-4 w-4" strokeWidth={2.25} />}
          title="Apenas essenciais"
          subtitle="Mostra só notificações com etiquetas como “importante”, “essencial” ou “urgente”."
        >
          <Toggle
            id="essential"
            checked={prefs.essentialOnly}
            onChange={(v) => setPrefs({ essentialOnly: v })}
          />
        </Row>
      </Group>

      {/* Quiet hours */}
      <Group label="Modo silencioso">
        <Row
          icon={<Moon className="h-4 w-4" strokeWidth={2.25} />}
          title="Horário silencioso"
          subtitle="Durante esse intervalo, sem som nem vibração."
        >
          <Toggle
            id="quiet"
            checked={prefs.quietHoursEnabled}
            onChange={(v) => setPrefs({ quietHoursEnabled: v })}
          />
        </Row>
        {prefs.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-3 px-4 py-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                Início
              </span>
              <input
                type="time"
                value={prefs.quietStart}
                onChange={(e) => setPrefs({ quietStart: e.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[14px] font-medium text-foreground focus:border-primary/60 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                Fim
              </span>
              <input
                type="time"
                value={prefs.quietEnd}
                onChange={(e) => setPrefs({ quietEnd: e.target.value })}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[14px] font-medium text-foreground focus:border-primary/60 focus:outline-none"
              />
            </label>
          </div>
        )}
      </Group>

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-[11px] text-foreground/45">
          Preferências salvas neste dispositivo.
        </p>
        <button
          onClick={reset}
          className="text-[12px] font-medium text-foreground/60 transition hover:text-foreground"
        >
          Restaurar padrões
        </button>
      </div>
    </div>
  );
}
