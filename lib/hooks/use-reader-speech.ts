"use client";

import { useSyncExternalStore } from "react";
import {
  SERVER_SPEECH_STATE,
  getSpeechState,
  subscribeSpeech,
} from "@/lib/speech/reader-speech";

/** Estado de la lectura en voz alta (ver lib/speech/reader-speech.ts). */
export function useReaderSpeech() {
  return useSyncExternalStore(
    subscribeSpeech,
    getSpeechState,
    () => SERVER_SPEECH_STATE
  );
}
