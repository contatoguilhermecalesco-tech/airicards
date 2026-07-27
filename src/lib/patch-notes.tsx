import { useMemo } from "react";

/* ============================================================
   Riot-style patch notes renderer
   Sintaxe leve suportada:
   - "## Título"        → cabeçalho de seção (bold itálico maiúsculo)
   - "### Sub"          → subcabeçalho
   - "- item"           → lista com bullet colorido
   - **negrito**        → rótulo/negrito
   - "=>" ou "->" ou "⇒" → seta entre valor antigo ⇒ novo
   - [NOVO] [REMOVIDO] [BUG] [AJUSTE] → tags coloridas inline
   - "---"              → divisor
   - Primeiro parágrafo antes de qualquer heading → pull-quote em serifa itálica
   ============================================================ */

type Block =
  | { type: "quote"; text: string }
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "hr" };

function parseRiotBody(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  let sawHeading = false;
  let firstParaConsumed = false;

  const flushPara = () => {
    if (para.length) {
      const text = para.join(" ").trim();
      if (text) {
        if (!sawHeading && !firstParaConsumed) {
          blocks.push({ type: "quote", text });
          firstParaConsumed = true;
        } else {
          blocks.push({ type: "p", text });
        }
      }
      para = [];
    }
  };
  const flushList = () => {
    if (list && list.length) {
      blocks.push({ type: "ul", items: list });
    }
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushPara();
      flushList();
      sawHeading = true;
      blocks.push({ type: "h2", text: line.replace(/^##\s+/, "") });
      continue;
    }
    if (/^###\s+/.test(line)) {
      flushPara();
      flushList();
      sawHeading = true;
      blocks.push({ type: "h3", text: line.replace(/^###\s+/, "") });
      continue;
    }
    if (/^---+$/.test(line)) {
      flushPara();
      flushList();
      blocks.push({ type: "hr" });
      continue;
    }
    if (/^[-*•]\s+/.test(line)) {
      flushPara();
      if (!list) list = [];
      list.push(line.replace(/^[-*•]\s+/, ""));
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

function InlineRich({ text }: { text: string }) {
  const tagRe = /\[(NOVO|REMOVIDO|BUG|NOVIDADE|AJUSTE|CONCEPT|ARTE|MOVIMENTO|SOM|PALETA)\]/gi;
  const parts: Array<{ kind: "text" | "tag"; value: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ kind: "text", value: text.slice(lastIndex, m.index) });
    }
    parts.push({ kind: "tag", value: m[1].toUpperCase() });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ kind: "text", value: text.slice(lastIndex) });
  }

  const renderText = (t: string, key: string) => {
    const normalized = t.replace(/=>/g, "⇒").replace(/->/g, "⇒");
    const boldSplit = normalized.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {boldSplit.map((chunk, i) => {
          if (/^\*\*[^*]+\*\*$/.test(chunk)) {
            return (
              <strong key={i} className="font-semibold text-foreground">
                {chunk.slice(2, -2)}
              </strong>
            );
          }
          const arrowSplit = chunk.split(/(⇒)/g);
          return (
            <span key={i}>
              {arrowSplit.map((c, j) =>
                c === "⇒" ? (
                  <span
                    key={j}
                    className="mx-1 font-bold text-foreground/50"
                    aria-hidden
                  >
                    ⇒
                  </span>
                ) : (
                  <span key={j}>{c}</span>
                ),
              )}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === "text") return renderText(p.value, `t${i}`);
        const styles: Record<string, string> = {
          NOVO: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
          NOVIDADE: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
          REMOVIDO: "bg-rose-500/15 text-rose-300 border-rose-400/30",
          BUG: "bg-amber-500/15 text-amber-300 border-amber-400/30",
          AJUSTE: "bg-sky-500/15 text-sky-300 border-sky-400/30",
        };
        return (
          <span
            key={`tag${i}`}
            className={`mr-1.5 inline-flex items-center rounded-[3px] border px-1.5 py-[1px] align-middle text-[9.5px] font-bold uppercase tracking-[0.14em] ${styles[p.value] ?? ""}`}
          >
            {p.value}
          </span>
        );
      })}
    </>
  );
}

export function RiotPatchBody({
  text,
  accent,
  compact = false,
}: {
  text: string;
  accent: string;
  compact?: boolean;
}) {
  const blocks = useMemo(() => parseRiotBody(text), [text]);
  if (blocks.length === 0) {
    return (
      <p
        className={
          compact
            ? "text-[13px] leading-relaxed text-foreground/70"
            : "text-[15px] leading-relaxed text-foreground/75"
        }
      >
        {text}
      </p>
    );
  }
  const gap = compact ? "space-y-4" : "space-y-6";
  return (
    <div className={gap}>
      {blocks.map((b, i) => {
        if (b.type === "quote") {
          return (
            <div key={i} className={`relative ${compact ? "pl-5" : "pl-6 sm:pl-8"}`}>
              <span
                aria-hidden
                className={`absolute left-0 top-0 select-none font-serif leading-none ${compact ? "text-[44px]" : "text-[64px]"}`}
                style={{ color: `${accent}bb` }}
              >
                “
              </span>
              <p
                className={
                  compact
                    ? "font-serif text-[14px] italic leading-[1.6] text-foreground/85"
                    : "font-serif text-[17px] italic leading-[1.65] text-foreground/85 sm:text-[18.5px]"
                }
              >
                <InlineRich text={b.text} />
              </p>
            </div>
          );
        }
        if (b.type === "h2") {
          return (
            <div key={i} className={compact ? "pt-2" : "pt-4"}>
              <h2
                className={
                  compact
                    ? "text-[16px] font-black italic uppercase tracking-[0.02em] text-foreground"
                    : "text-[22px] font-black italic uppercase tracking-[0.02em] text-foreground sm:text-[26px]"
                }
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {b.text}
              </h2>
              <div
                className="mt-2 h-[2px] w-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${accent}, ${accent}00)`,
                }}
              />
            </div>
          );
        }
        if (b.type === "h3") {
          return (
            <h3
              key={i}
              className={compact ? "pt-1 text-[12.5px] font-bold text-foreground" : "pt-2 text-[15px] font-bold text-foreground"}
            >
              {b.text}
            </h3>
          );
        }
        if (b.type === "hr") {
          return <hr key={i} className="border-white/10" />;
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="space-y-2 pl-1">
              {b.items.map((item, j) => (
                <li
                  key={j}
                  className={
                    compact
                      ? "relative pl-4 text-[12.5px] leading-[1.6] text-foreground/75"
                      : "relative pl-5 text-[14.5px] leading-[1.65] text-foreground/75 sm:text-[15.5px]"
                  }
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-[0.65em] h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <InlineRich text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className={
              compact
                ? "text-[13px] leading-[1.7] text-foreground/75"
                : "text-[15px] leading-[1.75] text-foreground/75 sm:text-[16px]"
            }
          >
            <InlineRich text={b.text} />
          </p>
        );
      })}
    </div>
  );
}

export const RIOT_NOTES_PLACEHOLDER = `Um parágrafo de abertura vira uma citação em serifa itálica — o "olá, jogador" do patch.

## Destaques da atualização
Um parágrafo curto contextualizando o que vem por aí neste patch.

## Estudo
### Cartas inimigas
- [NOVO] **Escudo de HP:** agora cada erro consome HP visível na tela.
- **Vibração no erro:** desativada => reativada em 15ms
- [AJUSTE] **Tempo de recarga:** 120s ⇒ 90s

## Social
### Duelo
- [REMOVIDO] Botão "encerrar duelo" aparecia duplicado.
- [BUG] Placar não atualizava ao vencer por WO.

---

Feche com uma linha celebrando a mudança ou agradecendo o feedback da galera.`;
