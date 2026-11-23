import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateDisc } from "@babylonjs/core/Meshes/Builders/discBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import "@babylonjs/core/Particles/particleSystemComponent";
import type { Scene } from "@babylonjs/core/scene";
import type { LifeData } from "../levels/types";

/**
 * Vida no cenário, sempre lenta e longe do que importa ao jogo:
 * janelas do fundo que acendem e apagam, uma TV piscando azul, luzes de antena pulsando e folhas levadas pelo vento;
 * dentro dos prédios, um monitor esquecido ligado e relógios de parede andando.
 * Nada disso é luz de verdade; só cor e partículas pequenas.
 */
const BACKGROUND_Z = 6;
const WINDOW_MIN_WAIT = 12;
const WINDOW_MAX_WAIT = 40;
const WINDOW_OFF_CHANCE = 0.35;
const BEACON_PERIOD = 2.2;
const LEAF_CAPACITY = 24;
/** Hora em que o jogo começa nos relógios (21h52, perto do fim da última aula), em segundos. */
const CLOCK_START = (21 * 60 + 52) * 60;
const CLOCK_SIZE = 0.34;

interface Toggle {
  mesh: AbstractMesh;
  timer: number;
}

export class Life {
  private readonly toggles: Toggle[] = [];
  private readonly tvs: StandardMaterial[] = [];
  private readonly monitors: StandardMaterial[] = [];
  private readonly clocks: { hour: TransformNode; minute: TransformNode; second: TransformNode }[] = [];
  private readonly beacons: { material: StandardMaterial; base: Color3; phase: number }[] = [];
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
    // Luz vermelha das antenas (as de perto e as do horizonte): um material por grupo, então pulsar ele pulsa todas.
    // O horizonte pulsa fora de fase, para não piscar tudo junto.
    for (const material of scene.materials) {
      if (!(material instanceof StandardMaterial)) continue;
      if (material.name === "mat-sinal") this.beacons.push({ material, base: material.emissiveColor.clone(), phase: 0 });
      if (material.name === "cidade-antenas-mat") this.beacons.push({ material, base: material.emissiveColor.clone(), phase: 0.4 });
    }
    for (const zone of zones) {
      for (const tv of zone.tvs ?? []) this.tvs.push(this.createTv(scene, tv));
      for (const monitor of zone.monitores ?? []) this.monitors.push(this.createMonitor(scene, monitor));
      for (const clock of zone.relogios ?? []) this.clocks.push(this.createClock(scene, clock));
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
    for (const beacon of this.beacons) {
      // Acende e apaga devagar, como balizamento de prédio.
      const k = 0.15 + 0.85 * Math.max(0, Math.sin((this.time / BEACON_PERIOD + beacon.phase) * Math.PI * 2)) ** 2;
      beacon.material.emissiveColor.copyFrom(beacon.base).scaleInPlace(k);
    }
    // TV: troca de brilho e de tom em cortes, como cenas de um filme.
    for (let i = 0; i < this.tvs.length; i++) {
      const cut = Math.floor(this.time * 2.3 + i * 7);
      const v = 0.25 + 0.55 * this.hash(cut);
      const blue = 0.75 + 0.25 * this.hash(cut + 101);
      this.tvs[i].emissiveColor.set(v * 0.55, v * 0.7, v * blue);
    }
    // Monitor: proteção de tela que respira bem devagar, cada um no seu tempo.
    for (let i = 0; i < this.monitors.length; i++) {
      const k = 0.75 + 0.25 * Math.sin(this.time * 0.6 + i * 2.1);
      this.monitors[i].emissiveColor.set(0.3 * k, 0.42 * k, 0.55 * k);
    }
    // Relógios: o ponteiro dos segundos anda aos saltos; o de minutos e o de horas acompanham.
    const now = CLOCK_START + Math.floor(this.time);
    for (const clock of this.clocks) {
      clock.second.rotation.z = -((now % 60) / 60) * Math.PI * 2;
      clock.minute.rotation.z = -((now % 3600) / 3600) * Math.PI * 2;
      clock.hour.rotation.z = -((now % 43200) / 43200) * Math.PI * 2;
    }
  }

