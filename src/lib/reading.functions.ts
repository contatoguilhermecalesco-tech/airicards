import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GenInput = z.object({
  level: z.enum(["beginner", "intermediate", "advanced"]),
  genre: z
    .enum(["story", "article", "dialogue", "letter", "opinion"])
    .default("article"),
  topic: z.string().max(200).optional(),
});

export type ReadingPassage = {
  title: string;
  text: string; // English passage
  translation: string; // pt-BR natural translation
  glossary: { word: string; meaning: string }[]; // 4-8 key words/expressions
  mcq: {
    q: string; // pt-BR
    options: string[]; // 4 options in pt-BR
    correct: number; // 0..3
    rationale: string; // pt-BR why
  }[];
  open: {
    q: string; // pt-BR interpretation question
    guidance: string; // pt-BR expected reasoning
  };
};

async function callGateway(system: string, user: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY não configurada");
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
  return JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
}

export const generateReading = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => GenInput.parse(i))
  .handler(async ({ data }): Promise<ReadingPassage> => {
    const wordRange =
      data.level === "beginner"
        ? "90-140 palavras, vocabulário simples, presente/passado simples, frases curtas"
        : data.level === "advanced"
          ? "220-320 palavras, vocabulário rico, tempos compostos, ideias abstratas"
          : "150-220 palavras, vocabulário intermediário, variedade de tempos e conectivos";

    const genreHint: Record<typeof data.genre, string> = {
      story: "uma micro-narrativa com começo, meio e fim; personagem e conflito claros",
      article: "um mini-artigo informativo/curioso com fatos ou reflexão",
      dialogue: "um diálogo natural entre 2 pessoas, com falas alternadas curtas",
      letter: "uma carta/email pessoal em tom coloquial",
      opinion: "um texto de opinião com tese, argumento e conclusão",
    };

    const system = [
      "Você gera passagens em INGLÊS para leitura guiada de alunos brasileiros.",
      "Escreva um texto natural, coeso e envolvente — não didático.",
      `Formato: ${genreHint[data.genre]}.`,
      `Tamanho: ${wordRange}.`,
      "Depois traduza para pt-BR de forma natural (nunca literal).",
      "Extraia 4-8 palavras/expressões-chave (foco em phrasal verbs, colocações e vocabulário útil) com o significado curto em pt-BR.",
      "Crie 3 questões de múltipla escolha em pt-BR sobre compreensão e inferência do texto — 4 alternativas cada, apenas 1 correta, com uma justificativa curta em pt-BR do porquê.",
      "Crie 1 questão aberta de interpretação em pt-BR que exija o aluno pensar sobre o texto (motivação, tema, contraste, etc.), com uma orientação curta em pt-BR do que uma boa resposta deveria conter.",
      "Responda SOMENTE JSON válido:",
      `{"title": string, "text": string, "translation": string, "glossary":[{"word": string, "meaning": string}], "mcq":[{"q": string, "options": string[], "correct": number, "rationale": string}], "open":{"q": string, "guidance": string}}`,
    ].join(" ");

    const user = data.topic
      ? `Tema sugerido: ${data.topic}. Nível: ${data.level}. Formato: ${data.genre}.`
      : `Escolha um tema variado e interessante. Nível: ${data.level}. Formato: ${data.genre}.`;

    const parsed = (await callGateway(system, user)) as ReadingPassage;
    return {
      title: parsed.title ?? "Reading",
      text: parsed.text ?? "",
      translation: parsed.translation ?? "",
      glossary: Array.isArray(parsed.glossary) ? parsed.glossary : [],
      mcq: Array.isArray(parsed.mcq)
        ? parsed.mcq.map((m) => ({
            q: m.q ?? "",
            options: Array.isArray(m.options) ? m.options.slice(0, 4) : [],
            correct:
              typeof m.correct === "number" ? Math.max(0, Math.min(3, m.correct)) : 0,
            rationale: m.rationale ?? "",
          }))
        : [],
      open: {
        q: parsed.open?.q ?? "",
        guidance: parsed.open?.guidance ?? "",
      },
    };
  });

const GradeInput = z.object({
  text: z.string().min(1).max(6000),
  question: z.string().min(1).max(1000),
  guidance: z.string().max(1500).optional(),
  answer: z.string().min(1).max(3000),
});

export type ReadingGrade = {
  score: number; // 0-100
  summary: string; // pt-BR
  strengths: string[];
  improvements: string[];
  modelAnswer: string; // pt-BR resposta modelo
};

export const gradeReading = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => GradeInput.parse(i))
  .handler(async ({ data }): Promise<ReadingGrade> => {
    const system = [
      "Você é professor de inglês avaliando a interpretação de texto de um aluno brasileiro.",
      "A resposta pode estar em pt-BR ou em inglês — aceite ambos.",
      "Avalie: fidelidade ao texto (não inventar), profundidade de interpretação, clareza.",
      "Tom didático, encorajador, específico.",
      "Score 0-100 refletindo qualidade da interpretação (não gramática).",
      "Responda SOMENTE JSON válido:",
      `{"score": number, "summary": string, "strengths": string[], "improvements": string[], "modelAnswer": string}`,
    ].join(" ");
    const user = [
      `TEXTO:\n${data.text}`,
      `PERGUNTA:\n${data.question}`,
      data.guidance ? `ORIENTAÇÃO:\n${data.guidance}` : "",
      `RESPOSTA DO ALUNO:\n${data.answer}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const parsed = (await callGateway(system, user)) as ReadingGrade;
    return {
      score:
        typeof parsed.score === "number"
          ? Math.max(0, Math.min(100, parsed.score))
          : 0,
      summary: parsed.summary ?? "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      modelAnswer: parsed.modelAnswer ?? "",
    };
  });
