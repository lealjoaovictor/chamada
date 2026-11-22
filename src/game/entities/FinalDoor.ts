import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { FinalDoorData } from "../../levels/types";

const THICKNESS = 0.12;
const OPEN_ANGLE = 1.65;
const OPEN_TIME = 1.4;

export class FinalDoor {
  readonly data: FinalDoorData;
  private readonly hinge: TransformNode;
  private blocker: PhysicsAggregate | null;
  private opening = false;
  private time = 0;

  constructor(scene: Scene, data: FinalDoorData, material: StandardMaterial, name: string) {
    this.data = data;
    this.hinge = new TransformNode(`${name}-dobradica`, scene);
    this.hinge.position.set(data.x, data.floorY, -data.depth / 2);
    const leaf = CreateBox(name, { width: THICKNESS, height: data.height, depth: data.depth }, scene);
    leaf.parent = this.hinge;
    leaf.position.set(0, data.height / 2, data.depth / 2);
    leaf.material = material;

    const blocker = CreateBox(`${name}-bloqueio`, { width: THICKNESS, height: data.height, depth: 4 }, scene);
    blocker.position.set(data.x, data.floorY + data.height / 2, 0);
    blocker.isVisible = false;
    this.blocker = new PhysicsAggregate(blocker, PhysicsShapeType.BOX, { mass: 0 }, scene);
  }

  open(): void {
    if (this.opening) return;
    this.opening = true;
    this.blocker?.dispose();
    this.blocker = null;
  }

  get isOpening(): boolean {
    return this.opening;
  }

  update(dt: number): void {
    if (!this.opening || this.time >= OPEN_TIME) return;
    this.time = Math.min(this.time + dt, OPEN_TIME);
    const t = this.time / OPEN_TIME;
    this.hinge.rotation.y = OPEN_ANGLE * (1 - (1 - t) * (1 - t));
  }
}
