import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GenInput = z.object({
  level: z.enum(["beginner", "intermediate", "advanced"]),
  focus: z.enum(["pronunciation", "fluency", "conversation"]).optional(),
});

export type SpeakingPrompt = {
  prompt: string; // pt-BR — o que o aluno deve dizer
  modelAnswer: string; // frase-modelo em inglês
  translation: string; // pt-BR literal
  focusPoints: string[]; // sons/entonação para prestar atenção (pt-BR)
  altAnswers: string[]; // 1-3 variações naturais em inglês
};

export const generateSpeaking = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => GenInput.parse(i))
  .handler(async ({ data }): Promise<SpeakingPrompt> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const range =
      data.level === "beginner"
        ? "1 frase curta, 6-12 palavras"
        : data.level === "advanced"
          ? "2-3 frases com ideias conectadas, 20-35 palavras"
          : "1-2 frases naturais, 12-22 palavras";

    const focusHint =
      data.focus === "pronunciation"
        ? "Inclua sons difíceis para brasileiros (th, r, w/v, vogais tensas/laxas)."
        : data.focus === "fluency"
          ? "Priorize conectivos e ritmo natural (linking, contrações)."
          : "Situação de conversa cotidiana natural.";

    const system = [
      "Você prepara exercícios de SPEAKING para alunos brasileiros.",
      "Dê ao aluno uma situação em pt-BR (o que ele quer dizer), depois um modelo natural em inglês.",
      `Tamanho da resposta modelo: ${range}. ${focusHint}`,
      "Liste 3-5 pontos de atenção em pt-BR (sons, entonação, contração, colocação).",
      "Dê 1-3 respostas alternativas igualmente naturais.",
      "Responda SOMENTE JSON válido:",
      `{"prompt": string, "modelAnswer": string, "translation": string, "focusPoints": string[], "altAnswers": string[]}`,
    ].join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Nível: ${data.level}. Gere um exercício variado.` },
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
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as SpeakingPrompt;
    return {
      prompt: parsed.prompt ?? "",
      modelAnswer: parsed.modelAnswer ?? "",
      translation: parsed.translation ?? "",
      focusPoints: Array.isArray(parsed.focusPoints) ? parsed.focusPoints : [],
      altAnswers: Array.isArray(parsed.altAnswers) ? parsed.altAnswers : [],
    };
  });

const GradeInput = z.object({
  target: z.string().min(1).max(1000),
  spoken: z.string().min(1).max(1000),
  altAnswers: z.array(z.string()).max(5).optional(),
});

export type SpeakingGrade = {
  score: number;
  fidelity: string; // pt-BR — quão próximo do alvo
  strengths: string[];
  issues: { word: string; problem: string; tip: string }[]; // problemas de pronúncia inferidos
  refinedAttempt: string; // o que a fala provavelmente foi, limpa
  advice: string;
};

export const gradeSpeaking = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => GradeInput.parse(i))
  .handler(async ({ data }): Promise<SpeakingGrade> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você avalia SPEAKING de um aluno brasileiro. O input do aluno vem de reconhecimento de voz — pode ter erros de transcrição que reflitam pronúncia ruim.",
      "Compare a fala transcrita com a resposta-alvo (e alternativas aceitas).",
      "Diagnóstico: palavras trocadas ou omitidas indicam problemas prováveis de pronúncia (linking, vogal, consoante final). Explique em pt-BR de forma didática.",
      "Se a fala for equivalente semanticamente, dê score alto mesmo que difira do modelo exato.",
      "Score 0-100. Sempre elogie o que estava bom antes das correções.",
      "Responda SOMENTE JSON válido:",
      `{"score": number, "fidelity": string, "strengths": string[], "issues":[{"word": string, "problem": string, "tip": string}], "refinedAttempt": string, "advice": string}`,
    ].join(" ");

    const user = [
      `RESPOSTA-ALVO: ${data.target}`,
      data.altAnswers?.length ? `ALTERNATIVAS ACEITAS: ${data.altAnswers.join(" | ")}` : "",
      `FALA DO ALUNO (transcrita): ${data.spoken}`,
    ]
      .filter(Boolean)
      .join("\n");

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
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as SpeakingGrade;
    return {
      score: typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : 0,
      fidelity: parsed.fidelity ?? "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      refinedAttempt: parsed.refinedAttempt ?? "",
      advice: parsed.advice ?? "",
    };
  });
