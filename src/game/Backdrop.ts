import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { Scene } from "@babylonjs/core/scene";

const DISTANCE = 70;
const WIDTH = 4000;
const BOTTOM = -40;
const TOP = 160;
const HORIZON_Y = 4;
const ZENITH_Y = 55;

/**
 * Céu atrás de tudo: degradê vertical do tom da névoa (no horizonte) até um azul quase preto no alto.
 * Dá profundidade às silhuetas dos prédios distantes em vez de um fundo chapado.
 */
export function createBackdrop(scene: Scene, centerX: number, horizon: Color3, zenith: Color3): void {
  const height = TOP - BOTTOM;
  const sky = CreateGround("ceu", { width: WIDTH, height, subdivisionsX: 1, subdivisionsY: 40 }, scene);
  sky.rotation.x = -Math.PI / 2;
  sky.position.set(centerX, BOTTOM + height / 2, DISTANCE);
  const positions = sky.getVerticesData(VertexBuffer.PositionKind) ?? [];
  const colors: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    // Depois de girar, o z local da malha vira a altura no mundo.
    const worldY = sky.position.y + positions[i + 2];
    const t = Math.min(1, Math.max(0, (worldY - HORIZON_Y) / (ZENITH_Y - HORIZON_Y)));
    const c = Color3.Lerp(horizon, zenith, Math.sqrt(t));
    colors.push(c.r, c.g, c.b, 1);
  }
  sky.setVerticesData(VertexBuffer.ColorKind, colors);
  const material = new StandardMaterial("ceu-mat", scene);
  material.disableLighting = true;
  material.emissiveColor = Color3.White();
  material.fogEnabled = false;
  material.backFaceCulling = false;
  sky.material = material;
  sky.isPickable = false;
  sky.infiniteDistance = false;
  sky.freezeWorldMatrix();
}
