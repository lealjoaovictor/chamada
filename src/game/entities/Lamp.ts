import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { LampData } from "../../levels/types";

const LAMP_COLOR = new Color3(1, 0.72, 0.38);
const LAMP_RANGE = 9;
const LAMP_Z = 1.4;
const MOON_COLOR = new Color3(0.45, 0.58, 0.85);
const MOON_INTENSITY = 0.9;
const MOON_RANGE = 14;
const MOON_Z = -2.5;
const OFF_LEVEL = 0.06;
const ON_TIME = [0.3, 2.6];
const OFF_TIME = [0.03, 0.16];
const BURST_CHANCE = 0.45;
const DARK_ON_TIME = [0.12, 0.4];
const DARK_OFF_TIME = [0.9, 2.2];
const DARK_OFF_LEVEL = 0;

function between(range: number[]): number {
  return range[0] + Math.random() * (range[1] - range[0]);
}

export class Lamp {
  private readonly light: PointLight;
  private readonly bulbMaterial: StandardMaterial;
  private readonly intensity: number;
  private readonly flicker: boolean;
  private readonly dark: boolean;
  private readonly x: number;
  private readonly diesWhenPassed: boolean;
  private dead = false;
  private on = true;
  private timer = 0;

  constructor(scene: Scene, data: LampData, intensity: number, name: string) {
    const moon = data.moonlight ?? false;
    this.intensity = moon ? MOON_INTENSITY : intensity;
    this.flicker = (data.flicker ?? false) !== false;
    this.dark = data.flicker === "escuro";
    this.x = data.x;
    this.diesWhenPassed = data.diesWhenPassed ?? false;
    this.light = new PointLight(name, new Vector3(data.x, data.y, moon ? MOON_Z : LAMP_Z), scene);
    this.light.diffuse = moon ? MOON_COLOR : LAMP_COLOR;
    this.light.specular = Color3.Black();
    this.light.intensity = this.intensity;
    this.light.range = moon ? MOON_RANGE : LAMP_RANGE;

    this.bulbMaterial = new StandardMaterial(`${name}-mat`, scene);
    if (moon) return;
    const bulb = CreateSphere(`${name}-bulb`, { diameter: 0.18 }, scene);
    bulb.position.set(data.x, data.y, LAMP_Z);
    this.bulbMaterial.emissiveColor = LAMP_COLOR;
    this.bulbMaterial.disableLighting = true;
    bulb.material = this.bulbMaterial;
    this.timer = between(ON_TIME);
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

  private setLevel(level: number): void {
    this.light.intensity = this.intensity * level;
    this.bulbMaterial.emissiveColor = LAMP_COLOR.scale(level);
  }
}
