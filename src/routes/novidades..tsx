
function ConceptDetail({ concept, onBack }: { concept: BundleConcept | null; onBack: () => void }) {
  if (!concept) {
    return (
      <main className="mx-auto max-w-2xl px-5 pb-20 pt-10 sm:px-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] text-foreground/60 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} /> Voltar
        </button>
        <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-foreground/70">Este concept não foi encontrado.</p>
        </div>
      </main>
    );
  }
  const accent = concept.palette || "#a855f7";
  return (
    <main className="relative min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3.5 sm:px-8">
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.08] hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="flex flex-1 items-baseline gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary/80">airi</span>
            <span className="truncate text-[10px] uppercase tracking-[0.24em] text-foreground/30">
              / bundle concepts
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <section className="relative mt-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0f]">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `radial-gradient(120% 90% at 85% 0%, ${accent}55 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, #6366f155 0%, transparent 60%), linear-gradient(180deg, #0a0a0f 0%, #050506 100%)`,
              }}
            />
            {concept.splash_url && (
              <div
                aria-hidden
                className="absolute inset-0 opacity-80"
                style={{
                  backgroundImage: `url(${concept.splash_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  maskImage:
                    "linear-gradient(180deg, rgba(0,0,0,1), rgba(0,0,0,0.4) 55%, transparent)",
                }}
              />
            )}
            <div className="relative px-6 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-12">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{
                  borderColor: `${accent}66`,
                  color: accent,
                  backgroundColor: `${accent}18`,
                }}
              >
                <Package className="h-3 w-3" strokeWidth={2.5} />
                Bundle concept
              </span>
              <h1 className="mt-6 text-[32px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[42px]">
                {concept.title}
              </h1>
              {concept.tagline && (
                <p className="mt-3 max-w-xl font-serif text-[15px] italic leading-relaxed text-foreground/80 sm:text-[16.5px]">
                  {concept.tagline}
                </p>
              )}
              <div className="mt-6 flex items-center gap-3">
                <div className="h-[3px] w-24 rounded-full" style={{ backgroundColor: accent }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">
                  Diário do bundle
                </span>
              </div>
            </div>
          </div>
        </section>

        <article className="mt-10 animate-fade-in patch-notes">
          <RiotPatchBody text={concept.concept} accent={accent} />
        </article>

        <div className="mt-10 flex items-center justify-center">
          <Link
            to="/novidades"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground/70 transition hover:bg-white/[0.06] hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} /> Todos os concepts
          </Link>
        </div>
      </div>
    </main>
  );
}
