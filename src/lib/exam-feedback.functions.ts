import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateExamFeedback } from "./exam-feedback.server";
import type { ExamFeedback } from "./exam-feedback.server";

export type { ExamFeedback };

const Bucket = z.object({ correct: z.number(), total: z.number() });

const Input = z.object({
  profileName: z.string(),
  monthKey: z.string(),
  level: z.string(),
  percent: z.number(),
  score: z.number(),
  total: z.number(),
  breakdown: z.record(z.string(), Bucket),
  skills: z.record(z.string(), Bucket),
  misses: z.array(
    z.object({
      prompt: z.string(),
      correct: z.string(),
      chosen: z.string().nullable(),
      skill: z.string(),
      difficulty: z.string(),
    }),
  ),
});

export const analyzeExamFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ExamFeedback> => generateExamFeedback(data));
