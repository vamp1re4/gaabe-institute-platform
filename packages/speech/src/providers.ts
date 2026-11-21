import type {
  Availability,
  PlaybackHandle,
  PlayOptions,
  SpeechProvider,
  SpeechSegment,
} from './types';

/** Plays a pre-recorded file. Shared by the teacher and approved-recitation providers. */
function playAudioFile(url: string, options: PlayOptions): PlaybackHandle {
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.playbackRate = options.rate;
  // Deliberately no `controls` and no download affordance. (Not a security boundary — see docs.)
  let settled = false;
  let finish: (r: 'ended' | 'stopped') => void = () => undefined;
  const done = new Promise<'ended' | 'stopped'>((resolve, reject) => {
    finish = (r) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };
    audio.onended = () => finish('ended');
    audio.onerror = () => {
      if (settled) return;
      settled = true;
      reject(new Error('audio-error'));
    };
    audio.play().catch((e: unknown) => {
      if (settled) return;
      settled = true;
      reject(e instanceof Error ? e : new Error('play-rejected'));
    });
  });
  return {
    pause: () => audio.pause(),
    resume: () => void audio.play().catch(() => undefined),
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
      finish('stopped');
    },
    done,
  };
}

/** Teacher's own recordings. Highest priority whenever a segment has one. */
export class TeacherRecordingProvider implements SpeechProvider {
  id = 'teacher-recording';
  label = 'Teacher recording';
  supports(s: SpeechSegment): Availability {
    return s.audioUrl && s.audioKind === 'teacher'
      ? { available: true }
      : { available: false, reason: 'teacher' };
  }
  speak(s: SpeechSegment, o: PlayOptions): PlaybackHandle {
    if (!s.audioUrl) throw new Error('No teacher recording');
    return playAudioFile(s.audioUrl, o);
  }
}

/**
 * Arabic is played ONLY from approved recordings by qualified reciters.
 * Generic synthetic Arabic speech is never presented as Quranic recitation.
 */
export class ApprovedArabicAudioProvider implements SpeechProvider {
  id = 'approved-arabic-audio';
  label = 'Approved recitation';
  supports(s: SpeechSegment): Availability {
    return s.lang === 'ar' && s.audioUrl && s.audioKind === 'recitation'
      ? { available: true }
      : { available: false, reason: 'ar' };
  }
  speak(s: SpeechSegment, o: PlayOptions): PlaybackHandle {
    if (!s.audioUrl) throw new Error('No approved recording');
    return playAudioFile(s.audioUrl, o);
  }
}

/**
 * Dhivehi provider interface. NO verified Dhivehi speech engine is integrated, so this
 * reports unavailable. It never falls back to an Arabic/Hindi/English voice.
 * To integrate an engine later: implement `speak` and return `{available:true}` from `supports`
 * only after native-speaker verification.
 */
export class DhivehiSpeechProvider implements SpeechProvider {
  id = 'dhivehi-tts';
  label = 'Dhivehi speech';
  supports(s: SpeechSegment): Availability {
    void s;
    return { available: false, reason: 'dv' };
  }
  speak(): PlaybackHandle {
    throw new Error('Dhivehi TTS is not integrated');
  }
}

export interface VoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
}

/** Browser-native speech synthesis — English only. */
export class BrowserSpeechProvider implements SpeechProvider {
  id = 'browser-speech-en';
  label = 'Browser speech (English)';
  constructor(private synth: SpeechSynthesis | undefined = globalThis.speechSynthesis) {}

  voices(): VoiceInfo[] {
    if (!this.synth) return [];
    return this.synth
      .getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith('en'))
      .map((v) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }));
  }

  supports(s: SpeechSegment): Availability {
    if (s.lang !== 'en') return { available: false, reason: s.lang };
    if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined')
      return { available: false, reason: 'en' };
    const all = this.synth.getVoices();
    // Voices load asynchronously in some browsers: only declare unavailable once loaded and none match.
    if (all.length > 0 && this.voices().length === 0) return { available: false, reason: 'en' };
    return { available: true };
  }

  speak(s: SpeechSegment, o: PlayOptions): PlaybackHandle {
    const synth = this.synth;
    if (!synth) throw new Error('speechSynthesis unavailable');
    const u = new SpeechSynthesisUtterance(s.text);
    u.rate = o.rate;
    u.lang = 'en';
    if (o.voiceURI) {
      const v = synth.getVoices().find((x) => x.voiceURI === o.voiceURI);
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      }
    }
    let stopped = false;
    const done = new Promise<'ended' | 'stopped'>((resolve, reject) => {
      u.onend = () => resolve(stopped ? 'stopped' : 'ended');
      u.onerror = (e) => {
        if (stopped || e.error === 'canceled' || e.error === 'interrupted') resolve('stopped');
        else reject(new Error(e.error));
      };
    });
    synth.cancel();
    synth.speak(u);
    return {
      pause: () => synth.pause(),
      resume: () => synth.resume(),
      stop: () => {
        stopped = true;
        synth.cancel();
      },
      done,
    };
  }
}

export interface ProviderSet {
  browser: BrowserSpeechProvider;
  dhivehi: DhivehiSpeechProvider;
  arabic: ApprovedArabicAudioProvider;
  teacher: TeacherRecordingProvider;
}

export function createDefaultProviders(): ProviderSet {
  return {
    browser: new BrowserSpeechProvider(),
    dhivehi: new DhivehiSpeechProvider(),
    arabic: new ApprovedArabicAudioProvider(),
    teacher: new TeacherRecordingProvider(),
  };
}

/**
 * Chooses the provider for a segment. Priority:
 *  1. Teacher recording (if present) — regardless of language.
 *  2. Language-specific provider; Dhivehi/Arabic never borrow another language's voice.
 */
export function resolveProvider(s: SpeechSegment, p: ProviderSet): SpeechProvider {
  if (s.audioUrl && s.audioKind === 'teacher') return p.teacher;
  if (s.lang === 'ar') return p.arabic;
  if (s.lang === 'dv') return p.dhivehi;
  return p.browser;
}
