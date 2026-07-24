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
      { name: "description", content: "Tudo o que chegou de novo no airi: novidades, melhorias e ajustes recentes." },
      { property: "og:title", content: "Novidades do airi" },
      { property: "og:description", content: "Descubra o que há de novo no seu app de estudo de inglês." },
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

function formatDate(iso: string) {
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
      // marca como visto após ver a tela
      window.setTimeout(() => markAllChangelogSeen(), 600);
    });
  }, []);

  const grouped = useMemo(() => groupByMonth(entries), [entries]);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-white/[0.06] hover:text-foreground"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
            airi
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
            Novidades
          </h1>
        </div>
      </div>

      {/* Hero */}
      <section className="mb-6 overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-primary/[0.14] via-white/[0.02] to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/20 text-primary">
            <Sparkles className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">
              O que há de novo
            </p>
            <p className="mt-0.5 text-[12px] text-foreground/60">
              Melhorias, correções e recursos que chegaram ao seu app.
            </p>
          </div>
        </div>
      </section>

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
        <div className="space-y-8">
          {grouped.map(([month, list]) => (
            <section key={month}>
              <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
                {month}
              </h2>
              <ul className="space-y-3">
                {list.map((e) => {
                  const meta = CATEGORY_META[e.category] ?? CATEGORY_META.feature;
                  const isNew = new Date(e.created_at).getTime() > lastSeen;
                  const Icon = e.icon
                    ? resolveNotificationIcon(e.icon, null, e.title)
                    : meta.Icon;
                  return (
                    <li
                      key={e.id}
                      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
                    >
                      {isNew && (
                        <span
                          className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${meta.color}22`,
                            color: meta.color,
                            border: `1px solid ${meta.color}55`,
                          }}
                        >
                          Novo
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border"
                          style={{
                            backgroundColor: `${meta.color}1c`,
                            borderColor: `${meta.color}44`,
                            color: meta.color,
                          }}
                        >
                          <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                              style={{
                                backgroundColor: `${meta.color}18`,
                                color: meta.color,
                                border: `1px solid ${meta.color}33`,
                              }}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-foreground/45">
                              {formatDate(e.created_at)}
                            </span>
                          </div>
                          <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-foreground">
                            {e.title}
                          </h3>
                          <p className="mt-1 text-[13px] leading-relaxed text-foreground/70">
                            {e.body}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
