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
        const buffer = (await this.decode(`audio/sfx/${name}.ogg`)) ?? (await this.decode(`audio/sfx/${name}.mp3`));
        if (buffer) this.buffers.set(name, buffer);
        else console.warn(`som ${name} não carregou`);
      }),
    );
  }

  get audio(): AudioContext {
    return this.context;
  }

  get output(): AudioNode {
    return this.master;
  }

  // Celulares só liberam o áudio dentro do próprio toque: chamar direto do evento.
  unlock(): void {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "playback";
    if (this.context.state !== "running") void this.context.resume();
    const silence = this.context.createBufferSource();
    silence.buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
    silence.connect(this.context.destination);
    silence.start();
  }

  // O iPhone não decodifica Ogg Vorbis; a build para celular traz uma cópia em MP3.
  private async decode(url: string): Promise<AudioBuffer | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await this.context.decodeAudioData(await response.arrayBuffer());
    } catch {
      return null;
    }
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
