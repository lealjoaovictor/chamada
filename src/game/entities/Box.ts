import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Material } from "@babylonjs/core/Materials/material";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { BoxData } from "../../levels/types";

const BOX_FRICTION = 0.4;

const IMPACT_SPEED = 3.5;
// Sombra de contato que anda junto com o objeto empurrável (as do cenário são pintadas fixas no chão e deixavam
// os carrinhos sem sombra nenhuma). Um pouco maior que a base, como as dos móveis parados.
const SHADOW_WIDTH = 1.9;
const SHADOW_DEPTH = 1.7;
const SHADOW_STRENGTH = 0.85;
const SHADOW_LIFT = 0.012;

const shadowMaterials = new WeakMap<Scene, StandardMaterial>();

/** Mancha escura e suave, igual à sombra de contato dos móveis (`blob` em Stickers.ts). */
function contactShadowMaterial(scene: Scene): StandardMaterial {
  const cached = shadowMaterials.get(scene);
  if (cached) return cached;
  const texture = new DynamicTexture("caixa-sombra-tex", { width: 128, height: 128 }, scene, false);
  const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(0,0,0,${SHADOW_STRENGTH})`);
  g.addColorStop(0.7, `rgba(0,0,0,${SHADOW_STRENGTH * 0.85})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  texture.hasAlpha = true;
  texture.update();
  const material = new StandardMaterial("caixa-sombra", scene);
  material.diffuseTexture = texture;
  material.useAlphaFromDiffuseTexture = true;
  material.specularColor = Color3.Black();
  material.transparencyMode = Material.MATERIAL_ALPHABLEND;
  material.zOffset = -2;
  shadowMaterials.set(scene, material);
  return material;
}

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
  private readonly shadow: Mesh;

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

    this.shadow = CreatePlane(`${name}-sombra`, { width: SHADOW_WIDTH, height: SHADOW_DEPTH }, scene);
    this.shadow.rotation.x = Math.PI / 2;
    this.shadow.material = contactShadowMaterial(scene);
    this.shadow.isPickable = false;
    this.shadow.receiveShadows = true;
    this.placeShadow();
  }

  /** A sombra fica sempre embaixo da base, inclusive quando o objeto cai numa valeta ou sobe num estrado. */
  private placeShadow(): void {
    const p = this.mesh.position;
    this.shadow.position.set(p.x, p.y - this.halfSize + SHADOW_LIFT, 0);
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
      this.placeShadow();
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
    this.placeShadow();
  }
}
