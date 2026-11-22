import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Input } from "./Input";
import { Physics } from "./Physics";
import { CAPSULE_HEIGHT, CAPSULE_RADIUS, Player } from "./Player";
import { CameraRig } from "./CameraRig";
import { PostFX, VISUAL } from "./PostFX";
import { Box } from "./entities/Box";
import { Door } from "./entities/Door";
import { Lamp } from "./entities/Lamp";
import { PressurePlate } from "./entities/PressurePlate";
import { Vigia } from "./entities/Vigia";
import { Elevator } from "./entities/Elevator";
import { Checkpoints } from "./Checkpoints";
import { Fade } from "../ui/Fade";
import { MaterialLibrary } from "./MaterialLibrary";
import type { BlockData, DecorData, LevelData, RampData } from "../levels/types";
import { pipelineLevel } from "../levels/pipeline";
import { worldLevel } from "../levels/world";

const MAX_DT = 1 / 30;
const PUSH_REACH = 0.5;
const PUSH_GRACE = 0.2;
const DEATH_FADE_OUT = 0.25;
const DEATH_FADE_IN = 0.25;
const DOOR_CLEARANCE = 0.05;
const SEEN_GRACE = 0.2;
const LIGHT_CULL_DISTANCE = 17;
const MAX_LIGHTS_PER_MATERIAL = 8;
const RAMP_THICKNESS = 0.4;

type GameState = "jogando" | "morto";

export class Game {
  private readonly boxes: Box[] = [];
  private readonly lamps: Lamp[] = [];
  private readonly doors: Door[] = [];
  private readonly plates: PressurePlate[] = [];
  private readonly vigias: Vigia[] = [];
  private readonly elevators: Elevator[] = [];
  private readonly obstacleMeshes: AbstractMesh[] = [];
  private readonly sightPoints = [new Vector3(), new Vector3(), new Vector3()];
  private seenTimer = 0;
  private player!: Player;
  private cameraRig!: CameraRig;
  private checkpoints!: Checkpoints;
  private killY = -Infinity;
  private state: GameState = "jogando";
  private deathTimer = 0;
  private respawned = false;
  private readonly fade = new Fade();
  private readonly scene: Scene;
  private readonly input = new Input();
  private pushTimer = 0;
  private pushDir = 0;
  private materials!: MaterialLibrary;

  private constructor(engine: AbstractEngine) {
    this.scene = new Scene(engine);
  }

  static async create(engine: AbstractEngine): Promise<Game> {
    const game = new Game(engine);
    const debugLevel = new URLSearchParams(location.search).get("fase") === "teste";
    await game.load(debugLevel ? pipelineLevel : worldLevel);
    return game;
  }

  render(): void {
    this.scene.render();
  }

  private async load(level: LevelData): Promise<void> {
    const scene = this.scene;
    await Physics.enable(scene);

    const light = new HemisphericLight("light", new Vector3(0.3, 1, -0.4), scene);
    light.groundColor = new Color3(0.08, 0.08, 0.1);
    level.lamps.forEach((lamp, i) => this.lamps.push(new Lamp(scene, lamp, VISUAL.lampIntensity, `lamp-${i}`)));

    this.materials = new MaterialLibrary(scene);
    for (const [i, block] of [...level.ground, ...level.walls, ...level.platforms].entries()) {
      this.createStatic(block, level.depth, `solid-${i}`);
    }
    level.obstacles.forEach((block, i) => this.obstacleMeshes.push(this.createStatic(block, level.depth, `obstacle-${i}`)));
    level.ramps.forEach((ramp, i) => this.createRamp(ramp, level.depth, `ramp-${i}`));
    level.decor.forEach((decor, i) => this.createDecor(decor, `decor-${i}`));
    level.doors.forEach((door, i) =>
      this.doors.push(new Door(scene, door, level.depth, this.materials.get("metal"), `door-${i}`)),
    );
    level.plates.forEach((plate, i) =>
      this.plates.push(new PressurePlate(scene, plate, level.depth, this.materials.get("metal"), `plate-${i}`)),
    );
    level.elevators.forEach((elevator, i) =>
      this.elevators.push(new Elevator(scene, elevator, level.depth, this.materials.get("metal"), `elevator-${i}`)),
    );

    level.boxes.forEach((data, i) =>
      this.boxes.push(new Box(scene, data, `box-${i}`, this.materials.get(data.material ?? "caixa"))),
    );

    this.checkpoints = new Checkpoints(level.checkpoints);
    this.killY = level.killY;
    const spawn = this.checkpoints.current;
    this.player = await Player.create(scene, spawn);
    for (const data of level.vigias) {
      const vigia = await Vigia.create(scene, data);
      vigia.addShadowCasters([...this.obstacleMeshes, ...this.player.meshes, ...this.boxes.map((box) => box.mesh)]);
      this.vigias.push(vigia);
    }
    this.cameraRig = new CameraRig(scene, { x: spawn.x, feetY: this.player.feetY }, level.bounds);
    PostFX.apply(scene, this.cameraRig.camera, light, VISUAL);

    for (const material of scene.materials) {
      if (material instanceof StandardMaterial) material.maxSimultaneousLights = MAX_LIGHTS_PER_MATERIAL;
    }

    scene.onBeforeRenderObservable.add(() => this.update());
    scene.onAfterPhysicsObservable.add(() => {
      for (const box of this.boxes) box.lockToPlane();
    });
  }

