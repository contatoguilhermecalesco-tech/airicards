// Tiny synthesized "tri-tone" chime using WebAudio — no asset needed.
// Also handles a short vibration pulse on supported devices.
let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function playChime() {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const notes = [880, 1320]; // A5, E6 — gentle two-note ping
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.11;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

export function vibratePulse() {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.([12, 40, 18]);
  } catch {
    /* ignore */
  }
}
