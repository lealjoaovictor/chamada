import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Input } from "./Input";
import { Physics } from "./Physics";
import { CAPSULE_HEIGHT, CAPSULE_RADIUS, Player } from "./Player";
import { CameraRig } from "./CameraRig";
import { PostFX } from "./PostFX";
import { Box } from "./entities/Box";
import { Checkpoints } from "./Checkpoints";
import { Fade } from "../ui/Fade";
import type { BlockData, LevelData } from "../levels/pipeline";
import { pipelineLevel } from "../levels/pipeline";

const MAX_DT = 1 / 30;
const PUSH_REACH = 0.5;
const PUSH_GRACE = 0.2;
const DEATH_FADE_OUT = 0.25;
const DEATH_FADE_IN = 0.25;

type GameState = "jogando" | "morto";

export class Game {
  private readonly boxes: Box[] = [];
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

  private constructor(engine: AbstractEngine) {
    this.scene = new Scene(engine);
  }

  static async create(engine: AbstractEngine): Promise<Game> {
    const game = new Game(engine);
    await game.load(pipelineLevel);
    return game;
  }

  render(): void {
    this.scene.render();
  }

  private async load(level: LevelData): Promise<void> {
    const scene = this.scene;
    await Physics.enable(scene);
    PostFX.apply(scene);

    const light = new HemisphericLight("light", new Vector3(0.3, 1, -0.4), scene);
    light.intensity = 0.7;
    light.diffuse = new Color3(0.75, 0.8, 0.9);
    light.groundColor = new Color3(0.08, 0.08, 0.1);

    const solidMaterial = new StandardMaterial("solid-mat", scene);
    solidMaterial.diffuseColor = new Color3(0.22, 0.23, 0.25);
    solidMaterial.specularColor = Color3.Black();

    for (const [i, block] of [...level.ground, ...level.walls, ...level.platforms, ...level.obstacles].entries()) {
      this.createStatic(block, level.depth, solidMaterial, `solid-${i}`);
    }

    level.boxes.forEach((data, i) => this.boxes.push(new Box(scene, data, `box-${i}`)));

    this.checkpoints = new Checkpoints(level.checkpoints);
    this.killY = level.killY;
    const spawn = this.checkpoints.current;
    this.player = await Player.create(scene, spawn);
    this.cameraRig = new CameraRig(scene, spawn.x);

    scene.onBeforeRenderObservable.add(() => this.update());
    scene.onAfterPhysicsObservable.add(() => {
      for (const box of this.boxes) box.lockToPlane();
    });
  }

  private update(): void {
    const dt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, MAX_DT);
    this.input.update();
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
    this.cameraRig.update(dt, this.player.position.x);
    this.checkpoints.update(this.player.position.x);
    if (this.player.position.y < this.killY) this.die();
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
      this.cameraRig.snap(point.x);
      this.pushTimer = 0;
    }
    const t = (this.deathTimer - DEATH_FADE_OUT) / DEATH_FADE_IN;
    this.fade.set(1 - t);
    if (t >= 1) this.state = "jogando";
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

  private createStatic(block: BlockData, depth: number, material: StandardMaterial, name: string): void {
    const mesh = CreateBox(name, { width: block.width, height: block.height, depth }, this.scene);
    mesh.position.set(block.x, block.y, 0);
    mesh.material = material;
    new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, this.scene);
  }
}
