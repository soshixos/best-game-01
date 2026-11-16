// All sound is synthesised with WebAudio: no audio files, no network, just
// oscillators and noise shaped into blips, chimes and a soft ambient pad.
export class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.padNodes = null;
    this.muted = false;
    this.lastShotAt = 0;
  }

  /** Create the context on the first user gesture; browsers block it before. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.startPad();
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, seconds, type, volume, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  noise(seconds, volume, filterFreq) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  shoot() {
    const now = performance.now();
    if (now - this.lastShotAt < 45) return; // one blip per volley, not per frame
    this.lastShotAt = now;
    this.tone(880, 0.07, 'square', 0.05, 440);
  }

  enemyDown() {
    this.tone(320, 0.12, 'triangle', 0.14, 90);
    this.noise(0.08, 0.1, 1800);
  }

  shard(comboStep) {
    const base = 660 + Math.min(comboStep, 12) * 36;
    this.tone(base, 0.09, 'sine', 0.1, base * 1.5);
  }

  hurt() {
    this.tone(140, 0.3, 'sawtooth', 0.2, 55);
    this.noise(0.2, 0.18, 700);
  }

  nova() {
    this.tone(90, 0.6, 'sine', 0.3, 28);
    this.noise(0.5, 0.22, 900);
  }

  powerup() {
    this.tone(523, 0.1, 'sine', 0.12);
    setTimeout(() => this.tone(784, 0.14, 'sine', 0.12), 70);
    setTimeout(() => this.tone(1046, 0.2, 'sine', 0.12), 140);
  }

  waveStart() {
    this.tone(392, 0.12, 'triangle', 0.12);
    setTimeout(() => this.tone(523, 0.16, 'triangle', 0.12), 110);
  }

  gameOver() {
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => setTimeout(() => this.tone(n, 0.34, 'triangle', 0.14), i * 170));
  }

  /** A slow two-voice pad that hums under everything once sound is unlocked. */
  startPad() {
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const o1 = this.ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 110;
    const o2 = this.ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 164.8;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    o1.connect(filter);
    o2.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    o1.start();
    o2.start();
    lfo.start();
    this.padNodes = { o1, o2, lfo };
  }
}
