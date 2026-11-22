import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { BoxData } from "../../levels/pipeline";

const BOX_FRICTION = 0.4;

export class Box {
  readonly mesh: Mesh;
  readonly halfSize: number;
  private readonly aggregate: PhysicsAggregate;
  private readonly velocity = new Vector3();
  private readonly start: Vector3;
  private resetFrames = 0;

  constructor(scene: Scene, data: BoxData, name: string) {
    this.halfSize = data.size / 2;
    this.start = new Vector3(data.x, data.y, 0);
    this.mesh = CreateBox(name, { size: data.size }, scene);
    this.mesh.position.set(data.x, data.y, 0);
    const material = new StandardMaterial(`${name}-mat`, scene);
    material.diffuseColor = new Color3(0.35, 0.28, 0.2);
    material.specularColor = Color3.Black();
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

  reset(): void {
    const body = this.aggregate.body;
    body.disablePreStep = false;
    this.mesh.position.copyFrom(this.start);
    body.setLinearVelocity(Vector3.Zero());
    body.setAngularVelocity(Vector3.Zero());
    this.resetFrames = 2;
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
