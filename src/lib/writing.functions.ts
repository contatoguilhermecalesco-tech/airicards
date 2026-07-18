import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  text: z.string().min(1).max(4000),
  prompt: z.string().max(500).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export type WritingIssue = {
  original: string;
  correction: string;
  type: string; // "grammar" | "spelling" | "vocabulary" | "concordance" | "style" | "punctuation" | ...
  explanation: string; // pt-BR, tom de professor
  tip?: string; // dica prática de como não errar de novo
};

export type WritingFeedback = {
  correctedText: string;
  overallFeedback: string; // resumo em pt-BR, encorajador e didático
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  issues: WritingIssue[];
  nextSteps: string[]; // exercícios ou focos para melhorar
};

/**
 * Corrige uma redação em inglês agindo como um professor particular.
 * Foco: mostrar o erro, corrigir, e ENSINAR como não errar de novo.
 */
export const correctWriting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<WritingFeedback> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você é um professor particular de inglês, paciente, encorajador e didático, corrigindo redações de alunos brasileiros.",
      "Sua missão não é só apontar erros — é ENSINAR o aluno a não errar de novo.",
      "Explique tudo em português brasileiro, com clareza, empatia e sem jargão. Trate o aluno com respeito.",
      "Para cada erro: mostre o trecho original, a correção, o tipo do erro, uma explicação didática (o PORQUÊ do erro em pt-BR) e uma DICA prática de como lembrar.",
      "Nunca reescreva o texto inteiro sem manter a voz do aluno. Preserve o estilo dele; corrija só o que está errado ou pouco natural.",
      "Sempre elogie o que está bom (strengths) antes de sugerir melhorias. Termine com nextSteps: 2-4 focos concretos de estudo.",
      "Score de 0 a 100 reflete precisão + naturalidade + coerência.",
      "Responda SOMENTE JSON válido no formato exato abaixo, sem markdown, sem comentários:",
      `{
  "correctedText": string,
  "overallFeedback": string,
  "score": number,
  "strengths": string[],
  "improvements": string[],
  "issues": [{"original": string, "correction": string, "type": string, "explanation": string, "tip"?: string}],
  "nextSteps": string[]
}`,
    ].join(" ");

    const userMsg = [
      data.prompt ? `Tema/proposta da redação: ${data.prompt}` : null,
      data.level ? `Nível declarado do aluno: ${data.level}` : null,
      "Texto do aluno (em inglês):",
      data.text,
    ]
      .filter(Boolean)
      .join("\n\n");

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
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Muitas correções seguidas. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha na correção (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(content) as WritingFeedback;
      return {
        correctedText: parsed.correctedText ?? data.text,
        overallFeedback: parsed.overallFeedback ?? "",
        score: typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : 0,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      };
    } catch {
      throw new Error("A IA retornou uma resposta inesperada. Tente de novo.");
    }
  });
