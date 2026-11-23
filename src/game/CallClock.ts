import type { CallData, Fala, Voz } from "../levels/types";
import { CallSchedule, type CallEvent } from "./CallSchedule";
import type { Sfx } from "./Sfx";
import type { CallScreen } from "../ui/CallScreen";

// Vozes gravadas: `audio/vozes/manifest.json` = { "<id da fala>": "<arquivo>" }. Para trocar uma voz,
// basta substituir o arquivo (ou apontar o id para outro arquivo no manifest). Sem o arquivo, o jogo usa
// a voz sintetizada do navegador, sem filtro.
const VOICES_DIR = "audio/vozes/";
const MAX_STEP = 0.25;
// Filtro de telefone (GDD: faixa de 300 a 3.400 Hz, compressão e leve distorção).
const PHONE_LOW = 300;
const PHONE_HIGH = 3400;
const PHONE_DRIVE = 2.2;
const PHONE_VOLUME = 1.1;
// Dois planos dentro da ligação: o professor ao fundo, com eco de sala, e o colega perto do microfone.
const PROFESSOR_VOLUME = 0.55;
const PROFESSOR_DUCKED = 0.22;
const ROOM_WET = 0.45;
const STUDENT_VOLUME = 0.7;
const COLEGA_VOLUME = 1.15;
const HISS_VOLUME = 0.018;
const HISS_DROPOUT = 0.07;
const DUCK_RELEASE = 0.4;
// Área 5: a voz real do professor, sem filtro, vindo do fim do corredor; a do celular baixa.
const SALA_VOLUME = 0.9;
const PHONE_AT_DOOR = 0.3;
// Picote no subsolo: trechos com sinal e sem sinal, de duração sorteada.
const SIGNAL_ON = [0.5, 1.6];
const SIGNAL_OFF = [0.35, 1.5];
const SIGNAL_SMOOTH = 18;
const GUARD_VOLUME = 0.95;
const GUARD_DUCKED = 0.6;
const GUARD_SILENT_CHANCE = { desconfia: 0.15, barulho: 0.1, pego: 0.3, persegue: 0 };
// Final ruim: depois do nome, um silêncio, "...ele chamou" e a caneta.
const BAD_ELE_CHAMOU = 2.6;
const BAD_PEN = 4.2;
const LEGEND_MIN = 2.5;

type Route = "professor" | "aluno" | "colega" | "ao-vivo";
export type GuardLine = "desconfia" | "barulho" | "pego" | "persegue";

// O relógio do jogo: o tempo de jogo decide o que está tocando na ligação.
export class CallClock {
  readonly schedule: CallSchedule;
  private readonly data: CallData;
  private readonly sfx: Sfx;
  private readonly screen: CallScreen | null;
  private time = 0;
  private started = false;
  private finished = false;
  private silenced = false;
  private studentCalled = false;
  private readonly clips = new Map<string, AudioBuffer>();
  private voices: SpeechSynthesisVoice[] = [];
  // Nós de áudio (criados no primeiro botão).
  private phoneOut: GainNode | null = null;
  private professorIn: GainNode | null = null;
  private studentIn: GainNode | null = null;
  private colegaIn: GainNode | null = null;
  private salaOut: GainNode | null = null;
  private salaIn: GainNode | null = null;
  private liveIn: GainNode | null = null;
  private guardIn: GainNode | null = null;
  private hissGain: GainNode | null = null;
  private hiss: AudioBufferSourceNode | null = null;
  private colegaUntil = 0;
  private signal = 1;
  private signalOn = true;
  private signalTimer = 0;
  private phoneLevel = 1;
  private readonly lastGuard = new Map<GuardLine, number>();

  constructor(data: CallData, sfx: Sfx, screen: CallScreen | null = null) {
    this.data = data;
    this.sfx = sfx;
    this.screen = screen;
    this.schedule = new CallSchedule(data);
  }

  get elapsed(): number {
    return this.time;
  }

  get calledCount(): number {
    return this.schedule.calledAt(this.time);
  }

  /** O colega está falando na ligação (a música baixa para a voz passar). */
  get colegaSpeaking(): boolean {
    return this.sfx.audio.currentTime < this.colegaUntil;
  }

  get studentNameReached(): boolean {
    return this.time >= this.schedule.finalAt;
  }

  setTime(seconds: number): void {
    this.time = Math.max(0, Math.min(seconds, this.schedule.finalAt - 0.01));
  }

  async load(): Promise<void> {
    try {
      const response = await fetch(`${VOICES_DIR}manifest.json`);
      if (!response.ok || !response.headers.get("content-type")?.includes("json")) return;
      const manifest = (await response.json()) as Record<string, string>;
      const context = this.sfx.audio;
      await Promise.all(
        Object.entries(manifest).map(async ([id, file]) => {
          try {
            const data = await (await fetch(`${VOICES_DIR}${file}`)).arrayBuffer();
            this.clips.set(id, await context.decodeAudioData(data));
          } catch {
            console.warn(`voz ${id} não carregou`);
          }
        }),
      );
    } catch (error) {
      console.warn("vozes gravadas não carregaram; usando voz sintetizada", error);
    }
  }

