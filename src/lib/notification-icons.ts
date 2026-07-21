import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  AlertTriangle,
  BookOpen,
  Trophy,
  Flame,
  Megaphone,
  Calendar,
  Gift,
  Zap,
  Heart,
  Info,
  GraduationCap,
  PenLine,
  Headphones,
  Mic,
  Languages,
  Bell,
  Star,
  Target,
  Clock,
  CheckCircle2,
  Rocket,
  Lightbulb,
} from "lucide-react";

export type NotificationIconKey =
  | "sparkles"
  | "bell"
  | "star"
  | "trophy"
  | "flame"
  | "target"
  | "rocket"
  | "lightbulb"
  | "check"
  | "clock"
  | "alert"
  | "info"
  | "megaphone"
  | "calendar"
  | "gift"
  | "zap"
  | "heart"
  | "graduation"
  | "book"
  | "pen"
  | "headphones"
  | "mic"
  | "languages";

export const NOTIFICATION_ICONS: { key: NotificationIconKey; Icon: LucideIcon; label: string }[] = [
  { key: "sparkles", Icon: Sparkles, label: "Brilho" },
  { key: "bell", Icon: Bell, label: "Sino" },
  { key: "star", Icon: Star, label: "Estrela" },
  { key: "trophy", Icon: Trophy, label: "Troféu" },
  { key: "flame", Icon: Flame, label: "Chama" },
  { key: "target", Icon: Target, label: "Meta" },
  { key: "rocket", Icon: Rocket, label: "Foguete" },
  { key: "lightbulb", Icon: Lightbulb, label: "Ideia" },
  { key: "check", Icon: CheckCircle2, label: "Concluído" },
  { key: "clock", Icon: Clock, label: "Lembrete" },
  { key: "alert", Icon: AlertTriangle, label: "Alerta" },
  { key: "info", Icon: Info, label: "Info" },
  { key: "megaphone", Icon: Megaphone, label: "Aviso" },
  { key: "calendar", Icon: Calendar, label: "Evento" },
  { key: "gift", Icon: Gift, label: "Presente" },
  { key: "zap", Icon: Zap, label: "Energia" },
  { key: "heart", Icon: Heart, label: "Favorito" },
  { key: "graduation", Icon: GraduationCap, label: "Estudo" },
  { key: "book", Icon: BookOpen, label: "Leitura" },
  { key: "pen", Icon: PenLine, label: "Escrita" },
  { key: "headphones", Icon: Headphones, label: "Listening" },
  { key: "mic", Icon: Mic, label: "Speaking" },
  { key: "languages", Icon: Languages, label: "Idioma" },
];

const ICON_MAP: Record<NotificationIconKey, LucideIcon> = NOTIFICATION_ICONS.reduce(
  (acc, i) => {
    acc[i.key] = i.Icon;
    return acc;
  },
  {} as Record<NotificationIconKey, LucideIcon>,
);

export function iconFromKey(key?: string | null): LucideIcon | null {
  if (!key) return null;
  return ICON_MAP[key as NotificationIconKey] ?? null;
}

export function guessIcon(tagName?: string | null, title?: string): LucideIcon {
  const s = `${tagName ?? ""} ${title ?? ""}`.toLowerCase();
  if (/urg|alerta|crit|import/.test(s)) return AlertTriangle;
  if (/conquist|trof|troph|medalh|record/.test(s)) return Trophy;
  if (/streak|sequ[eê]ncia|fogo|flame/.test(s)) return Flame;
  if (/dica|tip|estud|aprend|licao|lição/.test(s)) return GraduationCap;
  if (/leit|read/.test(s)) return BookOpen;
  if (/escri|writ|reda/.test(s)) return PenLine;
  if (/listen|escut|áudio|audio/.test(s)) return Headphones;
  if (/speak|fala|pron/.test(s)) return Mic;
  if (/gram[aá]t|vocab|idioma|ingl/.test(s)) return Languages;
  if (/event|agenda|calend/.test(s)) return Calendar;
  if (/novidade|update|anunc|notíci|noticia/.test(s)) return Megaphone;
  if (/presente|gift|recomp|bônus|bonus/.test(s)) return Gift;
  if (/energ|boost|r[aá]pido|zap/.test(s)) return Zap;
  if (/amor|coraç|love|favorit/.test(s)) return Heart;
  if (/info|aviso/.test(s)) return Info;
  return Sparkles;
}

export function resolveNotificationIcon(
  storedKey?: string | null,
  tagName?: string | null,
  title?: string,
): LucideIcon {
  return iconFromKey(storedKey) ?? guessIcon(tagName, title);
}
