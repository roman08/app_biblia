// Lectura en voz alta del capítulo con la Web Speech API del navegador.
//
// Es un store a nivel de módulo (no un contexto de React) para que el botón
// del header, la barra de reproducción, la lista de versículos y el atajo de
// teclado compartan el mismo estado aunque vivan en árboles distintos.
//
// Se lee un versículo por utterance: permite resaltar el versículo actual y
// evita que Chrome en Android corte los textos largos. "Pausar" cancela y
// recuerda el índice, porque pause()/resume() fallan en varios navegadores.

export type SpeechStatus = "idle" | "playing" | "paused";

export interface SpeechState {
  supported: boolean;
  status: SpeechStatus;
  /** Índice (0-based) del versículo que se está leyendo; -1 si no hay */
  index: number;
  total: number;
  rate: number;
}

export const SPEECH_RATES = [0.8, 1, 1.2, 1.5] as const;

const RATE_STORAGE_KEY = "biblia:speech-rate";

const isBrowser = typeof window !== "undefined";
const supported = isBrowser && "speechSynthesis" in window;

function readStoredRate(): number {
  try {
    const value = Number(localStorage.getItem(RATE_STORAGE_KEY));
    return (SPEECH_RATES as readonly number[]).includes(value) ? value : 1;
  } catch {
    return 1;
  }
}

let state: SpeechState = {
  supported,
  status: "idle",
  index: -1,
  total: 0,
  rate: supported ? readStoredRate() : 1,
};

export const SERVER_SPEECH_STATE: SpeechState = {
  supported: false,
  status: "idle",
  index: -1,
  total: 0,
  rate: 1,
};

const listeners = new Set<() => void>();

function setState(patch: Partial<SpeechState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function subscribeSpeech(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSpeechState() {
  return state;
}

// ─── Voz ────────────────────────────────────────────────────────────────

const VOICE_PREFERENCE = ["es-MX", "es-US", "es-419", "es-ES"];
let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  const spanish = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  for (const lang of VOICE_PREFERENCE) {
    const match = spanish.find((v) => v.lang.replace("_", "-") === lang);
    if (match) return match;
  }
  return spanish[0] ?? null;
}

if (supported) {
  voice = pickVoice();
  // En Chrome las voces cargan después del primer render
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    voice = pickVoice();
  });
}

// ─── Capítulo registrado ────────────────────────────────────────────────

let texts: string[] = [];
let chapterKey: string | null = null;
let mountCount = 0;
// Cada utterance guarda el token con el que se creó; si cambió (pausa, stop,
// salto a otro versículo) sus eventos onend/onerror se ignoran.
let token = 0;

/**
 * Registra el capítulo en pantalla. Devuelve la función de limpieza para un
 * useEffect. Si el componente se vuelve a montar (p. ej. al entrar al modo
 * enfocado) la lectura continúa; si el usuario sale del lector, se detiene.
 */
export function registerSpeechChapter(key: string, chapterTexts: string[]) {
  if (key !== chapterKey) {
    stopSpeech();
    chapterKey = key;
  }
  texts = chapterTexts;
  mountCount++;
  if (state.total !== texts.length) setState({ total: texts.length });

  return () => {
    mountCount--;
    setTimeout(() => {
      if (mountCount === 0 && chapterKey === key) {
        stopSpeech();
        chapterKey = null;
        texts = [];
      }
    }, 0);
  };
}

// ─── Reproducción ───────────────────────────────────────────────────────

function speakFrom(index: number) {
  if (!supported) return;
  const synth = window.speechSynthesis;
  const myToken = ++token;
  synth.cancel();

  if (index >= texts.length) {
    setState({ status: "idle", index: -1 });
    return;
  }

  const utterance = new SpeechSynthesisUtterance(texts[index]);
  utterance.lang = voice?.lang ?? "es-MX";
  if (voice) utterance.voice = voice;
  utterance.rate = state.rate;
  utterance.onend = () => {
    if (myToken === token) speakFrom(index + 1);
  };
  utterance.onerror = (e) => {
    if (myToken !== token) return;
    if (e.error === "interrupted" || e.error === "canceled") return;
    setState({ status: "idle", index: -1 });
  };

  setState({ status: "playing", index });
  synth.speak(utterance);
}

/** Empieza a leer desde el versículo `verseNumber` (1-based). */
export function playFromVerse(verseNumber: number) {
  if (!texts.length) return;
  speakFrom(Math.max(0, Math.min(verseNumber - 1, texts.length - 1)));
}

export function pauseSpeech() {
  if (state.status !== "playing") return;
  token++;
  window.speechSynthesis.cancel();
  setState({ status: "paused" });
}

export function resumeSpeech() {
  if (state.status !== "paused") return;
  speakFrom(state.index);
}

export function stopSpeech() {
  if (!supported) return;
  token++;
  window.speechSynthesis.cancel();
  if (state.status !== "idle") setState({ status: "idle", index: -1 });
}

/** Reproducir / pausar / reanudar según el estado actual. */
export function toggleSpeech() {
  if (state.status === "playing") pauseSpeech();
  else if (state.status === "paused") resumeSpeech();
  else playFromVerse(1);
}

export function setSpeechRate(rate: number) {
  try {
    localStorage.setItem(RATE_STORAGE_KEY, String(rate));
  } catch {
    // almacenamiento no disponible: la velocidad solo dura esta sesión
  }
  setState({ rate });
  // Aplicar la nueva velocidad al versículo actual
  if (state.status === "playing") speakFrom(state.index);
}

export function cycleSpeechRate() {
  const i = SPEECH_RATES.indexOf(state.rate as (typeof SPEECH_RATES)[number]);
  setSpeechRate(SPEECH_RATES[(i + 1) % SPEECH_RATES.length]);
}