  // A voz sintetizada também precisa ser liberada dentro de um toque no celular.
  primeSpeech(): void {
    if (typeof speechSynthesis === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0;
    speechSynthesis.speak(utterance);
  }

  // Chamado no primeiro botão do menu: o celular vibra e o colega liga.
  start(): void {
    if (this.started) return;
    this.started = true;
    const context = this.sfx.audio;
    const out = this.sfx.output;

    // Cadeia do telefone: passa-faixa, distorção leve e compressão.
    const phoneIn = context.createGain();
    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = PHONE_LOW;
    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = PHONE_HIGH;
    const shaper = context.createWaveShaper();
    shaper.curve = softClip(PHONE_DRIVE);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -28;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.15;
    this.phoneOut = context.createGain();
    this.phoneOut.gain.value = PHONE_VOLUME;
    phoneIn.connect(highpass).connect(lowpass).connect(shaper).connect(compressor).connect(this.phoneOut).connect(out);

    // Professor e alunos ao fundo da sala (com eco), colega seco e perto.
    const room = context.createConvolver();
    room.buffer = roomImpulse(context, 0.9);
    const roomWet = context.createGain();
    roomWet.gain.value = ROOM_WET;
    room.connect(roomWet).connect(phoneIn);
    this.professorIn = context.createGain();
    this.professorIn.gain.value = PROFESSOR_VOLUME;
    this.professorIn.connect(phoneIn);
    this.professorIn.connect(room);
    this.studentIn = context.createGain();
    this.studentIn.gain.value = PROFESSOR_VOLUME * STUDENT_VOLUME;
    this.studentIn.connect(phoneIn);
    this.studentIn.connect(room);
    this.colegaIn = context.createGain();
    this.colegaIn.gain.value = COLEGA_VOLUME;
    this.colegaIn.connect(phoneIn);

    // A sala de verdade (área 5): sem filtro de telefone, com o eco do corredor.
    this.salaIn = context.createGain();
    this.salaOut = context.createGain();
    this.salaOut.gain.value = 0;
    const hall = context.createConvolver();
    hall.buffer = roomImpulse(context, 1.6);
    const hallWet = context.createGain();
    hallWet.gain.value = 0.6;
    this.salaIn.connect(this.salaOut);
    this.salaIn.connect(hall).connect(hallWet).connect(this.salaOut);
    this.salaOut.connect(out);

    // Ao vivo: seguranças e o "presente" do Zacarias.
    this.liveIn = context.createGain();
    this.liveIn.connect(out);
    this.guardIn = context.createGain();
    this.guardIn.gain.value = GUARD_VOLUME;
    const guardRoom = context.createConvolver();
    guardRoom.buffer = roomImpulse(context, 1.2);
    const guardWet = context.createGain();
    guardWet.gain.value = 0.25;
    this.guardIn.connect(this.liveIn);
    this.guardIn.connect(guardRoom).connect(guardWet).connect(this.liveIn);

    this.hiss = context.createBufferSource();
    this.hiss.buffer = noiseBuffer(context);
    this.hiss.loop = true;
    this.hissGain = context.createGain();
    this.hissGain.gain.value = HISS_VOLUME;
    this.hiss.connect(this.hissGain).connect(phoneIn);
    this.hiss.start();

    this.vibrate();
    this.screen?.show();
    if (typeof speechSynthesis !== "undefined") {
      const pick = (): void => {
        this.voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("pt"));
      };
      pick();
      speechSynthesis.addEventListener("voiceschanged", pick);
    }
  }

