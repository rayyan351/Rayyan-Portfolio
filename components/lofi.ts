/*
 * A small lofi piece, composed in code and synthesized live with the Web Audio API.
 * Nothing is downloaded: every sound is built from oscillators and noise.
 *
 * 74 BPM, eight bars in C major with jazz voicings: Fmaj9, Em7, Dm9, G13, Fmaj9, Em7, Dm9, Cmaj9.
 * Electric piano chords, a round bass, soft swung drums, a sparse bell melody every other pass,
 * and vinyl crackle underneath. Everything runs through a low-pass "tape" filter and a gentle
 * compressor, with slow pitch wobble on the keys for that worn-cassette feel.
 *
 * The same code renders in real time (the site) and offline (to check levels).
 */

export const BPM = 74;
const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
const STEP = BEAT / 4; // a 16th note
const SWING = BEAT * 0.09; // late off-beats

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

// [bass root, chord voicing]
const CHORDS: [number, number[]][] = [
  [41, [57, 60, 64, 67]], // Fmaj9
  [40, [55, 59, 62, 64]], // Em7
  [38, [53, 57, 60, 64]], // Dm9
  [43, [53, 57, 59, 64]], // G13
  [41, [57, 60, 64, 67]], // Fmaj9
  [40, [55, 59, 62, 67]], // Em7 (G on top)
  [38, [53, 57, 60, 65]], // Dm9 (F on top)
  [36, [52, 55, 59, 62]], // Cmaj9
];

// The bell melody: [bar, beat, midi, length in beats]. A minor pentatonic over the changes.
const MELODY: [number, number, number, number][] = [
  [0, 2.5, 76, 0.5], [0, 3, 74, 1],
  [1, 0, 72, 2],
  [2, 2.5, 69, 0.5], [2, 3.5, 72, 0.5],
  [3, 0, 74, 1], [3, 1, 76, 2],
  [4, 2.5, 79, 0.5], [4, 3, 76, 1],
  [5, 0, 74, 2.5],
  [6, 2.5, 72, 0.5], [6, 3.5, 69, 0.5],
  [7, 0, 71, 1], [7, 1, 72, 2.5],
];

// 16 steps a bar. Kick on 1, the "and" of 2 and just before 4; brushed snare on 2 and 4.
const KICK = [0, 7, 10];
const SNARE = [4, 12];

export type Lofi = {
  input: GainNode; // everything goes in here
  scheduleBar: (bar: number, t: number) => void;
  startBed: (t: number) => void;
  stopBed: (t: number) => void;
};

function noiseBuffer(ctx: BaseAudioContext, seconds: number, crackle = false) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (!crackle) {
      d[i] = w;
      continue;
    }
    // soft pink-ish hiss
    b0 = 0.99765 * b0 + w * 0.099;
    b1 = 0.963 * b1 + w * 0.2965;
    b2 = 0.57 * b2 + w * 1.0527;
    d[i] = (b0 + b1 + b2) * 0.05;
    // and the odd dust click
    if (Math.random() < 3.2 / ctx.sampleRate) {
      const amp = 0.25 + Math.random() * 0.5;
      const n = Math.floor(ctx.sampleRate * (0.0006 + Math.random() * 0.0015));
      for (let k = 0; k < n && i + k < len; k++) d[i + k] += amp * (1 - k / n) * (Math.random() * 2 - 1);
    }
  }
  return buf;
}

