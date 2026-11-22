import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { T, useI18n } from '@gaabe/i18n';
import { getPlaybackController } from './controller';
import { resolveProvider } from './providers';
import { PLAYBACK_RATES, type PlaybackState, type SpeechSegment } from './types';

export function usePlayback(): PlaybackState {
  const c = getPlaybackController();
  return useSyncExternalStore(
    (cb) => c.subscribe(cb),
    () => c.getState(),
    () => c.getState(),
  );
}

/** English voices load asynchronously in some browsers; re-read when they change. */
function useEnglishVoices() {
  const [voices, setVoices] = useState(() => getPlaybackController().getProviders().browser.voices());
  useEffect(() => {
    const synth = globalThis.speechSynthesis;
    if (!synth) return;
    const update = () => setVoices(getPlaybackController().getProviders().browser.voices());
    update();
    synth.addEventListener?.('voiceschanged', update);
    return () => synth.removeEventListener?.('voiceschanged', update);
  }, []);
  return voices;
}

export interface ReadAloudToolbarProps {
  /** Unique id for this narration surface (page/slide/lesson). */
  queueId: string;
  segments: SpeechSegment[];
  /** Optional label, e.g. "Read this slide". */
  label?: string;
  /** Hide voice picker/speed (compact mode for per-item buttons). */
  compact?: boolean;
}

/**
 * Read Aloud controls. Availability is decided by the provider for each segment's stored language;
 * when unavailable the real reason is shown instead of silently doing nothing or substituting a voice.
 */
export function ReadAloudToolbar({ queueId, segments, label, compact }: ReadAloudToolbarProps) {
  const { t } = useI18n();
  const c = getPlaybackController();
  const state = usePlayback();
  const voices = useEnglishVoices();
  const selectId = useId();
  const mine = state.queueId === queueId;
  const status = mine ? state.status : 'idle';
  const first = segments[0];

  // Pre-flight: tell the truth about availability before the user presses Play.
  let preflight: string | null = null;
  if (first) {
    const provider = resolveProvider(first, c.getProviders());
    const a = provider.supports(first);
    if (!a.available) preflight = `speech.unavailable.${a.reason}`;
  }
  const reason = mine && state.status === 'unavailable' ? state.reason : null;
  const messageKey = reason ? `speech.unavailable.${reason}` : preflight;

  const playing = status === 'playing';
  const paused = status === 'paused';

  return (
    <div className="readaloud" role="group" aria-label={label ?? t('speech.readAloud')}>
      <strong>
        <T k="speech.readAloud" />
      </strong>
      {!playing && !paused && (
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => c.start(queueId, segments)}
          disabled={segments.length === 0}
        >
          ▶ {label ?? t('speech.play')}
        </button>
      )}
      {playing && (
        <button type="button" className="btn btn-sm" onClick={() => c.pause()}>
          ❚❚ {t('speech.pause')}
        </button>
      )}
      {paused && (
        <button type="button" className="btn btn-sm" onClick={() => c.resume()}>
          ▶ {t('speech.resume')}
        </button>
      )}
      {(playing || paused || status === 'unavailable' || status === 'error') && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => c.stop()}>
          ■ {t('speech.stop')}
        </button>
      )}
      {!compact && segments.length > 1 && mine && (
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => c.previous()} disabled={state.index <= 0}>
            {t('speech.previous')}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => c.next()}
            disabled={state.index >= segments.length - 1}
          >
            {t('speech.next')}
          </button>
        </>
      )}
      {!compact && first?.lang === 'en' && !first.audioUrl && (
        <>
          <label htmlFor={`${selectId}-rate`} className="sr-only">
            {t('speech.speed')}
          </label>
          <select
            id={`${selectId}-rate`}
            value={state.rate}
            onChange={(e) => c.setRate(Number(e.target.value))}
            aria-label={t('speech.speed')}
          >
            {PLAYBACK_RATES.map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
          {voices.length > 0 && (
            <>
              <label htmlFor={`${selectId}-voice`} className="sr-only">
                {t('speech.voice')}
              </label>
              <select
                id={`${selectId}-voice`}
                value={state.voiceURI ?? ''}
                onChange={(e) => c.setVoice(e.target.value || undefined)}
                aria-label={t('speech.voice')}
              >
                <option value="">{t('speech.voice')}</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </>
          )}
        </>
      )}
      <span aria-live="polite" style={{ flexBasis: '100%' }}>
        {messageKey && (
          <span className="muted">
            <T k={messageKey as never} />
          </span>
        )}
        {mine && status === 'error' && (
          <span role="alert">
            <T k="speech.error" />
          </span>
        )}
        {mine && (playing || paused) && state.segmentId && (
          <span className="muted">
            <T k="speech.nowReading" /> {state.index + 1}/{state.total}
          </span>
        )}
      </span>
    </div>
  );
}

/** Highlights the segment currently being read in a given queue. */
export function useReadingSegmentId(queueId: string): string | null {
  const s = usePlayback();
  return s.queueId === queueId && (s.status === 'playing' || s.status === 'paused') ? s.segmentId : null;
}
