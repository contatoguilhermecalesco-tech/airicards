import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const Input = z.object({
  week: z.number().int().min(1).max(8),
  topic: z.string().min(1).max(200),
  application: z.string().min(1).max(400),
  lessonSummary: z.string().max(4000).optional(),
  question: z.string().min(1).max(2000),
  history: z.array(MessageSchema).max(20).optional(),
});

export type GrammarTutorMessage = z.infer<typeof MessageSchema>;

/**
 * Chat de tutor de gramática. IA age como professor universitário,
 * respondendo dúvidas do aluno no contexto da aula da semana.
 */
export const askGrammarTutor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ answer: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você é um professor universitário de inglês, paciente, didático e rigoroso, tutorando alunos brasileiros.",
      "Responda SEMPRE em português brasileiro, com clareza e profundidade — sem jargão gratuito, mas sem simplificar demais.",
      `A aula atual é da semana ${data.week}, tópico "${data.topic}" (${data.application}).`,
      "Mantenha o foco no tópico da aula, mas responda a dúvidas relacionadas quando o aluno perguntar.",
      "Sempre que possível: (1) dê exemplos em inglês com tradução, (2) contraste com o português, (3) aponte armadilhas comuns de brasileiros.",
      "Use markdown leve: **negrito** para termos, listas quando ajudar, blocos de exemplo curtos.",
      "Se o aluno pedir algo fora de gramática/inglês, redirecione com gentileza para o estudo.",
      "Nunca invente respostas — se não tiver certeza, explique o que sabe e proponha como investigar.",
      data.lessonSummary
        ? `Resumo da aula atual para contexto:\n${data.lessonSummary.slice(0, 2000)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const messages = [
      { role: "system" as const, content: system },
      ...(data.history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: data.question },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Muitas perguntas seguidas. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha no tutor (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!answer) throw new Error("O tutor não conseguiu responder. Tente reformular.");
    return { answer };
  });
