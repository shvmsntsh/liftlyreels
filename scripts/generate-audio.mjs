/**
 * Generates ambient audio WAV files for each Liftly category.
 * Run: node scripts/generate-audio.mjs
 * Outputs to public/audio/
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "audio");

const SAMPLE_RATE = 22050;
const DURATION = 8;
const FADE_TIME = 1.5;
const OUTPUT_SAMPLES = SAMPLE_RATE * DURATION;
const TOTAL_SAMPLES = Math.ceil(SAMPLE_RATE * (DURATION + FADE_TIME));
const FADE_SAMPLES = Math.ceil(SAMPLE_RATE * FADE_TIME);

// ── Track presets ──
// Each tone: freq (Hz), copies (detuned voices), spread (cents spread)
const TRACKS = [
  // Mindset
  {
    id: "mindset-1",
    tones: [
      { freq: 130.81, copies: 5, spread: 5 },
      { freq: 196.0, copies: 4, spread: 4 },
      { freq: 261.63, copies: 4, spread: 6 },
    ],
    filterFreq: 480,
    lfoRate: 0.05,
    lfoDepth: 120,
    gain: 0.38,
    noiseGain: 0.015,
  },
  {
    id: "mindset-2",
    tones: [
      { freq: 196.0, copies: 5, spread: 6 },
      { freq: 293.66, copies: 4, spread: 5 },
      { freq: 392.0, copies: 3, spread: 7 },
    ],
    filterFreq: 420,
    lfoRate: 0.04,
    lfoDepth: 100,
    gain: 0.4,
    noiseGain: 0.012,
  },
  // Gym
  {
    id: "gym-1",
    tones: [
      { freq: 73.42, copies: 4, spread: 3 },
      { freq: 146.83, copies: 5, spread: 6 },
      { freq: 220.0, copies: 4, spread: 5 },
      { freq: 293.66, copies: 3, spread: 4 },
    ],
    filterFreq: 750,
    lfoRate: 0.22,
    lfoDepth: 280,
    gain: 0.3,
    noiseGain: 0.02,
  },
  {
    id: "gym-2",
    tones: [
      { freq: 98.0, copies: 4, spread: 4 },
      { freq: 196.0, copies: 5, spread: 6 },
      { freq: 293.66, copies: 4, spread: 5 },
    ],
    filterFreq: 680,
    lfoRate: 0.18,
    lfoDepth: 220,
    gain: 0.32,
    noiseGain: 0.018,
  },
  // Books
  {
    id: "books-1",
    tones: [
      { freq: 110.0, copies: 5, spread: 5 },
      { freq: 130.81, copies: 4, spread: 4 },
      { freq: 164.81, copies: 4, spread: 6 },
      { freq: 196.0, copies: 3, spread: 5 },
    ],
    filterFreq: 340,
    lfoRate: 0.035,
    lfoDepth: 80,
    gain: 0.42,
    noiseGain: 0.025,
  },
  {
    id: "books-2",
    tones: [
      { freq: 82.41, copies: 4, spread: 6 },
      { freq: 123.47, copies: 5, spread: 5 },
      { freq: 164.81, copies: 4, spread: 4 },
    ],
    filterFreq: 300,
    lfoRate: 0.03,
    lfoDepth: 70,
    gain: 0.45,
    noiseGain: 0.028,
  },
  // Diet
  {
    id: "diet-1",
    tones: [
      { freq: 174.61, copies: 5, spread: 5 },
      { freq: 220.0, copies: 4, spread: 4 },
      { freq: 261.63, copies: 4, spread: 6 },
      { freq: 349.23, copies: 3, spread: 5 },
    ],
    filterFreq: 650,
    lfoRate: 0.1,
    lfoDepth: 160,
    gain: 0.35,
    noiseGain: 0.012,
  },
  {
    id: "diet-2",
    tones: [
      { freq: 146.83, copies: 4, spread: 4 },
      { freq: 220.0, copies: 5, spread: 6 },
      { freq: 293.66, copies: 4, spread: 5 },
    ],
    filterFreq: 580,
    lfoRate: 0.08,
    lfoDepth: 140,
    gain: 0.38,
    noiseGain: 0.015,
  },
  // Wellness
  {
    id: "wellness-1",
    tones: [
      { freq: 65.41, copies: 4, spread: 6 },
      { freq: 98.0, copies: 5, spread: 5 },
      { freq: 130.81, copies: 4, spread: 7 },
      { freq: 196.0, copies: 3, spread: 6 },
    ],
    filterFreq: 300,
    lfoRate: 0.03,
    lfoDepth: 70,
    gain: 0.45,
    noiseGain: 0.03,
  },
  {
    id: "wellness-2",
    tones: [
      { freq: 87.31, copies: 4, spread: 5 },
      { freq: 130.81, copies: 5, spread: 6 },
      { freq: 174.61, copies: 4, spread: 5 },
    ],
    filterFreq: 350,
    lfoRate: 0.04,
    lfoDepth: 90,
    gain: 0.42,
    noiseGain: 0.025,
  },
  // Finance
  {
    id: "finance-1",
    tones: [
      { freq: 164.81, copies: 5, spread: 4 },
      { freq: 246.94, copies: 4, spread: 5 },
      { freq: 329.63, copies: 4, spread: 6 },
    ],
    filterFreq: 450,
    lfoRate: 0.06,
    lfoDepth: 110,
    gain: 0.38,
    noiseGain: 0.012,
  },
  {
    id: "finance-2",
    tones: [
      { freq: 130.81, copies: 4, spread: 5 },
      { freq: 196.0, copies: 5, spread: 4 },
      { freq: 261.63, copies: 4, spread: 6 },
    ],
    filterFreq: 400,
    lfoRate: 0.05,
    lfoDepth: 100,
    gain: 0.4,
    noiseGain: 0.015,
  },
  // Relationships
  {
    id: "relationships-1",
    tones: [
      { freq: 116.54, copies: 5, spread: 6 },
      { freq: 146.83, copies: 4, spread: 5 },
      { freq: 174.61, copies: 4, spread: 7 },
      { freq: 233.08, copies: 3, spread: 6 },
    ],
    filterFreq: 520,
    lfoRate: 0.055,
    lfoDepth: 130,
    gain: 0.38,
    noiseGain: 0.018,
  },
  {
    id: "relationships-2",
    tones: [
      { freq: 98.0, copies: 4, spread: 5 },
      { freq: 146.83, copies: 5, spread: 6 },
      { freq: 196.0, copies: 4, spread: 5 },
    ],
    filterFreq: 480,
    lfoRate: 0.045,
    lfoDepth: 110,
    gain: 0.4,
    noiseGain: 0.02,
  },
];

// ── Pink noise generator (Paul Kellet algorithm) ──
function createPinkNoise() {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  return function () {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const out = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    return out * 0.11;
  };
}

function generateTrack(preset) {
  // Build voices from tone presets
  const voices = [];
  for (const tone of preset.tones) {
    for (let c = 0; c < tone.copies; c++) {
      const detune =
        (c - (tone.copies - 1) / 2) * (tone.spread / Math.max(1, tone.copies - 1));
      const freq = tone.freq * Math.pow(2, detune / 1200);
      const phase = Math.random() * Math.PI * 2;
      voices.push({ freq, phase });
    }
  }

  const totalVoices = voices.length;
  const raw = new Float64Array(TOTAL_SAMPLES);
  const pink = createPinkNoise();

  // IIR low-pass filter state
  let y = 0;

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;

    // Sum oscillator voices
    let signal = 0;
    for (const v of voices) {
      signal += Math.sin(2 * Math.PI * v.freq * t + v.phase);
    }
    signal /= totalVoices;

    // Add pink noise for texture
    signal += pink() * preset.noiseGain;

    // Dynamic LP filter with LFO
    const cutoff =
      preset.filterFreq +
      preset.lfoDepth * Math.sin(2 * Math.PI * preset.lfoRate * t);
    const rc = 1 / (2 * Math.PI * Math.max(20, cutoff));
    const dt = 1 / SAMPLE_RATE;
    const alpha = dt / (rc + dt);
    y = y + alpha * (signal - y);

    raw[i] = y * preset.gain;
  }

  // Crossfade head with tail for seamless loop
  const result = new Float64Array(OUTPUT_SAMPLES);
  for (let i = 0; i < FADE_SAMPLES; i++) {
    const fadeIn = i / FADE_SAMPLES;
    result[i] = raw[i] * fadeIn + raw[OUTPUT_SAMPLES + i] * (1 - fadeIn);
  }
  for (let i = FADE_SAMPLES; i < OUTPUT_SAMPLES; i++) {
    result[i] = raw[i];
  }

  // Normalize peak to -3 dB (0.707)
  let peak = 0;
  for (let i = 0; i < OUTPUT_SAMPLES; i++) {
    peak = Math.max(peak, Math.abs(result[i]));
  }
  if (peak > 0) {
    const scale = 0.707 / peak;
    for (let i = 0; i < OUTPUT_SAMPLES; i++) {
      result[i] *= scale;
    }
  }

  return result;
}

function createWavBuffer(samples) {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const numChannels = 1;
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(val * 32767), 44 + i * 2);
  }

  return buffer;
}

// ── Main ──
if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

console.log(`Generating ${TRACKS.length} audio tracks...`);
console.log(`Sample rate: ${SAMPLE_RATE} Hz, Duration: ${DURATION}s, Fade: ${FADE_TIME}s\n`);

for (const track of TRACKS) {
  process.stdout.write(`  ${track.id}...`);
  const samples = generateTrack(track);
  const wav = createWavBuffer(samples);
  const outPath = join(OUT_DIR, `${track.id}.wav`);
  writeFileSync(outPath, wav);
  const sizeKB = Math.round(wav.length / 1024);
  console.log(` ${sizeKB} KB`);
}

console.log(`\nDone! Files written to public/audio/`);
