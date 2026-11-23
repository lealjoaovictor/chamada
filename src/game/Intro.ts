import type { Fade } from "../ui/Fade";
import { IntroScreen } from "../ui/IntroScreen";

// Introdução (uns 8 s, pulável com qualquer botão): do menu a tela escurece; Zacarias entra pela calçada
// andando devagar com o celular na mão, chegam as mensagens do Davi, ele para, o título aparece e o Davi liga.
// O relógio da chamada só começa na ligação, então a introdução não gasta tempo de jogo.

const FADE_OUT = 0.7;
const FADE_IN_START = 1.4;
const FADE_IN = 1.3;
/** Começa fora do quadro, à esquerda (a câmera para no limite da fase) e para perto do checkpoint. */
export const INTRO_START_X = -4.5;
const STOP_X = 1.6;
const MESSAGES: [number, string][] = [
  [2.6, "mano cadê vc??"],
  [4.0, "o prof vai fazer a chamada no fim da aula"],
  [5.4, "vc tá no limite de faltas"],
];
const TITLE_AT = 6.2;
const TITLE_HIDE_AFTER_CALL = 1.6;
const CALL_AT = 8.4;
/** Ignora o mesmo aperto do menu (e uma tecla segurada) antes de aceitar pular. */
const SKIP_AFTER = 1;

export interface IntroHost {
  readonly fade: Fade;
  playerX(): number;
  /** Põe o Zacarias no começo da calçada, com o celular na mão, e a câmera nele. */
  placeAtStart(): void;
  walk(on: boolean): void;
  /** Guarda o celular e devolve o controle; a ligação começa. */
  startCall(): void;
  ping(): void;
}

export class Intro {
  private readonly screen = new IntroScreen("Davi", "22:14");
  private time = 0;
  private placed = false;
  private walking = false;
  private stopped = false;
  private sent = 0;
  private titled = false;
  private finished = false;

  private readonly host: IntroHost;

  constructor(host: IntroHost) {
    this.host = host;
  }

  get done(): boolean {
    return this.finished;
  }

  /** `pressed`: qualquer botão neste quadro (pula a introdução). */
  update(dt: number, pressed: boolean): void {
    if (this.finished) return;
    this.time += dt;
    const host = this.host;
    if (pressed && this.time >= SKIP_AFTER) {
      this.skip();
      return;
    }
    if (this.time < FADE_OUT) {
      host.fade.set(this.time / FADE_OUT);
      return;
    }
    if (!this.placed) {
      this.placed = true;
      host.fade.set(1);
      host.placeAtStart();
      host.walk(true);
      this.walking = true;
    }
    host.fade.set(1 - Math.min(Math.max((this.time - FADE_IN_START) / FADE_IN, 0), 1));
    if (this.walking && !this.stopped && host.playerX() >= STOP_X) {
      this.stopped = true;
      host.walk(false);
    }
    while (this.sent < MESSAGES.length && this.time >= MESSAGES[this.sent][0]) {
      this.screen.message(MESSAGES[this.sent][1]);
      host.ping();
      this.sent++;
    }
    if (!this.titled && this.time >= TITLE_AT) {
      this.titled = true;
      this.screen.showTitle();
    }
    if (this.time >= CALL_AT) this.finish(false);
  }

  private skip(): void {
    this.host.fade.set(0);
    if (!this.placed) {
      this.placed = true;
      this.host.placeAtStart();
    }
    this.screen.clear();
    this.finish(true);
  }

  private finish(skipped: boolean): void {
    this.finished = true;
    this.host.walk(false);
    this.screen.hideMessages();
    if (!skipped) window.setTimeout(() => this.screen.hideTitle(), TITLE_HIDE_AFTER_CALL * 1000);
    this.host.startCall();
  }
}
