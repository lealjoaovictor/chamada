import { Color3 } from "@babylonjs/core/Maths/math.color";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import "@babylonjs/core/Layers/effectLayerSceneComponent";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Scene } from "@babylonjs/core/scene";
import type { CameraBeatData, HintData, RattleData } from "../levels/types";
import { HintIcon } from "../ui/HintIcon";

const GLOW_COLOR = new Color3(1, 0.72, 0.38);
const GLOW_PULSE = 2.2;
const PRESS_EPSILON = 0.4;
const RATTLE_TIME = 0.45;
const RATTLE_AMPLITUDE = 0.03;

export interface HintWorld {
  playerX: number;
  feetY: number;
  axis: number;
  sliding: boolean;
  grounded: boolean;
  boxOffset(index: number): number;
  boxTop(index: number): { x: number; y: number };
  platePressed(index: number): boolean;
  elevatorCalled(index: number): boolean;
  glowMesh(target: "box" | "plate" | "elevator", index: number): Mesh | null;
}

interface HintState {
  data: HintData;
  timer: number;
  deaths: number;
  done: boolean;
  glowing: Mesh[];
}

export class Hints {
  private readonly scene: Scene;
  private readonly states: HintState[];
  private readonly beats: { data: CameraBeatData; fired: boolean }[];
  private readonly rattles: { data: RattleData; mesh: Mesh | null; inside: boolean; timer: number; baseX: number }[];
  private readonly icon = new HintIcon();
  private readonly layer: HighlightLayer;
  private time = 0;
  private previousX: number | null = null;
  private speedX = 0;

  constructor(scene: Scene, hints: readonly HintData[], beats: readonly CameraBeatData[], rattles: readonly RattleData[]) {
    this.scene = scene;
    this.states = hints.map((data) => ({ data, timer: 0, deaths: 0, done: false, glowing: [] }));
    this.beats = beats.map((data) => ({ data, fired: false }));
    this.rattles = rattles.map((data) => {
      const mesh = scene.getMeshByName(data.meshId) as Mesh | null;
      return { data, mesh, inside: false, timer: 0, baseX: mesh?.position.x ?? 0 };
    });
    this.layer = new HighlightLayer("dicas", scene, { blurHorizontalSize: 1.2, blurVerticalSize: 1.2 });
    this.layer.innerGlow = false;
  }

  cameraBeat(playerX: number): CameraBeatData | null {
    for (const beat of this.beats) {
      if (!beat.fired && playerX >= beat.data.triggerX) {
        beat.fired = true;
        return beat.data;
      }
    }
    return null;
  }

  get touchingLocked(): boolean {
    return this.rattles.some((rattle) => rattle.inside);
  }

  registerDeath(playerX: number): void {
    for (const state of this.states) {
      const zone = state.data.deathZone ?? state.data.zone;
      if (state.data.trigger === "mortes" && playerX >= zone.minX && playerX <= zone.maxX) state.deaths++;
    }
  }

  update(dt: number, world: HintWorld, camera: Camera): void {
    this.time += dt;
    if (this.previousX !== null && dt > 0) this.speedX = (world.playerX - this.previousX) / dt;
    this.previousX = world.playerX;
    this.updateRattles(dt, world);

    let iconShown = false;
    for (const state of this.states) {
      if (!state.done && this.isDone(state.data, world)) {
        state.done = true;
        this.setGlow(state, []);
      }
      if (state.done) continue;
      const required = state.data.requires?.platePressed;
      const inZone =
        world.playerX >= state.data.zone.minX &&
        world.playerX <= state.data.zone.maxX &&
        (required === undefined || world.platePressed(required));
      if (!inZone) {
        this.setGlow(state, []);
        continue;
      }
      state.timer += this.progress(state, dt, world);
      const glowReady = state.data.glowAfter !== undefined && this.level(state) >= state.data.glowAfter;
      this.setGlow(state, glowReady ? this.glowTargets(state.data, world) : []);
      const iconReady = state.data.icon && state.data.iconAfter !== undefined && this.level(state) >= state.data.iconAfter;
      if (iconReady && !iconShown && state.data.icon) {
        const icon = state.data.icon;
        const anchor = icon.followBox !== undefined ? world.boxTop(icon.followBox) : { x: icon.x, y: icon.y };
        this.icon.show(icon.action, anchor.x + (icon.followBox !== undefined ? icon.x : 0), anchor.y + (icon.followBox !== undefined ? icon.y : 0));
        iconShown = true;
      }
    }
    if (!iconShown) this.icon.hide();
    this.icon.update(this.scene, camera);

    const pulse = 0.55 + 0.45 * Math.sin(this.time * GLOW_PULSE * Math.PI);
    for (const state of this.states) {
      for (const mesh of state.glowing) this.layer.addMesh(mesh, GLOW_COLOR.scale(pulse));
    }
  }

  private level(state: HintState): number {
    return state.data.trigger === "mortes" ? state.deaths : state.timer;
  }

  private progress(state: HintState, dt: number, world: HintWorld): number {
    if (state.data.trigger === "tempo") return dt;
    if (state.data.trigger === "encostado") {
      const pressing = world.axis > 0 && world.grounded && !world.sliding && Math.abs(this.speedX) < PRESS_EPSILON;
      return pressing ? dt : 0;
    }
    return 0;
  }

  private isDone(data: HintData, world: HintWorld): boolean {
    const done = data.doneWhen;
    if (done.boxMoved !== undefined && world.boxOffset(done.boxMoved) > 0.5) return true;
    if (done.platePressed !== undefined && world.platePressed(done.platePressed)) return true;
    if (done.elevatorCalled !== undefined && world.elevatorCalled(done.elevatorCalled)) return true;
    if (done.passedX !== undefined && world.playerX > done.passedX) return true;
    return false;
  }

  private glowTargets(data: HintData, world: HintWorld): Mesh[] {
    const meshes: (Mesh | null)[] = [];
    if (data.glow?.box !== undefined) meshes.push(world.glowMesh("box", data.glow.box));
    if (data.glow?.plate !== undefined) meshes.push(world.glowMesh("plate", data.glow.plate));
    if (data.glow?.elevator !== undefined) meshes.push(world.glowMesh("elevator", data.glow.elevator));
    return meshes.filter((mesh): mesh is Mesh => mesh !== null);
  }

  private setGlow(state: HintState, meshes: Mesh[]): void {
    for (const mesh of state.glowing) {
      if (!meshes.includes(mesh)) this.layer.removeMesh(mesh);
    }
    state.glowing = meshes;
  }

  private updateRattles(dt: number, world: HintWorld): void {
    for (const rattle of this.rattles) {
      if (!rattle.mesh) continue;
      const inside =
        world.playerX >= rattle.data.minX && world.playerX <= rattle.data.maxX && world.feetY >= rattle.data.minFeetY;
      if (inside && !rattle.inside) rattle.timer = RATTLE_TIME;
      rattle.inside = inside;
      if (rattle.timer <= 0) continue;
      rattle.timer = Math.max(0, rattle.timer - dt);
      const shake = rattle.timer > 0 ? Math.sin(rattle.timer * 70) * RATTLE_AMPLITUDE * (rattle.timer / RATTLE_TIME) : 0;
      rattle.mesh.unfreezeWorldMatrix();
      rattle.mesh.position.x = rattle.baseX + shake;
    }
  }
}
