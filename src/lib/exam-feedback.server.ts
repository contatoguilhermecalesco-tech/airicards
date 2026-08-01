/** Geração das considerações da IA sobre a prova mensal (server-only). */

export type ExamFeedback = {
  /** Parágrafo de abertura com a leitura geral do desempenho. */
  summary: string;
  strengths: string[];
  weaknesses: string[];
  /** Plano de estudo sugerido para o próximo mês. */
  plan: string[];
  /** Frase curta de encorajamento / próximo objetivo. */
  nextGoal: string;
  createdAt: number;
};

export type ExamFeedbackInput = {
  profileName: string;
  monthKey: string;
  level: string;
  percent: number;
  score: number;
  total: number;
  breakdown: Record<string, { correct: number; total: number }>;
  skills: Record<string, { correct: number; total: number }>;
  misses: { prompt: string; correct: string; chosen: string | null; skill: string; difficulty: string }[];
};

function asStrings(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, max);
}

export async function generateExamFeedback(input: ExamFeedbackInput): Promise<ExamFeedback> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("LOVABLE_API_KEY não configurada");

  const system = [
    "Você é um examinador e tutor de inglês (CEFR) que escreve devolutivas curtas, específicas e acionáveis em português do Brasil.",
    "Baseie-se SOMENTE nos dados enviados. Cite habilidades e níveis concretos, nunca elogios genéricos.",
    "Máximo de 3 itens por lista. Cada item com no máximo 160 caracteres.",
    "Retorne APENAS JSON válido no formato:",
    '{"summary":string,"strengths":[string],"weaknesses":[string],"plan":[string],"nextGoal":string}',
  ].join(" ");

  const user = [
    `Aluno: ${input.profileName}`,
    `Prova: ${input.monthKey}`,
    `Resultado: ${input.score}/${input.total} (${input.percent}%) — nível estimado ${input.level}`,
    `Desempenho por dificuldade: ${JSON.stringify(input.breakdown)}`,
    `Desempenho por habilidade: ${JSON.stringify(input.skills)}`,
    input.misses.length
      ? `Erros cometidos:\n${input.misses
          .slice(0, 25)
          .map(
            (m, i) =>
              `${i + 1}. [${m.skill}/${m.difficulty}] ${m.prompt} | correta: ${m.correct} | marcou: ${m.chosen ?? "em branco"}`,
          )
          .join("\n")}`
      : "Nenhum erro cometido.",
    "Escreva a devolutiva: resumo (2-3 frases), pontos fortes, pontos a melhorar, plano de estudo para o próximo mês e próximo objetivo.",
  ].join("\n\n");

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
    if (res.status === 429) throw new Error("Muitas requisições. Tente ver as considerações em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
    throw new Error(`Falha ao gerar considerações (${res.status})`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "") as Record<string, unknown>;
  } catch {
    throw new Error("A IA retornou uma resposta inesperada.");
  }

  const summary = typeof parsed.summary === "string" ? parsed.summary : "";
  if (!summary) throw new Error("A IA não retornou a análise da prova.");

  return {
    summary,
    strengths: asStrings(parsed.strengths, 3),
    weaknesses: asStrings(parsed.weaknesses, 3),
    plan: asStrings(parsed.plan, 3),
    nextGoal: typeof parsed.nextGoal === "string" ? parsed.nextGoal : "",
    createdAt: Date.now(),
  };
}
