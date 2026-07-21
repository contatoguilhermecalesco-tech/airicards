import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  week: z.number().int().min(1).max(8),
  topic: z.string().min(1),
  application: z.string().min(1),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export type GrammarExample = {
  en: string;
  pt: string;
};

export type GrammarExercise = {
  id: string;
  type: "multiple-choice" | "fill-blank";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
};

export type GrammarLesson = {
  week: number;
  topic: string;
  application: string;
  explanation: string;
  examples: GrammarExample[];
  exercises: GrammarExercise[];
};

function normalizeExercise(raw: unknown): GrammarExercise | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const id = typeof e.id === "string" ? e.id : "";
  const type = e.type === "multiple-choice" || e.type === "fill-blank" ? e.type : "multiple-choice";
  const question = typeof e.question === "string" ? e.question : "";
  const options = Array.isArray(e.options) ? e.options.filter((o): o is string => typeof o === "string") : undefined;
  let answer = "";
  if (typeof e.answer === "string") {
    answer = e.answer;
  } else if (typeof e.answer === "number" && options && options[e.answer]) {
    answer = options[e.answer];
  }
  const explanation = typeof e.explanation === "string" ? e.explanation : "";
  return { id, type, question, options, answer, explanation };
}

function normalizeLesson(week: number, topic: string, application: string, raw: unknown): GrammarLesson {
  const fallback: GrammarLesson = {
    week,
    topic,
    application,
    explanation: "Não foi possível gerar a explicação. Tente novamente.",
    examples: [],
    exercises: [],
  };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const explanation = typeof obj.explanation === "string" ? obj.explanation : fallback.explanation;
  const examples = Array.isArray(obj.examples)
    ? obj.examples
        .map((ex): GrammarExample | null => {
          if (!ex || typeof ex !== "object") return null;
          const x = ex as Record<string, unknown>;
          return {
            en: typeof x.en === "string" ? x.en : "",
            pt: typeof x.pt === "string" ? x.pt : "",
          };
        })
        .filter((x): x is GrammarExample => Boolean(x && (x.en || x.pt)))
    : [];
  const exercises = Array.isArray(obj.exercises)
    ? obj.exercises.map(normalizeExercise).filter((x): x is GrammarExercise => Boolean(x))
    : [];
  return { week, topic, application, explanation, examples, exercises };
}

/**
 * Gera uma aula de gramática personalizada para a semana do ciclo RRSLG.
 * Inclui explicação didática, exemplos bilingues e exercícios interativos.
 */
export const generateGrammarLesson = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<GrammarLesson> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você é um professor particular de inglês, didático, encorajador e claro, ensinando alunos brasileiros.",
      "Crie uma micro-aula de gramática em português brasileiro, com explicação simples, exemplos em inglês com tradução para o português, e exercícios interativos.",
      "A aula deve ser prática: mostre QUANDO usar a estrutura, COMO formá-la e erros comuns que brasileiros cometem.",
      "Os exemplos devem ser frases naturais do dia a dia, nunca isoladas sem contexto.",
      "Inclua 5 exercícios: uma mistura de múltipla escolha (multiple-choice) e preenchimento (fill-blank). Cada exercício deve ter uma resposta correta e uma explicação didática da resposta.",
      "No multiple-choice, forneça 4 opções. No fill-blank, a resposta é a palavra ou palavras que completam a frase.",
      "A resposta (answer) deve ser sempre o texto exato da opção correta (string). No multiple-choice, answer deve ser igual a uma das opções.",
      "Responda SOMENTE JSON válido no formato exato abaixo, sem markdown, sem comentários:",
      `{
  "explanation": string,
  "examples": [{"en": string, "pt": string}],
  "exercises": [
    {"id": string, "type": "multiple-choice" | "fill-blank", "question": string, "options": string[], "answer": string, "explanation": string}
  ]
}`,
    ].join(" ");

    const userMsg = [
      `Semana ${data.week} do ciclo de estudos.`,
      `Tópico de gramática: ${data.topic}.`,
      `Aplicação prática: ${data.application}.`,
      data.level ? `Nível do aluno: ${data.level}.` : null,
      "Gere a micro-aula completa seguindo o formato JSON solicitado.",
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
      if (res.status === 429) throw new Error("Muitas aulas seguidas. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha ao gerar aula (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(content) as unknown;
      return normalizeLesson(data.week, data.topic, data.application, parsed);
    } catch {
      throw new Error("A IA retornou uma resposta inesperada. Tente de novo.");
    }
  });
