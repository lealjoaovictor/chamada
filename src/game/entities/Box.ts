import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { BoxData } from "../../levels/types";

const BOX_FRICTION = 0.4;

const IMPACT_SPEED = 3.5;

export class Box {
  readonly mesh: Mesh;
  readonly halfSize: number;
  /** Pegada das mãos: altura acima da base e recuo a partir da face encostada. */
  readonly grip: { x: number; y: number };
  private readonly aggregate: PhysicsAggregate;
  private readonly velocity = new Vector3();
  private lastVy = 0;
  private impact = 0;
  private readonly start: Vector3;
  private resetFrames = 0;

  constructor(scene: Scene, data: BoxData, name: string, material: StandardMaterial) {
    this.halfSize = data.size / 2;
    this.grip = { x: data.pegada?.x ?? 0, y: data.pegada?.y ?? data.size * 0.96 };
    this.start = new Vector3(data.x, data.y, 0);
    this.mesh = CreateBox(name, { size: data.size }, scene);
    this.mesh.position.set(data.x, data.y, 0);
    this.mesh.material = material;

    this.aggregate = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.BOX,
      { mass: data.mass, friction: BOX_FRICTION, restitution: 0 },
      scene,
    );
    this.aggregate.body.setMassProperties({ inertia: Vector3.Zero() });
    this.aggregate.body.setLinearDamping(0.5);
  }

  get offset(): number {
    return Vector3.Distance(this.mesh.position, this.start);
  }

  reset(): void {
    const body = this.aggregate.body;
    body.disablePreStep = false;
    this.mesh.position.copyFrom(this.start);
    body.setLinearVelocity(Vector3.Zero());
    body.setAngularVelocity(Vector3.Zero());
    this.resetFrames = 2;
    this.lastVy = 0;
    this.impact = 0;
  }

  /** Velocidade da última queda forte (m/s), ou 0. Zera ao ler. */
  takeImpact(): number {
    const impact = this.impact;
    this.impact = 0;
    return impact;
  }

  lockToPlane(): void {
    const body = this.aggregate.body;
    if (this.resetFrames > 0) {
      this.resetFrames--;
      this.mesh.position.copyFrom(this.start);
      body.setLinearVelocity(Vector3.Zero());
      return;
    }
    body.getLinearVelocityToRef(this.velocity);
    if (this.lastVy < -IMPACT_SPEED && this.velocity.y > this.lastVy * 0.3) this.impact = -this.lastVy;
    this.lastVy = this.velocity.y;
    if (this.velocity.z !== 0) {
      this.velocity.z = 0;
      body.setLinearVelocity(this.velocity);
    }
    body.setAngularVelocity(Vector3.Zero());
    if (Math.abs(this.mesh.position.z) > 0.01) {
      body.disablePreStep = false;
      this.mesh.position.z = 0;
    } else if (!body.disablePreStep) {
      body.disablePreStep = true;
    }
  }
}
