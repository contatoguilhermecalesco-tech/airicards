import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wrench,
  Wand2,
  Share2,
} from "lucide-react";
import {
  initChangelog,
  useChangelog,
  type ChangelogCategory,
} from "@/lib/changelog-store";
import {
  initBundleConcepts,
  useBundleConcepts,
  type BundleConcept,
} from "@/lib/bundle-concepts-store";
import { Package } from "lucide-react";
import { resolveNotificationIcon } from "@/lib/notification-icons";
import { RiotPatchBody } from "@/lib/patch-notes";


export const Route = createFileRoute("/novidades/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Nota da atualização — airi" },
      {
        name: "description",
        content: "Detalhes desta atualização do airi.",
      },
      { property: "og:title", content: `Nota da atualização · ${params.id}` },
      {
        property: "og:description",
        content: "Confira o que mudou nesta versão do airi.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovidadeDetailPage,
});

type Meta = { label: string; color: string; Icon: typeof Sparkles };

const CATEGORY_META: Record<ChangelogCategory, Meta> = {
  feature: { label: "Novo", color: "#a78bfa", Icon: Sparkles },
  improvement: { label: "Melhoria", color: "#60a5fa", Icon: Wand2 },
  fix: { label: "Ajuste", color: "#34d399", Icon: Wrench },
};

function fmtLong(iso: string) {
  try {
    const d = new Date(iso);
    const s = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return "";
  }
}

function fmtTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function patchNumberFor(iso: string, index: number) {
  const d = new Date(iso);
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const seq = String(index + 1).padStart(2, "0");
  return `${y}.${m}.${seq}`;
}

function NovidadeDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { entries } = useChangelog();
  const { items: concepts } = useBundleConcepts();

  useEffect(() => {
    void initChangelog();
    void initBundleConcepts();
  }, []);

  if (id.startsWith("concept:")) {
    const conceptId = id.slice("concept:".length);
    const concept = concepts.find((c) => c.id === conceptId) ?? null;
    return <ConceptDetail concept={concept} onBack={() => navigate({ to: "/novidades" })} />;
  }

  const index = entries.findIndex((e) => e.id === id);
  const entry = index >= 0 ? entries[index] : null;
  const prev = index > 0 ? entries[index - 1] : null; // mais recente
  const next = index >= 0 && index < entries.length - 1 ? entries[index + 1] : null; // mais antigo

  const meta = entry ? CATEGORY_META[entry.category] ?? CATEGORY_META.feature : null;
  const Icon = useMemo(() => {
    if (!entry || !meta) return Sparkles;
    return entry.icon
      ? resolveNotificationIcon(entry.icon, null, entry.title)
      : meta.Icon;
  }, [entry, meta]);

  const fullText = useMemo(() => {
    if (!entry) return "";
    return (entry.notes && entry.notes.trim()) || entry.body;
  }, [entry]);




  async function share() {
    if (!entry) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `airi · ${entry.title}`,
      text: entry.body.slice(0, 140),
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // silencioso
    }
  }

  if (!entry || !meta) {
    return (
      <main className="mx-auto max-w-2xl px-5 pb-20 pt-10 sm:px-8">
        <Link
          to="/novidades"
          className="inline-flex items-center gap-1.5 text-[13px] text-foreground/60 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} /> Voltar
        </Link>
        <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-foreground/70">
            Esta nota não foi encontrada.
          </p>
          <p className="mt-1 text-xs text-foreground/45">
            Ela pode ter sido removida ou o link está incorreto.
          </p>
        </div>
      </main>
    );
  }

  const patch = patchNumberFor(entry.created_at, index);

  return (
    <main className="relative min-h-screen bg-background pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3.5 sm:px-8">
          <button
            onClick={() => navigate({ to: "/novidades" })}
            aria-label="Voltar"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.08] hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="flex flex-1 items-baseline gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary/80">
              airi
            </span>
            <span className="truncate text-[10px] uppercase tracking-[0.24em] text-foreground/30">
              / patch notes / {patch}
            </span>
          </div>
          <button
            onClick={share}
            aria-label="Compartilhar"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.08] hover:text-foreground"
          >
            <Share2 className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {/* Hero */}
        <section className="relative mt-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0f]">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `radial-gradient(120% 90% at 85% 0%, ${meta.color}55 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, #6366f155 0%, transparent 60%), linear-gradient(180deg, #0a0a0f 0%, #050506 100%)`,
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
                maskImage:
                  "radial-gradient(70% 60% at 70% 30%, black, transparent)",
              }}
            />
            <div
              aria-hidden
              className="absolute -right-16 top-6 h-[220%] w-[3px] rotate-12"
              style={{
                background: `linear-gradient(180deg, transparent, ${meta.color}, transparent)`,
              }}
            />

            <div className="relative px-6 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-12">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: `${meta.color}66`,
                    color: meta.color,
                    backgroundColor: `${meta.color}18`,
                  }}
                >
                  <Icon className="h-3 w-3" strokeWidth={2.5} />
                  {meta.label}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/40">
                  {fmtLong(entry.created_at)} · {fmtTime(entry.created_at)}
                </span>
              </div>

              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/40">
                Patch {patch}
              </p>
              <h1 className="mt-2 text-[32px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[42px]">
                {entry.title}
              </h1>

              <div className="mt-6 flex items-center gap-3">
                <div
                  className="h-[3px] w-24 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">
                  Notas completas
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Body — Riot-style patch notes */}
        <article className="mt-10 animate-fade-in patch-notes">
          <RiotPatchBody text={fullText || entry.body} accent={meta.color} />
        </article>


        {/* Meta strip */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetaCell label="Categoria" value={meta.label} color={meta.color} />
          <MetaCell label="Patch" value={patch} />
          <MetaCell
            label="Publicado"
            value={fmtLong(entry.created_at)}
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* Prev / Next navigation */}
        {(prev || next) && (
          <nav className="mt-10 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <PatchNavCard
                direction="newer"
                to="/novidades/$id"
                params={{ id: prev.id }}
                title={prev.title}
                category={prev.category}
              />
            ) : (
              <div className="hidden sm:block" />
            )}
            {next ? (
              <PatchNavCard
                direction="older"
                to="/novidades/$id"
                params={{ id: next.id }}
                title={next.title}
                category={next.category}
              />
            ) : (
              <div className="hidden sm:block" />
            )}
          </nav>
        )}

        {/* Back to index */}
        <div className="mt-10 flex items-center justify-center">
          <Link
            to="/novidades"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground/70 transition hover:bg-white/[0.06] hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} /> Todas as notas
          </Link>
        </div>
      </div>
    </main>
  );
}

