import { useEffect, useMemo, useState } from "react";
import { Home, Library, Sparkles, Swords, Trophy, X } from "lucide-react";
import { useCurrentProfile } from "@/lib/profile";

/**
 * Tour progressivo de primeira sessão.
 * - Guarda a versão vista em localStorage (por perfil), para permitir
 *   reintroduzir o tour depois se surgirem novidades ("v2", "v3"…).
 * - Bottom sheet no mobile, modal centrado no desktop.
 */
const VERSION = "v1";
function storageKey(profileId: string) {
  return `airi.onboarded.${profileId}`;
}

type Slide = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao airi",
    body:
      "Um jeito calmo e sofisticado de aprender inglês com repetição espaçada. Você estuda pouco todo dia — o app cuida do resto.",
    accent: "from-primary/40 to-primary/10",
  },
  {
    icon: Library,
    title: "Biblioteca de decks",
    body:
      "Crie decks temáticos (viagem, trabalho, séries…) e adicione frases ou expressões. A IA traduz para você em segundos.",
    accent: "from-fuchsia-500/40 to-fuchsia-500/10",
  },
  {
    icon: Home,
    title: "Revisão diária",
    body:
      "Na tela inicial você vê o que está pronto para revisar. Espaço vira a carta, 1 = Errei, 2 = Acertei. Simples.",
    accent: "from-sky-500/40 to-sky-500/10",
  },
  {
    icon: Swords,
    title: "Cartas inimigas",
    body:
      "Errou uma carta 3 vezes? Ela vira inimiga — um chefe do seu baralho. Derrote-a para dominar de vez.",
    accent: "from-rose-500/40 to-rose-500/10",
  },
  {
    icon: Trophy,
    title: "Rank & streak",
    body:
      "Cada acerto rende LP, cada dia estudado alimenta seu streak. Do Ferro ao Desafiante — o caminho é seu.",
    accent: "from-amber-400/40 to-amber-400/10",
  },
];

export function OnboardingTour() {
  const profile = useCurrentProfile();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!profile) return;
    if (typeof window === "undefined") return;
    try {
      const seen = localStorage.getItem(storageKey(profile.id));
      if (seen !== VERSION) {
        // Pequeno delay para não interromper a animação de entrada do app.
        const t = setTimeout(() => setOpen(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [profile?.id]);

  const total = SLIDES.length;
  const slide = SLIDES[step];

  function complete() {
    if (profile) {
      try {
        localStorage.setItem(storageKey(profile.id), VERSION);
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  const dots = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === step ? "w-6 bg-primary" : "w-1.5 bg-white/20"
          }`}
        />
      )),
    [step, total],
  );

  if (!open || !profile) return null;
  const Icon = slide.icon;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Tour de boas-vindas"
    >
      <div className="glass-panel relative w-full max-w-md rounded-t-3xl border-t border-white/10 p-6 pb-8 sm:rounded-3xl sm:border sm:pb-6">
        <button
          onClick={complete}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.1] hover:text-foreground"
          aria-label="Pular tour"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <div
          className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${slide.accent} ring-1 ring-white/10`}
        >
          <Icon className="h-8 w-8 text-foreground" strokeWidth={2} />
        </div>

        <h2 className="text-center text-xl font-semibold tracking-tight text-foreground">
          {slide.title}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-center text-[14px] leading-relaxed text-muted-foreground">
          {slide.body}
        </p>

        <div className="mt-6 flex items-center justify-center gap-1.5">{dots}</div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={complete}
            className="flex-1 rounded-full border border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
          >
            Pular
          </button>
          <button
            onClick={() => (step === total - 1 ? complete() : setStep((s) => s + 1))}
            className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
          >
            {step === total - 1 ? "Começar" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
