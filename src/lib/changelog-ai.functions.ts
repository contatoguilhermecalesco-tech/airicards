import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CATEGORY = z.enum(["feature", "improvement", "fix"]);

const Input = z.object({
  prompt: z.string().min(1).max(500),
  category: CATEGORY.optional(),
});

export type ChangelogDraft = {
  title: string;
  body: string;
};

/**
 * Gera título + corpo de uma "novidade" (changelog) em pt-BR.
 * Tom: iOS/Apple release notes — direto, elegante, celebrando o que mudou.
 */
export const generateChangelogEntry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ChangelogDraft> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const categoryHint = data.category === "fix"
      ? "É uma correção — enfatize que algo foi ajustado ou consertado."
      : data.category === "improvement"
        ? "É uma melhoria — enfatize refinamento em algo que já existia."
        : "É uma novidade — enfatize algo novo que o usuário pode experimentar.";

    const system = [
      "Você escreve entradas de 'novidades' (changelog / release notes) em português brasileiro para um app de estudo de inglês chamado airi.",
      "Tom: elegante, direto e humano — inspirado nas release notes da Apple no iOS. Nada de emojis em excesso, nada de jargão técnico, nada de 'agora com IA'.",
      "Título: até 52 caracteres, sem ponto final, sem prefixos como 'Novo:' ou 'Atualização:'. Só o nome/essência da mudança.",
      "Corpo: 1 a 2 frases, até 240 caracteres, explicando o que muda e por que é útil para quem usa o app.",
      categoryHint,
      "Responda SOMENTE JSON válido, sem markdown, no formato:",
      `{"title": string, "body": string}`,
    ].join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
      const parsed = JSON.parse(content) as ChangelogDraft;
      return {
        title: (parsed.title ?? "").slice(0, 80).trim(),
        body: (parsed.body ?? "").slice(0, 280).trim(),
      };
    } catch {
      throw new Error("A IA retornou uma resposta inesperada. Tente de novo.");
    }
  });
