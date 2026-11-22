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
const OFF_LEVEL = 0.06;
const ON_TIME = [0.3, 2.6];
const OFF_TIME = [0.03, 0.16];
const BURST_CHANCE = 0.45;

function between(range: number[]): number {
  return range[0] + Math.random() * (range[1] - range[0]);
}

export class Lamp {
  private readonly light: PointLight;
  private readonly bulbMaterial: StandardMaterial;
  private readonly intensity: number;
  private readonly flicker: boolean;
  private on = true;
  private timer = 0;

  constructor(scene: Scene, data: LampData, intensity: number, name: string) {
    this.intensity = intensity;
    this.flicker = data.flicker ?? false;
    this.light = new PointLight(name, new Vector3(data.x, data.y, LAMP_Z), scene);
    this.light.diffuse = LAMP_COLOR;
    this.light.specular = Color3.Black();
    this.light.intensity = intensity;
    this.light.range = LAMP_RANGE;

    const bulb = CreateSphere(`${name}-bulb`, { diameter: 0.18 }, scene);
    bulb.position.set(data.x, data.y, LAMP_Z);
    this.bulbMaterial = new StandardMaterial(`${name}-mat`, scene);
    this.bulbMaterial.emissiveColor = LAMP_COLOR;
    this.bulbMaterial.disableLighting = true;
    bulb.material = this.bulbMaterial;
    this.timer = between(ON_TIME);
  }

  update(dt: number): void {
    if (!this.flicker) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.on = !this.on;
    if (this.on) {
      this.timer = Math.random() < BURST_CHANCE ? between(OFF_TIME) : between(ON_TIME);
    } else {
      this.timer = between(OFF_TIME);
    }
    const level = this.on ? 1 : OFF_LEVEL;
    this.light.intensity = this.intensity * level;
    this.bulbMaterial.emissiveColor = LAMP_COLOR.scale(level);
  }
}
