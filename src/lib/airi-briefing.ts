export type DailyFocus = "reading" | "listening" | "speaking" | "grammar" | "writing" | "missions_pending";

export function dailyFocusFor(date: Date): DailyFocus {
  const days: DailyFocus[] = ["missions_pending", "reading", "listening", "speaking", "grammar", "writing", "missions_pending"];
  return days[date.getDay()];
}

export function briefingDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function briefingKey(profileId: string): string {
  return `airi.daily-briefing.${profileId}`;
}

export function shouldShowBriefing(profileId: string | undefined, lastSeen: string | null, date: Date): boolean {
  return Boolean(profileId) && lastSeen !== briefingDay(date);
}