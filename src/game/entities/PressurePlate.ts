import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { PlateData } from "../../levels/types";
import type { MaterialLibrary } from "../MaterialLibrary";
import type { Box } from "./Box";

const PLATE_THICKNESS = 0.04;
const PRESS_TOLERANCE = 0.15;
const PRESSED_SINK = 0.025;
/** Espessura do estrado de madeira do contrapeso (o topo fica na mesma altura da faixa do sensor). */
const PALLET_THICKNESS = 0.14;
const LED_IDLE = new Color3(0.9, 0.12, 0.06);
const LED_ON = new Color3(0.15, 0.95, 0.3);
const ROPE = 0.025;

/**
 * Ponto onde a caixa precisa ficar para abrir uma porta. No prédio real isso é um sensor de portão automático
 * (faixa no piso e uma coluna com o olho do sensor, LED vermelho/verde) ou, na zeladoria, um contrapeso:
 * um estrado pendurado por cordas que, com o peso da caixa, puxa a porta pela roldana do teto.
 */
export class PressurePlate {
  readonly door: number;
  private readonly data: PlateData;
  readonly mesh: Mesh;
  private readonly restY: number;
  private readonly led: StandardMaterial | null = null;
  private readonly ropes: Mesh[] = [];
  pressed = false;

  constructor(scene: Scene, data: PlateData, depth: number, materials: MaterialLibrary, name: string) {
    this.data = data;
    this.door = data.door;
    const counterweight = data.tipo === "contrapeso";
    const thickness = counterweight ? PALLET_THICKNESS : PLATE_THICKNESS;
    this.restY = data.y + PLATE_THICKNESS - thickness / 2;
    this.mesh = CreateBox(name, { width: data.width - 0.1, height: thickness, depth: depth * 0.6 }, scene);
    this.mesh.position.set(data.x, this.restY, 0);
    this.mesh.material = materials.get(counterweight ? "madeira" : "listrado");
    this.mesh.isPickable = false;

    if (counterweight) {
      this.buildCounterweight(scene, data, depth, materials, name);
      return;
    }
    // Coluna do sensor ao lado da faixa, no fundo da passagem.
    const postX = data.x + data.width / 2 + 0.25;
    const postZ = depth * 0.3 + 0.15;
    const floorY = data.y + PLATE_THICKNESS + PRESSED_SINK;
    const post = CreateCylinder(`${name}-coluna`, { diameter: 0.08, height: 1.0, tessellation: 10 }, scene);
    post.position.set(postX, floorY + 0.5, postZ);
    post.material = materials.get("metal");
    const head = CreateBox(`${name}-sensor`, { width: 0.16, height: 0.2, depth: 0.12 }, scene);
    head.position.set(postX, floorY + 1.05, postZ);
    head.material = materials.get("metal");
    const led = CreateSphere(`${name}-led`, { diameter: 0.05, segments: 6 }, scene);
    led.position.set(postX - 0.09, floorY + 1.08, postZ - 0.04);
    const ledMaterial = new StandardMaterial(`${name}-led-mat`, scene);
    ledMaterial.disableLighting = true;
    ledMaterial.emissiveColor = LED_IDLE.clone();
    led.material = ledMaterial;
    this.led = ledMaterial;
    for (const mesh of [post, head, led]) {
      mesh.isPickable = false;
      mesh.freezeWorldMatrix();
    }
  }

  private buildCounterweight(scene: Scene, data: PlateData, depth: number, materials: MaterialLibrary, name: string): void {
    const top = data.topo ?? data.y + 3;
    const ropeMaterial = materials.get("tecido");
    const pulleyY = top - 0.2;
    for (const dz of [-depth * 0.22, depth * 0.22]) {
      const rope = CreateCylinder(`${name}-corda`, { diameter: ROPE, height: 1, tessellation: 6 }, scene);
      rope.position.set(this.data.x, 0, dz);
      rope.material = ropeMaterial;
      rope.isPickable = false;
      this.ropes.push(rope);
    }
    this.layoutRopes();
    // Roldana no teto e a corda que vai até a porta.
    const pulley = CreateCylinder(`${name}-roldana`, { diameter: 0.3, height: 0.08, tessellation: 16 }, scene);
    pulley.rotation.x = Math.PI / 2;
    pulley.position.set(data.x, pulleyY, 0);
    pulley.material = materials.get("metal");
    if (data.portaX !== undefined) {
      const span = Math.abs(data.portaX - data.x);
      const run = CreateCylinder(`${name}-corda-porta`, { diameter: ROPE, height: span, tessellation: 6 }, scene);
      run.rotation.z = Math.PI / 2;
      run.position.set((data.x + data.portaX) / 2, pulleyY + 0.12, 0);
      run.material = ropeMaterial;
      const pulley2 = pulley.clone(`${name}-roldana-porta`);
      pulley2.position.set(data.portaX, pulleyY, 0);
      for (const mesh of [run, pulley2]) mesh.isPickable = false;
    }
    pulley.isPickable = false;
  }

  /** Cordas do estrado até a roldana, acompanhando a altura do estrado. */
  private layoutRopes(): void {
    if (this.ropes.length === 0) return;
    const top = (this.data.topo ?? this.data.y + 3) - 0.2;
    const bottom = this.mesh.position.y;
    for (const rope of this.ropes) {
      rope.scaling.y = top - bottom;
      rope.position.y = (top + bottom) / 2;
    }
  }

  update(boxes: readonly Box[]): boolean {
    const pressed = boxes.some((box) => {
      const p = box.mesh.position;
      const onTop = Math.abs(p.x - this.data.x) < this.data.width / 2;
      return onTop && p.y - box.halfSize < this.data.y + PRESS_TOLERANCE;
    });
    this.mesh.position.y = this.restY - (pressed ? PRESSED_SINK : 0);
    if (pressed !== this.pressed) {
      this.led?.emissiveColor.copyFrom(pressed ? LED_ON : LED_IDLE);
      this.layoutRopes();
    }
    this.pressed = pressed;
    return pressed;
  }
}
