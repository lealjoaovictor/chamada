import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import "@babylonjs/core/Particles/particleSystemComponent";
import type { Scene } from "@babylonjs/core/scene";
import type { LampData } from "../levels/types";

const CAPACITY = 45;
const TEXTURE_SIZE = 32;
const WARM = new Color4(1, 0.82, 0.6, 0.5);
const MOON = new Color4(0.7, 0.8, 1, 0.4);

export function createDust(scene: Scene, lamps: readonly LampData[]): void {
  const texture = dotTexture(scene);
  lamps.forEach((lamp, i) => {
    const system = new ParticleSystem(`poeira-${i}`, CAPACITY, scene);
    system.particleTexture = texture;
    system.emitter = new Vector3(lamp.x, lamp.y - 1.4, lamp.moonlight ? 0.6 : 1.2);
    system.minEmitBox = new Vector3(-1.6, -1.2, -0.8);
    system.maxEmitBox = new Vector3(1.6, 1.2, 0.8);
    system.color1 = lamp.moonlight ? MOON : WARM;
    system.color2 = lamp.moonlight ? MOON : WARM;
    system.colorDead = new Color4(0, 0, 0, 0);
    system.minSize = 0.015;
    system.maxSize = 0.04;
    system.minLifeTime = 4;
    system.maxLifeTime = 8;
    system.emitRate = 7;
    system.direction1 = new Vector3(-0.06, -0.04, -0.03);
    system.direction2 = new Vector3(0.06, 0.05, 0.03);
    system.minEmitPower = 0.5;
    system.maxEmitPower = 1;
    system.updateSpeed = 0.01;
    system.blendMode = ParticleSystem.BLENDMODE_ADD;
    system.preWarmCycles = 400;
    system.start();
  });
}

function dotTexture(scene: Scene): DynamicTexture {
  const texture = new DynamicTexture("poeira-ponto", TEXTURE_SIZE, scene, false);
  const context = texture.getContext();
  const half = TEXTURE_SIZE / 2;
  const gradient = context.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  texture.hasAlpha = true;
  texture.update();
  return texture;
}
