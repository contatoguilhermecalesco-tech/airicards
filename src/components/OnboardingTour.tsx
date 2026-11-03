import { useEffect, useMemo, useState } from "react";
import { BookOpen, Flame, Sparkles, X } from "lucide-react";
import { useCurrentProfile } from "@/lib/profile";

/**
 * Apresentação oficial da Airi. A versão é vinculada ao perfil para que
 * cada perfil veja o tour uma vez, sem interferir nos demais.
 */
const VERSION = "airi-mascot-tour-v3";
const STORAGE_PREFIX = "airi.onboarded.";

const SLIDES = [
  {
    eyebrow: "01 — BOAS-VINDAS",
    title: "Prazer, eu sou a Airi!",
    message: (name: string) =>
      `Oi, ${name}! Eu sou a Airi. Vou cuidar para seu inglês nunca mais cair no esquecimento.`,
    image: "/images/airi-onboarding/welcome.png",
    alt: "Airi acenando para dar as boas-vindas",
    fallback: Sparkles,
  },
  {
    eyebrow: "02 — O MÉTODO",
    title: "Aprender é melhor com estratégia.",
    message: (_name: string) =>
      "Revisões diárias inteligentes. Poucos minutos por dia, retenção máxima.",
    image: "/images/airi-onboarding/method.png",
    alt: "Airi de óculos, apresentando o método de estudos",
    fallback: BookOpen,
  },
  {
    eyebrow: "03 — PACTO DE FOGO",
    title: "Nossa chama não pode apagar!",
    message: (_name: string) =>
      "Estude todos os dias para manter nossa chama acesa e ganhar Arlys ✦. Preparado?",
    image: "/images/airi-onboarding/flame.png",
    alt: "Airi apresentando uma chama roxa brilhante",
    fallback: Flame,
  },
] as const;

function storageKey(profileId: string) {
  return `${STORAGE_PREFIX}${profileId}`;
}

export function OnboardingTour() {
  const profile = useCurrentProfile();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [failedImages, setFailedImages] = useState<number[]>([]);

  useEffect(() => {
    if (!profile || typeof window === "undefined") return;
    try {
      if (localStorage.getItem(storageKey(profile.id)) !== VERSION) {
        const timer = window.setTimeout(() => setOpen(true), 500);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // O tour continua utilizável mesmo se o navegador bloquear o storage.
      const timer = window.setTimeout(() => setOpen(true), 500);
      return () => window.clearTimeout(timer);
    }
  }, [profile?.id]);

  const slide = SLIDES[step];
  const total = SLIDES.length;
  const name = profile?.name?.trim() || "explorador(a)";
  const message = slide.message(name);
  const ImageFallback = slide.fallback;

  function finish() {
    if (profile) {
      try {
        localStorage.setItem(storageKey(profile.id), VERSION);
      } catch {
        // Sem storage, apenas encerra a apresentação nesta sessão.
      }
    }
    setOpen(false);
    setStep(0);
  }

  const progress = useMemo(
    () =>
      SLIDES.map((item, index) => (
        <span
          key={item.eyebrow}
          className={`h-1 rounded-full transition-all duration-300 ${
            index === step
              ? "w-8 bg-violet-300"
              : index < step
                ? "w-5 bg-violet-400/60"
                : "w-5 bg-white/15"
          }`}
        />
      )),
    [step],
  );

  if (!open || !profile) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#050408]/90 px-3 py-5 backdrop-blur-xl sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Apresentação da Airi"
      onKeyDown={(event) => {
        if (event.key === "Escape") finish();
        if (event.key === "ArrowRight" && step < total - 1)
          setStep((current) => current + 1);
        if (event.key === "ArrowLeft" && step > 0)
          setStep((current) => current - 1);
      }}
    >
      <div className="relative my-auto flex w-full max-w-[860px] flex-col overflow-hidden rounded-[28px] border border-violet-300/15 bg-[#100d18] shadow-[0_30px_120px_-35px_rgba(139,92,246,0.35)] sm:min-h-[520px] sm:flex-row">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_22%_35%,rgba(139,92,246,0.18),transparent_48%)]"
        />

        <button
          type="button"
          onClick={finish}
          aria-label="Pular apresentação"
          className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-white/65 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex min-h-[270px] items-center justify-center overflow-hidden px-5 pb-0 pt-8 sm:min-h-0 sm:w-[48%] sm:px-3 sm:pt-5">
          <div
            aria-hidden
            className="absolute bottom-5 h-40 w-40 rounded-full bg-violet-500/20 blur-[70px]"
          />
          {failedImages.includes(step) ? (
            <div className="relative grid aspect-square w-[72%] max-w-[310px] place-items-center rounded-full border border-violet-300/20 bg-violet-400/5">
              <ImageFallback
                className="h-20 w-20 text-violet-200"
                strokeWidth={1.2}
              />
            </div>
          ) : (
            <img
              key={slide.image}
              src={slide.image}
              alt={slide.alt}
              onError={() =>
                setFailedImages((current) =>
                  current.includes(step) ? current : [...current, step],
                )
              }
              className="relative z-10 max-h-[330px] w-full max-w-[390px] object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.45)] sm:max-h-[470px]"
            />
          )}
        </div>

        <div className="relative flex flex-1 flex-col justify-center px-6 pb-6 pt-2 sm:px-9 sm:py-12">
          <div className="mb-5 flex items-center gap-2">
            <span className="h-px w-6 bg-violet-300/70" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-200/80">
              {slide.eyebrow}
            </span>
          </div>

          <h2 className="max-w-md font-[Sora] text-[25px] font-semibold leading-tight tracking-tight text-white sm:text-[32px]">
            {slide.title}
          </h2>
          <p className="mt-4 max-w-md text-[14px] leading-7 text-white/70 sm:text-[15px]">
            {message}
          </p>

          <div
            className="mt-8 flex items-center gap-2"
            aria-label={`Etapa ${step + 1} de ${total}`}
          >
            {progress}
            <span className="ml-2 text-[10px] font-semibold tabular-nums tracking-wider text-white/35">
              0{step + 1} / 0{total}
            </span>
          </div>

          <div className="mt-7 flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                step === total - 1
                  ? finish()
                  : setStep((current) => current + 1)
              }
              className="flex-1 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8058d8] px-5 py-3.5 text-sm font-bold text-[#130d20] shadow-[0_8px_28px_-12px_rgba(167,139,250,0.8)] transition hover:brightness-110 active:scale-[0.99]"
            >
              {step === total - 1 ? "VAMOS COMEÇAR" : "CONTINUAR"}
            </button>
          </div>
          <button
            type="button"
            onClick={finish}
            className="mt-4 self-center text-[11px] font-medium text-white/35 transition hover:text-white/65"
          >
            Pular apresentação
          </button>
        </div>
      </div>
    </div>
  );
}
