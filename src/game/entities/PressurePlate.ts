import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { PlateData } from "../../levels/types";
import type { Box } from "./Box";

const PLATE_THICKNESS = 0.04;
const PRESS_TOLERANCE = 0.15;
const PRESSED_SINK = 0.025;

export class PressurePlate {
  readonly door: number;
  private readonly data: PlateData;
  readonly mesh;
  pressed = false;

  constructor(scene: Scene, data: PlateData, depth: number, material: StandardMaterial, name: string) {
    this.data = data;
    this.door = data.door;
    this.mesh = CreateBox(name, { width: data.width - 0.1, height: PLATE_THICKNESS, depth: depth * 0.6 }, scene);
    this.mesh.position.set(data.x, data.y + PLATE_THICKNESS / 2, 0);
    this.mesh.material = material;
    this.mesh.isPickable = false;
  }

  update(boxes: readonly Box[]): boolean {
    const pressed = boxes.some((box) => {
      const p = box.mesh.position;
      const onTop = Math.abs(p.x - this.data.x) < this.data.width / 2;
      return onTop && p.y - box.halfSize < this.data.y + PRESS_TOLERANCE;
    });
    this.mesh.position.y = this.data.y + PLATE_THICKNESS / 2 - (pressed ? PRESSED_SINK : 0);
    this.pressed = pressed;
    return pressed;
  }
}
