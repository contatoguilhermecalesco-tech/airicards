// Efeitos da forja: som sintetizado (sem asset) + vibração no celular.
let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  at: number,
  freq: number,
  dur: number,
  gain: number,
  type: OscillatorType = "sine",
) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function noiseHit(ac: AudioContext, at: number, dur = 0.22, gain = 0.16) {
  const frames = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(at);
}

/** Marteladas na bigorna enquanto a forja acontece. */
export function playForgeHammer() {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  [0, 0.22, 0.46].forEach((off, i) => {
    noiseHit(ac, now + off, 0.2, 0.13 + i * 0.02);
    tone(ac, now + off, 150 - i * 18, 0.2, 0.12, "triangle");
  });
}

/** Revelação do cosmético — acorde ascendente; crítico ganha brilho extra. */
export function playForgeReveal(crit = false) {
  const ac = ensureCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const notes = crit ? [523, 659, 784, 1046, 1318] : [523, 659, 784];
  notes.forEach((f, i) => {
    tone(ac, now + i * 0.075, f, crit ? 0.75 : 0.5, crit ? 0.16 : 0.13);
  });
  if (crit) {
    tone(ac, now + 0.42, 2093, 0.9, 0.08, "triangle");
    noiseHit(ac, now + 0.4, 0.6, 0.07);
  }
}

export function vibrateForge(crit = false) {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(crit ? [18, 60, 22, 60, 40, 80, 90] : [14, 70, 18, 70, 30]);
  } catch {
    /* ignore */
  }
}
