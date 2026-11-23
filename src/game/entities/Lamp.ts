import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Constants } from "@babylonjs/core/Engines/constants";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { LampData, LampTone } from "../../levels/types";

/** Cor de cada tipo de lâmpada (paleta "Clima da Chamada"): sódio #D4932F, fluorescente #C7D0CB, tubo velho #A2A067, sala #E2B47A. */
const TONE_COLORS: Record<LampTone, Color3> = {
  sodio: new Color3(1, 0.62, 0.2),
  fluorescente: new Color3(0.9, 1, 0.97),
  subsolo: new Color3(0.86, 1, 0.55),
  sala: new Color3(1, 0.76, 0.48),
};
const LAMP_RANGE = 9;
/** Intensidade de referência do cone visível (uma lâmpada com força 1). */
const BASE_INTENSITY = 3.6;
const LAMP_Z = 1.4;
const MOON_COLOR = new Color3(0.45, 0.58, 0.85);
const MOON_INTENSITY = 0.9;
const MOON_RANGE = 14;
const MOON_Z = -2.5;
const OFF_LEVEL = 0.06;
/** Cone de luz visível (poeira iluminada) abaixo de cada lâmpada. */
const CONE_ALPHA = 0.11;
const CONE_TOP = 0.22;
const CONE_SPREAD = 0.55;
const ON_TIME = [0.3, 2.6];
const OFF_TIME = [0.03, 0.16];
const BURST_CHANCE = 0.45;
const DARK_ON_TIME = [0.12, 0.4];
const DARK_OFF_TIME = [0.9, 2.2];
const DARK_OFF_LEVEL = 0;
const HUM_DISTANCE = 6;
const HUM_LEVEL = 0.6;
/** Luz de emergência (apagão do subsolo): vermelha e fraca, no lugar do tubo que apagou. */
const EMERGENCY_COLOR = new Color3(1, 0.08, 0.04);
const EMERGENCY_LEVEL = 0.45;

function between(range: number[]): number {
  return range[0] + Math.random() * (range[1] - range[0]);
}

export class Lamp {
  private readonly light: PointLight;
  private readonly bulbMaterial: StandardMaterial;
  private color: Color3;
  private readonly baseColor: Color3;
  private readonly startsDead: boolean;
  private readonly startsFlicker: boolean;
  private readonly startsDark: boolean;
  private coneMaterial: StandardMaterial | null = null;
  private readonly intensity: number;
  private flicker: boolean;
  private dark: boolean;
  private readonly x: number;
  private readonly diesWhenPassed: boolean;
  private readonly y: number;
  private readonly buzzes: boolean;
  private dead = false;
  private on = true;
  private timer = 0;
  private level = 1;
  /** Luz pintada no chão embaixo deste poste: acende e apaga junto com a lâmpada. */
  private readonly glows: StandardMaterial[] = [];

  constructor(scene: Scene, data: LampData, intensity: number, name: string) {
    const moon = data.moonlight ?? false;
    this.intensity = (moon ? MOON_INTENSITY : intensity) * (data.forca ?? 1);
    this.color = TONE_COLORS[data.tom ?? "fluorescente"];
    this.baseColor = this.color;
    this.flicker = (data.flicker ?? false) !== false;
    this.dark = data.flicker === "escuro";
    this.startsFlicker = this.flicker;
    this.startsDark = this.dark;
    this.startsDead = data.desligada ?? false;
    this.x = data.x;
    this.diesWhenPassed = data.diesWhenPassed ?? false;
    this.y = data.y;
    this.buzzes = data.zumbido ?? false;
    this.light = new PointLight(name, new Vector3(data.x, data.y, moon ? MOON_Z : LAMP_Z), scene);
    this.light.diffuse = moon ? MOON_COLOR : this.color;
    this.light.specular = Color3.Black();
    this.light.intensity = this.intensity;
    this.light.range = moon ? MOON_RANGE : LAMP_RANGE;

    this.bulbMaterial = new StandardMaterial(`${name}-mat`, scene);
    if (moon) return;
    const bulb = CreateSphere(`${name}-bulb`, { diameter: 0.18 }, scene);
    bulb.position.set(data.x, data.y, LAMP_Z);
    this.bulbMaterial.emissiveColor = this.color;
    this.bulbMaterial.disableLighting = true;
    bulb.material = this.bulbMaterial;
    this.createCone(scene, data, name);
    this.timer = between(ON_TIME);
    if (data.desligada) {
      this.dead = true;
      this.setLevel(0);
      this.bulbMaterial.emissiveColor = this.color.scale(0.04);
    }
  }

  get positionX(): number {
    return this.x;
  }

