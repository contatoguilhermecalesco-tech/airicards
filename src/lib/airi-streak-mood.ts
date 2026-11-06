export type AiriMood = "done" | "lost" | "urgent" | "pending";

export function resolveAiriMood(opts: { studiedToday: boolean; current: number; hour: number }): AiriMood {
  if (opts.current === 0) return "lost";
  if (opts.studiedToday) return "done";
  if (opts.hour >= 20) return "urgent";
  return "pending";
}