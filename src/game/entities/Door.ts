import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { DoorData } from "../../levels/types";
import type { CoverBox } from "../sightCover";

const OPEN_SPEED = 0.8;
const CLOSE_SPEED = 1.6;

export class Door {
  readonly mesh: Mesh;
  private readonly data: DoorData;
  private offset = 0;
  private readonly depth: number;

  constructor(scene: Scene, data: DoorData, depth: number, material: StandardMaterial, name: string) {
    this.data = data;
    this.depth = depth;
    this.mesh = CreateBox(name, { width: data.width, height: data.height, depth }, scene);
    this.mesh.position.set(data.x, data.y, 0);
    this.mesh.material = material;
    const aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.BOX, { mass: 0 }, scene);
    aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
    aggregate.body.disablePreStep = false;
    this.reset();
  }

  get closeAfterX(): number | undefined {
    return this.data.closeAfterX;
  }

  get bottom(): number {
    return this.mesh.position.y - this.data.height / 2;
  }

  /** Caixa atual do portão (sobe e desce), para cortar o facho da lanterna dos seguranças. */
  get occluder(): CoverBox {
    const { x, width, height } = this.data;
    const y = this.mesh.position.y;
    return { minX: x - width / 2, maxX: x + width / 2, minY: y - height / 2, maxY: y + height / 2, minZ: -this.depth / 2, maxZ: this.depth / 2 };
  }

  isOver(x: number, margin: number): boolean {
    return Math.abs(x - this.data.x) < this.data.width / 2 + margin;
  }

  update(dt: number, open: boolean, blocked: boolean): void {
    if (open) {
      this.offset = Math.min(this.data.openHeight, this.offset + OPEN_SPEED * dt);
    } else if (!blocked) {
      this.offset = Math.max(0, this.offset - CLOSE_SPEED * dt);
    }
    this.mesh.position.y = this.data.y + this.offset;
  }

  reset(): void {
    this.offset = this.data.closeAfterX === undefined ? 0 : this.data.openHeight;
    this.mesh.position.y = this.data.y + this.offset;
  }
}
