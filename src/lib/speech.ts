// Wrappers para Web Speech API (funciona nativamente no Safari iOS e Chrome).
// TTS via SpeechSynthesis, STT via SpeechRecognition.

export function isBrowser() {
  return typeof window !== "undefined";
}

// ---------- TTS ----------

export function speak(
  text: string,
  opts?: { rate?: number; lang?: string; onEnd?: () => void; onStart?: () => void },
) {
  if (!isBrowser() || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts?.lang ?? "en-US";
  u.rate = opts?.rate ?? 1;
  u.pitch = 1;
  if (opts?.onEnd) u.onend = opts.onEnd;
  if (opts?.onStart) u.onstart = opts.onStart;
  // pick a good en-US voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith("en") && /Samantha|Ava|Aaron|Google US English|Zira|Karen/i.test(v.name),
  );
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (!isBrowser() || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

export function ttsAvailable(): boolean {
  return isBrowser() && "speechSynthesis" in window;
}

// ---------- STT ----------

// Safari uses webkitSpeechRecognition; Chrome exposes SpeechRecognition.
type AnyWindow = Window & {
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  SpeechRecognition?: new () => SpeechRecognitionLike;
};

type SRAlt = { transcript: string; confidence: number };
type SRResult = { 0: SRAlt; isFinal: boolean; length: number };
type SRResults = { length: number; [i: number]: SRResult };

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: SRResults }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export function sttAvailable(): boolean {
  if (!isBrowser()) return false;
  const w = window as AnyWindow;
  return Boolean(w.webkitSpeechRecognition || w.SpeechRecognition);
}

export type STTHandle = {
  stop: () => void;
  abort: () => void;
};

export function startRecognition(opts: {
  lang?: string;
  onInterim?: (text: string) => void;
  onFinal: (text: string, confidence: number) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
}): STTHandle | null {
  if (!isBrowser()) return null;
  const w = window as AnyWindow;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = opts.lang ?? "en-US";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = "";
  let finalConf = 0;
  rec.onresult = (e) => {
    let interim = "";
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i];
      const alt = res[0];
      if (res.isFinal) {
        finalText += alt.transcript;
        finalConf = alt.confidence;
      } else {
        interim += alt.transcript;
      }
    }
    if (interim && opts.onInterim) opts.onInterim(interim);
  };
  rec.onerror = (e) => opts.onError?.(e.error);
  rec.onend = () => {
    if (finalText.trim()) opts.onFinal(finalText.trim(), finalConf);
    opts.onEnd?.();
  };
  try {
    rec.start();
  } catch (e) {
    opts.onError?.(e instanceof Error ? e.message : "start_failed");
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    },
    abort: () => {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    },
  };
}