  /**
   * `sala` vai de 0 a 1 conforme o jogador se aproxima da porta da sala na área 5:
   * a voz real do professor sobe e a do celular baixa.
   */
  update(dt: number, area: number, running: boolean, sala = 0): void {
    if (!this.started || this.finished) return;
    const context = this.sfx.audio;
    const now = context.currentTime;
    const k = Math.min(1, dt * SIGNAL_SMOOTH);

    // Sinal: estável fora do subsolo; no subsolo, picota e quase some.
    const base = this.data.sinalPorArea[area - 1] ?? 1;
    if (this.data.picotaNasAreas.includes(area)) {
      this.signalTimer -= dt;
      if (this.signalTimer <= 0) {
        this.signalOn = !this.signalOn;
        const [min, max] = this.signalOn ? SIGNAL_ON : SIGNAL_OFF;
        this.signalTimer = min + Math.random() * (max - min);
      }
    } else {
      this.signalOn = true;
      this.signalTimer = 0;
    }
    const target = this.signalOn ? base : 0.02;
    this.signal += (target - this.signal) * k;
    this.phoneLevel += (1 - (1 - PHONE_AT_DOOR) * sala - this.phoneLevel) * Math.min(1, dt * 2);
    if (this.phoneOut) this.phoneOut.gain.value = PHONE_VOLUME * this.signal * this.phoneLevel;
    if (this.hissGain) this.hissGain.gain.value = this.signalOn ? HISS_VOLUME : HISS_DROPOUT;
    if (this.salaOut) this.salaOut.gain.value = SALA_VOLUME * sala * sala;
    this.screen?.setSignal(this.signalOn ? base : 0);

    // Ducking: quando o colega fala, o professor e os seguranças baixam.
    const ducked = now < this.colegaUntil;
    const duck = (node: GainNode | null, normal: number, low: number): void => {
      if (!node) return;
      const goal = ducked ? low : normal;
      node.gain.value += (goal - node.gain.value) * Math.min(1, dt / (ducked ? 0.08 : DUCK_RELEASE));
    };
    duck(this.professorIn, PROFESSOR_VOLUME, PROFESSOR_DUCKED);
    duck(this.studentIn, PROFESSOR_VOLUME * STUDENT_VOLUME, PROFESSOR_DUCKED * STUDENT_VOLUME);
    duck(this.guardIn, GUARD_VOLUME, GUARD_DUCKED);

    if (!running || this.studentCalled) return;
    const previous = this.time;
    this.time = Math.min(this.time + Math.min(dt, MAX_STEP), this.schedule.finalAt);
    for (const event of this.schedule.between(previous, this.time)) this.play(event);
  }

  /** Final ruim: o nome já foi lido; vem o silêncio, o colega e a caneta riscando. */
  badEnding(): void {
    this.studentCalled = true;
    const fala = this.data.falas.eleChamou;
    this.playFala(fala, "colega", BAD_ELE_CHAMOU);
    window.setTimeout(() => this.screen?.colega(fala.legenda ?? fala.texto, 4), BAD_ELE_CHAMOU * 1000);
    this.pen(BAD_PEN);
  }

  /** Final bom: a ligação acaba e o professor, na sala, chama o nome fora da ordem. Devolve a duração da fala. */
  goodEnding(): number {
    this.studentCalled = true;
    this.hangUp();
    const fala = this.data.falas.salaChama;
    this.playFala(fala, "ao-vivo", 0, 0.95);
    return this.clips.get(fala.id)?.duration ?? 1.4;
  }

  /** O jogador respondeu: "presente". Devolve quando a fala termina, contando o atraso. */
  answer(): number {
    return 0.05 + this.playFala(this.data.falas.zacariasPresente, "ao-vivo", 0.05, 1);
  }

  /** Corte para preto: tudo em silêncio. */
  silence(): void {
    if (this.silenced) return;
    this.silenced = true;
    this.hangUp();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }

  /** Fala de um segurança, sorteada sem repetir a anterior; às vezes nenhuma. */
  guard(kind: GuardLine, volume = 1, always = false): boolean {
    if (!this.started) return false;
    if (!always && Math.random() < GUARD_SILENT_CHANCE[kind]) return false;
    const options = this.data.falas.seguranca[kind];
    const last = this.lastGuard.get(kind) ?? -1;
    let pick = Math.floor(Math.random() * options.length);
    if (options.length > 1 && pick === last) pick = (pick + 1 + Math.floor(Math.random() * (options.length - 1))) % options.length;
    this.lastGuard.set(kind, pick);
    this.playFala(options[pick], "ao-vivo", 0, volume, this.guardIn);
    return true;
  }

  /** Sala de teste: o celular vibra e o colega fala a primeira fala. */
  ring(): void {
    if (!this.started) return;
    this.vibrate();
    const fala = this.data.colega[0].fala;
    const duration = this.playFala(fala, "colega", 1.1);
    window.setTimeout(() => this.screen?.colega(fala.legenda ?? fala.texto, Math.max(LEGEND_MIN, duration + 1)), 1100);
  }

  private hangUp(): void {
    if (!this.started) return;
    this.finished = true;
    const now = this.sfx.audio.currentTime;
    for (const node of [this.phoneOut, this.salaOut]) {
      if (!node) continue;
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(node.gain.value, now);
      node.gain.linearRampToValueAtTime(0, now + 0.3);
    }
    this.hiss?.stop(now + 0.35);
    this.hiss = null;
    this.screen?.hide();
  }

