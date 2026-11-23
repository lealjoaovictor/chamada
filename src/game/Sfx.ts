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
const VOLUME_KEY = "chamada-volumes";

export type VolumeChannel = "geral" | "musica" | "vozes" | "efeitos";
type VolumeLevels = Record<VolumeChannel, number>;

function loadLevels(): VolumeLevels {
  const levels: VolumeLevels = { geral: 1, musica: 1, vozes: 1, efeitos: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem(VOLUME_KEY) ?? "{}") as Partial<VolumeLevels>;
    for (const channel of Object.keys(levels) as VolumeChannel[]) {
      const value = saved[channel];
      if (typeof value === "number" && value >= 0 && value <= 1) levels[channel] = value;
    }
  } catch {
    /* sem armazenamento ou valor estragado: volumes padrão */
  }
  return levels;
}
const HUM_VOLUME = 0.035;

export class Sfx {
  private readonly context = new AudioContext();
  private readonly master: GainNode;
  // Volumes do menu de pausa: geral (master), música, vozes (ligação, sala, seguranças) e efeitos (passos, portas, sustos).
  private readonly effects: GainNode;
  private readonly voices: GainNode;
  private readonly music: GainNode;
  private readonly levels: VolumeLevels = loadLevels();
  private readonly buffers = new Map<SfxName, AudioBuffer>();

  constructor() {
    this.master = this.context.createGain();
    this.master.gain.value = MASTER_VOLUME * this.levels.geral;
    this.master.connect(this.context.destination);
    this.effects = this.context.createGain();
    this.effects.gain.value = this.levels.efeitos;
    this.effects.connect(this.master);
    this.voices = this.context.createGain();
    this.voices.gain.value = this.levels.vozes;
    this.voices.connect(this.master);
    this.music = this.context.createGain();
    this.music.gain.value = this.levels.musica;
    this.music.connect(this.master);
  }

  volume(channel: VolumeChannel): number {
    return this.levels[channel];
  }

  setVolume(channel: VolumeChannel, value: number): void {
    this.levels[channel] = Math.min(Math.max(value, 0), 1);
    const now = this.context.currentTime;
    if (channel === "geral") {
      if (!this.mutedState) this.master.gain.setTargetAtTime(MASTER_VOLUME * this.levels.geral, now, 0.02);
    } else {
      const bus = channel === "efeitos" ? this.effects : channel === "vozes" ? this.voices : this.music;
      bus.gain.setTargetAtTime(this.levels[channel], now, 0.02);
    }
    try {
      localStorage.setItem(VOLUME_KEY, JSON.stringify(this.levels));
    } catch {
      /* sem armazenamento: vale só nesta partida */
    }
  }

  /** Pausa: congela todo o áudio (vozes da ligação no meio da frase incluídas) e volta de onde parou. */
  setPaused(paused: boolean): void {
    this.pausedState = paused;
    if (paused) {
      if (this.context.state === "running") void this.context.suspend();
      if (typeof speechSynthesis !== "undefined") speechSynthesis.pause();
    } else {
      if (this.context.state === "suspended") void this.context.resume();
      if (typeof speechSynthesis !== "undefined") speechSynthesis.resume();
    }
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

  private mutedState = false;
  private pausedState = false;

  /** Silencia todo o jogo (efeitos, ambiente e vozes passam por este volume geral). */
  get muted(): boolean {
    return this.mutedState;
  }

  set muted(value: boolean) {
    this.mutedState = value;
    this.master.gain.setTargetAtTime(value ? 0 : MASTER_VOLUME * this.levels.geral, this.context.currentTime, 0.02);
    if (value && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }

  get audio(): AudioContext {
    return this.context;
  }

  /** Saída geral (só o volume geral e o mudo). */
  get output(): AudioNode {
    return this.master;
  }

  /** Saída das vozes (ligação, sala de aula, seguranças): passa pelo volume de vozes. */
  get voiceOutput(): AudioNode {
    return this.voices;
  }

  /** Saída da música: passa pelo volume de música. */
  get musicOutput(): AudioNode {
    return this.music;
  }

  // Celulares só liberam o áudio dentro do próprio toque: chamar direto do evento.
  unlock(): void {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "playback";
    if (this.pausedState) return;
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

  private humGain: GainNode | null = null;

  /** Zumbido baixo do reator da lâmpada do elevador (0 desliga). Os osciladores são criados na primeira vez. */
  setHum(level: number): void {
    if (this.context.state !== "running") return;
    if (!this.humGain) {
      if (level <= 0) return;
      this.humGain = this.context.createGain();
      this.humGain.gain.value = 0;
      this.humGain.connect(this.effects);
      for (const [freq, amount] of [[120, 1], [240, 0.35], [360, 0.12]]) {
        const osc = this.context.createOscillator();
        osc.frequency.value = freq;
        const gain = this.context.createGain();
        gain.gain.value = amount;
        osc.connect(gain).connect(this.humGain);
        osc.start();
      }
    }
    this.humGain.gain.setTargetAtTime(level * HUM_VOLUME, this.context.currentTime, 0.08);
  }

  /** "Plim" de elevador chegando: duas notas de sino sintetizadas, uma depois da outra. */
  chime(volume = 0.4): void {
    if (this.context.state !== "running") return;
    const now = this.context.currentTime;
    [
      { freq: 1318.5, at: 0 },
      { freq: 1046.5, at: 0.22 },
    ].forEach(({ freq, at }) => {
      for (const [ratio, level] of [[1, 1], [2.76, 0.25]]) {
        const osc = this.context.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * ratio;
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0, now + at);
        gain.gain.linearRampToValueAtTime(volume * level, now + at + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 1.4);
        osc.connect(gain).connect(this.effects);
        osc.start(now + at);
        osc.stop(now + at + 1.5);
      }
    });
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
    source.connect(gain).connect(this.effects);
    source.start();
  }
}
