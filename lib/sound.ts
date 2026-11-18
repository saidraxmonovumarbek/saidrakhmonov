/**
 * The site soundtrack: one looping track, shared by the whole app.
 *
 * The music is on by default on every visit and every refresh: turning it off
 * only lasts until the page is reloaded. Browsers only allow sound after the
 * visitor interacts with the page, so `startSound()` is tried on load and
 * again on the first click, tap or key press.
 * When the file's host allows cross-origin reads, the track is also routed
 * through an analyser so the scene can pulse with the bass (`soundLevel()`).
 */

export const SOUNDTRACK = {
  src: "https://mfeyyptx0pvafogs.public.blob.vercel-storage.com/demo/Let-it-happen.m4a",
  title: "Let It Happen",
  artist: "Tame Impala",
};

const VOLUME = 0.55;

export type SoundState = "idle" | "waiting" | "playing" | "paused";

let audio: HTMLAudioElement | null = null;
let corsChecked: Promise<boolean> | null = null;
let corsOk = false;
let context: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;
let fade = 0;
let state: SoundState = "idle";
let average = 0.2;
const listeners = new Set<(s: SoundState) => void>();

const setState = (next: SoundState) => {
  state = next;
  listeners.forEach((fn) => fn(next));
};

export const soundState = () => state;
export function onSoundState(fn: (s: SoundState) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}


/** Check (once) whether the host lets us read the audio data, before the element is made. */
export function prepareSound(): Promise<boolean> {
  corsChecked ??= fetch(SOUNDTRACK.src, { method: "HEAD", mode: "cors" })
    .then((r) => (corsOk = r.ok))
    .catch(() => (corsOk = false));
  return corsChecked;
}

function element(): HTMLAudioElement {
  if (audio) return audio;
  audio = new Audio();
  // only ask for CORS when the host grants it, otherwise the file would not load at all
  if (corsOk) audio.crossOrigin = "anonymous";
  audio.src = SOUNDTRACK.src;
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  audio.addEventListener("ended", () => audio?.play().catch(() => {}));
  return audio;
}

function rampTo(target: number, seconds: number, done?: () => void) {
  const el = element();
  cancelAnimationFrame(fade);
  const from = el.volume;
  const begin = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - begin) / (seconds * 1000));
    el.volume = from + (target - from) * k * k * (3 - 2 * k);
    if (k < 1) fade = requestAnimationFrame(step);
    else done?.();
  };
  fade = requestAnimationFrame(step);
}

/** Hook up the analyser. Must run inside a user gesture, or the context stays silent. */
function listen() {
  if (!corsOk || analyser || typeof AudioContext === "undefined") return;
  try {
    context = new AudioContext();
    void context.resume();
    const source = context.createMediaElementSource(element());
    analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
    analyser.connect(context.destination);
    bins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  } catch {
    analyser = null;
  }
}

/**
 * Start (or resume) the music. Call it straight from an event handler when
 * you can: `fromGesture` lets it set up the beat analyser too.
 */
export function startSound(fromGesture: boolean): Promise<boolean> {
  const el = element();
  if (fromGesture) {
    listen();
    void context?.resume();
  }
  return el
    .play()
    .then(() => {
      setState("playing");
      rampTo(VOLUME, 2.5);
      return true;
    })
    .catch(() => {
      setState("waiting");
      return false;
    });
}

export function stopSound() {
  setState("paused");
  rampTo(0, 0.45, () => audio?.pause());
}

/** 0..1, how hard the low end is hitting right now (0 when silent or unavailable). */
export function soundLevel(): number {
  if (!analyser || !bins || state !== "playing") return 0;
  analyser.getByteFrequencyData(bins);
  let sum = 0;
  // roughly 40–260 Hz: kick and bass
  for (let i = 1; i < 7; i++) sum += bins[i];
  const bass = sum / (6 * 255);
  average += (bass - average) * 0.02;
  return Math.min(1, Math.max(0, (bass - average * 0.85) * 3.2));
}
