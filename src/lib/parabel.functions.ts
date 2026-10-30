import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  scenario: z.string().min(3).max(160),
  context: z.string().min(10).max(1200),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  answer: z.string().min(2).max(8000),
});

export type ParabelFeedback = {
  score: number;
  criteria: { grammar: number; vocabulary: number; clarity: number; naturalness: number; contextFit: number; structure: number };
  overallFeedback: string;
  strengths: string[];
  corrections: { original: string; correction: string; explanation: string }[];
  naturalAlternative: string;
  nextSteps: string[];
  errorTags: string[];
  learningTip: string;
};

export const evaluateParabel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ParabelFeedback> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você é o avaliador pedagógico do PARABEL, simulador de situações reais em inglês para estudantes brasileiros.",
      "Avalie a resposta livre para a situação. Não exija cópia de uma frase-modelo: aceite respostas diferentes quando forem corretas, naturais e adequadas ao contexto.",
      "Explique em português brasileiro, de forma simples, respeitosa e didática. Avalie o sentido, não uma comparação literal.",
      "Dê notas de 0 a 100 para gramática, vocabulário, clareza, naturalidade, adequação ao contexto e estrutura. A nota geral reflete o conjunto sem punir excessivamente erros pequenos que não atrapalham a comunicação.",
      "Aponte apenas erros reais ou trechos pouco naturais. Se não houver erros, deixe corrections vazio e explique o que funcionou.",
      "naturalAlternative deve preservar a intenção do aluno, sem inventar informações. Ajuste a expectativa ao nível beginner, intermediate ou advanced.",
      "Identifique também padrões de erro com etiquetas curtas e consistentes (ex.: verb_tense, articles, prepositions, word_order, verb_pattern, vocabulary, politeness, spelling). Inclua uma dica curta de aprendizagem.",
      "Responda SOMENTE JSON válido: {\"score\":number,\"criteria\":{\"grammar\":number,\"vocabulary\":number,\"clarity\":number,\"naturalness\":number,\"contextFit\":number,\"structure\":number},\"overallFeedback\":string,\"strengths\":string[],\"corrections\":[{\"original\":string,\"correction\":string,\"explanation\":string}],\"naturalAlternative\":string,\"nextSteps\":string[],\"errorTags\":string[],\"learningTip\":string}",
    ].join(" ");

    const user = [
      `Situação: ${data.scenario}`,
      `Contexto e objetivo: ${data.context}`,
      `Nível do aluno: ${data.level}`,
      "Resposta escrita pelo aluno (em inglês):",
      data.answer,
    ].join("\n\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" } }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Muitas avaliações seguidas. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha na avaliação (${res.status}). Tente novamente.`);
    }

    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    try {
      const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as ParabelFeedback;
      const clamp = (value: unknown) => typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0;
      const criteria = parsed.criteria ?? {} as ParabelFeedback["criteria"];
      return {
        score: clamp(parsed.score),
        criteria: { grammar: clamp(criteria.grammar), vocabulary: clamp(criteria.vocabulary), clarity: clamp(criteria.clarity), naturalness: clamp(criteria.naturalness), contextFit: clamp(criteria.contextFit), structure: clamp(criteria.structure) },
        overallFeedback: parsed.overallFeedback ?? "Sua resposta foi avaliada.",
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
        naturalAlternative: parsed.naturalAlternative ?? data.answer,
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
        errorTags: Array.isArray(parsed.errorTags) ? parsed.errorTags.filter((tag): tag is string => typeof tag === "string").slice(0, 8) : [],
        learningTip: typeof parsed.learningTip === "string" ? parsed.learningTip : "Revise as correções e tente usar essas estruturas em outra frase.",
      };
    } catch {
      throw new Error("A IA retornou uma avaliação inesperada. Tente novamente.");
    }
  });


const ConversationInput = z.object({
  scenario: z.string().min(3).max(160),
  context: z.string().min(10).max(1200),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  messages: z.array(z.object({
    role: z.enum(["assistant", "user"]),
    content: z.string().min(1).max(1200),
  })).max(12),
});

export type ParabelConversationMessage = {
  role: "assistant" | "user";
  content: string;
};

export const continueParabelConversation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ConversationInput.parse(input))
  .handler(async ({ data }): Promise<{ reply: string; done: boolean }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = [
      "Você interpreta uma pessoa real em uma simulação de inglês do PARABEL. O aluno é um estudante brasileiro e deve conversar em inglês.",
      "Fale exclusivamente em inglês, com frases naturais e adequadas ao nível do aluno. BEGINNER: frases curtas e vocabulário comum; INTERMEDIATE: linguagem natural e perguntas de acompanhamento; ADVANCED: nuances, imprevistos e linguagem mais sofisticada.",
      "Você é o interlocutor do cenário, nunca o professor durante a conversa. Responda ao que o aluno realmente disse, sem exigir frases exatas. Faça uma pergunta ou apresente uma nova informação por turno para manter a conversa viva.",
      "Não traduza, não corrija explicitamente e não dê a resposta pronta. Se o aluno cometer erros, continue a conversa naturalmente. Introduza uma pequena complicação coerente com o cenário quando houver espaço, especialmente nos níveis intermediário e avançado.",
      "A primeira resposta deve iniciar a cena e convidar o aluno a falar. Seja breve (uma a três frases).",
      "Defina done=true apenas quando a situação estiver naturalmente resolvida ou quando já houver pelo menos 5 mensagens do aluno. Caso contrário done=false.",
      "Responda SOMENTE JSON válido no formato {\"reply\":string,\"done\":boolean}.",
    ].join(" ");

    const transcript = data.messages.map((message) => `${message.role === "user" ? "STUDENT" : "YOU"}: ${message.content}`).join("\n");
    const user = [
      `CENÁRIO: ${data.scenario}`,
      `SITUAÇÃO: ${data.context}`,
      `NÍVEL: ${data.level}`,
      data.messages.length ? `CONTEXTO DA CONVERSA:\n${transcript}\n\nContinue a conversa a partir da última fala do estudante.` : "Inicie a conversa como a pessoa que o aluno encontrou nesta situação.",
    ].join("\n\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Muitas mensagens seguidas. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha na conversa (${res.status}). Tente novamente.`);
    }
    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    try {
      const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as { reply?: unknown; done?: unknown };
      if (typeof parsed.reply !== "string" || !parsed.reply.trim()) throw new Error("empty reply");
      return { reply: parsed.reply.trim(), done: parsed.done === true };
    } catch {
      throw new Error("A IA retornou uma resposta inesperada. Tente novamente.");
    }
  });
