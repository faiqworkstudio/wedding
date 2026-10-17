/*
 * A small music box, played live with the Web Audio API.
 * I–iii–vi–IV in F with a slow melody on top; nothing is pre-recorded.
 * If a song file is given in the config, that plays instead.
 */

const BPM = 64;
const EIGHTH = 60 / BPM / 2;

// [bass, arpeggio tones, melody (two half-bar notes, null = rest)]
const BARS = [
  [41, [60, 64, 65, 69], [81, 79]], // Fmaj7
  [45, [60, 64, 67, 69], [76, 79]], // Am7
  [38, [60, 62, 65, 69], [77, 74]], // Dm7
  [46, [58, 62, 65, 69], [74, 77]], // Bbmaj7
  [45, [60, 64, 65, 69], [72, 76]], // F/A
  [43, [58, 62, 65, 67], [74, 70]], // Gm7
  [46, [58, 62, 65, 69], [77, 74]], // Bbmaj7
  [48, [60, 64, 67, 72], [79, null]], // C
];
const ARP = [0, 1, 2, 3, 2, 1, 3, 2];

const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export class Music {
  constructor(songUrl) {
    this.songUrl = songUrl;
    this.muted = false;
    this.ctx = null;
  }

  start() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = (this.ctx = new Ctx());

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 4);

    if (this.songUrl) {
      this.audio = new Audio(this.songUrl);
      this.audio.loop = true;
      this.audio.crossOrigin = 'anonymous';
      ctx.createMediaElementSource(this.audio).connect(this.master);
      this.audio.play().catch(() => {});
      return;
    }

    // room: a generated impulse response, plus a soft echo
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.#impulse(3.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    this.reverb.connect(wet).connect(this.master);

    this.delay = ctx.createDelay(2);
    this.delay.delayTime.value = EIGHTH * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const delayTone = ctx.createBiquadFilter();
    delayTone.type = 'lowpass';
    delayTone.frequency.value = 2400;
    this.delay.connect(delayTone).connect(fb).connect(this.delay);
    delayTone.connect(this.reverb);
    delayTone.connect(this.master);

    this.dry = ctx.createGain();
    this.dry.gain.value = 0.6;
    this.dry.connect(this.master);

    this.step = 0;
    this.nextAt = ctx.currentTime + 0.4;
    this.timer = setInterval(() => this.#schedule(), 25);

    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else if (!this.muted) this.ctx.resume();
    });
  }

  toggle() {
    if (!this.ctx) return this.muted;
    this.muted = !this.muted;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.9, now + 0.8);
    return this.muted;
  }

  // A rising shimmer for the moment the knot is tied.
  swell() {
    if (!this.ctx || this.audio) return;
    const now = this.ctx.currentTime + 0.05;
    const notes = [65, 69, 72, 76, 77, 81, 84, 88, 89, 93];
    notes.forEach((n, i) => this.#bell(freq(n), now + i * 0.07, 0.22 - i * 0.012, 3.2));
    this.#pad([41, 53, 57, 60, 64], now, 9, 0.11);
  }

  #schedule() {
    const ctx = this.ctx;
    while (this.nextAt < ctx.currentTime + 0.2) {
      const bar = Math.floor(this.step / 8) % BARS.length;
      const inBar = this.step % 8;
      const [bass, tones, melody] = BARS[bar];
      const human = (Math.random() - 0.5) * 0.018;
      const t = this.nextAt + human;

      if (inBar === 0) this.#pad([bass, bass + 12, tones[1], tones[3]], t, EIGHTH * 8 + 1.5, 0.05);

      const tone = tones[ARP[inBar]] + 12;
      const accent = inBar === 0 ? 1 : inBar === 4 ? 0.8 : 0.55;
      this.#bell(freq(tone), t, 0.07 * accent + Math.random() * 0.015, 2.2);

      if (inBar === 0 || inBar === 4) {
        const m = melody[inBar === 0 ? 0 : 1];
        if (m) this.#bell(freq(m), t + 0.012, 0.13, 3.6);
      }

      this.nextAt += EIGHTH;
      this.step++;
    }
  }

  // music-box tine: a sine plus a bright, fast-fading partial
  #bell(f, t, gain, decay) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(gain, t + 0.004);
    out.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    out.connect(this.dry);
    out.connect(this.reverb);
    out.connect(this.delay);

    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = f;
    o1.connect(out);

    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.value = f * 4.02;
    g2.gain.setValueAtTime(0.35, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o2.connect(g2).connect(out);

    o1.start(t);
    o2.start(t);
    o1.stop(t + decay + 0.1);
    o2.stop(t + 0.4);
  }

  #pad(notes, t, length, gain) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(gain, t + 1.8);
    out.gain.setValueAtTime(gain, t + length - 2);
    out.gain.linearRampToValueAtTime(0, t + length);
    lp.connect(out);
    out.connect(this.reverb);
    out.connect(this.dry);
    for (const n of notes) {
      for (const detune of [-6, 7]) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = freq(n);
        o.detune.value = detune;
        o.connect(lp);
        o.start(t);
        o.stop(t + length + 0.1);
      }
    }
  }

  #impulse(seconds) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }
}
