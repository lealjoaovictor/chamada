import type { Sfx } from "./Sfx";

// Trilha sonora (ElevenLabs Music e Sound Effects; ver a tabela de licenças). Arquivos em audio/musica/<nome>.ogg,
// com cópia em MP3 na build de celular. Os loops já vêm com a emenda em crossfade (ferramentas/musica_loops.py).
//
// Como funciona: cada loop tem um volume-alvo calculado a cada quadro a partir do estado do jogo, e o volume
// atual corre atrás dele com tempos de subida e descida próprios. Só a perseguição tem batida; o resto é drone,
// então as camadas não precisam estar sincronizadas. Quando o colega fala na ligação, a música inteira baixa e
// perde os agudos, para a voz (o relógio do jogo) ficar sempre na frente.
const LOOPS = ["menu", "patio", "corredor", "tensao", "perseguicao"] as const;
const ONE_SHOTS = ["final", "stinger-desconfia", "stinger-pego", "stinger-perseguicao"] as const;
type Loop = (typeof LOOPS)[number];
type OneShot = (typeof ONE_SHOTS)[number];

/** Volume geral da música, abaixo dos efeitos e das vozes (todos passam pelo volume geral do Sfx). */
const MUSIC_VOLUME = 0.6;
/** Volume de cada loop quando está "inteiro" (alvo 1). */
const LEVEL: Record<Loop, number> = { menu: 0.85, patio: 0.75, corredor: 0.75, tensao: 0.8, perseguicao: 0.8 };
/** Tempos (s) para chegar perto do alvo: subida e descida. */
const RISE: Record<Loop, number> = { menu: 1.5, patio: 3, corredor: 3, tensao: 0.7, perseguicao: 0.25 };
const FALL: Record<Loop, number> = { menu: 2.5, patio: 3, corredor: 3, tensao: 3.5, perseguicao: 2 };
/** Ser pego: tudo cai rápido. */
const CAUGHT_FALL = 0.15;
/** Corredor final: a música some devagar e fica só a voz do professor. */
const SALA_FALL = 6;
/** Subsolo: o drone fica mais baixo, a pressão vem da perseguição. */
const SUBSOLO_BASE = 0.6;
/** Durante a perseguição, o drone da área quase some, e rápido. */
const CHASE_BASE = 0.15;
const CHASE_DUCK_FALL = 0.6;
/** Ducking quando o colega fala. */
const DUCK_LEVEL = 0.45;
const DUCK_ATTACK = 0.12;
const DUCK_RELEASE = 0.8;
const OPEN_LOWPASS = 14000;
const DUCK_LOWPASS = 1600;
const STINGER_VOLUME = 0.9;
const SUSPICION_COOLDOWN = 5;
/** Depois de quanto tempo em silêncio um loop é parado (e recomeça do início na próxima vez). */
const STOP_AFTER = 2;

export type MusicScene = "menu" | "jogo" | "pego" | "chegada" | "fim" | "atrasado";

export interface MusicState {
  scene: MusicScene;
  area: number;
  /** 0 a 1: proximidade e alerta do segurança mais perigoso (fora da perseguição). */
  tension: number;
  /** Algum segurança desconfiou (vira o stinger "desconfia" na subida). */
  suspicious: boolean;
  /** 0 = sem perseguição; acima de 0 = perseguição, mais alto com o segurança perto. */
  chase: number;
  colegaSpeaking: boolean;
}

interface Voice {
  gain: GainNode;
  source: AudioBufferSourceNode | null;
  level: number;
  silentFor: number;
}

export class Music {
  private readonly sfx: Sfx;
  private readonly buffers = new Map<Loop | OneShot, AudioBuffer>();
  private readonly voices = new Map<Loop, Voice>();
  private bus: GainNode | null = null;
  private duck: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private duckLevel = 1;
  private previous: MusicState | null = null;
  private suspicionCooldown = 0;
  private finalPlayed = false;

  constructor(sfx: Sfx) {
    this.sfx = sfx;
  }

  async load(): Promise<void> {
    await Promise.all(
      [...LOOPS, ...ONE_SHOTS].map(async (name) => {
        const buffer = (await this.decode(`audio/musica/${name}.ogg`)) ?? (await this.decode(`audio/musica/${name}.mp3`));
        if (buffer) this.buffers.set(name, buffer);
        else console.warn(`música ${name} não carregou`);
      }),
    );
  }

