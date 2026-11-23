import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

/**
 * O que o segurança está fazendo, desenhado a giz em cima da cabeça:
 * - `zzz`: dormindo (pode passar, sem barulho);
 * - `alerta`: vai olhar daqui a pouco (melhor parar ou se esconder);
 * - `duvida`: viu alguma coisa (sai da luz!);
 * - `gol`: comemorando o gol na TV (distraído);
 * - `celular`: olhando o celular (distraído, mesmo atrás das estantes).
 */
export type BadgeKind = "zzz" | "alerta" | "duvida" | "gol" | "celular";

const SIZE = 0.78;
const ABOVE_HEAD = 0.5;
const FADE_IN = 6;
const FADE_OUT = 4;
const FONT = '600 190px Caveat, "Bradley Hand", "Segoe Print", cursive';

const STYLE: Record<BadgeKind, { text: string; color: string }> = {
  zzz: { text: "z Z", color: "#cfe3ff" },
  alerta: { text: "!", color: "#ffb43a" },
  duvida: { text: "?", color: "#ffe066" },
  gol: { text: "GOL!", color: "#9be27a" },
  celular: { text: "", color: "#a9c8ff" },
};

export class HabitBadge {
  private readonly mesh: Mesh;
  private readonly material: StandardMaterial;
  private readonly textures = new Map<BadgeKind, DynamicTexture>();
  private readonly head: TransformNode | null;
  private readonly fallback: () => Vector3;
  private kind: BadgeKind | null = null;
  private shown: BadgeKind | null = null;
  private alpha = 0;
  private time = 0;
  private readonly at = new Vector3();

  constructor(scene: Scene, name: string, head: TransformNode | null, fallback: () => Vector3) {
    this.head = head;
    this.fallback = fallback;
    this.mesh = CreatePlane(`${name}-balao`, { size: SIZE }, scene);
    this.mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.mesh.isPickable = false;
    this.material = new StandardMaterial(`${name}-balao-mat`, scene);
    this.material.disableLighting = true;
    this.material.emissiveColor = Color3.White();
    this.material.fogEnabled = false;
    this.material.backFaceCulling = false;
    this.material.useAlphaFromDiffuseTexture = true;
    this.mesh.material = this.material;
    this.mesh.renderingGroupId = 1;
    for (const kind of Object.keys(STYLE) as BadgeKind[]) this.textures.set(kind, draw(scene, `${name}-${kind}`, STYLE[kind]));
    this.mesh.setEnabled(false);
  }

  set(kind: BadgeKind | null): void {
    this.kind = kind;
  }

  update(dt: number, visible: boolean): void {
    this.time += dt;
    const want = visible ? this.kind : null;
    if (want && want !== this.shown) {
      // Troca de símbolo: o novo entra com um pulo.
      this.shown = want;
      this.alpha = Math.min(this.alpha, 0.2);
      this.time = 0;
      const texture = this.textures.get(want) ?? null;
      this.material.diffuseTexture = texture;
      this.material.emissiveTexture = texture;
    }
    this.alpha = want ? Math.min(1, this.alpha + dt * FADE_IN) : Math.max(0, this.alpha - dt * FADE_OUT);
    if (this.alpha <= 0) {
      this.shown = null;
      this.mesh.setEnabled(false);
      return;
    }
    this.mesh.setEnabled(true);
    if (this.head) this.at.copyFrom(this.head.getAbsolutePosition());
    else this.at.copyFrom(this.fallback());
    let rise = ABOVE_HEAD;
    let scale = 1;
    let alpha = this.alpha;
    switch (this.shown) {
      case "zzz":
        // Sobe devagar e some, como respiração.
        rise += 0.12 * ((this.time * 0.45) % 1);
        alpha *= 0.55 + 0.45 * Math.sin(this.time * 2.2) ** 2;
        break;
      case "alerta":
        scale = 1 + 0.35 * Math.max(0, 1 - this.time * 5) + 0.08 * Math.sin(this.time * 14);
        break;
      case "celular":
        // A tela pisca devagar, como quem rola o feed.
        alpha *= 0.75 + 0.25 * Math.sin(this.time * 3);
        break;
      case "gol":
        scale = 0.9 + 0.1 * Math.sin(this.time * 9);
        break;
      case "duvida":
        scale = 1 + 0.25 * Math.max(0, 1 - this.time * 5);
        rise += 0.03 * Math.sin(this.time * 6);
        break;
    }
    this.mesh.position.set(this.at.x, this.at.y + rise, this.at.z);
    this.mesh.scaling.setAll(scale);
    this.material.alpha = alpha;
  }

  dispose(): void {
    this.mesh.dispose();
    this.material.dispose();
    for (const texture of this.textures.values()) texture.dispose();
  }
}

function draw(scene: Scene, name: string, style: { text: string; color: string }): DynamicTexture {
  const texture = new DynamicTexture(name, { width: 256, height: 256 }, scene, true);
  texture.hasAlpha = true;
  const ctx = texture.getContext() as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 256, 256);
  if (!style.text) {
    // Celular: um retângulo de tela acesa, com brilho em volta.
    ctx.shadowColor = style.color;
    ctx.shadowBlur = 40;
    ctx.fillStyle = "rgba(10, 12, 18, 0.9)";
    roundRect(ctx, 88, 40, 80, 150, 16);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = style.color;
    roundRect(ctx, 98, 54, 60, 116, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(10, 12, 18, 0.55)";
    for (const y of [70, 92, 114, 136]) ctx.fillRect(106, y, 44, 8);
    texture.update();
    return texture;
  }
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  // Contorno escuro: lê bem tanto no escuro quanto na luz da lanterna.
  ctx.lineWidth = 18;
  ctx.strokeStyle = "rgba(10, 12, 18, 0.85)";
  ctx.strokeText(style.text, 128, 138);
  ctx.fillStyle = style.color;
  ctx.fillText(style.text, 128, 138);
  texture.update();
  return texture;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
