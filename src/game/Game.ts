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
import type { BlockData, LevelData } from "../levels/pipeline";
import { pipelineLevel } from "../levels/pipeline";

const MAX_DT = 1 / 30;
const PUSH_REACH = 0.5;
const PUSH_GRACE = 0.2;

export class Game {
  private readonly boxes: Box[] = [];
  private player!: Player;
  private cameraRig!: CameraRig;
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

    for (const [i, block] of [level.ground, ...level.walls, ...level.platforms].entries()) {
      this.createStatic(block, level.depth, solidMaterial, `solid-${i}`);
    }

    level.boxes.forEach((data, i) => this.boxes.push(new Box(scene, data, `box-${i}`)));

    this.player = await Player.create(scene, level.spawn);
    this.cameraRig = new CameraRig(scene, level.spawn.x);

    scene.onBeforeRenderObservable.add(() => this.update());
    scene.onAfterPhysicsObservable.add(() => {
      for (const box of this.boxes) box.lockToPlane();
    });
  }

  private update(): void {
    const dt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, MAX_DT);
    this.input.update();
    const dir = this.input.axisX();
    if (this.isPushingBox()) {
      this.pushTimer = PUSH_GRACE;
      this.pushDir = dir;
    } else {
      this.pushTimer = dir === this.pushDir ? Math.max(0, this.pushTimer - dt) : 0;
    }
    this.player.update(dt, this.input, this.pushTimer > 0);
    this.cameraRig.update(dt, this.player.position.x);
    this.input.endFrame();
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