  private createTv(scene: Scene, tv: { x: number; y: number; z: number; largura?: number; altura?: number }): StandardMaterial {
    const plane = CreatePlane(`tv-${tv.x}`, { width: tv.largura ?? 1.6, height: tv.altura ?? 1.6 }, scene);
    plane.position.set(tv.x, tv.y, tv.z);
    const material = new StandardMaterial(`tv-${tv.x}-mat`, scene);
    material.disableLighting = true;
    material.emissiveColor = new Color3(0.2, 0.25, 0.4);
    plane.material = material;
    plane.isPickable = false;
    plane.freezeWorldMatrix();
    return material;
  }

  /** Monitor de tubo fino em cima da mesa, de frente para a câmera, com a tela acesa. */
  private createMonitor(scene: Scene, monitor: { x: number; y: number; z: number }): StandardMaterial {
    const body = new StandardMaterial(`monitor-${monitor.x}-corpo`, scene);
    body.diffuseColor = new Color3(0.1, 0.1, 0.11);
    body.specularColor = Color3.Black();
    const parts = [
      { w: 0.5, h: 0.34, d: 0.06, y: 0.3 },
      { w: 0.05, h: 0.12, d: 0.05, y: 0.07 },
      { w: 0.22, h: 0.02, d: 0.16, y: 0.01 },
    ];
    for (const [i, part] of parts.entries()) {
      const box = CreateBox(`monitor-${monitor.x}-${i}`, { width: part.w, height: part.h, depth: part.d }, scene);
      box.position.set(monitor.x, monitor.y + part.y, monitor.z);
      box.material = body;
      box.isPickable = false;
      box.receiveShadows = true;
      box.freezeWorldMatrix();
    }
    const screen = CreatePlane(`monitor-${monitor.x}-tela`, { width: 0.44, height: 0.28 }, scene);
    screen.position.set(monitor.x, monitor.y + 0.3, monitor.z - 0.031);
    const material = new StandardMaterial(`monitor-${monitor.x}-tela-mat`, scene);
    material.disableLighting = true;
    material.emissiveColor = new Color3(0.3, 0.42, 0.55);
    screen.material = material;
    screen.isPickable = false;
    screen.freezeWorldMatrix();
    return material;
  }

  /** Relógio redondo de parede: aro escuro, mostrador claro e três ponteiros que giram no centro. */
  private createClock(scene: Scene, clock: { x: number; y: number; z: number }) {
    const name = `relogio-${clock.x}`;
    const flat = (id: string, color: Color3): StandardMaterial => {
      const material = new StandardMaterial(`${name}-${id}`, scene);
      material.diffuseColor = color;
      material.specularColor = Color3.Black();
      return material;
    };
    const rim = CreateDisc(`${name}-aro`, { radius: CLOCK_SIZE / 2 + 0.025, tessellation: 32 }, scene);
    rim.position.set(clock.x, clock.y, clock.z - 0.01);
    rim.material = flat("aro", new Color3(0.08, 0.08, 0.09));
    const face = CreateDisc(`${name}-face`, { radius: CLOCK_SIZE / 2, tessellation: 32 }, scene);
    face.position.set(clock.x, clock.y, clock.z - 0.02);
    face.material = flat("face", new Color3(0.82, 0.8, 0.74));
    const ink = flat("tinta", new Color3(0.05, 0.05, 0.05));
    // Marcas das horas.
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      const r = CLOCK_SIZE / 2 - 0.025;
      const mark = CreatePlane(`${name}-marca-${h}`, { width: 0.012, height: h % 3 === 0 ? 0.035 : 0.02 }, scene);
      mark.position.set(clock.x + Math.sin(a) * r, clock.y + Math.cos(a) * r, clock.z - 0.025);
      mark.rotation.z = -a;
      mark.material = ink;
    }
    const hand = (id: string, length: number, width: number, material: StandardMaterial, dz: number): TransformNode => {
      const pivot = new TransformNode(`${name}-${id}`, scene);
      pivot.position.set(clock.x, clock.y, clock.z - dz);
      const blade = CreatePlane(`${name}-${id}-lamina`, { width, height: length + 0.02 }, scene);
      blade.parent = pivot;
      blade.position.y = length / 2 - 0.01;
      blade.material = material;
      return pivot;
    };
    const parts = {
      hour: hand("horas", 0.075, 0.016, ink, 0.03),
      minute: hand("minutos", 0.12, 0.011, ink, 0.034),
      second: hand("segundos", 0.13, 0.005, flat("segundos", new Color3(0.7, 0.1, 0.08)), 0.038),
    };
    for (const mesh of [rim, face]) {
      mesh.isPickable = false;
      mesh.receiveShadows = true;
      mesh.freezeWorldMatrix();
    }
    return parts;
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
