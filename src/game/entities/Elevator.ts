import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { ElevatorData } from "../../levels/types";

const THICKNESS = 0.3;
const SPEED = 0.9;
const RIDE_DELAY = 0.6;
const BUTTON_REACH = 0.5;
const BUTTON_IDLE = new Color3(0.45, 0.08, 0.05);
const BUTTON_ACTIVE = new Color3(0.9, 0.55, 0.2);

export interface Rider {
  x: number;
  feetY: number;
  topY: number;
  grounded: boolean;
}

export class Elevator {
  readonly mesh: Mesh;
  private readonly data: ElevatorData;
  private readonly body: PhysicsBody;
  private readonly buttonMaterial: StandardMaterial;
  readonly button: Mesh;
  private readonly target = new Vector3();
  private readonly rotation = Quaternion.Identity();
  private surface: number;
  private goal: number;
  private rideTimer = 0;

  constructor(scene: Scene, data: ElevatorData, depth: number, material: StandardMaterial, name: string) {
    this.data = data;
    this.surface = data.topY;
    this.goal = data.topY;
    this.mesh = CreateBox(name, { width: data.width, height: THICKNESS, depth }, scene);
    this.mesh.material = material;
    this.mesh.position.set(data.x, data.topY - THICKNESS / 2, 0);
    const aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, scene);
    this.body = aggregate.body;
    this.body.setMotionType(PhysicsMotionType.ANIMATED);

    const button = CreateBox(`${name}-botao`, { width: 0.25, height: 0.25, depth: 0.1 }, scene);
    this.button = button;
    button.position.set(data.buttonX, data.buttonY, 1.9);
    this.buttonMaterial = new StandardMaterial(`${name}-botao-mat`, scene);
    this.buttonMaterial.emissiveColor = BUTTON_IDLE;
    this.buttonMaterial.disableLighting = true;
    button.material = this.buttonMaterial;
  }

  update(dt: number, rider: Rider): void {
    const onButton = Math.abs(rider.x - this.data.buttonX) < BUTTON_REACH && rider.feetY < this.data.buttonY;
    if (onButton && this.surface > this.data.bottomY) this.goal = this.data.bottomY;

    const onPlatform =
      Math.abs(rider.x - this.data.x) < this.data.width / 2 &&
      rider.grounded &&
      Math.abs(rider.feetY - this.surface) < 0.3;
    this.rideTimer = onPlatform && this.surface <= this.data.bottomY + 0.01 ? this.rideTimer + dt : 0;
    if (this.rideTimer >= RIDE_DELAY) this.goal = this.data.topY;

    const under =
      Math.abs(rider.x - this.data.x) < this.data.width / 2 + 0.3 && rider.topY < this.surface - THICKNESS;
    const bottom = this.surface - THICKNESS;
    const blocked = under && this.goal < this.surface && bottom - SPEED * dt < rider.topY + 0.05;
    if (!blocked) {
      const delta = this.goal - this.surface;
      this.surface += Math.sign(delta) * Math.min(Math.abs(delta), SPEED * dt);
    }

    const moving = Math.abs(this.goal - this.surface) > 0.001;
    this.buttonMaterial.emissiveColor = moving || this.goal === this.data.bottomY ? BUTTON_ACTIVE : BUTTON_IDLE;
    this.target.set(this.data.x, this.surface - THICKNESS / 2, 0);
    this.body.setTargetTransform(this.target, this.rotation);
  }

  get called(): boolean {
    return this.goal === this.data.bottomY || this.surface < this.data.topY - 0.01;
  }

  reset(): void {
    this.surface = this.data.topY;
    this.goal = this.data.topY;
    this.rideTimer = 0;
    this.target.set(this.data.x, this.surface - THICKNESS / 2, 0);
    this.body.setTargetTransform(this.target, this.rotation);
  }
}
