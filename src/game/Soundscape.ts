import type { Sfx, SfxName } from "./Sfx";

const STEPS: SfxName[] = ["passo-1", "passo-2", "passo-3", "passo-4"];
const STEP_INTERVAL = 0.34;
const VIGIA_STEP_INTERVAL = 0.5;
const VIGIA_RUN_INTERVAL = 0.3;
const PUSH_INTERVAL = 0.42;
const ELEVATOR_INTERVAL = 0.5;
const WALK_SPEED = 1;
const LAND_AIRTIME = 0.25;
const HEARING_DISTANCE = 16;
const DOOR_EPSILON = 0.002;

export interface SoundState {
  playerX: number;
  playerY: number;
  moving: boolean;
  grounded: boolean;
  sliding: boolean;
  pushing: boolean;
  plates: boolean[];
  doorBottoms: number[];
  elevatorsMoving: boolean[];
  elevatorsCalled: boolean[];
  /** Porta do elevador: +1 abrindo, -1 fechando, 0 parada. */
  elevatorDoors: number[];
  /** Chegadas da cabine (cada uma é um "plim"). */
  elevatorArrivals: number[];
  /** Zumbido da lâmpada da cabine mais próxima (0 a 1). */
  elevatorHum: number;
  lampsDead: boolean[];
  vigias: { x: number; walking: boolean; chases: boolean; shown: boolean; suspicious: boolean }[];
  finalDoorOpen: boolean;
  lockedDoorTouched: boolean;
}

export class Soundscape {
  private readonly sfx: Sfx;
  private previous: SoundState | null = null;
  private stepTimer = 0;
  private stepIndex = 0;
  private airtime = 0;
  private pushTimer = 0;
  private elevatorTimer = 0;
  private readonly vigiaTimers: number[] = [];
  private readonly doorDirection: number[] = [];

  constructor(sfx: Sfx) {
    this.sfx = sfx;
  }

  death(cause: "queda" | "luz" | "toque"): void {
    if (cause === "luz") this.sfx.play("morte-luz", { volume: 0.9 });
    else if (cause === "toque") this.sfx.play("morte-toque", { volume: 1, pitch: 0.7 });
    else this.sfx.play("morte-queda", { volume: 0.8 });
  }

  /** Pego por um segurança: um aviso curto e baixo (eles são bravos, não violentos); a fala vem do CallClock. */
  caught(cause: "luz" | "toque"): void {
    if (cause === "luz") this.sfx.play("morte-luz", { volume: 0.45 });
    else this.sfx.play("vigia-surge", { volume: 0.4, pitch: 0.8 });
  }

  forget(): void {
    this.previous = null;
    this.sfx.setHum(0);
  }

  update(dt: number, state: SoundState): void {
    const before = this.previous;
    this.previous = { ...state, vigias: state.vigias.map((vigia) => ({ ...vigia })) };
    if (!before) return;

    const speed = Math.abs(state.playerX - before.playerX) / Math.max(dt, 1e-4);
    this.updatePlayer(dt, state, before, speed);
    this.updatePush(dt, state.pushing && speed > 0.1);

    state.plates.forEach((pressed, i) => {
      if (pressed && !before.plates[i]) this.sfx.play("placa", { volume: 0.8 });
    });
    state.doorBottoms.forEach((bottom, i) => {
      const delta = bottom - (before.doorBottoms[i] ?? bottom);
      const wasMoving = this.doorDirection[i] ?? 0;
      const direction = Math.abs(delta) > DOOR_EPSILON ? Math.sign(delta) : 0;
      if (direction !== 0 && direction !== wasMoving) {
        this.sfx.play(direction > 0 ? "porta-abre" : "porta-fecha", { volume: 0.75 });
      }
      this.doorDirection[i] = direction;
    });
    state.elevatorsCalled.forEach((called, i) => {
      if (called && !before.elevatorsCalled[i]) this.sfx.play("botao", { volume: 0.7 });
    });
    this.sfx.setHum(state.elevatorHum);
    state.elevatorArrivals.forEach((count, i) => {
      if (count > (before.elevatorArrivals[i] ?? count)) this.sfx.chime(0.35);
    });
    state.elevatorDoors.forEach((motion, i) => {
      if (motion !== 0 && motion !== before.elevatorDoors[i]) {
        this.sfx.play(motion > 0 ? "porta-abre" : "porta-fecha", { volume: 0.3, pitch: 1.6 });
      }
    });
    this.updateElevators(dt, state.elevatorsMoving.some(Boolean));
    state.lampsDead.forEach((dead, i) => {
      if (dead && !before.lampsDead[i]) this.sfx.play("lampada", { volume: 0.7, pitch: 0.8 });
    });
    this.updateVigias(dt, state, before);
    if (state.finalDoorOpen && !before.finalDoorOpen) this.sfx.play("porta-final", { volume: 0.9 });
    if (state.lockedDoorTouched && !before.lockedDoorTouched) this.sfx.play("porta-trancada", { volume: 0.8 });
  }

