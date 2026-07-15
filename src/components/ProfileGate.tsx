import { useEffect, useState, type ReactNode } from "react";
import {
  PROFILES,
  setCurrentProfile,
  useCurrentProfile,
  type Profile,
} from "@/lib/profile";
import airiLogo from "@/assets/airi-logo.png.asset.json";

export function ProfileGate({ children }: { children: ReactNode }) {
  const profile = useCurrentProfile();
  const [hydrated, setHydrated] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Avoid SSR/hydration flash — render nothing until client hydration confirms.
  if (!hydrated) return null;

  if (loadingProfile) {
    return <ProfileLoading profile={loadingProfile} />;
  }

  if (!profile) {
    return (
      <ProfilePicker
        onSelect={(p) => {
          setLoadingProfile(p);
          // Small delay so the loading state reads as "entering the account".
          window.setTimeout(() => {
            setCurrentProfile(p.id);
            setLoadingProfile(null);
          }, 1400);
        }}
      />
    );
  }

  return <>{children}</>;
}

function ProfilePicker({ onSelect }: { onSelect: (p: Profile) => void }) {
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
        {PROFILES.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p)}
              className="group ios-card relative flex w-full items-center gap-4 overflow-hidden rounded-2xl px-4 py-3.5 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                  Entrar na conta
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
        ))}
      </ul>
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