function MetaCell({
  label,
  value,
  color,
  className = "",
}: {
  label: string;
  value: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 ${className}`}
    >
      <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-foreground/40">
        {label}
      </p>
      <p
        className="mt-1 text-[13.5px] font-semibold"
        style={{ color: color ?? "hsl(var(--foreground))" }}
      >
        {value}
      </p>
    </div>
  );
}

function PatchNavCard({
  direction,
  to,
  params,
  title,
  category,
}: {
  direction: "newer" | "older";
  to: "/novidades/$id";
  params: { id: string };
  title: string;
  category: ChangelogCategory;
}) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.feature;
  const isNewer = direction === "newer";
  return (
    <Link
      to={to}
      params={params}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.05]"
    >
      {isNewer && (
        <ChevronLeft
          className="h-4 w-4 shrink-0 text-foreground/40 transition group-hover:-translate-x-0.5 group-hover:text-foreground/70"
          strokeWidth={2.25}
        />
      )}
      <div className={`min-w-0 flex-1 ${isNewer ? "" : "text-right"}`}>
        <p
          className="text-[9.5px] font-bold uppercase tracking-[0.24em]"
          style={{ color: meta.color }}
        >
          {isNewer ? "Mais recente" : "Anterior"}
        </p>
        <p className="mt-0.5 truncate text-[13.5px] font-semibold text-foreground">
          {title}
        </p>
      </div>
      {!isNewer && (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-foreground/70"
          strokeWidth={2.25}
        />
      )}
    </Link>
  );
}




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

        {Array.isArray(concept.gallery) && concept.gallery.length > 0 && (
          <section className="mt-14 animate-fade-in">
            <div className="mb-5 flex items-center gap-3">
              <span
                className="h-4 w-1 rounded-sm"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/70">
                Processo · Concept arts
              </h2>
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/40">
                {concept.gallery.length} peças
              </span>
            </div>
            <ol className="grid gap-6 sm:grid-cols-2">
              {concept.gallery.map((item, idx) => (
                <li
                  key={`${item.url}-${idx}`}
                  className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0a0f] transition hover:-translate-y-0.5 hover:border-white/20"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10"
                    style={{
                      background: `linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)`,
                    }}
                  />
                  <img
                    src={item.url}
                    alt={item.caption ?? item.tag ?? `Concept ${idx + 1}`}
                    loading="lazy"
                    className="block aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="relative z-20 -mt-24 px-5 pb-5 pt-24">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.22em]"
                        style={{
                          borderColor: `${accent}66`,
                          color: accent,
                          backgroundColor: `${accent}18`,
                        }}
                      >
                        {(item.tag && item.tag.trim()) || `Concept ${String(idx + 1).padStart(2, "0")}`}
                      </span>
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/35">
                        #{String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    {item.caption && item.caption.trim() && (
                      <p className="mt-2 text-[13px] leading-relaxed text-white/85 sm:text-[13.5px]">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}


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
