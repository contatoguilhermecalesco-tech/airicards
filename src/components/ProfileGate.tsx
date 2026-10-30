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
import airiLogo from "@/assets/airi-horizontal-transparent.png.asset.json";

const HEADING_FONT = { fontFamily: "'Sora', 'Inter', sans-serif" };
const BODY_FONT = { fontFamily: "'Manrope', 'Inter', sans-serif" };

export function ProfileGate({ children }: { children: ReactNode }) {
  const profile = useCurrentProfile();
  const hydrated = useProfileHydrated();
  const [loadingProfile, setLoadingProfile] = useState<Profile | null>(null);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    if (!hydrated || profile) return;
    const timeout = window.setTimeout(() => setIntroComplete(true), 2400);
    return () => window.clearTimeout(timeout);
  }, [hydrated, profile]);

  if (!hydrated || (!profile && !introComplete)) return <WelcomeSplash />;

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

function WelcomeSplash() {
  const [message, setMessage] = useState("Preparando seu espaço de estudos");

  useEffect(() => {
    const a = window.setTimeout(() => setMessage("Organizando sua experiência"), 850);
    const b = window.setTimeout(() => setMessage("Tudo pronto para começar"), 1650);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, []);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#171717] px-6" style={BODY_FONT} aria-label="Carregando AIRI">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(182,154,232,0.13), transparent 70%)", animation: "airi-glow 3s ease-in-out infinite" }} />
      <div className="relative flex w-full max-w-[320px] flex-col items-center text-center">
        <div className="relative grid h-[112px] w-[112px] place-items-center">
          <span aria-hidden className="absolute inset-0 rounded-full border border-[#b69ae8]/20" style={{ animation: "airi-ring 2.4s ease-out infinite" }} />
          <span aria-hidden className="absolute inset-[12px] rounded-full border border-[#b69ae8]/10" />
          <Logo size="sm" />
        </div>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b69ae8]/75">Seu espaço de aprendizado</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-white" style={HEADING_FONT}>Bem-vindo ao <span className="text-[#c4acee]">AIRI</span></h1>
        <p className="mt-2 min-h-[20px] text-[12px] text-white/45" aria-live="polite">{message}</p>
        <div className="mt-9 h-[3px] w-[172px] overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-label="Preparando o AIRI">
          <div className="h-full w-full origin-left scale-x-0 rounded-full bg-[#b69ae8]" style={{ animation: "airi-progress 2.4s cubic-bezier(0.22,1,0.36,1) forwards", boxShadow: "0 0 12px rgba(182,154,232,0.55)" }} />
        </div>
        <p className="mt-4 text-[9px] font-medium uppercase tracking-[0.2em] text-white/20">Um momento</p>
      </div>
      <style>{`@keyframes airi-progress{to{transform:scaleX(1)}}@keyframes airi-glow{0%,100%{opacity:.65;transform:translate(-50%,-50%) scale(.94)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.06)}}@keyframes airi-ring{0%{transform:scale(.82);opacity:.65}75%,100%{transform:scale(1.28);opacity:0}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important}}`}</style>
    </main>
  );
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
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#171717] px-5 py-10"
      style={BODY_FONT}
    >
      {/* Subtle top spotlight — no blur, just gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
      {/* Hairline grid vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.012), transparent 48%)",
        }}
      />
      <div className="relative w-full max-w-[400px] animate-fade-in">{children}</div>
    </main>
  );
}

function ProfilePicker({ onLinked }: { onLinked: (p: Profile) => void }) {
  const [metas, setMetas] = useState<ProfileMeta[] | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);
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
    <Shell>
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-5 grid h-[76px] w-[76px] place-items-center rounded-full border border-[#b69ae8]/25 bg-[#28232f] shadow-[0_0_55px_-18px_rgba(182,154,232,0.42)]">
          <Logo size="sm" />
          <span className="pointer-events-none absolute inset-[-13px] rounded-full border border-[#b69ae8]/[0.08]" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b69ae8]/80">
          AIRI · SEU ESPAÇO DE ESTUDOS
        </p>
        <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-white" style={HEADING_FONT}>
          Escolha seu perfil
        </h1>
        <p className="mt-2 max-w-[270px] text-[13px] leading-relaxed text-white/45">
          Selecione o avatar para continuar.
        </p>
      </div>

      <div className="mx-auto mt-9 grid w-full max-w-[310px] grid-cols-2 gap-4">
        {PROFILES.map((p) => {
          const meta = metas?.find((m) => m.id === p.id);
          const active = selected?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              disabled={!metas}
              aria-pressed={active}
              className={"group flex min-h-[142px] flex-col items-center justify-center gap-3 rounded-[22px] border p-4 transition duration-200 active:scale-[0.97] disabled:opacity-50 " + (active
                ? "border-[#b69ae8] bg-[#30283b] shadow-[0_0_0_1px_rgba(182,154,232,0.24),0_10px_32px_-18px_rgba(182,154,232,0.6)]"
                : "border-white/[0.07] bg-[#222222] hover:border-white/[0.15] hover:bg-[#292929]")}
            >
              <span className={"rounded-[20px] p-[3px] transition duration-200 " + (active ? "bg-[#b69ae8] shadow-[0_0_22px_rgba(182,154,232,0.32)]" : "bg-white/[0.07] group-hover:bg-white/[0.13]")}>
                <ProfileAvatar
                  profileId={p.id}
                  initial={p.name.charAt(0).toUpperCase()}
                  gradient={p.gradient}
                  size={68}
                  radius={17}
                  fontScale={0.36}
                  ring="rgba(255,255,255,0.12)"
                />
              </span>
              <span className="min-w-0 text-center">
                <span className="block truncate text-[14px] font-semibold text-white" style={HEADING_FONT}>{p.name}</span>
                <span className="mt-1 block text-[10px] text-white/40">
                  {!meta ? "Carregando…" : meta.hasPin ? "Perfil protegido" : "Novo perfil"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => selected && setChosen(selected)}
        disabled={!selected || !metas}
        className="mx-auto mt-7 flex h-[52px] w-full max-w-[310px] items-center justify-center gap-3 rounded-[17px] bg-[#b69ae8] px-6 text-[14px] font-semibold text-[#1c1724] shadow-[0_10px_28px_-16px_rgba(182,154,232,0.7)] transition duration-200 hover:bg-[#c4acee] active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-[#34313a] disabled:text-white/25 disabled:shadow-none"
        style={HEADING_FONT}
      >
        Continuar
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      <p className="mt-6 text-center text-[10px] text-white/30">
        Acesso individual protegido por PIN
      </p>
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
  const dots = Array.from({ length: targetLen }, (_, i) => i);

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

      {/* PIN field with progress dots and quick submit */}
      <div className="mt-8 flex items-center gap-3 rounded-full border border-white/[0.07] bg-[#202020] p-2 pl-5 shadow-[inset_5px_5px_12px_rgba(0,0,0,0.24),inset_-4px_-4px_10px_rgba(255,255,255,0.018)]">
        <div className="flex min-h-[34px] flex-1 items-center gap-2" onClick={() => inputRef.current?.focus()} role="presentation">
          {dots.map((i) => (
            <span key={i} className={"h-[9px] w-[9px] rounded-full transition-all duration-200 " + (i < filled ? "scale-110 bg-[#b69ae8] shadow-[0_0_10px_rgba(182,154,232,0.4)]" : "bg-white/15")} />
          ))}
          {busy && <span className="ml-1 text-[11px] text-white/40">Verificando…</span>}
        </div>
        {stage === "enter" && (
          <button
            type="button"
            onClick={() => submit(pin)}
            disabled={busy || pin.length < 4}
            aria-label="Confirmar PIN"
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#b69ae8] text-[#1c1724] transition hover:bg-[#c4acee] active:scale-95 disabled:bg-[#39343f] disabled:text-white/25"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        )}
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

      {/* Soft circular keypad */}
      <div className="mx-auto mt-8 grid w-full max-w-[292px] grid-cols-3 justify-items-center gap-x-4 gap-y-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button
            key={n}
            type="button"
            disabled={busy}
            onClick={() => onChange(value + n)}
            className="grid h-[72px] w-[72px] place-items-center rounded-full border border-white/[0.035] bg-[#202020] text-[23px] font-medium text-white shadow-[6px_7px_16px_rgba(0,0,0,0.28),-4px_-4px_12px_rgba(255,255,255,0.018)] transition duration-150 hover:bg-[#29252f] hover:text-[#d6c6f2] active:scale-[0.94] active:shadow-inner disabled:opacity-50"
            style={HEADING_FONT}
          >
            {n}
          </button>
        ))}
        <span />
        <button
          type="button"
          disabled={busy}
          onClick={() => onChange(value + "0")}
          className="grid h-[72px] w-[72px] place-items-center rounded-full border border-white/[0.035] bg-[#202020] text-[23px] font-medium text-white shadow-[6px_7px_16px_rgba(0,0,0,0.28),-4px_-4px_12px_rgba(255,255,255,0.018)] transition duration-150 hover:bg-[#29252f] hover:text-[#d6c6f2] active:scale-[0.94] active:shadow-inner disabled:opacity-50"
          style={HEADING_FONT}
        >
          0
        </button>
        <button
          type="button"
          disabled={busy || value.length === 0}
          onClick={() => onChange(value.slice(0, -1))}
          aria-label="Apagar"
          className="grid h-[72px] w-[72px] place-items-center rounded-full text-white/55 transition duration-150 hover:bg-white/[0.04] hover:text-white active:scale-[0.94] disabled:opacity-25"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M22 5H10L3 12l7 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
            <path d="M18 9l-6 6M12 9l6 6" />
          </svg>
        </button>
      </div>
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
      className="flex min-h-screen flex-col items-center justify-center bg-[#171717] px-6"
      style={BODY_FONT}
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        <Logo size="md" />
        <div className="mt-10">
          <ProfileAvatar
            profileId={profile.id}
            initial={profile.name.charAt(0).toUpperCase()}
            gradient={profile.gradient}
            size={64}
            fontScale={0.32}
          />
        </div>
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
