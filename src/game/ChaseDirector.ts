import type { Vigia } from "./entities/Vigia";
import type { Lamp } from "./entities/Lamp";
import type { CenaPerseguicao } from "../levels/types";

// Aberturas das perseguições do subsolo (ver `CenaPerseguicao`):
// - porta: na primeira vez, o Zacarias para, a câmera mostra a porta com luz por baixo, a portaria chama pelo
//   rádio, o segurança responde e a porta abre de supetão; o controle volta no estrondo;
// - apagão: as luzes apagam uma a uma, entra a luz vermelha de emergência e a lanterna acende lá atrás.

/** Cena da porta: quando cada coisa acontece (s). */
const RADIO_AT = 0.15;
const TURN_AT = 0.9;
/** A resposta entra por cima do chiado final do rádio (negativo = sobrepõe). */
const REPLY_GAP = -0.15;
const BURST_GAP = 0.45;
/** No fim da resposta ele vai até a porta: a sombra dos pés tapa a fresta. */
const AT_DOOR = 0.55;
/** Teto para a cena inteira, caso o áudio não diga a duração. */
const SCENE_MAX = 9;
// Apagão: intervalo entre uma lâmpada e a próxima, a espera até a emergência e até a lanterna.
const CUT_STEP = 0.17;
const EMERGENCY_DELAY = 0.45;
const FLASHLIGHT_DELAY = 0.35;
/** Margem do trecho escuro além das lâmpadas que apagam. */
const DARK_MARGIN = 4;
/** Na segunda perseguição (sem porta), a lanterna acende no máximo a esta distância atrás do jogador. */
const BLACKOUT_SPAWN_BEHIND = 6;
/** Passou desta distância do fim da perseguição (checkpoint mais à frente): ela não acontece mais. */
const PAST_END = 2;
/** Batida na maçaneta e o flash da sala pelo vão no estrondo. */
const HANDLE_LEAD = 0.45;
const SLAM_FLASH = 0.12;

export interface ChaseStage {
  /** Trava (0) ou devolve (null) o controle ao jogador. */
  autopilot(axis: number | null): void;
  /** Câmera para num ponto por `seconds` (0 solta). */
  focus(x: number, seconds: number): void;
  punch(strength: number): void;
  /** Vira o Zacarias. */
  face(dir: 1 | -1): void;
  /** Fala atrás da porta; devolve a duração em segundos. */
  behindDoor(kind: "radio" | "responde"): number;
  doorSlam(): void;
  /** Estalo da maçaneta, logo antes do estrondo. */
  handle(): void;
  emergencyOn(): void;
}

type DoorScene = {
  tipo: "porta";
  vigia: Vigia;
  cena: Extract<CenaPerseguicao, { tipo: "porta" }>;
  /** "espera" (ainda não chegou), "cena" (rodando) ou "feita" (não repete, nem depois de ser pego). */
  state: "espera" | "cena" | "feita";
  t: number;
  replyAt: number;
  burstAt: number;
  replyStarted: boolean;
  radioStarted: boolean;
  handle: boolean;
  /** Depois do estrondo: o flash da luz da sala pelo vão (s restantes). */
  flash: number;
};

type Blackout = {
  tipo: "apagao";
  vigia: Vigia;
  cena: Extract<CenaPerseguicao, { tipo: "apagao" }>;
  lamps: Lamp[];
  state: "espera" | "apagando" | "escuro";
  t: number;
  cut: number;
  emergency: boolean;
};

export class ChaseDirector {
  private readonly scenes: (DoorScene | Blackout)[] = [];
  private time = 0;

  constructor(vigias: readonly Vigia[], lamps: readonly Lamp[]) {
    for (const vigia of vigias) {
      const cena = vigia.settings.cena;
      if (!vigia.chases || !cena) continue;
      vigia.held = true;
      if (cena.tipo === "porta") {
        this.scenes.push({ tipo: "porta", vigia, cena, state: "espera", t: 0, replyAt: SCENE_MAX, burstAt: SCENE_MAX, replyStarted: false, radioStarted: false, handle: false, flash: 0 });
      } else {
        const inside = lamps.filter((lamp) => lamp.positionX >= cena.de && lamp.positionX <= cena.ate);
        inside.sort((a, b) => a.positionX - b.positionX);
        this.scenes.push({ tipo: "apagao", vigia, cena, lamps: inside, state: "espera", t: 0, cut: 0, emergency: false });
      }
    }
  }

  /** A cena da porta está rodando (o jogo não deixa o jogador andar nem a câmera seguir). */
  get inScene(): boolean {
    return this.scenes.some((scene) => scene.tipo === "porta" && scene.state === "cena");
  }

  /**
   * O jogador foi pego (ou voltou ao checkpoint pelo menu): a porta volta a esperar (sem a cena, que só toca
   * uma vez) e o apagão desfaz. Se a cena estava no meio, devolve o controle e a câmera.
   */
  reset(stage: ChaseStage): void {
    for (const scene of this.scenes) {
      if (scene.tipo === "porta") {
        if (scene.state === "cena") {
          scene.state = "espera";
          stage.autopilot(null);
          stage.focus(scene.cena.focusX, 0);
        }
        scene.vigia.held = scene.state !== "feita";
        scene.flash = 0;
        scene.vigia.setDoorLight(1);
        continue;
      }
      scene.vigia.held = true;
      scene.state = "espera";
      scene.t = 0;
      scene.cut = 0;
      scene.emergency = false;
      for (const lamp of scene.lamps) lamp.restore();
    }
  }

