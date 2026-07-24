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

export function ProfileGate({ children }: { children: ReactNode }) {
  const profile = useCurrentProfile();
  const hydrated = useProfileHydrated();
  const [loadingProfile, setLoadingProfile] = useState<Profile | null>(null);

  // Avoid SSR/hydration flash — render nothing until client hydration confirms.
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
        onLinked={() => {
          onLinked(chosen);
          // Bootstrap re-hidrata a sessão; o children monta a seguir.
        }}
      />
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center">
        <img
          src={airiLogo.url}
          alt="airi"
          className="h-14 w-14 rounded-2xl object-contain"
        />
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Quem está estudando?
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Escolha seu perfil
        </h1>
      </div>

      <ul className="mt-14 flex w-full max-w-md flex-col gap-3">
        {PROFILES.map((p) => {
          const meta = metas?.find((m) => m.id === p.id);
          const subtitle = !meta
            ? "Carregando…"
            : meta.hasPin
              ? "Digite seu PIN para entrar"
              : "Crie seu PIN de acesso";
          return (
            <li key={p.id}>
              <button
                onClick={() => setChosen(p)}
                disabled={!metas}
                className="group ios-card relative flex w-full items-center gap-4 overflow-hidden rounded-2xl px-4 py-3.5 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
              >
                <span
                  aria-hidden
                  className="h-11 w-16 shrink-0 rounded-xl ring-1 ring-white/10"
                  style={{ backgroundImage: p.gradient }}
                />
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold tracking-tight text-foreground">
                    {p.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {subtitle}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="ml-auto text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
                >
                  →
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-10 max-w-xs text-center text-[11px] leading-relaxed text-muted-foreground">
        Seu PIN protege seus decks, arlys e progresso. Ele nunca sai do servidor
        — só o hash bcrypt é conferido no login.
      </p>
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
      if (digits.length >= 4 && digits.length <= 8) {
        // esperar Enter/blur — não auto-submit no enter mode pra evitar
        // tentar PINs curtos por engano.
      }
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
      ? "Digite seu PIN para entrar"
      : stage === "create"
        ? "Escolha 4 a 8 dígitos numéricos"
        : "Digite o mesmo PIN novamente";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center">
        <span
          aria-hidden
          className="h-16 w-24 rounded-2xl ring-1 ring-white/15 shadow-card"
          style={{ backgroundImage: profile.gradient }}
        />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="mt-10 flex w-full max-w-xs flex-col items-center gap-4">
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
          className="w-full rounded-2xl border border-white/10 bg-surface/80 px-5 py-4 text-center text-2xl font-semibold tracking-[0.8em] text-foreground outline-none ring-primary/40 transition focus:ring-2 disabled:opacity-60"
        />
        {error && (
          <p className="text-center text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {stage === "enter" && (
          <button
            type="button"
            onClick={() => submit(pin)}
            disabled={busy || pin.length < 4}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Voltar
        </button>
      </div>
    </main>
  );
}

function ProfileLoading({ profile }: { profile: Profile }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div
          className="h-14 w-full rounded-2xl ring-1 ring-white/15 shadow-card"
          style={{ backgroundImage: profile.gradient }}
        />
        <div className="mt-6 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-1/3 rounded-full bg-white/70"
            style={{ animation: "airi-slide 1.2s ease-in-out infinite" }}
          />
        </div>
        <p className="mt-5 text-sm font-medium tracking-wide text-muted-foreground">
          Preparando sua sessão, {profile.name}…
        </p>
      </div>
      <style>{`@keyframes airi-slide{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </main>
  );
}
