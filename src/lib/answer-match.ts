// Fuzzy matcher para respostas de tradução.
// Aceita variações ortográficas leves, remove acentos, pontuação e artigos comuns.

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const FILLER = new Set([
  "o", "a", "os", "as", "um", "uma", "uns", "umas",
  "de", "do", "da", "dos", "das",
  "e", "ou", "que", "pra", "para", "the", "to", "of",
]);

export function normalize(input: string): string {
  return stripAccents(input)
    .toLowerCase()
    .replace(/[.,;:!?¿¡"'`´()\[\]{}\-–—/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 0 && !FILLER.has(t));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

export type MatchResult = {
  correct: boolean;
  similarity: number; // 0..1
  bestExpected: string;
};

// Uma resposta esperada pode ter alternativas separadas por "/" ou ";" ou " | ".
function splitAccepted(back: string): string[] {
  return back
    .split(/\s*(?:\/|;|\||,\s*ou\s+|\s+ou\s+)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function matchAnswer(userInput: string, expected: string): MatchResult {
  const candidates = splitAccepted(expected);
  let best: MatchResult = { correct: false, similarity: 0, bestExpected: expected };

  const user = normalize(userInput);
  const userTokens = tokens(userInput);

  for (const cand of candidates) {
    const target = normalize(cand);
    if (!target) continue;

    // Exato
    if (user === target) {
      return { correct: true, similarity: 1, bestExpected: cand };
    }

    // Distância de edição normalizada
    const dist = levenshtein(user, target);
    const maxLen = Math.max(user.length, target.length);
    const sim = 1 - dist / Math.max(1, maxLen);

    // Tokens (Jaccard) para respostas com ordem/artigo diferentes
    const candTokens = tokens(cand);
    const setA = new Set(userTokens);
    const setB = new Set(candTokens);
    const inter = [...setA].filter((t) => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size || 1;
    const jaccard = inter / union;

    const score = Math.max(sim, jaccard);

    // Limiar dinâmico: respostas curtas exigem mais precisão
    const tolerance =
      target.length <= 4 ? 0 :
      target.length <= 8 ? 1 :
      target.length <= 14 ? 2 : 3;

    const correct =
      dist <= tolerance ||
      (jaccard >= 0.75 && candTokens.length >= 2) ||
      sim >= 0.88;

    if (score > best.similarity) {
      best = { correct, similarity: score, bestExpected: cand };
    }
    if (correct) return { correct: true, similarity: score, bestExpected: cand };
  }

  return best;
}

// Retorna partes com destaque de diferença simples caractere-a-caractere.
export function diffChars(user: string, expected: string): Array<{ ch: string; ok: boolean }> {
  const u = normalize(user);
  const e = normalize(expected);
  const out: Array<{ ch: string; ok: boolean }> = [];
  const len = Math.max(u.length, e.length);
  for (let i = 0; i < len; i++) {
    const cu = u[i] ?? "";
    const ce = e[i] ?? "";
    out.push({ ch: expected[i] ?? "", ok: cu === ce });
  }
  return out;
}
