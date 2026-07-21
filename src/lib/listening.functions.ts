import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GenInput = z.object({
  level: z.enum(["beginner", "intermediate", "advanced"]),
  topic: z.string().max(200).optional(),
});

export type ListeningPassage = {
  title: string;
  transcript: string; // English text (2-5 sentences)
  translation: string; // pt-BR
  questions: { q: string; a: string }[]; // 2-3 comprehension questions in pt-BR
  vocabulary: { word: string; meaning: string }[]; // 3-6 key words
};

export const generateListening = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => GenInput.parse(i))
  .handler(async ({ data }): Promise<ListeningPassage> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const wordRange =
      data.level === "beginner"
        ? "35-55 palavras, vocabulário simples e presente/passado simples"
        : data.level === "advanced"
          ? "80-130 palavras, vocabulário rico, phrasal verbs, tempos compostos"
          : "55-85 palavras, vocabulário intermediário e variedade de tempos";

    const system = [
      "Você gera passagens curtas em INGLÊS para treino de listening de alunos brasileiros.",
      "Escreva um trecho natural, do dia-a-dia, com ritmo de fala real (contrações, conectivos, entonação implícita).",
      `Tamanho: ${wordRange}.`,
      "Nunca coloque marcações de fonética, apenas o texto em inglês corrido.",
      "Depois traduza para pt-BR de forma natural (não literal).",
      "Gere 2-3 perguntas de compreensão em pt-BR com respostas curtas e diretas em pt-BR.",
      "Liste 3-6 palavras/expressões-chave do trecho com o significado em pt-BR.",
      "Responda SOMENTE JSON válido:",
      `{"title": string, "transcript": string, "translation": string, "questions":[{"q": string, "a": string}], "vocabulary":[{"word": string, "meaning": string}]}`,
    ].join(" ");

    const user = data.topic
      ? `Tema sugerido: ${data.topic}. Nível: ${data.level}.`
      : `Escolha um tema cotidiano variado. Nível: ${data.level}.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
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
      if (res.status === 429) throw new Error("Muitas requisições. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error(`Falha (${res.status})`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as ListeningPassage;
    return {
      title: parsed.title ?? "Listening",
      transcript: parsed.transcript ?? "",
      translation: parsed.translation ?? "",
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
    };
  });

const GradeInput = z.object({
  reference: z.string().min(1).max(4000),
  attempt: z.string().min(1).max(4000),
});

export type ListeningGrade = {
  score: number; // 0-100
  accuracy: string; // pt-BR resumo
  strengths: string[];
  misses: { heard: string; actual: string; tip: string }[];
  advice: string; // pt-BR
};

export const gradeListening = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => GradeInput.parse(i))
  .handler(async ({ data }): Promise<ListeningGrade> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você é professor de inglês avaliando a transcrição que um aluno brasileiro fez de um áudio.",
      "Compare a tentativa com o texto original. Ignore diferenças mínimas de pontuação e capitalização.",
      "Foco: o que ele CONSEGUIU ouvir, o que confundiu, e por que (ex.: linking, redução de vogais, palavras homófonas).",
      "Tudo em pt-BR, com tom didático e encorajador.",
      "Score reflete quanto do conteúdo ele capturou (0-100).",
      "Responda SOMENTE JSON válido:",
      `{"score": number, "accuracy": string, "strengths": string[], "misses":[{"heard": string, "actual": string, "tip": string}], "advice": string}`,
    ].join(" ");

    const user = `TEXTO ORIGINAL:\n${data.reference}\n\nTRANSCRIÇÃO DO ALUNO:\n${data.attempt}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
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
      if (res.status === 429) throw new Error("Muitas requisições. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error(`Falha (${res.status})`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as ListeningGrade;
    return {
      score: typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : 0,
      accuracy: parsed.accuracy ?? "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      misses: Array.isArray(parsed.misses) ? parsed.misses : [],
      advice: parsed.advice ?? "",
    };
  });
