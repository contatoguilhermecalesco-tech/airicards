import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { ChevronLeft, Sparkles, Wrench, Wand2 } from "lucide-react";
import {
  initChangelog,
  markAllChangelogSeen,
  useChangelog,
  type ChangelogCategory,
  type ChangelogEntry,
} from "@/lib/changelog-store";
import { resolveNotificationIcon } from "@/lib/notification-icons";

export const Route = createFileRoute("/novidades")({
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

const CATEGORY_META: Record<
  ChangelogCategory,
  { label: string; color: string; Icon: typeof Sparkles }
> = {
  feature: { label: "Novo", color: "#a78bfa", Icon: Sparkles },
  improvement: { label: "Melhoria", color: "#60a5fa", Icon: Wand2 },
  fix: { label: "Ajuste", color: "#34d399", Icon: Wrench },
};

function formatShortDate(iso: string) {
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

function formatLongDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function groupByMonth(entries: ChangelogEntry[]) {
  const groups = new Map<string, ChangelogEntry[]>();
  for (const e of entries) {
    const d = new Date(e.created_at);
    const key = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(d);
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    const list = groups.get(label) ?? [];
    list.push(e);
    groups.set(label, list);
  }
  return Array.from(groups.entries());
}

function NovidadesPage() {
  const { entries, lastSeen } = useChangelog();

  useEffect(() => {
    void initChangelog().then(() => {
      window.setTimeout(() => markAllChangelogSeen(), 600);
    });
  }, []);

  const [featured, ...rest] = entries;
  const grouped = useMemo(() => groupByMonth(rest), [rest]);
  const featuredMeta = featured
    ? CATEGORY_META[featured.category] ?? CATEGORY_META.feature
    : null;
  const featuredIsNew =
    featured && new Date(featured.created_at).getTime() > lastSeen;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-6 sm:px-8 sm:pt-10">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-1 animate-fade-in">
        <div className="mb-2 flex items-center gap-2">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.08] hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
            airi
          </span>
        </div>
        <h1 className="text-[30px] font-semibold tracking-tight text-foreground">
          Novidades
        </h1>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-sm text-foreground/70">
            Ainda sem novidades por aqui.
          </p>
          <p className="mt-1 text-xs text-foreground/45">
            Assim que algo novo chegar, aparece nesta lista.
          </p>
        </div>
      ) : (
        <>
          {/* Featured hero — latest entry */}
          {featured && featuredMeta && (
            <section className="relative mb-10 animate-fade-in">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-0.5 rounded-[28px] opacity-25 blur-xl"
                style={{
                  background: `linear-gradient(120deg, ${featuredMeta.color}, #6366f1)`,
                }}
              />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span
                    className="rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${featuredMeta.color}26`,
                      borderColor: `${featuredMeta.color}55`,
                      color: featuredMeta.color,
                    }}
                  >
                    {featuredIsNew ? "Destaque" : featuredMeta.label}
                  </span>
                  <span className="text-xs text-foreground/40">
                    {formatLongDate(featured.created_at)}
                  </span>
                </div>
                <h2 className="mb-2 text-xl font-semibold leading-tight text-foreground">
                  {featured.title}
                </h2>
                <p className="text-[13.5px] leading-relaxed text-foreground/60">
                  {featured.body}
                </p>
                <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full w-1/3 rounded-full"
                    style={{ backgroundColor: featuredMeta.color }}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Timeline groups */}
          <div className="space-y-10">
            {grouped.map(([month, list]) => (
              <section key={month} className="flex flex-col gap-6 animate-fade-in">
                <div className="flex items-center gap-4">
                  <h3 className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/35">
                    {month}
                  </h3>
                  <div className="h-px w-full bg-white/[0.06]" />
                </div>

                <div className="relative space-y-8">
                  {/* Vertical spine */}
                  <div
                    aria-hidden
                    className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-white/[0.06] to-transparent"
                  />

                  {list.map((e) => {
                    const meta =
                      CATEGORY_META[e.category] ?? CATEGORY_META.feature;
                    const isNew =
                      new Date(e.created_at).getTime() > lastSeen;
                    const Icon = e.icon
                      ? resolveNotificationIcon(e.icon, null, e.title)
                      : meta.Icon;

                    return (
                      <article
                        key={e.id}
                        className="relative pl-8 transition hover:-translate-y-px"
                      >
                        {/* Timeline node */}
                        <div
                          aria-hidden
                          className="absolute left-0 top-1 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-background"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: isNew
                                ? meta.color
                                : "rgba(255,255,255,0.2)",
                              boxShadow: isNew
                                ? `0 0 10px ${meta.color}99`
                                : undefined,
                              animation: isNew
                                ? "pulse 2.4s ease-in-out infinite"
                                : undefined,
                            }}
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                              style={{ color: meta.color }}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[10px] tabular-nums text-foreground/30">
                              {formatShortDate(e.created_at)}
                            </span>
                            {isNew && (
                              <span
                                aria-label="Nova"
                                className="ml-0.5 h-1 w-1 rounded-full"
                                style={{ backgroundColor: meta.color }}
                              />
                            )}
                          </div>
                          <div className="flex items-start gap-2">
                            <Icon
                              className="mt-0.5 h-3.5 w-3.5 shrink-0"
                              strokeWidth={2.25}
                              style={{ color: meta.color, opacity: 0.75 }}
                            />
                            <h4 className="text-[15px] font-semibold leading-snug text-foreground/95">
                              {e.title}
                            </h4>
                          </div>
                          <p className="text-[12.5px] leading-relaxed text-foreground/55">
                            {e.body}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
