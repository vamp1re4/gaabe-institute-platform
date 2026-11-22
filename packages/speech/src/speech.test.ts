import { describe, expect, it } from 'vitest';
import { PlaybackController } from './controller';
import {
  ApprovedArabicAudioProvider,
  BrowserSpeechProvider,
  DhivehiSpeechProvider,
  TeacherRecordingProvider,
  resolveProvider,
  type ProviderSet,
} from './providers';
import { splitSentences, toSegments } from './segments';
import type { SpeechSegment } from './types';

const providers = (): ProviderSet => ({
  browser: new BrowserSpeechProvider(undefined),
  dhivehi: new DhivehiSpeechProvider(),
  arabic: new ApprovedArabicAudioProvider(),
  teacher: new TeacherRecordingProvider(),
});

const seg = (over: Partial<SpeechSegment>): SpeechSegment => ({ id: 's1', text: 'x', lang: 'en', ...over });

describe('provider resolution', () => {
  it('routes by stored language, never by guessing', () => {
    const p = providers();
    expect(resolveProvider(seg({ lang: 'en' }), p)).toBe(p.browser);
    expect(resolveProvider(seg({ lang: 'dv' }), p)).toBe(p.dhivehi);
    expect(resolveProvider(seg({ lang: 'ar' }), p)).toBe(p.arabic);
  });

  it('prefers a teacher recording over any synthetic provider', () => {
    const p = providers();
    expect(resolveProvider(seg({ lang: 'dv', audioUrl: 'blob:x', audioKind: 'teacher' }), p)).toBe(p.teacher);
  });
});

describe('truthful unavailability', () => {
  it('Dhivehi is always unavailable (no verified engine)', () => {
    const a = new DhivehiSpeechProvider().supports(seg({ lang: 'dv' }));
    expect(a).toEqual({ available: false, reason: 'dv' });
  });

  it('Arabic without an approved recitation is unavailable', () => {
    const a = new ApprovedArabicAudioProvider().supports(seg({ lang: 'ar' }));
    expect(a).toEqual({ available: false, reason: 'ar' });
  });

  it('Arabic only counts as available with an approved recitation', () => {
    const ok = new ApprovedArabicAudioProvider().supports(
      seg({ lang: 'ar', audioUrl: 'blob:y', audioKind: 'recitation' }),
    );
    expect(ok.available).toBe(true);
    const wrongKind = new ApprovedArabicAudioProvider().supports(
      seg({ lang: 'ar', audioUrl: 'blob:y', audioKind: 'teacher' }),
    );
    expect(wrongKind.available).toBe(false);
  });

  it('browser provider refuses non-English and reports missing engine', () => {
    const b = new BrowserSpeechProvider(undefined);
    expect(b.supports(seg({ lang: 'dv' }))).toEqual({ available: false, reason: 'dv' });
    expect(b.supports(seg({ lang: 'en' }))).toEqual({ available: false, reason: 'en' });
  });

  it('controller halts with the real reason instead of skipping or substituting', () => {
    const c = new PlaybackController(providers());
    c.start('q', [seg({ lang: 'dv', id: 'a' }), seg({ lang: 'en', id: 'b' })]);
    const s = c.getState();
    expect(s.status).toBe('unavailable');
    expect(s.reason).toBe('dv');
    expect(s.segmentId).toBe('a');
  });

  it('stop resets state', () => {
    const c = new PlaybackController(providers());
    c.start('q', [seg({ lang: 'dv' })]);
    c.stop();
    expect(c.getState().status).toBe('idle');
    expect(c.getState().queueId).toBeNull();
  });
});

describe('segmenter', () => {
  it('splits sentences on Latin and Arabic punctuation', () => {
    expect(splitSentences('One. Two! Three؟ Four')).toEqual(['One.', 'Two!', 'Three؟', 'Four']);
  });
  it('keeps the supplied language tag on every segment', () => {
    const segs = toSegments('p', 'A. B.', 'dv');
    expect(segs).toHaveLength(2);
    expect(segs.every((s) => s.lang === 'dv')).toBe(true);
    expect(segs[1]!.id).toBe('p-2');
  });
});
