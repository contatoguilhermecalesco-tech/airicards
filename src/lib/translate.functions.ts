import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  text: z.string().min(1).max(2000),
  context: z.string().max(8000).optional(),
});

type Result = { translation: string; alternatives?: string[]; note?: string };

/**
 * Traduz uma palavra ou frase de inglês para português (pt-BR) usando
 * Lovable AI Gateway. Foco em precisão semântica, não literalidade.
 */
export const translateEnToPt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você é um tradutor profissional inglês → português brasileiro.",
      "Traduza preservando o significado, o registro (formal/informal), gírias, expressões idiomáticas e nuances.",
      "Nunca traduza palavra por palavra: entregue a forma como um brasileiro nativo diria.",
      "Se houver ambiguidade, escolha o sentido mais comum e liste no máximo 2 alternativas curtas.",
      "Responda SOMENTE JSON no formato: {\"translation\": string, \"alternatives\"?: string[], \"note\"?: string}. Sem markdown.",
    ].join(" ");

    const user = data.context
      ? `Traduza para pt-BR: "${data.text}"\nContexto: ${data.context}`
      : `Traduza para pt-BR: "${data.text}"`;

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
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Muitas traduções seguidas. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha na tradução (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(content) as Result;
      if (!parsed.translation) throw new Error("Resposta vazia");
      return parsed;
    } catch {
      // Fallback: usa o próprio texto se não veio JSON válido.
      return { translation: content.trim() || "" };
    }
  });