  private updatePlayer(dt: number, state: SoundState, before: SoundState, speed: number): void {
    if (!state.grounded) this.airtime += dt;
    if (state.grounded && !before.grounded && this.airtime > LAND_AIRTIME) {
      this.sfx.play("aterrissar", { volume: 0.7, pitchJitter: 0.08 });
    }
    if (!state.grounded && before.grounded && state.playerY > before.playerY) {
      this.sfx.play("pulo", { volume: 0.5, pitchJitter: 0.1 });
    }
    if (state.grounded) this.airtime = 0;
    if (state.sliding && !before.sliding) this.sfx.play("deslizar", { volume: 0.6, pitchJitter: 0.1 });

    const walking = state.moving && state.grounded && !state.sliding && speed > WALK_SPEED;
    if (!walking) {
      this.stepTimer = STEP_INTERVAL * 0.5;
      return;
    }
    this.stepTimer -= dt;
    if (this.stepTimer > 0) return;
    this.stepTimer = STEP_INTERVAL;
    this.stepIndex = (this.stepIndex + 1) % STEPS.length;
    this.sfx.play(STEPS[this.stepIndex], { volume: 0.6, pitchJitter: 0.06 });
  }

  private updatePush(dt: number, pushing: boolean): void {
    this.pushTimer = Math.max(0, this.pushTimer - dt);
    if (!pushing || this.pushTimer > 0) return;
    this.pushTimer = PUSH_INTERVAL;
    this.sfx.play(Math.random() < 0.5 ? "empurrar-1" : "empurrar-2", { volume: 0.55, pitch: 0.75, pitchJitter: 0.08 });
  }

  private updateElevators(dt: number, moving: boolean): void {
    this.elevatorTimer = Math.max(0, this.elevatorTimer - dt);
    if (!moving || this.elevatorTimer > 0) return;
    this.elevatorTimer = ELEVATOR_INTERVAL;
    this.sfx.play("elevador", { volume: 0.4, pitch: 0.7 });
  }

  private updateVigias(dt: number, state: SoundState, before: SoundState): void {
    state.vigias.forEach((vigia, i) => {
      const was = before.vigias[i];
      if (vigia.chases && vigia.shown && was && !was.shown) this.sfx.play("vigia-surge", { volume: 1 });
      if (vigia.suspicious && was && !was.suspicious) this.sfx.play("vigia-surge", { volume: 0.45, pitch: 1.4 });
      const distance = Math.abs(vigia.x - state.playerX);
      if (!vigia.shown || !vigia.walking || distance > HEARING_DISTANCE) {
        this.vigiaTimers[i] = 0;
        return;
      }
      this.vigiaTimers[i] = (this.vigiaTimers[i] ?? 0) - dt;
      if (this.vigiaTimers[i] > 0) return;
      this.vigiaTimers[i] = vigia.chases ? VIGIA_RUN_INTERVAL : VIGIA_STEP_INTERVAL;
      const volume = 0.7 * (1 - distance / HEARING_DISTANCE);
      this.sfx.play(STEPS[Math.floor(Math.random() * STEPS.length)], { volume, pitch: 0.65, pitchJitter: 0.05 });
    });
  }
}
