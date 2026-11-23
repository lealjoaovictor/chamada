import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateTube } from "@babylonjs/core/Meshes/Builders/tubeBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { RailData, WireData } from "../levels/types";

const WIRE_SEGMENTS = 24;
const DEFAULT_THICKNESS = 0.025;
const RAIL_SPACING = 0.14;
const RAIL_BAR = 0.025;
const RAIL_TOP = 0.05;

/**
 * Fios elétricos e grades de ferro: linhas finas que atravessam os planos e são a forma mais barata de mostrar
 * profundidade. Quase pretos, recebem só a névoa (sem luz própria), então viram silhueta contra o fundo.
 */
function darkMaterial(scene: Scene, name: string, color: Color3): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.disableLighting = true;
  material.emissiveColor = color;
  material.freeze();
  return material;
}

/** Pontos de uma curva pendurada (parábola) entre a e b, descendo `sag` no meio. */
function hang(wire: WireData): Vector3[] {
  const a = new Vector3(...wire.a);
  const b = new Vector3(...wire.b);
  const points: Vector3[] = [];
  for (let i = 0; i <= WIRE_SEGMENTS; i++) {
    const t = i / WIRE_SEGMENTS;
    const p = Vector3.Lerp(a, b, t);
    p.y -= wire.sag * 4 * t * (1 - t);
    points.push(p);
  }
  return points;
}

export function createWires(scene: Scene, wires: WireData[]): void {
  if (wires.length === 0) return;
  const tubes = wires.map((wire, i) =>
    CreateTube(`fio-${i}`, { path: hang(wire), radius: (wire.thickness ?? DEFAULT_THICKNESS) / 2, tessellation: 4 }, scene),
  );
  const merged = Mesh.MergeMeshes(tubes, true, true);
  if (!merged) return;
  merged.name = "fios";
  // Um leve reflexo do sódio dos postes: preto puro some contra as fachadas escuras.
  merged.material = darkMaterial(scene, "fios-mat", new Color3(0.11, 0.085, 0.06));
  merged.isPickable = false;
  merged.freezeWorldMatrix();
}

export function createRails(scene: Scene, rails: RailData[]): void {
  if (rails.length === 0) return;
  const bar = CreateBox("grades", { size: 1 }, scene);
  bar.material = darkMaterial(scene, "grades-mat", new Color3(0.03, 0.03, 0.035));
  const matrices: Matrix[] = [];
  for (const rail of rails) {
    const length = rail.x1 - rail.x0;
    // Corrimão em cima e travessa embaixo; barras verticais a cada 14 cm.
    for (const y of [rail.height - RAIL_TOP / 2, 0.12]) {
      matrices.push(Matrix.Scaling(length, RAIL_TOP, RAIL_TOP).multiply(Matrix.Translation(rail.x0 + length / 2, y, rail.z)));
    }
    const count = Math.max(1, Math.floor(length / RAIL_SPACING));
    for (let i = 0; i <= count; i++) {
      const x = rail.x0 + (i * length) / count;
      matrices.push(Matrix.Scaling(RAIL_BAR, rail.height, RAIL_BAR).multiply(Matrix.Translation(x, rail.height / 2, rail.z)));
    }
  }
  bar.thinInstanceAdd(matrices);
  bar.isPickable = false;
  bar.freezeWorldMatrix();
}
