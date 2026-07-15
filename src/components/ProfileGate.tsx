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

      <ul className="mt-14 flex flex-wrap items-start justify-center gap-8 sm:gap-12">
        {PROFILES.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p)}
              className="group flex flex-col items-center gap-3 focus:outline-none"
            >
              <span
                className="flex h-24 w-24 items-center justify-center rounded-3xl text-3xl font-semibold text-white shadow-card ring-1 ring-white/10 transition duration-300 group-hover:scale-[1.04] group-hover:ring-white/25 group-focus-visible:ring-2 group-focus-visible:ring-primary sm:h-28 sm:w-28"
                style={{ backgroundImage: p.gradient }}
              >
                {p.initial}
              </span>
              <span className="text-sm font-medium text-muted-foreground transition group-hover:text-foreground">
                {p.name}
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
      <div className="relative">
        <span
          className="flex h-28 w-28 items-center justify-center rounded-3xl text-4xl font-semibold text-white shadow-card ring-1 ring-white/15"
          style={{ backgroundImage: profile.gradient }}
        >
          {profile.initial}
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-[2rem] border border-white/10"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-[2rem] border-t border-white/60 animate-spin"
          style={{ animationDuration: "1.4s" }}
        />
      </div>
      <p className="mt-8 text-sm font-medium tracking-wide text-muted-foreground">
        Preparando sua sessão, {profile.name}…
      </p>
    </main>
  );
}