  update(dt: number, state: MusicState): void {
    const ctx = this.sfx.audio;
    if (ctx.state !== "running") return;
    this.ensureGraph();
    const before = this.previous;
    this.previous = { ...state };
    this.suspicionCooldown = Math.max(0, this.suspicionCooldown - dt);

    // Stingers nas mudanças de estado.
    if (before) {
      if (state.scene === "pego" && before.scene !== "pego") this.stinger("stinger-pego");
      if (state.scene === "jogo" && state.chase > 0 && before.chase === 0) this.stinger("stinger-perseguicao");
      if (state.scene === "jogo" && state.suspicious && !before.suspicious && state.chase === 0 && this.suspicionCooldown === 0) {
        this.stinger("stinger-desconfia", 0.75);
        this.suspicionCooldown = SUSPICION_COOLDOWN;
      }
    }
    if (state.scene === "menu") this.finalPlayed = false;

    const targets = this.targets(state);
    for (const name of LOOPS) this.updateVoice(name, targets[name], dt, state);

    // Ducking pela voz do colega.
    const goal = state.colegaSpeaking ? DUCK_LEVEL : 1;
    this.duckLevel += (goal - this.duckLevel) * Math.min(1, dt / (state.colegaSpeaking ? DUCK_ATTACK : DUCK_RELEASE));
    if (this.duck) this.duck.gain.value = this.duckLevel;
    if (this.filter) {
      const open = (this.duckLevel - DUCK_LEVEL) / (1 - DUCK_LEVEL);
      this.filter.frequency.value = DUCK_LOWPASS * Math.pow(OPEN_LOWPASS / DUCK_LOWPASS, Math.max(0, Math.min(1, open)));
    }
  }

  /** Final bom: o tema volta, quente, depois do "presente". */
  playFinal(): void {
    if (this.finalPlayed) return;
    this.finalPlayed = true;
    this.stinger("final", 1);
  }

  private targets(state: MusicState): Record<Loop, number> {
    const t: Record<Loop, number> = { menu: 0, patio: 0, corredor: 0, tensao: 0, perseguicao: 0 };
    if (state.scene === "menu") {
      t.menu = 1;
      return t;
    }
    if (state.scene !== "jogo") return t;
    if (state.area >= 5) return t;
    const base = state.area <= 1 ? "patio" : "corredor";
    t[base] = state.area === 4 ? SUBSOLO_BASE : 1;
    if (state.chase > 0) {
      t[base] *= CHASE_BASE;
      t.perseguicao = 0.7 + 0.3 * Math.min(1, state.chase);
    } else {
      t.tensao = Math.max(0, Math.min(1, state.tension));
    }
    return t;
  }

  private updateVoice(name: Loop, target: number, dt: number, state: MusicState): void {
    const voice = this.voices.get(name);
    const buffer = this.buffers.get(name);
    if (!voice || !buffer) return;
    let tau = target > voice.level ? RISE[name] : FALL[name];
    if (state.scene === "pego") tau = CAUGHT_FALL;
    else if (state.chase > 0 && name !== "perseguicao" && target < voice.level) tau = CHASE_DUCK_FALL;
    else if (state.scene === "jogo" && state.area >= 5 && target === 0) tau = SALA_FALL;
    voice.level += (target - voice.level) * Math.min(1, dt / tau);
    if (target > 0.001 && !voice.source) {
      voice.source = this.sfx.audio.createBufferSource();
      voice.source.buffer = buffer;
      voice.source.loop = true;
      voice.source.connect(voice.gain);
      voice.source.start();
    }
    voice.gain.gain.value = voice.level * LEVEL[name];
    voice.silentFor = target <= 0.001 && voice.level < 0.002 ? voice.silentFor + dt : 0;
    if (voice.source && voice.silentFor > STOP_AFTER) {
      voice.source.stop();
      voice.source.disconnect();
      voice.source = null;
      voice.level = 0;
    }
  }

  private stinger(name: OneShot, volume = STINGER_VOLUME): void {
    const buffer = this.buffers.get(name);
    if (!buffer || !this.bus) return;
    const ctx = this.sfx.audio;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    // Stingers e o final passam por fora do ducking: são curtos e marcam o evento.
    source.connect(gain).connect(this.bus);
    source.start();
  }

  private ensureGraph(): void {
    if (this.bus) return;
    const ctx = this.sfx.audio;
    this.bus = ctx.createGain();
    this.bus.gain.value = MUSIC_VOLUME;
    this.bus.connect(this.sfx.musicOutput);
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = OPEN_LOWPASS;
    this.duck = ctx.createGain();
    this.filter.connect(this.duck).connect(this.bus);
    for (const name of LOOPS) {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(this.filter);
      this.voices.set(name, { gain, source: null, level: 0, silentFor: 0 });
    }
  }

  private async decode(url: string): Promise<AudioBuffer | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await this.sfx.audio.decodeAudioData(await response.arrayBuffer());
    } catch {
      return null;
    }
  }
}
