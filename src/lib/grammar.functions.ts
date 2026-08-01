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
  note?: string;
};

export type GrammarSection = {
  title: string;
  content: string;
};

export type GrammarMistake = {
  wrong: string;
  right: string;
  why: string;
};

export type GrammarContrast = {
  title: string;
  a: { label: string; example: string; when: string };
  b: { label: string; example: string; when: string };
};

export type GrammarFormation = {
  affirmative?: string;
  negative?: string;
  interrogative?: string;
  short?: string;
  notes?: string[];
};

export type GrammarGlossaryItem = {
  term: string;
  definition: string;
};

export type GrammarExerciseType =
  | "multiple-choice"
  | "fill-blank"
  | "error-correction"
  | "translation-en-pt"
  | "translation-pt-en"
  | "transformation";

export type GrammarExercise = {
  id: string;
  type: GrammarExerciseType;
  prompt?: string; // instruction like "Reescreva na negativa"
  question: string;
  options?: string[];
  answer: string;
  acceptedAnswers?: string[]; // alternate correct answers for open-ended
  explanation: string;
  hint?: string;
};

export type GrammarLesson = {
  week: number;
  topic: string;
  application: string;
  // Legacy field for backward compatibility (mirrors introduction)
  explanation: string;
  // New rich content
  introduction: string;
  objectives: string[];
  sections: GrammarSection[];
  formation?: GrammarFormation;
  contrasts: GrammarContrast[];
  commonMistakes: GrammarMistake[];
  register?: string;
  examples: GrammarExample[];
  glossary: GrammarGlossaryItem[];
  summary: string;
  nextSteps: string[];
  exercises: GrammarExercise[];
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asStringArray(v: unknown): string[] {
  return asArray(v).filter((x): x is string => typeof x === "string");
}

function normalizeExercise(raw: unknown, idx: number): GrammarExercise | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const validTypes: GrammarExerciseType[] = [
    "multiple-choice",
    "fill-blank",
    "error-correction",
    "translation-en-pt",
    "translation-pt-en",
    "transformation",
  ];
  const type = (validTypes as string[]).includes(e.type as string)
    ? (e.type as GrammarExerciseType)
    : "multiple-choice";
  const id = asString(e.id) || `ex-${idx + 1}`;
  const question = asString(e.question);
  const prompt = typeof e.prompt === "string" ? e.prompt : undefined;
  const options = Array.isArray(e.options)
    ? e.options.filter((o): o is string => typeof o === "string")
    : undefined;
  let answer = "";
  if (typeof e.answer === "string") answer = e.answer;
  else if (typeof e.answer === "number" && options && options[e.answer]) answer = options[e.answer];
  const acceptedAnswers = Array.isArray(e.acceptedAnswers)
    ? e.acceptedAnswers.filter((o): o is string => typeof o === "string")
    : undefined;
  const explanation = asString(e.explanation);
  const hint = typeof e.hint === "string" ? e.hint : undefined;
  if (!question || !answer) return null;
  return { id, type, prompt, question, options, answer, acceptedAnswers, explanation, hint };
}

function normalizeLesson(week: number, topic: string, application: string, raw: unknown): GrammarLesson {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const introduction = asString(obj.introduction) || asString(obj.explanation);
  const objectives = asStringArray(obj.objectives);
  const sections = asArray(obj.sections)
    .map((s): GrammarSection | null => {
      if (!s || typeof s !== "object") return null;
      const x = s as Record<string, unknown>;
      const title = asString(x.title);
      const content = asString(x.content);
      return title && content ? { title, content } : null;
    })
    .filter((s): s is GrammarSection => Boolean(s));

  const formationRaw = obj.formation as Record<string, unknown> | undefined;
  const formation: GrammarFormation | undefined = formationRaw
    ? {
        affirmative: typeof formationRaw.affirmative === "string" ? formationRaw.affirmative : undefined,
        negative: typeof formationRaw.negative === "string" ? formationRaw.negative : undefined,
        interrogative:
          typeof formationRaw.interrogative === "string" ? formationRaw.interrogative : undefined,
        short: typeof formationRaw.short === "string" ? formationRaw.short : undefined,
        notes: Array.isArray(formationRaw.notes)
          ? (formationRaw.notes.filter((n) => typeof n === "string") as string[])
          : undefined,
      }
    : undefined;

  const contrasts = asArray(obj.contrasts)
    .map((c): GrammarContrast | null => {
      if (!c || typeof c !== "object") return null;
      const x = c as Record<string, unknown>;
      const a = x.a as Record<string, unknown> | undefined;
      const b = x.b as Record<string, unknown> | undefined;
      if (!a || !b) return null;
      return {
        title: asString(x.title, "Contraste"),
        a: {
          label: asString(a.label),
          example: asString(a.example),
          when: asString(a.when),
        },
        b: {
          label: asString(b.label),
          example: asString(b.example),
          when: asString(b.when),
        },
      };
    })
    .filter((c): c is GrammarContrast => Boolean(c));

  const commonMistakes = asArray(obj.commonMistakes)
    .map((m): GrammarMistake | null => {
      if (!m || typeof m !== "object") return null;
      const x = m as Record<string, unknown>;
      const wrong = asString(x.wrong);
      const right = asString(x.right);
      const why = asString(x.why);
      return wrong && right ? { wrong, right, why } : null;
    })
    .filter((m): m is GrammarMistake => Boolean(m));

  const examples = asArray(obj.examples)
    .map((ex): GrammarExample | null => {
      if (!ex || typeof ex !== "object") return null;
      const x = ex as Record<string, unknown>;
      const en = asString(x.en);
      const pt = asString(x.pt);
      const note = typeof x.note === "string" ? x.note : undefined;
      return en || pt ? { en, pt, note } : null;
    })
    .filter((x): x is GrammarExample => Boolean(x));

  const glossary = asArray(obj.glossary)
    .map((g): GrammarGlossaryItem | null => {
      if (!g || typeof g !== "object") return null;
      const x = g as Record<string, unknown>;
      const term = asString(x.term);
      const definition = asString(x.definition);
      return term && definition ? { term, definition } : null;
    })
    .filter((g): g is GrammarGlossaryItem => Boolean(g));

  const exercises = asArray(obj.exercises)
    .map((e, i) => normalizeExercise(e, i))
    .filter((e): e is GrammarExercise => Boolean(e));

  return {
    week,
    topic,
    application,
    explanation: introduction || "Aula gerada.",
    introduction: introduction || "",
    objectives,
    sections,
    formation,
    contrasts,
    commonMistakes,
    register: typeof obj.register === "string" ? obj.register : undefined,
    examples,
    glossary,
    summary: asString(obj.summary),
    nextSteps: asStringArray(obj.nextSteps),
    exercises,
  };
}

