import type { CallData } from "../levels/types";
import { CallSchedule, type CallEvent } from "./CallSchedule";
import type { Sfx } from "./Sfx";

const MANIFEST_URL = "audio/chamada/manifest.json";
const VOLUME_SMOOTHING = 1.5;
const HISS_VOLUME = 0.025;
const HIGHPASS = 320;
const MAX_STEP = 0.25;
const SPEECH_RATE = 1.05;
const SPEECH_PITCH = 0.85;
const ANSWER_PITCH = 1.25;
const ANSWER_DELAY = 1.3;
const ANSWER_VOLUME = 0.45;

// Arquivos gerados (ElevenLabs): `audio/chamada/manifest.json` = { "nomes": { "<nome>": "<arquivo>" }, "presente": ["<arquivo>", ...] }.
interface Manifest {
  nomes: Record<string, string>;
  presente: string[];
}

// O relógio do jogo: o tempo de jogo decide qual nome está sendo chamado.
// A voz usa os arquivos gravados quando existem; sem eles, usa a voz sintetizada do navegador (provisória).
export class CallClock {
  readonly schedule: CallSchedule;
  private readonly data: CallData;
  private readonly sfx: Sfx;
  private time = 0;
  private area = 1;
  private volume = 0;
  private bus: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private hiss: AudioBufferSourceNode | null = null;
  private readonly clips = new Map<string, AudioBuffer>();
  private readonly answers: AudioBuffer[] = [];
  private voice: SpeechSynthesisVoice | null = null;
  private started = false;
  private studentCalled = false;

  constructor(data: CallData, sfx: Sfx) {
    this.data = data;
    this.sfx = sfx;
    this.schedule = new CallSchedule(data);
  }

  get elapsed(): number {
    return this.time;
  }

  get calledCount(): number {
    return this.schedule.calledAt(this.time);
  }

  get studentNameReached(): boolean {
    return this.time >= this.schedule.finalAt;
  }

  setTime(seconds: number): void {
    this.time = Math.max(0, Math.min(seconds, this.schedule.finalAt - 0.01));
  }

  async load(): Promise<void> {
    try {
      const response = await fetch(MANIFEST_URL);
      if (!response.ok || !response.headers.get("content-type")?.includes("json")) return;
      const manifest = (await response.json()) as Manifest;
      const context = this.sfx.audio;
      const decode = async (file: string): Promise<AudioBuffer> => {
        const data = await (await fetch(`audio/chamada/${file}`)).arrayBuffer();
        return context.decodeAudioData(data);
      };
      await Promise.all(
        Object.entries(manifest.nomes).map(async ([nome, file]) => this.clips.set(nome, await decode(file))),
      );
      for (const file of manifest.presente) this.answers.push(await decode(file));
    } catch (error) {
      console.warn("chamada gravada não carregou; usando voz sintetizada", error);
      this.clips.clear();
      this.answers.length = 0;
    }
  }

  // A voz sintetizada também precisa ser liberada dentro de um toque no celular.
  primeSpeech(): void {
    if (typeof speechSynthesis === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0;
    speechSynthesis.speak(utterance);
  }

  // Chamado no primeiro botão do menu, quando o áudio pode começar.
  start(): void {
    if (this.started) return;
    this.started = true;
    const context = this.sfx.audio;
    this.bus = context.createGain();
    this.bus.gain.value = 0;
    this.filter = context.createBiquadFilter();
    this.filter.type = "lowpass";
    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = HIGHPASS;
    this.filter.connect(highpass).connect(this.bus).connect(this.sfx.output);
    this.hiss = context.createBufferSource();
    this.hiss.buffer = noiseBuffer(context);
    this.hiss.loop = true;
    const hissGain = context.createGain();
    hissGain.gain.value = HISS_VOLUME;
    this.hiss.connect(hissGain).connect(this.filter);
    this.hiss.start();
    if (typeof speechSynthesis !== "undefined") {
      const pick = (): void => {
        const voices = speechSynthesis.getVoices();
        this.voice = voices.find((v) => v.lang === "pt-BR") ?? voices.find((v) => v.lang.startsWith("pt")) ?? null;
      };
      pick();
      speechSynthesis.addEventListener("voiceschanged", pick);
    }
  }

  update(dt: number, area: number, running: boolean): void {
    this.area = area;
    const target = this.started ? this.data.volumePorArea[area - 1] ?? 1 : 0;
    this.volume += (target - this.volume) * Math.min(1, dt * VOLUME_SMOOTHING);
    if (this.bus) this.bus.gain.value = this.volume;
    if (this.filter) this.filter.frequency.value = this.data.filtroPorArea[area - 1] ?? 6000;
    if (!running || this.studentCalled) return;
    const previous = this.time;
    this.time = Math.min(this.time + Math.min(dt, MAX_STEP), this.schedule.finalAt);
    for (const event of this.schedule.between(previous, this.time)) this.say(event);
  }

  // Final bom: o aluno chegou e a voz chama o nome dele na hora.
  callStudentNow(): void {
    if (this.studentCalled) return;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    this.say(this.schedule.events[this.schedule.events.length - 1]);
  }

  stopHiss(): void {
    this.hiss?.stop();
    this.hiss = null;
  }

  private say(event: CallEvent): void {
    if (event.aluno) this.studentCalled = true;
    const clip = this.clips.get(event.nome);
    if (clip) {
      this.playClip(clip, 0, 1);
      if (event.presente && this.answers.length > 0) {
        this.playClip(this.answers[event.index % this.answers.length], ANSWER_DELAY, ANSWER_VOLUME);
      }
      return;
    }
    this.speak(event.nome, SPEECH_PITCH, 1);
    if (event.presente) this.speak("presente", ANSWER_PITCH, ANSWER_VOLUME);
  }

  private playClip(buffer: AudioBuffer, delay: number, volume: number): void {
    if (!this.filter) return;
    const context = this.sfx.audio;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(this.filter);
    source.start(context.currentTime + delay);
  }

  private speak(text: string, pitch: number, volume: number): void {
    if (typeof speechSynthesis === "undefined" || !this.started) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = SPEECH_RATE;
    utterance.pitch = pitch;
    utterance.volume = Math.min(1, volume * (this.data.volumePorArea[this.area - 1] ?? 1));
    speechSynthesis.speak(utterance);
  }
}

function noiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
  return buffer;
}