function impulse(ctx: BaseAudioContext, seconds: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

export function createLofi(ctx: BaseAudioContext, out: AudioNode): Lofi {
  // Master: tape low-pass, gentle glue compression.
  const input = ctx.createGain();
  input.gain.value = 0.9;
  const tape = ctx.createBiquadFilter();
  tape.type = "lowpass";
  tape.frequency.value = 6500;
  tape.Q.value = 0.4;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.25;
  const rumble = ctx.createBiquadFilter();
  rumble.type = "highpass";
  rumble.frequency.value = 38;
  input.connect(rumble).connect(tape).connect(comp).connect(out);

  const reverb = ctx.createConvolver();
  reverb.buffer = impulse(ctx, 2.8);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  reverb.connect(wet).connect(input);

  // Keys bus: tremolo + a warmer filter, with a reverb send.
  const keys = ctx.createGain();
  keys.gain.value = 0.22;
  const keysTone = ctx.createBiquadFilter();
  keysTone.type = "lowpass";
  keysTone.frequency.value = 2900;
  const trem = ctx.createGain();
  keys.connect(keysTone).connect(trem).connect(input);
  keysTone.connect(reverb);
  const tremLfo = ctx.createOscillator();
  tremLfo.frequency.value = 4.2;
  const tremDepth = ctx.createGain();
  tremDepth.gain.value = 0.12;
  trem.gain.value = 0.88;
  tremLfo.connect(tremDepth).connect(trem.gain);
  tremLfo.start();

  // Slow pitch wobble shared by everything tonal.
  const wow = ctx.createOscillator();
  wow.frequency.value = 0.45;
  const wowDepth = ctx.createGain();
  wowDepth.gain.value = 7; // cents
  wow.connect(wowDepth);
  wow.start();

  const drums = ctx.createGain();
  drums.gain.value = 0.55;
  const drumTone = ctx.createBiquadFilter();
  drumTone.type = "lowpass";
  drumTone.frequency.value = 8000;
  drums.connect(drumTone).connect(input);

  const bassBus = ctx.createGain();
  bassBus.gain.value = 0.14;
  const bassTone = ctx.createBiquadFilter();
  bassTone.type = "lowpass";
  bassTone.frequency.value = 320;
  bassBus.connect(bassTone).connect(input);

  const bell = ctx.createGain();
  bell.gain.value = 0.085;
  bell.connect(input);
  bell.connect(reverb);

  const white = noiseBuffer(ctx, 1);

  const epNote = (midi: number, t: number, dur: number, vel: number) => {
    const f = hz(midi);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vel, t + 0.012);
    env.gain.exponentialRampToValueAtTime(vel * 0.45, t + 0.6);
    env.gain.setTargetAtTime(0.0001, t + dur, 0.35);
    env.connect(keys);
    const a = ctx.createOscillator();
    a.type = "sine";
    a.frequency.value = f;
    const b = ctx.createOscillator();
    b.type = "triangle";
    b.frequency.value = f * 2;
    b.detune.value = 4;
    const bGain = ctx.createGain();
    bGain.gain.setValueAtTime(0.22, t);
    bGain.gain.exponentialRampToValueAtTime(0.02, t + 0.4);
    wowDepth.connect(a.detune);
    wowDepth.connect(b.detune);
    // the "tine": a quick bright partial at the start of each note
    const c = ctx.createOscillator();
    c.type = "sine";
    c.frequency.value = f * 4.02;
    const cGain = ctx.createGain();
    cGain.gain.setValueAtTime(0.09, t);
    cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    a.connect(env);
    b.connect(bGain).connect(env);
    c.connect(cGain).connect(env);
    const end = t + dur + 1.6;
    a.start(t); b.start(t); c.start(t); a.stop(end); b.stop(end); c.stop(t + 0.2);
  };

  const bass = (midi: number, t: number, dur: number, vel: number) => {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vel, t + 0.02);
    env.gain.setTargetAtTime(vel * 0.6, t + 0.05, 0.3);
    env.gain.setTargetAtTime(0.0001, t + dur, 0.08);
    env.connect(bassBus);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = hz(midi);
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = hz(midi);
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(env);
    o2.connect(g2).connect(env);
    o.start(t); o2.start(t); o.stop(t + dur + 0.5); o2.stop(t + dur + 0.5);
  };

  const kick = (t: number, vel: number) => {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(115, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g).connect(drums);
    o.start(t);
    o.stop(t + 0.45);
  };

  const noiseHit = (t: number, type: BiquadFilterType, freq: number, q: number, vel: number, decay: number) => {
    const s = ctx.createBufferSource();
    s.buffer = white;
    s.playbackRate.value = 0.9 + Math.random() * 0.2;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    s.connect(f).connect(g).connect(drums);
    s.start(t, Math.random() * 0.5);
    s.stop(t + decay + 0.02);
  };

  const snare = (t: number, vel: number) => {
    noiseHit(t, "bandpass", 1900, 0.7, vel, 0.2);
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g).connect(drums);
    o.start(t);
    o.stop(t + 0.1);
  };

  const hat = (t: number, vel: number, open = false) => noiseHit(t, "bandpass", 5200, 0.8, vel, open ? 0.24 : 0.05);

  const bellNote = (midi: number, t: number, dur: number) => {
    const f = hz(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur * BEAT + 1.2);
    g.connect(bell);
    const end = t + dur * BEAT + 1.3;
    [[1, 1], [2.01, 0.28], [3.98, 0.08]].forEach(([mul, amp]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * mul;
      const a = ctx.createGain();
      a.gain.value = amp;
      wowDepth.connect(o.detune);
      o.connect(a).connect(g);
      o.start(t);
      o.stop(end);
    });
  };

  const at = (t: number, step: number) => t + step * STEP + (step % 4 === 2 ? SWING : 0);

  const scheduleBar = (bar: number, t: number) => {
    const i = bar % CHORDS.length;
    const pass = Math.floor(bar / CHORDS.length);
    const [root, voicing] = CHORDS[i];
    const intro = bar < 2; // the first two bars are keys and crackle only

    // Keys: a soft strum on 1, a lighter stab on the "and" of 3.
    voicing.forEach((n, k) => epNote(n, t + k * 0.018 + Math.random() * 0.006, BEAT * 2.3, 0.62 - k * 0.04));
    voicing.slice(1).forEach((n, k) => epNote(n, at(t, 10) + k * 0.012, BEAT * 0.9, 0.36));

    if (!intro) {
      bass(root, t, BEAT * 1.6, 0.9);
      bass(root, at(t, 10), BEAT * 0.5, 0.6);
      bass(root + 7, at(t, 14), BEAT * 0.4, 0.45);

      KICK.forEach((s) => kick(at(t, s), s === 0 ? 0.6 : 0.42));
      SNARE.forEach((s) => snare(at(t, s), 0.55));
      for (let s = 0; s < 16; s += 2) hat(at(t, s), s % 4 === 0 ? 0.3 : 0.19, s === 14 && i % 4 === 3);
      if (i % 2 === 1) hat(at(t, 15), 0.08); // a ghost note now and then
    }

    // The melody comes in on every other pass.
    if (pass % 2 === 1) {
      MELODY.filter(([b]) => b === i).forEach(([, beat, midi, len]) => bellNote(midi, t + beat * BEAT + (beat % 1 ? SWING : 0), len));
    }
  };

  // Vinyl bed: a looping buffer of hiss and dust, very low.
  let bed: AudioBufferSourceNode | null = null;
  const bedGain = ctx.createGain();
  bedGain.gain.value = 0.045;
  const bedTone = ctx.createBiquadFilter();
  bedTone.type = "bandpass";
  bedTone.frequency.value = 2400;
  bedTone.Q.value = 0.5;
  bedGain.connect(bedTone).connect(input);
  const vinyl = noiseBuffer(ctx, 6, true);
  const startBed = (t: number) => {
    bed = ctx.createBufferSource();
    bed.buffer = vinyl;
    bed.loop = true;
    bed.connect(bedGain);
    bed.start(t);
  };
  const stopBed = (t: number) => {
    bed?.stop(t);
    bed = null;
  };

  return { input, scheduleBar, startBed, stopBed };
}
