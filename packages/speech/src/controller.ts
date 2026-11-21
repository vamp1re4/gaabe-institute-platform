import {
  createDefaultProviders,
  resolveProvider,
  type ProviderSet,
} from './providers';
import type { PlaybackHandle, PlaybackState, SpeechSegment } from './types';

type Listener = (s: PlaybackState) => void;

const IDLE: PlaybackState = {
  status: 'idle',
  queueId: null,
  index: 0,
  total: 0,
  segmentId: null,
  providerId: null,
  reason: null,
  rate: 1,
};

/**
 * Shared playback controller. Guarantees ONE narration at a time across the whole app:
 * starting a queue stops whatever was playing. It never skips an unavailable segment silently —
 * playback halts and the reason is surfaced so the UI can tell the truth.
 */
export class PlaybackController {
  private state: PlaybackState = { ...IDLE };
  private listeners = new Set<Listener>();
  private queue: SpeechSegment[] = [];
  private sequential = true;
  private handle: PlaybackHandle | null = null;
  private run = 0;

  constructor(private providers: ProviderSet = createDefaultProviders()) {}

  getProviders(): ProviderSet {
    return this.providers;
  }

  getState(): PlaybackState {
    return this.state;
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private set(patch: Partial<PlaybackState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  /** Start a queue. `sequential=false` plays just the segment at `startIndex`. */
  start(queueId: string, segments: SpeechSegment[], startIndex = 0, sequential = true) {
    this.halt();
    this.queue = segments;
    this.sequential = sequential;
    this.set({ queueId, total: segments.length, index: startIndex });
    void this.playIndex(startIndex);
  }

  private halt() {
    this.run++;
    const h = this.handle;
    this.handle = null;
    h?.stop();
  }

  private async playIndex(index: number): Promise<void> {
    const seg = this.queue[index];
    const myRun = ++this.run;
    if (!seg) {
      this.set({ status: 'idle', segmentId: null, providerId: null, reason: null });
      return;
    }
    const provider = resolveProvider(seg, this.providers);
    const availability = provider.supports(seg);
    if (!availability.available) {
      this.set({
        status: 'unavailable',
        index,
        segmentId: seg.id,
        providerId: provider.id,
        reason: availability.reason,
      });
      return;
    }
    try {
      const h = provider.speak(seg, { rate: this.state.rate, voiceURI: this.state.voiceURI });
      this.handle = h;
      this.set({ status: 'playing', index, segmentId: seg.id, providerId: provider.id, reason: null });
      const result = await h.done;
      if (myRun !== this.run) return; // superseded
      if (result === 'ended' && this.sequential && index + 1 < this.queue.length) {
        await this.playIndex(index + 1);
      } else if (result === 'ended') {
        this.set({ status: 'idle', segmentId: null, providerId: null });
      }
    } catch {
      if (myRun !== this.run) return;
      this.set({ status: 'error', segmentId: seg.id, providerId: provider.id, reason: null });
    }
  }

  pause() {
    if (this.state.status !== 'playing') return;
    this.handle?.pause();
    this.set({ status: 'paused' });
  }

  resume() {
    if (this.state.status !== 'paused') return;
    this.handle?.resume();
    this.set({ status: 'playing' });
  }

  stop() {
    this.halt();
    this.set({ ...IDLE, rate: this.state.rate, voiceURI: this.state.voiceURI });
  }

  next() {
    const i = this.state.index + 1;
    if (this.state.queueId && i < this.queue.length) {
      this.halt();
      void this.playIndex(i);
    }
  }

  previous() {
    const i = this.state.index - 1;
    if (this.state.queueId && i >= 0) {
      this.halt();
      void this.playIndex(i);
    }
  }

  replay() {
    if (!this.state.queueId) return;
    this.halt();
    void this.playIndex(this.state.index);
  }

  setRate(rate: number) {
    this.set({ rate });
    if (this.state.status === 'playing' || this.state.status === 'paused') this.replay();
  }

  setVoice(voiceURI: string | undefined) {
    this.set({ voiceURI });
  }
}

let singleton: PlaybackController | null = null;
export function getPlaybackController(): PlaybackController {
  singleton ??= new PlaybackController();
  return singleton;
}
