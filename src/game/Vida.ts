import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import "@babylonjs/core/Particles/particleSystemComponent";
import type { Scene } from "@babylonjs/core/scene";
import type { LifeData } from "../levels/types";

/**
 * Vida no cenário de fora, sempre lenta e longe do que importa ao jogo:
 * janelas do fundo que acendem e apagam, uma TV piscando azul, luzes de antena pulsando e folhas levadas pelo vento.
 * Nada disso é luz de verdade; só cor e partículas pequenas.
 */
const BACKGROUND_Z = 6;
const WINDOW_MIN_WAIT = 12;
const WINDOW_MAX_WAIT = 40;
const WINDOW_OFF_CHANCE = 0.35;
const BEACON_PERIOD = 2.2;
const LEAF_CAPACITY = 24;

interface Toggle {
  mesh: AbstractMesh;
  timer: number;
}

export class Life {
  private readonly toggles: Toggle[] = [];
  private readonly tvs: StandardMaterial[] = [];
  private beacon: StandardMaterial | null = null;
  private readonly beaconBase = new Color3();
  private time = 0;
  private seed = 11;

  constructor(scene: Scene, zones: LifeData[]) {
    if (zones.length === 0) return;
    const inZone = (x: number): boolean => zones.some((z) => x >= z.minX && x <= z.maxX);
    // Janelas acesas do fundo (z alto): cada uma alterna sozinha, em tempos diferentes.
    for (const mesh of scene.meshes) {
      if (mesh.material?.name !== "mat-janela-acesa") continue;
      const p = mesh.getAbsolutePosition();
      if (p.z < BACKGROUND_Z || !inZone(p.x)) continue;
      this.toggles.push({ mesh, timer: this.wait() });
    }
    // Luz vermelha das antenas: o material é um só, então pulsar ele pulsa todas.
    const beacon = scene.getMaterialByName("mat-sinal");
    if (beacon instanceof StandardMaterial) {
      this.beacon = beacon;
      this.beaconBase.copyFrom(beacon.emissiveColor);
    }
    for (const zone of zones) {
      for (const tv of zone.tvs ?? []) this.tvs.push(this.createTv(scene, tv));
      if (zone.folhas) this.createLeaves(scene, zone);
    }
  }

  update(dt: number): void {
    this.time += dt;
    for (const toggle of this.toggles) {
      toggle.timer -= dt;
      if (toggle.timer > 0) continue;
      toggle.timer = this.wait();
      toggle.mesh.isVisible = toggle.mesh.isVisible ? this.random() > WINDOW_OFF_CHANCE : true;
    }
    if (this.beacon) {
      // Acende e apaga devagar, como balizamento de prédio.
      const k = 0.15 + 0.85 * Math.max(0, Math.sin((this.time / BEACON_PERIOD) * Math.PI * 2)) ** 2;
      this.beacon.emissiveColor.copyFrom(this.beaconBase).scaleInPlace(k);
    }
    // TV: troca de brilho e de tom em cortes, como cenas de um filme.
    for (let i = 0; i < this.tvs.length; i++) {
      const cut = Math.floor(this.time * 2.3 + i * 7);
      const v = 0.25 + 0.55 * this.hash(cut);
      const blue = 0.75 + 0.25 * this.hash(cut + 101);
      this.tvs[i].emissiveColor.set(v * 0.55, v * 0.7, v * blue);
    }
  }

  private createTv(scene: Scene, tv: { x: number; y: number; z: number }): StandardMaterial {
    const plane = CreatePlane(`tv-${tv.x}`, { width: 1.6, height: 1.6 }, scene);
    plane.position.set(tv.x, tv.y, tv.z);
    const material = new StandardMaterial(`tv-${tv.x}-mat`, scene);
    material.disableLighting = true;
    material.emissiveColor = new Color3(0.2, 0.25, 0.4);
    plane.material = material;
    plane.isPickable = false;
    plane.freezeWorldMatrix();
    return material;
  }

  private createLeaves(scene: Scene, zone: LifeData): void {
    const system = new ParticleSystem(`folhas-${zone.minX}`, LEAF_CAPACITY, scene);
    system.particleTexture = leafTexture(scene);
    const width = zone.maxX - zone.minX;
    system.emitter = new Vector3(zone.minX + width / 2, 0.4, -1);
    system.minEmitBox = new Vector3(-width / 2, -0.35, -2.5);
    system.maxEmitBox = new Vector3(width / 2, 0.6, 2.5);
    // Vento da esquerda para a direita, folha caindo e subindo de leve.
    system.direction1 = new Vector3(0.9, -0.05, -0.1);
    system.direction2 = new Vector3(1.6, 0.25, 0.1);
    system.gravity = new Vector3(0, -0.15, 0);
    system.minEmitPower = 0.5;
    system.maxEmitPower = 1;
    system.minLifeTime = 3;
    system.maxLifeTime = 6;
    system.emitRate = 2.5;
    system.minSize = 0.07;
    system.maxSize = 0.13;
    system.minAngularSpeed = -4;
    system.maxAngularSpeed = 4;
    system.color1 = new Color4(0.45, 0.36, 0.2, 1);
    system.color2 = new Color4(0.32, 0.3, 0.14, 1);
    system.colorDead = new Color4(0.3, 0.25, 0.15, 0);
    system.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    system.preWarmCycles = 200;
    system.start();
  }

  private wait(): number {
    return WINDOW_MIN_WAIT + this.random() * (WINDOW_MAX_WAIT - WINDOW_MIN_WAIT);
  }

  private random(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  private hash(n: number): number {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
}

function leafTexture(scene: Scene): DynamicTexture {
  const size = 32;
  const texture = new DynamicTexture("folha", size, scene, false);
  const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2, size * 0.42, size * 0.2, 0.5, 0, Math.PI * 2);
  ctx.fill();
  texture.hasAlpha = true;
  texture.update();
  return texture;
}
