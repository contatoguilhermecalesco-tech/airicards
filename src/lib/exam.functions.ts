import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Prova mensal de nivelamento — 25 questões geradas por IA, sem repetição.
 * Todas as questões são multiple-choice com 4 alternativas para permitir
 * correção determinística e cálculo consistente do nível CEFR.
 */

export type ExamSkill =
  | "vocabulary"
  | "grammar"
  | "reading"
  | "listening"
  | "usage"
  | "phrasal-verbs"
  | "collocations";

export type ExamDifficulty = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type ExamQuestion = {
  id: string;
  skill: ExamSkill;
  difficulty: ExamDifficulty;
  /** Contexto opcional (parágrafo curto, transcrição, diálogo). */
  context?: string;
  prompt: string;
  options: [string, string, string, string];
  /** Índice 0-3 da opção correta. */
  answer: number;
  explanation: string;
};

const Input = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  profileName: z.string().min(1),
  /** Hashes/resumos das últimas provas para evitar repetição. */
  avoid: z.array(z.string()).max(400).optional(),
});

const DIFFICULTIES: ExamDifficulty[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SKILLS: ExamSkill[] = [
  "vocabulary",
  "grammar",
  "reading",
  "listening",
  "usage",
  "phrasal-verbs",
  "collocations",
];

function asString(v: unknown, f = ""): string {
  return typeof v === "string" ? v : f;
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function normalizeQuestion(raw: unknown, idx: number): ExamQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const options = asArray(q.options)
    .filter((o): o is string => typeof o === "string")
    .slice(0, 4);
  if (options.length !== 4) return null;
  const prompt = asString(q.prompt);
  if (!prompt) return null;
  let answer = -1;
  if (typeof q.answer === "number") answer = q.answer;
  else if (typeof q.answer === "string") answer = options.findIndex((o) => o === q.answer);
  if (answer < 0 || answer > 3) return null;
  const skill = (SKILLS as string[]).includes(q.skill as string)
    ? (q.skill as ExamSkill)
    : "grammar";
  const difficulty = (DIFFICULTIES as string[]).includes(q.difficulty as string)
    ? (q.difficulty as ExamDifficulty)
    : "B1";
  return {
    id: asString(q.id) || `q-${idx + 1}`,
    skill,
    difficulty,
    context: typeof q.context === "string" ? q.context : undefined,
    prompt,
    options: options as [string, string, string, string],
    answer,
    explanation: asString(q.explanation, "—"),
  };
}

export const generateMonthlyExam = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ questions: ExamQuestion[] }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você é um examinador certificado de proficiência em inglês (Cambridge/CEFR), especializado em avaliar brasileiros.",
      "Sua tarefa: montar uma prova de nivelamento com EXATAMENTE 25 questões, variando skills e dificuldades para diagnosticar precisamente o nível do aluno.",
      "TODAS as questões são multiple-choice com 4 alternativas. Apenas UMA correta. Distratores devem ser plausíveis (erros típicos de brasileiros).",
      "Distribuição obrigatória de dificuldades: 3 A1, 4 A2, 5 B1, 5 B2, 5 C1, 3 C2 (total 25).",
      "Distribuição de skills (aproximada): 6 grammar, 5 vocabulary, 4 reading (com context curto de 2-4 frases), 3 listening (com context em formato de transcrição/diálogo), 3 usage (preposições, artigos), 2 phrasal-verbs, 2 collocations.",
      "Nunca repita conteúdo/tema/frase das provas anteriores enviadas em 'avoid'. Gere questões novas e originais.",
      "Escreva enunciados em português quando for instrução meta (ex.: 'Escolha a opção correta:'), mas o material linguístico em inglês.",
      "Cada questão tem 'explanation' curta em português explicando por que a resposta é correta e o erro dos distratores.",
      "Retorne APENAS JSON válido, sem markdown, no formato exato:",
      `{"questions":[{"id":"q1","skill":"grammar|vocabulary|reading|listening|usage|phrasal-verbs|collocations","difficulty":"A1|A2|B1|B2|C1|C2","context"?:string,"prompt":string,"options":[string,string,string,string],"answer":0|1|2|3,"explanation":string}]}`,
    ].join(" ");

    const avoidLine = data.avoid && data.avoid.length > 0
      ? `Evite qualquer semelhança com estas questões já usadas: ${data.avoid.slice(0, 200).join(" | ")}`
      : "Primeira prova do aluno — sem restrições.";

    const userMsg = [
      `Aluno: ${data.profileName}.`,
      `Mês de referência: ${data.monthKey}.`,
      avoidLine,
      "Gere a prova completa (25 questões) seguindo rigorosamente a distribuição e o formato JSON.",
    ].join("\n\n");

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
      if (res.status === 429) throw new Error("Muitas requisições. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha ao gerar prova (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("A IA retornou uma resposta inesperada. Tente de novo.");
    }
    const rawQuestions = asArray((parsed as { questions?: unknown }).questions);
    const questions = rawQuestions
      .map((q, i) => normalizeQuestion(q, i))
      .filter((q): q is ExamQuestion => Boolean(q));

    if (questions.length < 15) {
      throw new Error("A prova gerada veio incompleta. Tente novamente.");
    }
    // Reindexa IDs para estabilidade
    questions.forEach((q, i) => {
      q.id = `q${i + 1}`;
    });
    return { questions: questions.slice(0, 25) };
  });