  private play(event: CallEvent): void {
    if (event.aluno) this.studentCalled = true;
    const legend = this.legendOf(event);
    const route: Route = event.kind === "colega" ? "colega" : event.kind === "presente" || event.kind === "aluna" ? "aluno" : "professor";
    const duration = this.playFala(event.fala, route, 0);
    if (!legend) return;
    if (event.kind === "colega") this.screen?.colega(legend, Math.max(LEGEND_MIN, duration + 1));
    else if (this.signalOn) this.screen?.professor(legend);
    else this.screen?.professor("· · ·");
  }

  private legendOf(event: CallEvent): string | undefined {
    switch (event.kind) {
      case "nome":
        return event.nome;
      case "repete":
        return `${event.nome}?`;
      case "presente":
        return `${event.nome} · presente`;
      case "falta":
        return `${event.nome} · falta`;
      default:
        return event.fala.legenda;
    }
  }

  /** Toca uma fala pela rota certa; devolve a duração (estimada, se for voz sintetizada). */
  private playFala(fala: Fala, route: Route, delay: number, volume = 1, input: GainNode | null = null): number {
    const clip = this.clips.get(fala.id);
    const context = this.sfx.audio;
    if (!clip) {
      if (delay > 0) window.setTimeout(() => this.speak(fala, route), delay * 1000);
      else this.speak(fala, route);
      return fala.texto.length * 0.07;
    }
    // Ao vivo (seguranças, Zacarias, o professor na sala no final): sem telefone.
    const targets: (AudioNode | null)[] =
      input ? [input]
      : route === "colega" ? [this.colegaIn]
      : route === "aluno" ? [this.studentIn, this.salaIn]
      : route === "professor" ? [this.professorIn, this.salaIn]
      : [this.liveIn];
    const source = context.createBufferSource();
    source.buffer = clip;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    for (const target of targets) if (target) gain.connect(target);
    source.start(context.currentTime + delay);
    if (route === "colega") this.colegaUntil = Math.max(this.colegaUntil, context.currentTime + delay + clip.duration + 0.1);
    return clip.duration;
  }

  private speak(fala: Fala, route: Route): void {
    if (typeof speechSynthesis === "undefined" || !this.started || this.sfx.muted) return;
    const utterance = new SpeechSynthesisUtterance(fala.texto);
    utterance.lang = "pt-BR";
    const voice = this.voices[VOICE_INDEX[fala.voz] % Math.max(1, this.voices.length)];
    if (voice) utterance.voice = voice;
    utterance.rate = fala.voz === "colega" ? 1.25 : 1.05;
    utterance.pitch = fala.voz === "seguranca" ? 0.6 : fala.voz === "aluna" ? 1.3 : fala.voz === "colega" ? 1.1 : 0.85;
    utterance.volume = route === "colega" || route === "ao-vivo" ? 1 : route === "aluno" ? 0.35 : 0.5;
    speechSynthesis.speak(utterance);
  }

  /** Celular vibrando no bolso (duas vibradas curtas). */
  private vibrate(): void {
    const context = this.sfx.audio;
    const t0 = context.currentTime + 0.05;
    for (const start of [0, 0.55]) {
      const osc = context.createOscillator();
      osc.type = "square";
      osc.frequency.value = 160;
      const lowpass = context.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 400;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, t0 + start);
      gain.gain.linearRampToValueAtTime(0.18, t0 + start + 0.03);
      gain.gain.setValueAtTime(0.18, t0 + start + 0.38);
      gain.gain.linearRampToValueAtTime(0, t0 + start + 0.42);
      osc.connect(lowpass).connect(gain).connect(this.sfx.output);
      osc.start(t0 + start);
      osc.stop(t0 + start + 0.45);
    }
  }

  /** Caneta marcando a falta na lista, ouvida pelo celular. */
  private pen(delay: number): void {
    const context = this.sfx.audio;
    const input = this.colegaIn;
    if (!input) return;
    const t0 = context.currentTime + delay;
    for (const [start, length] of [[0, 0.12], [0.16, 0.22]]) {
      const source = context.createBufferSource();
      source.buffer = noiseBuffer(context);
      const band = context.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 2600;
      band.Q.value = 1.4;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, t0 + start);
      gain.gain.linearRampToValueAtTime(0.5, t0 + start + 0.02);
      gain.gain.linearRampToValueAtTime(0.25, t0 + start + length * 0.6);
      gain.gain.linearRampToValueAtTime(0, t0 + start + length);
      source.connect(band).connect(gain).connect(input);
      source.start(t0 + start);
      source.stop(t0 + start + length + 0.05);
    }
  }
}

const VOICE_INDEX: Record<Voz, number> = { professor: 0, colega: 1, aluno: 2, aluna: 3, zacarias: 4, seguranca: 5 };

function softClip(drive: number): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

/** Eco de sala sintético: ruído com decaimento exponencial. */
function roomImpulse(context: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let c = 0; c < 2; c++) {
    const channel = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.5);
  }
  return buffer;
}

function noiseBuffer(context: BaseAudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
  return buffer;
}
