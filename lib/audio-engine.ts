/**
 * Web Audio API ambient sound engine.
 * Generates pleasant background ambient pads per category using oscillators + filters.
 * No external audio files — works offline, never breaks.
 */

type Preset = {
  /** Oscillator voices: frequency in Hz, waveform type, optional detune in cents */
  tones: { freq: number; type: OscillatorType; detune?: number }[];
  /** Low-pass filter cutoff frequency */
  filterFreq: number;
  /** LFO rate in Hz (how fast the filter wobbles) */
  lfoRate: number;
  /** LFO depth in Hz (how much the filter wobbles) */
  lfoDepth: number;
  /** Master gain (0-1). Keep very low for subtle ambient. */
  gain: number;
};

// Each category has a unique ambient "chord" built from stacked 5ths for harmonic purity.
// Detuned pairs create a natural chorus/pad effect.
const PRESETS: Record<string, Preset> = {
  Mindset: {
    // C3-G3-C4 pad — calm, centered
    tones: [
      { freq: 130.81, type: "sine" },
      { freq: 130.81, type: "sine", detune: 7 },
      { freq: 196.0, type: "sine" },
      { freq: 261.63, type: "triangle", detune: -5 },
    ],
    filterFreq: 600,
    lfoRate: 0.07,
    lfoDepth: 150,
    gain: 0.045,
  },
  Gym: {
    // D3-A3-D4-A4 — energetic power stack
    tones: [
      { freq: 146.83, type: "sawtooth" },
      { freq: 146.83, type: "sawtooth", detune: 8 },
      { freq: 220.0, type: "sine" },
      { freq: 293.66, type: "triangle", detune: -4 },
    ],
    filterFreq: 900,
    lfoRate: 0.18,
    lfoDepth: 250,
    gain: 0.04,
  },
  Books: {
    // A2-E3-A3 — deep, calm lo-fi
    tones: [
      { freq: 110.0, type: "sine" },
      { freq: 110.0, type: "sine", detune: 5 },
      { freq: 164.81, type: "sine" },
      { freq: 220.0, type: "triangle", detune: -6 },
    ],
    filterFreq: 450,
    lfoRate: 0.05,
    lfoDepth: 100,
    gain: 0.05,
  },
  Diet: {
    // F3-C4-F4 — bright, positive
    tones: [
      { freq: 174.61, type: "sine" },
      { freq: 174.61, type: "sine", detune: 6 },
      { freq: 261.63, type: "sine" },
      { freq: 349.23, type: "triangle", detune: -3 },
    ],
    filterFreq: 750,
    lfoRate: 0.12,
    lfoDepth: 180,
    gain: 0.045,
  },
  Wellness: {
    // G2-D3-G3 — spacious, nature calm
    tones: [
      { freq: 98.0, type: "sine" },
      { freq: 98.0, type: "sine", detune: 8 },
      { freq: 146.83, type: "sine" },
      { freq: 196.0, type: "triangle", detune: -5 },
    ],
    filterFreq: 400,
    lfoRate: 0.04,
    lfoDepth: 80,
    gain: 0.055,
  },
  Finance: {
    // E3-B3-E4 — focused, steady
    tones: [
      { freq: 164.81, type: "sine" },
      { freq: 164.81, type: "sine", detune: 5 },
      { freq: 246.94, type: "sine" },
      { freq: 329.63, type: "triangle", detune: -4 },
    ],
    filterFreq: 550,
    lfoRate: 0.09,
    lfoDepth: 120,
    gain: 0.045,
  },
  Relationships: {
    // Bb2-F3-Bb3 — warm, open
    tones: [
      { freq: 116.54, type: "sine" },
      { freq: 116.54, type: "sine", detune: 7 },
      { freq: 174.61, type: "sine" },
      { freq: 233.08, type: "triangle", detune: -6 },
    ],
    filterFreq: 650,
    lfoRate: 0.06,
    lfoDepth: 140,
    gain: 0.05,
  },
};

// Default fallback
const DEFAULT_PRESET = "Mindset";

/** Category labels shown in the UI when audio is playing */
export const CATEGORY_LABELS: Record<string, string> = {
  Mindset: "Focus Pad",
  Gym: "Energy Pulse",
  Books: "Lo-fi Calm",
  Diet: "Uplift",
  Wellness: "Nature Calm",
  Finance: "Deep Focus",
  Relationships: "Warm Glow",
};

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private _currentCategory: string | null = null;
  private _isPlaying = false;
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Unlock AudioContext (call from a user gesture handler) */
  async unlock(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  /** Play ambient sound for a category. Returns true if started. */
  async play(category: string): Promise<boolean> {
    try {
      const ctx = this.ensureContext();

      // Resume if suspended (iOS)
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // Still suspended? Can't play without user gesture
      if (ctx.state !== "running") return false;

      // Already playing this category — no-op
      if (this._isPlaying && this._currentCategory === category) return true;

      // Clear any pending fade-out cleanup
      if (this.fadeTimeout) {
        clearTimeout(this.fadeTimeout);
        this.fadeTimeout = null;
      }

      // Stop previous sounds
      this.stopNodes();

      const preset = PRESETS[category] ?? PRESETS[DEFAULT_PRESET];

      // Create low-pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = preset.filterFreq;
      filter.Q.value = 0.7;
      filter.connect(this.masterGain!);
      this.nodes.push(filter);

      // Create LFO for gentle filter modulation
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = preset.lfoRate;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = preset.lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.nodes.push(lfo, lfoGain);

      // Create voices
      for (const voice of preset.tones) {
        const osc = ctx.createOscillator();
        osc.type = voice.type;
        osc.frequency.value = voice.freq;
        if (voice.detune) osc.detune.value = voice.detune;
        osc.connect(filter);
        osc.start();
        this.nodes.push(osc);
      }

      // Smooth fade in
      const now = ctx.currentTime;
      this.masterGain!.gain.cancelScheduledValues(now);
      this.masterGain!.gain.setValueAtTime(
        this.masterGain!.gain.value,
        now
      );
      this.masterGain!.gain.linearRampToValueAtTime(preset.gain, now + 1.5);

      this._currentCategory = category;
      this._isPlaying = true;
      return true;
    } catch {
      return false;
    }
  }

  /** Fade out and stop all sounds */
  pause(): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);

    this._isPlaying = false;

    // Clean up nodes after fade completes
    this.fadeTimeout = setTimeout(() => {
      this.stopNodes();
      this.fadeTimeout = null;
    }, 600);
  }

  private stopNodes(): void {
    for (const node of this.nodes) {
      try {
        if (node instanceof OscillatorNode) node.stop();
        node.disconnect();
      } catch {
        // Already stopped
      }
    }
    this.nodes = [];
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get currentCategory(): string | null {
    return this._currentCategory;
  }

  /** Clean up everything */
  destroy(): void {
    if (this.fadeTimeout) clearTimeout(this.fadeTimeout);
    this.stopNodes();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.masterGain = null;
  }
}