  update(dt: number, playerX: number, stage: ChaseStage): void {
    this.time += dt;
    for (const scene of this.scenes) {
      if (scene.tipo === "porta") this.updateDoor(scene, dt, playerX, stage);
      else this.updateBlackout(scene, dt, playerX, stage);
    }
  }

  /** Luz ambiente do apagão no trecho onde o jogador está, ou null (vale a da área). */
  ambientAt(x: number): { intensidade: number; cor: [number, number, number] } | null {
    for (const scene of this.scenes) {
      if (scene.tipo !== "apagao" || scene.state === "espera") continue;
      const from = Math.min(scene.cena.de, scene.vigia.settings.x0) - DARK_MARGIN;
      if (x >= from && x <= scene.cena.ate + DARK_MARGIN) return scene.cena.ambiente;
    }
    return null;
  }

  private updateDoor(scene: DoorScene, dt: number, playerX: number, stage: ChaseStage): void {
    const vigia = scene.vigia;
    if (scene.state === "feita") {
      if (scene.flash > 0) {
        scene.flash = Math.max(0, scene.flash - dt);
        vigia.setDoorLight(scene.flash > 0 ? 3 : 0);
      }
      return;
    }
    if (scene.state === "espera") {
      // Começou depois desta perseguição (checkpoint ou ?area=): a cena não toca, e a perseguição segue a regra normal.
      if (playerX > vigia.settings.x1 + PAST_END) {
        scene.state = "feita";
        vigia.held = false;
        return;
      }
      // Alguém anda do outro lado: de vez em quando a sombra dos pés passa pela fresta.
      const pass = Math.max(0, Math.sin(this.time * 0.9) - 0.7) / 0.3;
      vigia.setDoorLight(1 - 0.55 * pass * (0.6 + 0.4 * Math.sin(this.time * 9)));
      if (playerX < scene.cena.triggerX) return;
      scene.state = "cena";
      scene.t = 0;
      scene.radioStarted = false;
      scene.replyStarted = false;
      scene.handle = false;
      scene.replyAt = SCENE_MAX;
      scene.burstAt = SCENE_MAX;
      stage.autopilot(0);
      stage.focus(scene.cena.focusX, SCENE_MAX + 1);
    }
    scene.t += dt;
    const t = scene.t;
    // O controle fica travado a cena inteira (nada mais o devolve no meio dela).
    stage.autopilot(0);
    if (!scene.radioStarted && t >= RADIO_AT) {
      scene.radioStarted = true;
      const radio = stage.behindDoor("radio");
      scene.replyAt = t + Math.max(radio, 1.5) + REPLY_GAP;
    }
    if (t >= TURN_AT && t - dt < TURN_AT) stage.face(-1);
    if (!scene.replyStarted && t >= scene.replyAt) {
      scene.replyStarted = true;
      const reply = stage.behindDoor("responde");
      scene.burstAt = Math.min(SCENE_MAX, t + Math.max(reply, 1) + BURST_GAP);
    }
    // A luz por baixo da porta: parada durante o rádio, os pés andando na resposta e tapada no fim.
    let light = 1;
    if (scene.replyStarted) light = 0.55 + 0.45 * Math.abs(Math.sin(t * 5.5));
    if (t > scene.burstAt - AT_DOOR) light = 0.12;
    vigia.setDoorLight(light);
    // Um estalo na maçaneta avisa que é agora (sem tirar o susto).
    if (scene.replyStarted && !scene.handle && t >= scene.burstAt - HANDLE_LEAD) {
      scene.handle = true;
      stage.handle();
    }
    if (t < scene.burstAt) return;
    scene.state = "feita";
    scene.flash = SLAM_FLASH;
    vigia.burst();
    vigia.setDoorLight(3);
    stage.doorSlam();
    stage.punch(1);
    stage.focus(scene.cena.focusX, 0);
    stage.autopilot(null);
  }

  private updateBlackout(scene: Blackout, dt: number, playerX: number, stage: ChaseStage): void {
    if (scene.state === "espera") {
      if (playerX < (scene.vigia.settings.triggerX ?? scene.cena.de)) return;
      // Voltou num checkpoint depois desta perseguição: nada de apagão nem segurança lá atrás.
      if (playerX > scene.vigia.settings.x1 + PAST_END) return;
      scene.state = "apagando";
      scene.t = 0;
      scene.cut = 0;
    }
    if (scene.state === "escuro") return;
    scene.t += dt;
    // Clac, clac, clac: de trás para a frente, passando pelo jogador.
    while (scene.cut < scene.lamps.length && scene.t >= scene.cut * CUT_STEP) {
      scene.lamps[scene.cut].cut();
      scene.cut++;
    }
    const allOut = scene.lamps.length * CUT_STEP;
    if (!scene.emergency && scene.t >= allOut + EMERGENCY_DELAY) {
      scene.emergency = true;
      for (const lamp of scene.lamps) lamp.emergency();
      stage.emergencyOn();
    }
    if (scene.t >= allOut + EMERGENCY_DELAY + FLASHLIGHT_DELAY) {
      scene.state = "escuro";
      // Sem porta: ele aparece logo atrás do jogador (na tela), não lá no portão se o jogador já correu muito.
      scene.vigia.burst(Math.max(scene.vigia.settings.x0, playerX - BLACKOUT_SPAWN_BEHIND));
    }
  }
}