/**
 * Gera uma aula de gramática simples e clara — foco em POR QUÊ, COMO e QUANDO usar.
 */
export const generateGrammarLesson = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<GrammarLesson> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você é um professor de inglês que explica gramática de forma SIMPLES, como se estivesse conversando com um amigo brasileiro que nunca gostou de gramática.",
      "Regra de ouro: qualquer pessoa — do aluno mais iniciante ao mais avançado — deve entender a aula na primeira leitura.",
      "Escreva tudo em português brasileiro, com frases curtas e diretas. Evite jargão. Se um termo técnico for realmente necessário, explique-o na hora com palavras do dia a dia e repita a explicação no glossário.",
      "Toda a aula gira em torno de três perguntas, sempre nessa ordem e sempre respondidas de forma explícita:",
      "1) POR QUÊ isso existe / por que o inglês precisa dessa estrutura (a ideia por trás dela, em linguagem humana).",
      "2) COMO funciona (a montagem da frase, passo a passo, com um padrão fácil de lembrar).",
      "3) QUANDO usar (situações reais do dia a dia) — e quando NÃO usar.",
      "Use analogias simples e comparações com o português para criar clique mental. Nada de definições de dicionário.",
      "Todos os exemplos devem ser frases curtas, naturais e úteis no dia a dia, com tradução natural (não literal).",
      "Faça 12 exercícios variados, do mais fácil ao mais difícil, sempre com enunciado simples.",
      "Distribua os tipos: 4 multiple-choice (4 opções cada), 3 fill-blank, 2 error-correction (aluno reescreve corretamente), 2 translation-pt-en, 1 transformation (ex.: reescrever na negativa ou na interrogativa).",
      "Em multiple-choice, 'answer' é o texto EXATO de uma das opções. Em fill-blank, 'answer' é a palavra/expressão que completa. Em translation/error-correction/transformation, 'answer' é a versão correta completa; forneça também 'acceptedAnswers' com 1-3 variações válidas.",
      "Cada exercício traz 'explanation' curta que ensina o porquê da resposta em linguagem simples. Adicione 'hint' nos mais difíceis.",
      "Responda SOMENTE JSON válido, sem markdown, no formato exato:",
      `{
  "introduction": string,
  "objectives": string[],
  "sections": [{"title": string, "content": string}],
  "formation": {"affirmative"?: string, "negative"?: string, "interrogative"?: string, "short"?: string, "notes"?: string[]},
  "contrasts": [{"title": string, "a": {"label": string, "example": string, "when": string}, "b": {"label": string, "example": string, "when": string}}],
  "commonMistakes": [{"wrong": string, "right": string, "why": string}],
  "register": string,
  "examples": [{"en": string, "pt": string, "note"?: string}],
  "glossary": [{"term": string, "definition": string}],
  "summary": string,
  "nextSteps": string[],
  "exercises": [{"id": string, "type": "multiple-choice"|"fill-blank"|"error-correction"|"translation-pt-en"|"translation-en-pt"|"transformation", "prompt"?: string, "question": string, "options"?: string[], "answer": string, "acceptedAnswers"?: string[], "explanation": string, "hint"?: string}]
}`,
      "Requisitos: introduction com 1-2 parágrafos bem simples explicando POR QUÊ essa estrutura existe e para que serve no dia a dia;",
      "sections com exatamente 4 blocos, nesta ordem e com estes títulos: 'Por que isso existe', 'Como funciona', 'Quando usar (e quando não)', 'Comparando com o português';",
      "objectives com 3-4 itens escritos como 'Você vai conseguir…';",
      "commonMistakes com 4-6 erros típicos de brasileiros, com o 'why' explicado em uma frase simples;",
      "examples com 6-10 frases curtas do dia a dia; glossary com 3-6 termos explicados em linguagem de gente comum;",
      "summary com 2-3 frases fáceis de decorar; nextSteps com 3 sugestões práticas; exercises com exatamente 12 itens.",
      "Nunca escreva parágrafos longos: quebre em frases curtas.",
    ].join(" ");


    const userMsg = [
      `Semana ${data.week} do ciclo RRSLG.`,
      `Tópico gramatical: ${data.topic}.`,
      `Aplicação prática esperada: ${data.application}.`,
      data.level ? `Nível declarado do aluno: ${data.level}.` : "Nível: intermediário.",
      "Gere a aula seguindo rigorosamente o formato JSON e os requisitos. Prioridade máxima: SIMPLICIDADE e clareza — responda sempre por quê, como e quando usar.",
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
