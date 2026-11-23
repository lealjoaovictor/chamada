import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/**
 * Silhueta da cidade no horizonte, em três camadas (perspectiva atmosférica: quanto mais longe, mais clara).
 * Tudo é cor pronta, sem luz e sem névoa: não conta no limite de luzes da GPU e custa poucas chamadas de desenho
 * (uma malha com instâncias finas por camada para prédios, janelas e luzes de antena).
 */
interface Layer {
  z: number;
  /** Quanto a cor do prédio puxa para o brilho do horizonte (0 = céu alto, 1 = horizonte). */
  haze: number;
  minH: number;
  maxH: number;
  minW: number;
  maxW: number;
  gap: number;
  windowChance: number;
  windowWarmth: number;
}

const LAYERS: Layer[] = [
  { z: 58, haze: 0.75, minH: 14, maxH: 40, minW: 6, maxW: 14, gap: 4, windowChance: 0.025, windowWarmth: 0.35 },
  { z: 40, haze: 0.4, minH: 10, maxH: 26, minW: 7, maxW: 16, gap: 6, windowChance: 0.04, windowWarmth: 0.5 },
  { z: 27, haze: 0.1, minH: 6, maxH: 16, minW: 8, maxW: 18, gap: 8, windowChance: 0.06, windowWarmth: 0.7 },
];
const WARM = new Color3(0.95, 0.62, 0.3);
const ANTENNA = new Color3(0.8, 0.08, 0.05);
const GROUND_Y = -1;
const FLOOR = 3;
// Brilho de cidade: faixa alaranjada atrás das silhuetas, só neste trecho (o céu do resto do mundo não muda).
const GLOW_Z = 66;
const GLOW_BOTTOM = -10;
const GLOW_TOP = 45;
const GLOW_FADE_X = 30;

function rng(seed: number): () => number {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function flatMaterial(scene: Scene, name: string, color: Color3): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.disableLighting = true;
  material.emissiveColor = color;
  material.fogEnabled = false;
  material.freeze();
  return material;
}

function finish(mesh: Mesh, matrices: Matrix[]): void {
  if (matrices.length === 0) {
    mesh.dispose();
    return;
  }
  mesh.thinInstanceAdd(matrices);
  mesh.isPickable = false;
  mesh.alwaysSelectAsActiveMesh = true;
  mesh.freezeWorldMatrix();
}

function createGlow(scene: Scene, minX: number, maxX: number, glow: Color3): void {
  const width = maxX - minX + GLOW_FADE_X * 2;
  const height = GLOW_TOP - GLOW_BOTTOM;
  const plane = CreateGround("cidade-brilho", { width, height, subdivisionsX: 24, subdivisionsY: 16 }, scene);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set((minX + maxX) / 2, GLOW_BOTTOM + height / 2, GLOW_Z);
  const positions = plane.getVerticesData(VertexBuffer.PositionKind) ?? [];
  const colors: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = plane.position.x + positions[i];
    const y = plane.position.y + positions[i + 2];
    // Forte no horizonte, some para cima e nas pontas do trecho.
    const up = Math.min(1, Math.max(0, (y - 2) / 26));
    const edge = Math.min(1, Math.max(0, Math.min(x - (minX - GLOW_FADE_X), maxX + GLOW_FADE_X - x) / GLOW_FADE_X));
    const a = (1 - up) * (1 - up) * edge;
    colors.push(glow.r, glow.g, glow.b, a);
  }
  plane.setVerticesData(VertexBuffer.ColorKind, colors);
  plane.hasVertexAlpha = true;
  // Branco multiplicado pela cor de cada vértice; alfa < 1 liga a mistura com o céu atrás.
  const material = new StandardMaterial("cidade-brilho-mat", scene);
  material.disableLighting = true;
  material.emissiveColor = Color3.White();
  material.fogEnabled = false;
  material.backFaceCulling = false;
  material.alpha = 0.999;
  plane.material = material;
  plane.isPickable = false;
  plane.freezeWorldMatrix();
}

/** Cria o horizonte de cidade entre minX e maxX. `sky` é a cor do céu alto e `glow` a do brilho no horizonte. */
export function createSkyline(scene: Scene, minX: number, maxX: number, sky: Color3, glow: Color3, seed = 7): void {
  createGlow(scene, minX, maxX, glow);
  const rand = rng(seed);
  const red = CreateBox("cidade-antenas", { size: 1 }, scene);
  red.material = flatMaterial(scene, "cidade-antenas-mat", ANTENNA);
  const reds: Matrix[] = [];
  LAYERS.forEach((layer, li) => {
    const body = CreateBox(`cidade-${li}`, { size: 1 }, scene);
    body.material = flatMaterial(scene, `cidade-${li}-mat`, Color3.Lerp(sky, glow, layer.haze * 0.55));
    const win = CreatePlane(`cidade-janelas-${li}`, { size: 1 }, scene);
    win.material = flatMaterial(scene, `cidade-janelas-${li}-mat`, Color3.Lerp(glow, WARM, layer.windowWarmth));
    const bodies: Matrix[] = [];
    const wins: Matrix[] = [];
    // A câmera vê mais longe dos lados quanto mais fundo está a camada: estende para não aparecer a ponta.
    const span = (layer.z + 12) * 0.9;
    let x = minX - span;
    while (x < maxX + span) {
      const w = layer.minW + rand() * (layer.maxW - layer.minW);
      const h = layer.minH + rand() * (layer.maxH - layer.minH);
      const cx = x + w / 2;
      bodies.push(Matrix.Scaling(w, h, 4).multiply(Matrix.Translation(cx, GROUND_Y + h / 2, layer.z)));
      // Telhado: casa de máquinas ou caixa d'água; às vezes uma antena com luz vermelha.
      if (rand() < 0.55) {
        const rw = 1.5 + rand() * 2.5;
        const rh = 1.2 + rand() * 2;
        const rx = cx + (rand() - 0.5) * (w - rw);
        const roof = GROUND_Y + h;
        bodies.push(Matrix.Scaling(rw, rh, 3).multiply(Matrix.Translation(rx, roof + rh / 2, layer.z)));
        if (rand() < 0.35) {
          const ah = 3 + rand() * 5;
          bodies.push(Matrix.Scaling(0.15, ah, 0.15).multiply(Matrix.Translation(rx, roof + rh + ah / 2, layer.z)));
          reds.push(Matrix.Scaling(0.35, 0.35, 0.35).multiply(Matrix.Translation(rx, roof + rh + ah, layer.z - 0.2)));
        }
      }
      // Janelas acesas esparsas; às vezes um andar inteiro aceso.
      const cols = Math.max(1, Math.floor(w / 2.2));
      const rows = Math.floor((h - 2) / FLOOR);
      const litRow = rand() < 0.3 ? Math.floor(rand() * rows) : -1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() < layer.windowChance || (r === litRow && rand() < 0.6)) {
            const wx = x + (c + 0.5) * (w / cols);
            const wy = GROUND_Y + 2 + r * FLOOR;
            wins.push(Matrix.Scaling(0.9, 1.1, 1).multiply(Matrix.Translation(wx, wy, layer.z - 2.05)));
          }
        }
      }
      x += w + layer.gap * rand();
    }
    finish(body, bodies);
    finish(win, wins);
  });
  finish(red, reds);
}
