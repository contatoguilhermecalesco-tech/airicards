import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wrench,
  Wand2,
  ArrowUpRight,
  Package,
} from "lucide-react";
import {
  initChangelog,
  markAllChangelogSeen,
  useChangelog,
  type ChangelogCategory,
  type ChangelogEntry,
} from "@/lib/changelog-store";
import {
  initBundleConcepts,
  useBundleConcepts,
  type BundleConcept,
} from "@/lib/bundle-concepts-store";
import { resolveNotificationIcon } from "@/lib/notification-icons";

export const Route = createFileRoute("/novidades/")({
  head: () => ({
    meta: [
      { title: "Novidades — airi" },
      {
        name: "description",
        content:
          "Tudo o que chegou de novo no airi: novidades, melhorias e ajustes recentes.",
      },
      { property: "og:title", content: "Novidades do airi" },
      {
        property: "og:description",
        content: "Descubra o que há de novo no seu app de estudo de inglês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovidadesPage,
});

type Meta = { label: string; color: string; Icon: typeof Sparkles };

const CATEGORY_META: Record<ChangelogCategory, Meta> = {
  feature: { label: "Novo", color: "#a78bfa", Icon: Sparkles },
  improvement: { label: "Melhoria", color: "#60a5fa", Icon: Wand2 },
  fix: { label: "Ajuste", color: "#34d399", Icon: Wrench },
};

function fmtDay(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    })
      .format(new Date(iso))
      .replace(".", "")
      .toUpperCase();
  } catch {
    return "";
  }
}

function fmtMonthTitle(iso: string) {
  try {
    const d = new Date(iso);
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(d);
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return "";
  }
}

/** Deterministic "patch" number based on entry id/date. */
function patchNumberFor(entry: ChangelogEntry, index: number) {
  const d = new Date(entry.created_at);
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const seq = String(index + 1).padStart(2, "0");
  return `${y}.${m}.${seq}`;
}

function groupByMonth(entries: ChangelogEntry[]) {
  const groups = new Map<string, ChangelogEntry[]>();
  for (const e of entries) {
    const key = fmtMonthTitle(e.created_at);
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

function NovidadesPage() {
  const { entries, lastSeen } = useChangelog();
  const { items: concepts } = useBundleConcepts();
  const [tab, setTab] = useState<"patches" | "concepts">("patches");

  useEffect(() => {
    void initChangelog().then(() => {
      window.setTimeout(() => markAllChangelogSeen(), 600);
    });
    void initBundleConcepts();
  }, []);

  const [featured, ...rest] = entries;
  const highlights = useMemo(() => rest.slice(0, 3), [rest]);
  const restAfterHighlights = useMemo(() => rest.slice(3), [rest]);
  const grouped = useMemo(
    () => groupByMonth(restAfterHighlights),
    [restAfterHighlights],
  );
  const featuredMeta = featured ? CATEGORY_META[featured.category] : null;
  const featuredPatch = featured ? patchNumberFor(featured, 0) : "";
  const featuredIsNew =
    featured && new Date(featured.created_at).getTime() > lastSeen;

  return (
    <main className="relative min-h-screen bg-background pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3.5 sm:px-8">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.08] hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <div className="flex flex-1 items-baseline gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary/80">
              airi
            </span>
            <span className="text-[10px] uppercase tracking-[0.24em] text-foreground/30">
              / {tab === "patches" ? "patch notes" : "bundle concepts"}
            </span>
          </div>
        </div>
        {/* Tabs */}
        <div className="mx-auto flex max-w-3xl items-center gap-1 px-5 pb-2 sm:px-8">
          {[
            { key: "patches" as const, label: "Patch notes", Icon: Sparkles },
            { key: "concepts" as const, label: "Bundle concepts", Icon: Package },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition ${
                  active
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/[0.02] text-foreground/55 hover:bg-white/[0.05] hover:text-foreground/80"
                }`}
              >
                <t.Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {tab === "concepts" ? (
          <ConceptsTab concepts={concepts} />
        ) : entries.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-sm text-foreground/70">
              Ainda sem novidades por aqui.
            </p>
            <p className="mt-1 text-xs text-foreground/45">
              Assim que algo novo chegar, aparece nesta lista.
            </p>
          </div>
        ) : (
          <div className="mt-16 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-sm text-foreground/70">
              Ainda sem novidades por aqui.
            </p>
            <p className="mt-1 text-xs text-foreground/45">
              Assim que algo novo chegar, aparece nesta lista.
            </p>
          </div>
        ) : (
          <>
            {/* HERO — Patch cover, Riot-style */}
            {featured && featuredMeta && (
              <section className="relative mt-6 animate-fade-in">
                <Link
                  to="/novidades/$id"
                  params={{ id: featured.id }}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a0f] transition group-hover:border-white/20">
                    {/* Editorial gradient art */}
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(120% 90% at 85% 0%, ${featuredMeta.color}55 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, #6366f155 0%, transparent 60%), linear-gradient(180deg, #0a0a0f 0%, #050506 100%)`,
                      }}
                    />
                    {/* Grid overlay */}
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
                    {/* Diagonal accent line */}
                    <div
                      aria-hidden
                      className="absolute -right-16 top-6 h-[220%] w-[3px] rotate-12"
                      style={{
                        background: `linear-gradient(180deg, transparent, ${featuredMeta.color}, transparent)`,
                      }}
                    />

                    <div className="relative px-6 pb-7 pt-8 sm:px-10 sm:pb-10 sm:pt-12">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                          style={{
                            borderColor: `${featuredMeta.color}66`,
                            color: featuredMeta.color,
                            backgroundColor: `${featuredMeta.color}18`,
                          }}
                        >
                          {featuredIsNew ? (
                            <>
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor: featuredMeta.color,
                                  boxShadow: `0 0 8px ${featuredMeta.color}`,
                                }}
                              />
                              Novo
                            </>
                          ) : (
                            featuredMeta.label
                          )}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/40">
                          {fmtDay(featured.created_at)}
                        </span>
                      </div>

                      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/40">
                        Patch {featuredPatch}
                      </p>
                      <h1 className="mt-2 text-[34px] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-[44px]">
                        {featured.title}
                      </h1>
                      <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-foreground/65 sm:text-[15px]">
                        {featured.body}
                      </p>

                      <div className="mt-6 flex items-center gap-3">
                        <div
                          className="h-[3px] flex-1 max-w-[80px] rounded-full"
                          style={{ backgroundColor: featuredMeta.color }}
                        />
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition group-hover:-translate-y-0.5"
                          style={{
                            borderColor: `${featuredMeta.color}66`,
                            color: featuredMeta.color,
                            backgroundColor: `${featuredMeta.color}1a`,
                            boxShadow: `0 8px 24px -12px ${featuredMeta.color}88`,
                          }}
                        >
                          Ler notas completas
                          <ArrowUpRight
                            className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            strokeWidth={2.5}
                          />
                        </span>
                      </div>

                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* HIGHLIGHTS strip */}
            {highlights.length > 0 && (
              <section className="mt-10 animate-fade-in">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-4 w-1 rounded-sm bg-primary" />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/70">
                    Destaques da versão
                  </h2>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                <ul className="grid gap-3 sm:grid-cols-3">
                  {highlights.map((e) => {
                    const meta = CATEGORY_META[e.category] ?? CATEGORY_META.feature;
                    const Icon = e.icon
                      ? resolveNotificationIcon(e.icon, null, e.title)
                      : meta.Icon;
                    const isNew =
                      new Date(e.created_at).getTime() > lastSeen;
                    return (
                      <li key={e.id}>
                        <Link
                          to="/novidades/$id"
                          params={{ id: e.id }}
                          className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.05]"
                          style={{
                            boxShadow: isNew
                              ? `inset 3px 0 0 0 ${meta.color}`
                              : undefined,
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className="grid h-9 w-9 place-items-center rounded-xl border"
                              style={{
                                backgroundColor: `${meta.color}18`,
                                borderColor: `${meta.color}3d`,
                                color: meta.color,
                              }}
                            >
                              <Icon className="h-4 w-4" strokeWidth={2.25} />
                            </div>
                            <ArrowUpRight
                              className="h-4 w-4 text-foreground/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground/60"
                              strokeWidth={2.25}
                            />
                          </div>
                          <p
                            className="mt-3 text-[9.5px] font-bold uppercase tracking-[0.2em]"
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </p>
                          <h3 className="mt-1 text-[15px] font-semibold leading-snug text-foreground">
                            {e.title}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-foreground/55">
                            {e.body}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* PATCH NOTES — grouped by month */}
            {grouped.length > 0 && (
              <div className="mt-12 space-y-14">
                {grouped.map(([month, list]) => (
                  <section key={month} className="animate-fade-in">
                    {/* Section headline — Riot editorial style */}
                    <div className="mb-6 flex items-end justify-between border-b border-white/10 pb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40">
                          Arquivo
                        </p>
                        <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
                          {month}
                        </h2>
                      </div>
                      <span className="pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/35">
                        {list.length}{" "}
                        {list.length === 1 ? "nota" : "notas"}
                      </span>
                    </div>

                    <ul className="space-y-4">
                      {list.map((e, idx) => {
                        const meta =
                          CATEGORY_META[e.category] ?? CATEGORY_META.feature;
                        const Icon = e.icon
                          ? resolveNotificationIcon(e.icon, null, e.title)
                          : meta.Icon;
                        const isNew =
                          new Date(e.created_at).getTime() > lastSeen;
                        const patch = patchNumberFor(e, idx + highlights.length + 1);

                        return (
                          <li key={e.id}>
                            <Link
                              to="/novidades/$id"
                              params={{ id: e.id }}
                              className="group relative flex gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 pl-5 transition hover:-translate-y-px hover:border-white/[0.14] hover:bg-white/[0.045] sm:p-5 sm:pl-6"
                            >
                              {/* Left accent bar (category color) */}
                              <span
                                aria-hidden
                                className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
                                style={{
                                  backgroundColor: meta.color,
                                  opacity: isNew ? 1 : 0.55,
                                  boxShadow: isNew
                                    ? `0 0 12px ${meta.color}88`
                                    : undefined,
                                }}
                              />

                              <div
                                className="hidden sm:grid h-11 w-11 shrink-0 place-items-center rounded-xl border"
                                style={{
                                  backgroundColor: `${meta.color}15`,
                                  borderColor: `${meta.color}33`,
                                  color: meta.color,
                                }}
                              >
                                <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                  <span
                                    className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
                                    style={{ color: meta.color }}
                                  >
                                    {meta.label}
                                  </span>
                                  <span className="text-[10px] font-semibold tabular-nums uppercase tracking-[0.14em] text-foreground/35">
                                    {patch}
                                  </span>
                                  <span className="text-foreground/20">•</span>
                                  <span className="text-[10px] font-semibold tabular-nums uppercase tracking-[0.14em] text-foreground/35">
                                    {fmtDay(e.created_at)}
                                  </span>
                                  {isNew && (
                                    <span
                                      className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                      style={{
                                        backgroundColor: `${meta.color}22`,
                                        color: meta.color,
                                        border: `1px solid ${meta.color}55`,
                                      }}
                                    >
                                      Novo
                                    </span>
                                  )}
                                </div>

                                <h3 className="mt-1.5 text-[16px] font-semibold leading-snug text-foreground sm:text-[17px]">
                                  {e.title}
                                </h3>
                                <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-foreground/60 sm:text-[13.5px]">
                                  {e.body}
                                </p>
                              </div>

                              <ChevronRight
                                className="mt-1 hidden h-4 w-4 shrink-0 self-center text-foreground/25 transition group-hover:translate-x-0.5 group-hover:text-foreground/60 sm:block"
                                strokeWidth={2.25}
                              />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}

            {/* Footer signature */}
            <div className="mt-16 flex items-center justify-center gap-3 text-foreground/25">
              <span className="h-px w-10 bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
                airi · patch notes
              </span>
              <span className="h-px w-10 bg-white/10" />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
