import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  prompt: z.string().min(1).max(1500),
  currentTitle: z.string().max(120).optional(),
  currentTagline: z.string().max(200).optional(),
  currentConcept: z.string().max(8000).optional(),
  mode: z.enum(["full", "refine", "tagline", "concept"]).default("full"),
});

export type BundleConceptDraft = {
  title: string;
  tagline: string;
  concept: string;
};

/**
 * Gera título + tagline + concept diary (Riot-style) para um bundle.
 * Tom: diário de criação de skins da Riot Games — cinematográfico, poético, mostrando o processo.
 */
export const generateBundleConcept = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<BundleConceptDraft> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const modeHint =
      data.mode === "tagline"
        ? "Foco: apenas polir a tagline. Mantenha título e concept praticamente iguais."
        : data.mode === "concept"
          ? "Foco: reescrever/expandir o concept diary. Mantenha o título."
          : data.mode === "refine"
            ? "Refinamento: melhore o que já existe sem mudar a essência. Mantenha o tom e as ideias-chave."
            : "Geração completa a partir da ideia do usuário.";

    const context = [
      data.currentTitle && `Título atual: ${data.currentTitle}`,
      data.currentTagline && `Tagline atual: ${data.currentTagline}`,
      data.currentConcept && `Concept atual:\n${data.currentConcept}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const system = [
      "Você escreve DIÁRIOS DE CRIAÇÃO de bundles cosméticos (skins) para um app chamado airi.",
      "Referência absoluta: os dev diaries da Riot Games para skins de League of Legends (Spirit Blossom, Coven, Star Guardian, DRX, Solo Leveling). Cinematográfico, poético, íntimo, mostrando o PROCESSO por trás da arte.",
      "Idioma: português brasileiro. Sem emojis. Sem 'agora com IA'. Sem jargão técnico. Sem bullet points genéricos de marketing.",
      "",
      "ESTRUTURA DE SAÍDA (JSON):",
      '{"title": string, "tagline": string, "concept": string}',
      "",
      "TÍTULO: 2 a 4 palavras, evocativo, sem artigo inicial. Ex.: 'Florescer Celestial', 'Monarca das Sombras', 'Coração de Neblina'.",
      "",
      "TAGLINE: uma única frase curta e cinematográfica (até 90 caracteres), sem ponto final. Ex.: 'Quando as pétalas caem, os espíritos acordam'.",
      "",
      "CONCEPT (Riot-style diary — use a sintaxe leve abaixo, é renderizada como patch notes):",
      "- Abra com UM parágrafo em prosa. Vira uma citação em serifa itálica no topo (o 'olá' do diário). Sem título antes dele.",
      "- Use '## Nome da Seção' para separar as etapas do processo. Sugestões: '## A Semente', '## Referências', '## A Composição', '## A Paleta', '## Os Personagens', '## A Animação', '## O Som'. Escolha 3 a 5 seções que façam sentido para a ideia.",
      "- Dentro de cada seção, use '### Subitem' para o nome do item/momento (opcional) e bullets com '- ' para detalhes.",
      "- Nos bullets, use '**Rótulo:**' em negrito antes do detalhe quando ajudar leitura.",
      "- Tags inline em MAIÚSCULAS entre colchetes quando fizer sentido: [CONCEPT], [ARTE], [MOVIMENTO], [SOM], [PALETA].",
      "- Use '---' em uma linha para inserir um divisor antes do parágrafo de fechamento.",
      "- Feche com um parágrafo curto de assinatura do time criativo, chamando o jogador pela emoção que o bundle desperta.",
      "",
      "EXTENSÃO: 350–700 palavras no concept. Prosa densa, não lista de features. Descreva sensações, cores, silhuetas, sons, movimento — não 'o que o usuário ganha'.",
      "",
      "IMPORTANTE: NÃO invente números, preços, quantidade de itens, mecânicas de gameplay ou datas. Fique na atmosfera criativa.",
      "",
      modeHint,
      context && "",
      context && "CONTEXTO EXISTENTE (respeite ao refinar):",
      context,
      "",
      "Responda SOMENTE JSON válido, sem markdown wrapper.",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Muitas gerações seguidas. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha ao gerar (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(content) as Partial<BundleConceptDraft>;
      return {
        title: (parsed.title ?? "").slice(0, 80).trim(),
        tagline: (parsed.tagline ?? "").slice(0, 140).trim(),
        concept: (parsed.concept ?? "").slice(0, 8000).trim(),
      };
    } catch {
      throw new Error("A IA retornou uma resposta inesperada. Tente de novo.");
    }
  });
