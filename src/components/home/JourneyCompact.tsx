// Card compacto da Jornada do Primeiro Bundle na Home. Ao clicar, abre um
// modal com o detalhe completo (reutilizando FirstBundleJourney).
import { useState } from "react";
import { Sparkles, ChevronRight, Gift } from "lucide-react";
import {
  useJourney,
  journeyTotals,
  currentJourneyStep,
  type JourneyStep,
} from "@/lib/daily-challenges";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FirstBundleJourney } from "@/components/home/FirstBundleJourney";

function stepStatus(step: JourneyStep): string {
  if (step.claimed) return "Concluído";
  if (step.progress >= step.target) return "Pronto para resgatar";
  return `${step.progress}/${step.target}`;
}

export function JourneyCompact() {
  const journey = useJourney();
  const [open, setOpen] = useState(false);

  if (!journey.loaded || journey.hasFirstBundle) return null;

  const totals = journeyTotals();
  const percent = Math.round((totals.earned / Math.max(1, totals.total)) * 100);
  const current = currentJourneyStep();



  return (
    <>
      <section
        className="animate-fade-in mt-6 lg:col-span-4 lg:col-start-9 lg:row-start-3 lg:mt-0"
        style={{ animationDelay: "90ms", animationFillMode: "backwards" }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-left shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_16px_40px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:border-white/[0.14] hover:bg-white/[0.05]"
        >
          {/* Rim light */}
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {/* Soft violet aura */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl transition-opacity group-hover:opacity-80"
          />

          <div className="relative flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-violet-400/20 to-violet-600/10 ring-1 ring-violet-300/20 shadow-[0_0_24px_-8px_rgba(167,139,250,0.45)]">
              <Sparkles className="h-5 w-5 text-violet-200" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/70">
                  Jornada
                </span>
                <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-white/50">
                  {totals.completed}/{totals.count}
                </span>
              </div>
              <p className="mt-1 text-[15px] font-semibold leading-tight text-white">
                Provações do primeiro bundle
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="text-[10px] text-white/45">recompensa</span>
              <span className="flex items-center gap-1 text-[15px] font-semibold text-white/90">
                <Gift className="h-3.5 w-3.5 text-violet-200/70" strokeWidth={2.25} />
                {totals.total} ✦
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="relative mt-4">
            <div className="flex items-center justify-between text-[10px] font-medium text-white/45">
              <span>Progresso</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-300 transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Current step preview */}
          {current && (
            <div className="relative mt-3 rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12px] font-medium text-white/85">
                  {current.title}
                </p>
                <span className="shrink-0 text-[10px] text-white/45">
                  {stepStatus(current)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-white/40">
                {current.description}
              </p>
            </div>
          )}

          {/* CTA row */}
          <div className="relative mt-3 flex items-center justify-between">
            <span className="text-[11px] text-white/45">
              Toque para ver os passos
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-200/80 transition group-hover:text-violet-100">
              Abrir
              <ChevronRight
                className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                strokeWidth={2.25}
              />
            </span>
          </div>
        </button>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden border-white/10 bg-transparent p-0 shadow-2xl">
          <DialogTitle className="sr-only">Jornada do primeiro bundle</DialogTitle>
          <div className="max-h-[80vh] overflow-y-auto p-1">
            <FirstBundleJourney />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
