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
import airiLogo from "@/assets/airi-logo.png.asset.json";

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

function BrandPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#1a1230] to-[#0b0714] ${
        compact
          ? "min-h-[180px] w-full p-6"
          : "w-full p-10 md:min-h-full md:w-5/12 md:p-14 lg:p-16"
      }`}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[20%] -top-[20%] h-[80%] w-[80%] rounded-full bg-[#6d5cff]/15 blur-[110px]"
        style={{ animation: "airi-breath 9s ease-in-out infinite" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[30%] -right-[10%] h-[60%] w-[60%] rounded-full bg-[#c4b5fd]/10 blur-[120px]"
        style={{ animation: "airi-breath 11s ease-in-out infinite reverse" }}
      />

      <div className="relative z-10 flex items-center gap-3">
        <img
          src={airiLogo.url}
          alt="airi"
          className="h-10 w-10 rounded-xl object-contain ring-1 ring-white/10"
        />
        <div>
          <div
            className="text-2xl font-bold tracking-tight text-white"
            style={HEADING_FONT}
          >
            airi
            <span className="text-[#8b7dff]">.</span>
          </div>
          <p
            className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/40"
            style={BODY_FONT}
          >
            Fluência diária
          </p>
        </div>
      </div>

      {!compact && (
        <div className="relative z-10 mt-10">
          <h2
            className="text-2xl font-semibold leading-tight text-white lg:text-[26px]"
            style={HEADING_FONT}
          >
            Domine o idioma
            <br />
            com flashcards.
          </h2>
          <p
            className="mt-3 max-w-[240px] text-sm leading-relaxed text-white/45"
            style={BODY_FONT}
          >
            Seu ritual diário de imersão no inglês — sem pressa, sem ruído.
          </p>
          <div className="mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-[#6d5cff] to-[#c4b5fd]" />
        </div>
      )}
    </div>
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

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center bg-[#0b0714] p-4 md:p-10"
      style={BODY_FONT}
    >
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#140c26] shadow-[0_40px_120px_-30px_rgba(109,92,255,0.35)] md:flex-row md:rounded-[32px]">
        <BrandPanel compact />
        <div className="hidden md:contents">
          <BrandPanel />
        </div>

        {/* Right side — profile selection */}
        <div className="flex flex-1 flex-col justify-center bg-white/[0.02] p-6 sm:p-10 md:p-14 lg:p-16">
          <div className="mb-8 sm:mb-10">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8b7dff]/80"
              style={BODY_FONT}
            >
              Quem está estudando?
            </p>
            <h1
              className="mt-2 text-2xl font-bold text-white sm:text-3xl"
              style={HEADING_FONT}
            >
              Escolha seu perfil
            </h1>
            <p className="mt-2 text-sm text-white/40">
              Bem-vindo de volta. Toque no seu perfil para continuar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {PROFILES.map((p) => {
              const meta = metas?.find((m) => m.id === p.id);
              const subtitle = !meta
                ? "Carregando…"
                : meta.hasPin
                  ? "Digite seu PIN para entrar"
                  : "Crie seu PIN de acesso";
              const initial = p.name.charAt(0).toUpperCase();
              return (
                <button
                  key={p.id}
                  onClick={() => setChosen(p)}
                  disabled={!metas}
                  className="group relative flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff]/60 disabled:cursor-progress disabled:opacity-60 sm:p-6"
                >
                  <span
                    aria-hidden
                    className="mb-4 grid h-20 w-20 place-items-center rounded-full text-2xl font-bold text-white shadow-[0_0_38px_-6px_rgba(109,92,255,0.55)] transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
                    style={{
                      backgroundImage: p.gradient,
                      ...HEADING_FONT,
                    }}
                  >
                    {initial}
                  </span>
                  <span
                    className="text-lg font-semibold text-white"
                    style={HEADING_FONT}
                  >
                    {p.name}
                  </span>
                  <span className="mt-1 text-[11px] text-white/40">
                    {subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 sm:mt-12">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <p className="text-[11px] leading-snug text-white/40">
              <span className="font-medium text-white/60">Segurança airi:</span>{" "}
              seu PIN é protegido por hash bcrypt e nunca sai do servidor.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes airi-breath { 0%,100%{ transform: scale(1); opacity:.85 } 50%{ transform: scale(1.12); opacity:1 } }
      `}</style>
    </main>
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
    } else if (stage === "create") {
      setPin(digits);
      setError(null);
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
        ? `Crie um PIN, ${profile.name}`
        : "Confirme o PIN";
  const subtitle =
    stage === "enter"
      ? "Digite seu PIN para continuar"
      : stage === "create"
        ? "Escolha 4 a 8 dígitos numéricos"
        : "Digite o mesmo PIN novamente";
  const initial = profile.name.charAt(0).toUpperCase();

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center bg-[#0b0714] p-4 md:p-10"
      style={BODY_FONT}
    >
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#140c26] shadow-[0_40px_120px_-30px_rgba(109,92,255,0.35)] md:flex-row md:rounded-[32px]">
        <BrandPanel compact />
        <div className="hidden md:contents">
          <BrandPanel />
        </div>

        <div className="flex flex-1 flex-col justify-center bg-white/[0.02] p-6 sm:p-10 md:p-14 lg:p-16">
          <div className="flex flex-col items-center text-center">
            <span
              aria-hidden
              className="grid h-24 w-24 place-items-center rounded-full text-3xl font-bold text-white shadow-[0_0_44px_-6px_rgba(109,92,255,0.6)]"
              style={{ backgroundImage: profile.gradient, ...HEADING_FONT }}
            >
              {initial}
            </span>
            <h1
              className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl"
              style={HEADING_FONT}
            >
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-white/45">{subtitle}</p>
          </div>

          <div className="mt-8 flex w-full flex-col items-center gap-4">
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
              className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-2xl font-semibold tracking-[0.7em] text-white outline-none transition focus:border-[#6d5cff]/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#6d5cff]/30 disabled:opacity-60"
              style={HEADING_FONT}
            />
            {error && (
              <p className="text-center text-xs text-rose-300" role="alert">
                {error}
              </p>
            )}
            {stage === "enter" && (
              <button
                type="button"
                onClick={() => submit(pin)}
                disabled={busy || pin.length < 4}
                className="mt-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#6d5cff] to-[#8b7dff] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(109,92,255,0.7)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={HEADING_FONT}
              >
                {busy ? "Entrando…" : "Entrar"}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="mt-2 text-xs font-medium text-white/40 underline-offset-4 transition hover:text-white/70 hover:underline"
            >
              ← Voltar aos perfis
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileLoading({ profile }: { profile: Profile }) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-[#0b0714] px-6"
      style={BODY_FONT}
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        <span
          aria-hidden
          className="grid h-20 w-20 place-items-center rounded-full text-2xl font-bold text-white shadow-[0_0_44px_-6px_rgba(109,92,255,0.6)]"
          style={{ backgroundImage: profile.gradient, ...HEADING_FONT }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </span>
        <div className="mt-6 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#6d5cff] to-[#c4b5fd]"
            style={{ animation: "airi-slide 1.2s ease-in-out infinite" }}
          />
        </div>
        <p
          className="mt-5 text-sm font-medium tracking-wide text-white/55"
          style={BODY_FONT}
        >
          Preparando sua sessão, {profile.name}…
        </p>
      </div>
      <style>{`@keyframes airi-slide{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </main>
  );
}
