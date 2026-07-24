import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  PROFILES,
  linkProfile,
  useCurrentProfile,
  useProfileHydrated,
  listProfilesMeta,
  type Profile,
  type ProfileMeta,
} from "@/lib/profile";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import airiLogo from "@/assets/airi-horizontal.png.asset.json";

const HEADING_FONT = { fontFamily: "'Sora', 'Inter', sans-serif" };
const BODY_FONT = { fontFamily: "'Manrope', 'Inter', sans-serif" };

export function ProfileGate({ children }: { children: ReactNode }) {
  const profile = useCurrentProfile();
  const hydrated = useProfileHydrated();
  const [loadingProfile, setLoadingProfile] = useState<Profile | null>(null);

  if (!hydrated) return null;

  if (loadingProfile) {
    return <ProfileLoading profile={loadingProfile} />;
  }

  if (!profile) {
    return (
      <ProfilePicker
        onLinked={(p) => {
          setLoadingProfile(p);
          window.setTimeout(() => setLoadingProfile(null), 900);
        }}
      />
    );
  }

  return <>{children}</>;
}

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = size === "lg" ? "h-20" : size === "md" ? "h-16" : "h-12";
  return (
    <img
      src={airiLogo.url}
      alt="airi"
      className={`${h} w-auto object-contain select-none`}
      draggable={false}
    />
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black px-5 py-10"
      style={BODY_FONT}
    >
      {/* Subtle top spotlight — no blur, just gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(139,125,255,0.10) 0%, rgba(139,125,255,0) 70%)",
        }}
      />
      {/* Hairline grid vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(1200px 600px at 50% -10%, rgba(255,255,255,0.04), transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-[420px]">{children}</div>
    </main>
  );
}

function ProfilePicker({ onLinked }: { onLinked: (p: Profile) => void }) {
  const [metas, setMetas] = useState<ProfileMeta[] | null>(null);
  const [chosen, setChosen] = useState<Profile | null>(null);

  useEffect(() => {
    let alive = true;
    listProfilesMeta().then((m) => {
      if (alive) setMetas(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  const chosenMeta = useMemo(
    () => (chosen ? metas?.find((m) => m.id === chosen.id) ?? null : null),
    [chosen, metas],
  );

  if (chosen && chosenMeta) {
    return (
      <PinPad
        profile={chosen}
        needsCreate={!chosenMeta.hasPin}
        onCancel={() => setChosen(null)}
        onLinked={() => onLinked(chosen)}
      />
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "Boa madrugada"
      : hour < 12
        ? "Bom dia"
        : hour < 18
          ? "Boa tarde"
          : "Boa noite";

  return (
    <Shell>
      <div className="flex flex-col items-center">
        <Logo size="lg" />
        <p
          className="mt-10 text-[12px] font-medium uppercase tracking-[0.24em] text-white/40"
          style={BODY_FONT}
        >
          {greeting}
        </p>
        <h1
          className="mt-2 text-center text-[28px] font-semibold leading-tight tracking-tight text-white"
          style={HEADING_FONT}
        >
          Quem está estudando?
        </h1>
        <p className="mt-2 text-center text-[14px] text-white/45">
          Toque no perfil para continuar.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#0f0f12]">
        {PROFILES.map((p, i) => {
          const meta = metas?.find((m) => m.id === p.id);
          const subtitle = !meta
            ? "Carregando…"
            : meta.hasPin
              ? "PIN configurado"
              : "Novo perfil · criar PIN";
          const initial = p.name.charAt(0).toUpperCase();
          return (
            <button
              key={p.id}
              onClick={() => setChosen(p)}
              disabled={!metas}
              className={`group relative flex w-full items-center gap-4 px-4 py-4 text-left transition active:bg-white/[0.04] hover:bg-white/[0.025] disabled:opacity-50 ${
                i > 0 ? "border-t border-white/[0.06]" : ""
              }`}
            >
              <span aria-hidden className="relative">
                <ProfileAvatar
                  profileId={p.id}
                  initial={initial}
                  gradient={p.gradient}
                  size={48}
                  fontScale={0.36}
                  ring="rgba(255,255,255,0.15)"
                />
                {meta?.hasPin && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-black ring-2 ring-black"
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span
                  className="block truncate text-[17px] font-semibold text-white"
                  style={HEADING_FONT}
                >
                  {p.name}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-white/45">
                  {subtitle}
                </span>
              </span>
              <svg
                className="shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/60"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/35">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <span>Protegido por PIN · criptografia bcrypt</span>
      </div>
    </Shell>
  );
}

function PinPad({
  profile,
  needsCreate,
  onCancel,
  onLinked,
}: {
  profile: Profile;
  needsCreate: boolean;
  onCancel: () => void;
  onLinked: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [needsCreate]);

  const stage: "create" | "confirm" | "enter" = needsCreate
    ? pin.length >= 4
      ? "confirm"
      : "create"
    : "enter";

  async function submit(finalPin: string) {
    setBusy(true);
    setError(null);
    const res = await linkProfile(profile.id, finalPin);
    setBusy(false);
    if (res.ok) {
      onLinked();
      return;
    }
    setPin("");
    setConfirmPin("");
    if (res.error === "wrong_pin") setError("PIN incorreto. Tente de novo.");
    else if (res.error === "invalid_pin")
      setError("Use 4 a 8 dígitos numéricos.");
    else setError("Não deu para entrar. Tente novamente.");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onChange(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 8);
    if (stage === "confirm") {
      setConfirmPin(digits);
      if (digits.length === pin.length && pin.length >= 4) {
        if (digits === pin) void submit(digits);
        else {
          setError("Os PINs não conferem.");
          setConfirmPin("");
          setPin("");
        }
      }
    } else {
      setPin(digits);
      setError(null);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && stage === "enter" && pin.length >= 4) {
      e.preventDefault();
      void submit(pin);
    }
  }

  const value = stage === "confirm" ? confirmPin : pin;
  const title =
    stage === "enter"
      ? `Olá, ${profile.name}`
      : stage === "create"
        ? `Crie um PIN`
        : "Confirme o PIN";
  const subtitle =
    stage === "enter"
      ? "Digite seu PIN para continuar"
      : stage === "create"
        ? "Escolha 4 a 8 dígitos numéricos"
        : "Digite o mesmo PIN novamente";
  const initial = profile.name.charAt(0).toUpperCase();

  const filled = value.length;
  const targetLen = Math.max(4, pin.length || 4);
  const dots = Array.from({ length: 6 }, (_, i) => i);

  return (
    <Shell>
      <div className="flex flex-col items-center">
        <Logo size="md" />

        <div className="mt-10">
          <ProfileAvatar
            profileId={profile.id}
            initial={initial}
            gradient={profile.gradient}
            size={76}
            fontScale={0.32}
            ring="rgba(255,255,255,0.15)"
          />
        </div>
        <h1
          className="mt-5 text-center text-[24px] font-semibold tracking-tight text-white"
          style={HEADING_FONT}
        >
          {title}
        </h1>
        <p className="mt-1.5 text-center text-[14px] text-white/50">
          {subtitle}
        </p>
      </div>

      {/* Dot indicator */}
      <div
        className="mt-8 flex items-center justify-center gap-3"
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        {dots.map((i) => {
          const active = i < filled;
          const inRange = i < targetLen;
          return (
            <span
              key={i}
              className={`h-3 w-3 rounded-full transition-all duration-200 ${
                active
                  ? "bg-white scale-110"
                  : inRange
                    ? "bg-white/15"
                    : "bg-white/[0.06]"
              }`}
            />
          );
        })}
      </div>

      {/* Hidden input capturing keyboard */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        value={value}
        maxLength={8}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        aria-label="PIN"
        className="sr-only"
      />

      {error && (
        <p
          className="mt-5 text-center text-[13px] text-rose-300"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Numeric keypad — iOS style */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button
            key={n}
            type="button"
            disabled={busy}
            onClick={() => onChange(value + n)}
            className="h-16 rounded-2xl border border-white/[0.07] bg-[#111114] text-[26px] font-medium text-white transition active:scale-[0.96] active:bg-white/[0.06] hover:bg-white/[0.03] disabled:opacity-50"
            style={HEADING_FONT}
          >
            {n}
          </button>
        ))}
        <div />
        <button
          type="button"
          disabled={busy}
          onClick={() => onChange(value + "0")}
          className="h-16 rounded-2xl border border-white/[0.07] bg-[#111114] text-[26px] font-medium text-white transition active:scale-[0.96] active:bg-white/[0.06] hover:bg-white/[0.03] disabled:opacity-50"
          style={HEADING_FONT}
        >
          0
        </button>
        <button
          type="button"
          disabled={busy || value.length === 0}
          onClick={() => onChange(value.slice(0, -1))}
          className="grid h-16 place-items-center rounded-2xl text-white/60 transition active:scale-[0.96] active:bg-white/[0.04] hover:text-white disabled:opacity-30"
          aria-label="Apagar"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 5H10L3 12l7 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
            <path d="M18 9l-6 6M12 9l6 6" />
          </svg>
        </button>
      </div>

      {stage === "enter" && (
        <button
          type="button"
          onClick={() => submit(pin)}
          disabled={busy || pin.length < 4}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-8 py-4 text-[15px] font-semibold text-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          style={HEADING_FONT}
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      )}

      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="mx-auto mt-5 block text-[13px] font-medium text-white/45 transition hover:text-white/80"
      >
        ← Trocar de perfil
      </button>
    </Shell>
  );
}

function ProfileLoading({ profile }: { profile: Profile }) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-black px-6"
      style={BODY_FONT}
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        <Logo size="md" />
        <span
          aria-hidden
          className="mt-10 grid h-16 w-16 place-items-center rounded-full text-xl font-semibold text-white"
          style={{ backgroundImage: profile.gradient, ...HEADING_FONT }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </span>
        <div className="mt-6 h-[2px] w-32 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-1/3 rounded-full bg-white/70"
            style={{ animation: "airi-slide 1.2s ease-in-out infinite" }}
          />
        </div>
        <p className="mt-5 text-[14px] font-medium text-white/55">
          Entrando, {profile.name}…
        </p>
      </div>
      <style>{`@keyframes airi-slide{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </main>
  );
}
