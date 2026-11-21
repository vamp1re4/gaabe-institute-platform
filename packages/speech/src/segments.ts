import type { SpeechLang, SpeechSegment } from './types';

/**
 * Splits text into sentence-sized segments for narration. Handles Latin/Thaana full stops,
 * Arabic question mark (؟) and Arabic full stop (۔). The language tag is supplied by the caller
 * (the content block's stored language); it is never detected.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?؟۔])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toSegments(idPrefix: string, text: string, lang: SpeechLang): SpeechSegment[] {
  return splitSentences(text).map((t, i) => ({ id: `${idPrefix}-${i + 1}`, text: t, lang }));
}