  private update(): void {
    const dt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, MAX_DT);
    this.input.update();
    for (const lamp of this.lamps) lamp.update(dt);
    this.updateDoors(dt);
    for (const vigia of this.vigias) vigia.update(dt);
    this.updateElevators(dt);
    if (this.state === "morto") {
      this.updateDeath(dt);
      this.input.endFrame();
      return;
    }
    const dir = this.input.axisX();
    if (this.isPushingBox()) {
      this.pushTimer = PUSH_GRACE;
      this.pushDir = dir;
    } else {
      this.pushTimer = dir === this.pushDir ? Math.max(0, this.pushTimer - dt) : 0;
    }
    this.player.update(dt, this.input, this.pushTimer > 0);
    this.cameraRig.update(dt, {
      x: this.player.position.x,
      feetY: this.player.feetY,
      grounded: this.player.isGrounded,
      facing: this.player.facingDirection,
    });
    this.checkpoints.update(this.player.position.x);
    this.cullLights();
    if (this.player.position.y < this.killY || this.isSeen(dt)) this.die();
    this.input.endFrame();
  }

  private die(): void {
    this.state = "morto";
    this.deathTimer = 0;
    this.respawned = false;
  }

  private updateDeath(dt: number): void {
    this.deathTimer += dt;
    if (this.deathTimer < DEATH_FADE_OUT) {
      this.fade.set(this.deathTimer / DEATH_FADE_OUT);
      return;
    }
    if (!this.respawned) {
      this.respawned = true;
      const point = this.checkpoints.current;
      this.player.respawn(point);
      for (const box of this.boxes) box.reset();
      for (const door of this.doors) door.reset();
      for (const vigia of this.vigias) vigia.reset();
      for (const elevator of this.elevators) elevator.reset();
      this.seenTimer = 0;
      this.cameraRig.snap(point.x, this.player.feetY);
      this.pushTimer = 0;
    }
    const t = (this.deathTimer - DEATH_FADE_OUT) / DEATH_FADE_IN;
    this.fade.set(1 - t);
    if (t >= 1) this.state = "jogando";
  }

  private updateDoors(dt: number): void {
    const open = this.doors.map(() => false);
    for (const plate of this.plates) {
      if (plate.update(this.boxes)) open[plate.door] = true;
    }
    const p = this.player.position;
    this.doors.forEach((door, i) => {
      const under = door.isOver(p.x, CAPSULE_RADIUS + DOOR_CLEARANCE) && this.player.feetY < door.bottom;
      door.update(dt, open[i], under);
    });
  }

  private cullLights(): void {
    const cameraX = this.cameraRig.camera.position.x;
    for (const light of this.scene.lights) {
      if (!(light instanceof PointLight || light instanceof SpotLight)) continue;
      const near = Math.abs(light.position.x - cameraX) < LIGHT_CULL_DISTANCE;
      if (light.isEnabled() !== near) light.setEnabled(near);
    }
  }

  private updateElevators(dt: number): void {
    const p = this.player.position;
    const feetY = this.player.feetY;
    const rider = { x: p.x, feetY, topY: feetY + (p.y - feetY) * 2, grounded: this.player.isGrounded };
    for (const elevator of this.elevators) elevator.update(dt, rider);
  }

  private isSeen(dt: number): boolean {
    if (this.vigias.length === 0) return false;
    const p = this.player.position;
    const feetY = this.player.feetY;
    const height = (p.y - feetY) * 2;
    this.sightPoints[0].set(p.x, feetY + 0.25, 0);
    this.sightPoints[1].set(p.x, feetY + height * 0.55, 0);
    this.sightPoints[2].set(p.x, feetY + height - 0.15, 0);
    const seen = this.vigias.some((vigia) => vigia.sees(this.sightPoints));
    this.seenTimer = seen ? this.seenTimer + dt : 0;
    return this.seenTimer > SEEN_GRACE;
  }

  private isPushingBox(): boolean {
    const dir = this.input.axisX();
    if (dir === 0 || !this.player.isGrounded) return false;
    const p = this.player.position;
    return this.boxes.some((box) => {
      const ahead = (box.mesh.position.x - p.x) * dir;
      const feet = p.y - CAPSULE_HEIGHT / 2;
      const overlapY = box.mesh.position.y + box.halfSize > feet + 0.1 && box.mesh.position.y - box.halfSize < feet + CAPSULE_HEIGHT;
      return ahead > 0 && ahead < CAPSULE_RADIUS + box.halfSize + PUSH_REACH && overlapY;
    });
  }

  private createStatic(block: BlockData, depth: number, name: string): Mesh {
    const mesh = CreateBox(name, { width: block.width, height: block.height, depth: block.depth ?? depth }, this.scene);
    mesh.position.set(block.x, block.y, block.z ?? 0);
    mesh.receiveShadows = true;
    mesh.material = this.materials.get(block.material ?? "concreto");
    new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, this.scene);
    mesh.freezeWorldMatrix();
    return mesh;
  }

  private createRamp(ramp: RampData, depth: number, name: string): void {
    const dx = ramp.x1 - ramp.x0;
    const dy = ramp.y1 - ramp.y0;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const mesh = CreateBox(name, { width: length, height: RAMP_THICKNESS, depth }, this.scene);
    mesh.rotation.z = angle;
    mesh.position.set(
      (ramp.x0 + ramp.x1) / 2 + Math.sin(angle) * RAMP_THICKNESS / 2,
      (ramp.y0 + ramp.y1) / 2 - Math.cos(angle) * RAMP_THICKNESS / 2,
      0,
    );
    mesh.material = this.materials.get(ramp.material ?? "concreto");
    mesh.isVisible = !ramp.hidden;
    new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, this.scene);
    mesh.freezeWorldMatrix();
  }

  private createDecor(decor: DecorData, name: string): void {
    let mesh: Mesh;
    if (decor.shape === "sphere") {
      mesh = CreateSphere(name, { diameterX: decor.width, diameterY: decor.height, diameterZ: decor.depth, segments: 8 }, this.scene);
    } else if (decor.shape === "cylinder") {
      mesh = CreateCylinder(name, { diameter: decor.width, height: decor.height, tessellation: 10 }, this.scene);
    } else if (decor.shape === "disc") {
      mesh = CreateCylinder(name, { diameter: decor.width, height: decor.depth, tessellation: 24 }, this.scene);
      mesh.rotation.x = Math.PI / 2;
    } else {
      mesh = CreateBox(name, { width: decor.width, height: decor.height, depth: decor.depth }, this.scene);
    }
    mesh.position.set(decor.x, decor.y, decor.z);
    mesh.material = this.materials.get(decor.material ?? "concreto");
    mesh.isPickable = false;
    mesh.receiveShadows = true;
    mesh.freezeWorldMatrix();
  }
}
