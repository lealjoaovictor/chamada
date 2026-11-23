import type { Sfx } from "./Sfx";

// Sons dos hábitos dos seguranças, sintetizados com Web Audio (sem arquivo): a TV com o jogo de futebol,
// o ronco do segurança que cochila, o clique da lanterna e a notificação do celular.
// O volume de cada som cai com a distância até o jogador (`near`, de 0 a 1).

const CROWD_BASE = 0.05;
const CROWD_SWELL = 0.16;
const CROWD_ROAR = 0.34;

export class GuardSounds {
  private readonly sfx: Sfx;
  private noise: AudioBuffer | null = null;
  /** Torcida da TV: ruído filtrado como multidão, com volume que sobe nos lances. */
  private crowd: { gain: GainNode; band: BiquadFilterNode; level: number; target: number; source: AudioBufferSourceNode } | null = null;
  private crowdNear = 0;

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
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Ruído rosa (mais grave que o branco): soa como murmúrio de estádio pela TV.
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
    }
    this.noise = buffer;
    return buffer;
  }

  /** Liga a TV (uma vez): a torcida fica tocando baixinho e o volume segue a distância. */
  private ensureCrowd(): void {
    if (this.crowd || !this.ready) return;
    const ctx = this.ctx;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer();
    source.loop = true;
    // Alto-falante pequeno de TV: sem graves nem agudos.
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(band).connect(gain).connect(this.sfx.output);
    source.start();
    this.crowd = { gain, band, level: CROWD_BASE, target: CROWD_BASE, source };
  }

  /** A cada quadro: `near` = 0 longe da TV, 1 do lado dela. */
  updateTv(dt: number, near: number): void {
    if (near <= 0 && !this.crowd) return;
    this.ensureCrowd();
    const crowd = this.crowd;
    if (!crowd) return;
    this.crowdNear = near;
    crowd.level += (crowd.target - crowd.level) * Math.min(1, dt * 1.6);
    // Depois de um pico, a torcida volta sozinha ao murmúrio.
    crowd.target += (CROWD_BASE - crowd.target) * Math.min(1, dt * 0.35);
    const wobble = 1 + 0.12 * Math.sin(this.ctx.currentTime * 1.7) + 0.06 * Math.sin(this.ctx.currentTime * 4.3);
    crowd.gain.gain.value = crowd.level * wobble * near * near;
    crowd.band.frequency.value = 800 + crowd.level * 1400;
  }

  /** Lance perigoso: a torcida sobe. */
  swell(): void {
    if (this.crowd) this.crowd.target = CROWD_SWELL;
  }

  /** Gol: a torcida explode. */
  roar(): void {
    if (this.crowd) {
      this.crowd.target = CROWD_ROAR;
      this.crowd.level = Math.max(this.crowd.level, CROWD_ROAR * 0.8);
    }
  }

  /** Chance perdida: "uhhh" da torcida (um pico mais curto e mais grave). */
  groan(): void {
    if (!this.crowd || !this.ready) return;
    this.crowd.target = CROWD_SWELL * 1.2;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(170, ctx.currentTime + 1.2);
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 700;
    const gain = ctx.createGain();
    const peak = 0.05 * this.crowdNear * this.crowdNear;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.25);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.3);
    osc.connect(low).connect(gain).connect(this.sfx.output);
    osc.start();
    osc.stop(ctx.currentTime + 1.4);
  }

  /** Clique do botão da lanterna. */
  click(near: number): void {
    if (!this.ready || near <= 0) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    for (const [at, freq] of [[0, 3200], [0.045, 2400]] as const) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer();
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = freq;
      band.Q.value = 6;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t + at);
      gain.gain.linearRampToValueAtTime(0.5 * near, t + at + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.03);
      src.connect(band).connect(gain).connect(this.sfx.output);
      src.start(t + at, Math.random() * 2);
      src.stop(t + at + 0.05);
    }
  }

  /** Notificação do celular: duas notas curtas e agudas. */
  notification(near: number): void {
    if (!this.ready || near <= 0) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [
      { f: 1760, at: 0 },
      { f: 2349, at: 0.09 },
    ].forEach(({ f, at }) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t + at);
      gain.gain.linearRampToValueAtTime(0.1 * near, t + at + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.18);
      osc.connect(gain).connect(this.sfx.output);
      osc.start(t + at);
      osc.stop(t + at + 0.2);
    });
  }

  /** Ronco: inspiração rouca e grave (ruído filtrado com tremor) e uma expiração mais leve. */
  snore(near: number): void {
    if (!this.ready || near <= 0) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 420;
    low.Q.value = 4;
    // Tremor do palato: modula o volume a ~32 Hz durante a inspiração.
    const flutter = ctx.createGain();
    flutter.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 32;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain).connect(flutter.gain);
    const gain = ctx.createGain();
    const level = 0.55 * near * near;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + 0.55);
    gain.gain.linearRampToValueAtTime(level * 0.8, t + 1.0);
    gain.gain.linearRampToValueAtTime(0, t + 1.15);
    gain.gain.linearRampToValueAtTime(level * 0.22, t + 1.45);
    gain.gain.linearRampToValueAtTime(0, t + 2.1);
    src.connect(low).connect(flutter).connect(gain).connect(this.sfx.output);
    src.start(t, Math.random() * 2);
    src.stop(t + 2.2);
    lfo.start(t);
    lfo.stop(t + 1.2);
  }
}
