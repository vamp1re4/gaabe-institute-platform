export type SpeechLang = 'dv' | 'en' | 'ar';

/**
 * A unit of narration. `lang` is the EXPLICITLY STORED language of the content block —
 * it is never guessed from the text.
 */
export interface SpeechSegment {
  id: string;
  text: string;
  lang: SpeechLang;
  /** Pre-recorded audio. `teacher` = Gaabe Sir's own recording; `recitation` = approved reciter recording. */
  audioUrl?: string;
  audioKind?: 'teacher' | 'recitation';
  label?: string;
}

/** Reason keys map to i18n keys `speech.unavailable.<reason>`. */
export type UnavailableReason = 'dv' | 'ar' | 'en' | 'teacher';

export type Availability = { available: true } | { available: false; reason: UnavailableReason };

export interface PlayOptions {
  rate: number;
  voiceURI?: string;
}

export interface PlaybackHandle {
  pause(): void;
  resume(): void;
  stop(): void;
  /** Resolves 'ended' on natural completion, 'stopped' when stopped; rejects on engine failure. */
  done: Promise<'ended' | 'stopped'>;
}

export interface SpeechProvider {
  id: string;
  label: string;
  supports(segment: SpeechSegment): Availability;
  speak(segment: SpeechSegment, options: PlayOptions): PlaybackHandle;
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'unavailable' | 'error';

export interface PlaybackState {
  status: PlaybackStatus;
  /** Identifies which UI surface owns the active queue (so other toolbars stay idle). */
  queueId: string | null;
  index: number;
  total: number;
  segmentId: string | null;
  providerId: string | null;
  reason: UnavailableReason | null;
  rate: number;
  voiceURI?: string;
}

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;
