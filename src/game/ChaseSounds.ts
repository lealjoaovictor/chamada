import type { Sfx } from "./Sfx";

// Sons das perseguições do subsolo, sintetizados com Web Audio (sem arquivo): a porta de metal abrindo de
// supetão, o segurança batendo na grade e a luz de emergência entrando no apagão.

export class ChaseSounds {
  private readonly sfx: Sfx;
  private noise: AudioBuffer | null = null;

  constructor(sfx: Sfx) {
    this.sfx = sfx;
  }

  private get ctx(): AudioContext {
    return this.sfx.audio;
  }

  private get ready(): boolean {
    return this.ctx.state === "running";
  }

  private noiseBuffer(): AudioBuffer {
    if (this.noise) return this.noise;
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }

  /** Porta de serviço aberta com um chute: baque grave, estalo da fechadura e a chapa vibrando. */
  doorSlam(volume = 1): void {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.thump(t, 72, 0.55, 0.9 * volume);
    this.crack(t, 1800, 0.12, 0.6 * volume);
    this.ring(t + 0.01, [233, 397, 611, 947, 1381], 0.9, 0.16 * volume);
  }

  /** O segurança bate as mãos na grade: duas pancadas e a grade sacudindo. */
  gateBang(volume = 1): void {
    if (!this.ready || volume <= 0) return;
    const t = this.ctx.currentTime;
    [0, 0.24].forEach((at, i) => {
      const k = i === 0 ? 1 : 0.75;
      this.thump(t + at, 95, 0.25, 0.45 * volume * k);
      this.crack(t + at, 2600, 0.06, 0.35 * volume * k);
      this.ring(t + at, [517, 829, 1243, 1907, 2711], 0.55, 0.09 * volume * k);
    });
    // Chocalho da grade solta no trilho.
    for (let i = 0; i < 6; i++) this.crack(t + 0.32 + i * 0.07 + Math.random() * 0.03, 3400, 0.03, 0.12 * volume * (1 - i / 7));
  }

  /** Disjuntor da luz de emergência: um "clunk" e o zumbido do reator entrando. */
  emergencyOn(volume = 1): void {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    this.thump(t, 110, 0.18, 0.45 * volume);
    this.crack(t, 1200, 0.05, 0.3 * volume);
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 120;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t + 0.05);
    gain.gain.linearRampToValueAtTime(0.06 * volume, t + 0.15);
    gain.gain.linearRampToValueAtTime(0, t + 1.4);
    osc.connect(low).connect(gain).connect(this.sfx.effectsOutput);
    osc.start(t + 0.05);
    osc.stop(t + 1.5);
  }

  /** Baque grave: uma senoide que cai de tom. */
  private thump(t: number, freq: number, length: number, level: number): void {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.8, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(this.sfx.effectsOutput);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }

  /** Estalo: ruído curto numa faixa. */
  private crack(t: number, freq: number, length: number, level: number): void {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = freq;
    band.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(band).connect(gain).connect(this.sfx.effectsOutput);
    src.start(t, Math.random() * 0.5);
    src.stop(t + length + 0.02);
  }

  /** Chapa de metal vibrando: parciais fora da série harmônica, cada uma sumindo no seu tempo. */
  private ring(t: number, partials: number[], length: number, level: number): void {
    const ctx = this.ctx;
    partials.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * (0.98 + Math.random() * 0.04);
      const gain = ctx.createGain();
      const decay = length * (1 - i * 0.12);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(level / (1 + i * 0.4), t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(gain).connect(this.sfx.effectsOutput);
      osc.start(t);
      osc.stop(t + decay + 0.05);
    });
  }
}
