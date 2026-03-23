/**
 * Audio engine that plays locally-hosted ambient WAV files.
 * Accepts an external DOM <audio> element for iOS compatibility.
 * iOS Safari requires the audio element to be rendered in JSX (not new Audio()).
 */

import { getDefaultTrack, getTrackById, type AudioTrack } from "./audio-tracks";

export class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private _currentTrackId: string | null = null;
  private _currentCategory: string | null = null;
  private _isPlaying = false;

  /** Bind to a DOM-rendered <audio> element */
  setElement(el: HTMLAudioElement): void {
    this.audio = el;
  }

  /** Unlock audio on iOS (call synchronously inside a user gesture handler) */
  unlock(): void {
    const el = this.audio;
    if (!el) return;
    // iOS requires play() to be called synchronously in a gesture handler.
    // Play muted silence to prime the element, then immediately pause.
    el.muted = true;
    const p = el.play();
    if (p) {
      p.then(() => {
        el.pause();
        el.muted = false;
        el.currentTime = 0;
      }).catch(() => {
        el.muted = false;
      });
    }
  }

  /** Play a specific track by ID, or the default track for a category */
  async play(
    category: string,
    trackId?: string | null
  ): Promise<boolean> {
    const el = this.audio;
    if (!el) return false;

    try {
      // Resolve which track to play
      let track: AudioTrack | undefined;
      if (trackId) {
        track = getTrackById(trackId);
      }
      if (!track) {
        track = getDefaultTrack(category);
      }

      // Already playing this track
      if (
        this._isPlaying &&
        this._currentTrackId === track.id &&
        !el.paused
      ) {
        return true;
      }

      // Load new track if different
      if (this._currentTrackId !== track.id) {
        el.src = track.url;
        this._currentTrackId = track.id;
      }

      this._currentCategory = category;
      el.muted = false;
      await el.play();
      this._isPlaying = true;
      return true;
    } catch {
      this._isPlaying = false;
      return false;
    }
  }

  /** Pause playback */
  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
    this._isPlaying = false;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get currentTrackId(): string | null {
    return this._currentTrackId;
  }

  get currentCategory(): string | null {
    return this._currentCategory;
  }

  get trackLabel(): string {
    if (!this._currentTrackId) return "";
    const track = getTrackById(this._currentTrackId);
    return track?.label ?? "";
  }

  destroy(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
    }
    this._isPlaying = false;
    this._currentTrackId = null;
    this._currentCategory = null;
    this.audio = null;
  }
}
