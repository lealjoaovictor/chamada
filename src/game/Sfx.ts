const NAMES = [
  "passo-1",
  "passo-2",
  "passo-3",
  "passo-4",
  "pulo",
  "aterrissar",
  "deslizar",
  "empurrar-1",
  "empurrar-2",
  "placa",
  "botao",
  "elevador",
  "porta-abre",
  "porta-fecha",
  "porta-trancada",
  "porta-final",
  "lampada",
  "morte-luz",
  "morte-toque",
  "morte-queda",
  "vigia-surge",
] as const;

export type SfxName = (typeof NAMES)[number];

export interface PlayOptions {
  volume?: number;
  pitch?: number;
  pitchJitter?: number;
}

const MASTER_VOLUME = 0.8;

export class Sfx {
  private readonly context = new AudioContext();
  private readonly master: GainNode;
  private readonly buffers = new Map<SfxName, AudioBuffer>();

  constructor() {
    this.master = this.context.createGain();
    this.master.gain.value = MASTER_VOLUME;
    this.master.connect(this.context.destination);
  }

  async load(): Promise<void> {
    await Promise.all(
      NAMES.map(async (name) => {
        const response = await fetch(`audio/sfx/${name}.ogg`);
        const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(name, buffer);
      }),
    );
  }

  unlock(): void {
    if (this.context.state === "suspended") void this.context.resume();
  }

  play(name: SfxName, options: PlayOptions = {}): void {
    const buffer = this.buffers.get(name);
    if (!buffer || this.context.state !== "running") return;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const jitter = options.pitchJitter ?? 0;
    source.playbackRate.value = (options.pitch ?? 1) * (1 + (Math.random() * 2 - 1) * jitter);
    const gain = this.context.createGain();
    gain.gain.value = options.volume ?? 1;
    source.connect(gain).connect(this.master);
    source.start();
  }
}
