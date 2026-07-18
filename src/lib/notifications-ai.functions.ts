import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  prompt: z.string().min(1).max(500),
  tag: z.string().max(60).optional(),
});

export type NotificationDraft = {
  title: string;
  body: string;
};

/**
 * Gera título + corpo de notificação em pt-BR a partir de uma ideia curta do admin.
 * Tom: iOS/Apple — direto, gentil, sem emoji excessivo, sem clichê de IA.
 */
export const generateNotification = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<NotificationDraft> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você escreve notificações curtas em português brasileiro para um app de estudo de inglês chamado airi.",
      "Tom: elegante, direto e gentil — inspirado em copy da Apple (iOS). Nada de emojis em excesso, nada de jargão de IA, nada de exclamações duplas.",
      "Título: até 48 caracteres, sem ponto final, sem emojis (no máximo 1 se fizer sentido).",
      "Corpo: 1 a 2 frases, até 220 caracteres. Claro, útil, orientado a ação quando fizer sentido.",
      data.tag ? `A notificação pertence à categoria: "${data.tag}". Use isso como contexto.` : "",
      "Responda SOMENTE JSON válido, sem markdown, no formato:",
      `{"title": string, "body": string}`,
    ]
      .filter(Boolean)
      .join(" ");

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
      const parsed = JSON.parse(content) as NotificationDraft;
      return {
        title: (parsed.title ?? "").slice(0, 80).trim(),
        body: (parsed.body ?? "").slice(0, 280).trim(),
      };
    } catch {
      throw new Error("A IA retornou uma resposta inesperada. Tente de novo.");
    }
  });