  /** Zumbido do reator (0 a 1) ouvido de (x, y): some com a distância e corta quando a lâmpada pisca. */
  humAt(x: number, y: number): number {
    if (!this.buzzes || this.dead) return 0;
    const distance = Math.hypot(x - this.x, (y - this.y) * 0.5);
    return this.level * Math.max(0, 1 - distance / HUM_DISTANCE) * HUM_LEVEL;
  }

  /** Passa a lâmpada para o modo escuro (quase sempre apagada). */
  makeDark(): void {
    this.flicker = true;
    this.dark = true;
    this.on = false;
    this.timer = 0.3;
    this.setLevel(0);
  }

  /** Apagão: a lâmpada morre de vez (o som de lâmpada queimando sai do `Soundscape`). */
  cut(): void {
    this.dead = true;
    this.setLevel(0);
  }

  /** Depois do apagão: acende a luz de emergência, vermelha e fraca. */
  emergency(): void {
    this.dead = true;
    this.color = EMERGENCY_COLOR;
    this.light.diffuse = EMERGENCY_COLOR.clone();
    this.setLevel(EMERGENCY_LEVEL);
    // A lâmpada em si brilha forte (é ela que o jogador vê no escuro); a poça pintada no chão era do tubo.
    this.bulbMaterial.emissiveColor = EMERGENCY_COLOR.clone();
    for (const glow of this.glows) glow.alpha = 0;
    // O cone de poeira é do tubo fluorescente: some com ele.
    if (this.coneMaterial) this.coneMaterial.emissiveColor = Color3.Black();
  }

  /** Volta ao estado do começo (o jogador foi pego e o apagão vai acontecer de novo). */
  restore(): void {
    this.color = this.baseColor;
    this.light.diffuse = this.baseColor;
    this.flicker = this.startsFlicker;
    this.dark = this.startsDark;
    this.dead = this.startsDead;
    this.on = true;
    this.timer = between(ON_TIME);
    this.setLevel(this.dead ? 0 : 1);
  }

  get isDead(): boolean {
    return this.dead;
  }

  update(dt: number, playerX: number): void {
    if (this.dead) return;
    if (this.diesWhenPassed && playerX > this.x) {
      this.dead = true;
      this.setLevel(0);
      return;
    }
    if (!this.flicker) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.on = !this.on;
    if (this.dark) {
      this.timer = between(this.on ? DARK_ON_TIME : DARK_OFF_TIME);
      this.setLevel(this.on ? 1 : DARK_OFF_LEVEL);
      return;
    }
    if (this.on) {
      this.timer = Math.random() < BURST_CHANCE ? between(OFF_TIME) : between(ON_TIME);
    } else {
      this.timer = between(OFF_TIME);
    }
    this.setLevel(this.on ? 1 : OFF_LEVEL);
  }

  /** Liga uma poça de luz pintada a esta lâmpada. */
  addGlow(material: StandardMaterial): void {
    this.glows.push(material);
    material.alpha = this.level;
  }

  private setLevel(level: number): void {
    this.level = level;
    for (const glow of this.glows) glow.alpha = level;
    this.light.intensity = this.intensity * level;
    this.bulbMaterial.emissiveColor = this.color.scale(level);
    if (this.coneMaterial) this.coneMaterial.emissiveColor = this.color.scale(level * (this.intensity / BASE_INTENSITY));
  }

  /** Tronco de cone aditivo, mais forte junto da lâmpada e sumindo até o chão. */
  private createCone(scene: Scene, data: LampData, name: string): void {
    const height = Math.max(1, data.y - 0.15);
    const cone = CreateCylinder(
      `${name}-cone`,
      { height, diameterTop: CONE_TOP, diameterBottom: CONE_TOP + height * CONE_SPREAD * 2, tessellation: 24, cap: 0 },
      scene,
    );
    cone.position.set(data.x, data.y - 0.15 - height / 2, LAMP_Z);
    const positions = cone.getVerticesData(VertexBuffer.PositionKind) ?? [];
    const colors: number[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      const t = (positions[i + 1] + height / 2) / height;
      const k = CONE_ALPHA * t * t * t;
      colors.push(k, k, k, 1);
    }
    cone.setVerticesData(VertexBuffer.ColorKind, colors);
    const material = new StandardMaterial(`${name}-cone-mat`, scene);
    material.disableLighting = true;
    material.emissiveColor = this.color.scale(this.intensity / BASE_INTENSITY);
    material.backFaceCulling = false;
    material.alpha = 0.999;
    material.alphaMode = Constants.ALPHA_ONEONE;
    material.disableDepthWrite = true;
    material.fogEnabled = false;
    cone.material = material;
    cone.isPickable = false;
    cone.freezeWorldMatrix();
    this.coneMaterial = material;
  }
}
