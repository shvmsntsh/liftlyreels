/**
 * Audio engine that plays locally-hosted ambient WAV files.
 * Uses a single HTML Audio element for iOS compatibility.
 */

import { getDefaultTrack, getTrackById, type AudioTrack } from "./audio-tracks";

export class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private _currentTrackId: string | null = null;
  private _currentCategory: string | null = null;
  private _isPlaying = false;
  private unlocked = false;

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.preload = "auto";
      this.audio.volume = 0.5;
    }
    return this.audio;
  }

  /** Unlock audio on iOS (call from a user gesture handler) */
  async unlock(): Promise<void> {
    if (this.unlocked) return;
    const el = this.ensureAudio();
    try {
      el.muted = true;
      // Use a tiny silence data URI to unlock
      const prevSrc = el.src;
      el.src =
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      await el.play();
      el.pause();
      el.muted = false;
      el.currentTime = 0;
      if (prevSrc) el.src = prevSrc;
      this.unlocked = true;
    } catch {
      // Silently fail — will retry on next gesture
    }
  }

  /** Play a specific track by ID, or the default track for a category */
  async play(
    category: string,
    trackId?: string | null
  ): Promise<boolean> {
    try {
      const el = this.ensureAudio();

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

  /** Set volume (0-1) */
  setVolume(v: number): void {
    const el = this.ensureAudio();
    el.volume = Math.max(0, Math.min(1, v));
  }

  get volume(): number {
    return this.audio?.volume ?? 0.5;
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
      this.audio.src = "";
      this.audio = null;
    }
    this._isPlaying = false;
    this._currentTrackId = null;
  }
}
