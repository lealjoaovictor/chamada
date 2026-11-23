import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import type { ApronData, BlockData } from "../levels/types";
import type { MaterialLibrary } from "./MaterialLibrary";

/**
 * Primeiro plano dos interiores. A câmera fica 12 m à frente da faixa de jogo e o piso das salas termina 2 m à frente
 * do jogador, então a parte de baixo da tela mostrava a lateral da laje, os rebaixos das placas e o vazio. Aqui o piso
 * continua até sair do quadro (como a calçada no pátio), escurecendo em direção à câmera, e a borda do teto ganha
 * uma viga e uma faixa escura. Tudo só visual: sem colisão, sem luz nova, e nada fica acima da altura do piso.
 */

/** Até onde o piso vem (z): a borda de baixo do quadro cai em ~z −7 com o jogador no chão. */
const NEAR_Z = -8.6;
const THICKNESS = 0.3;
/**
 * Escuro do degradê, do lado da faixa de jogo (0) até a frente (1). A borda de baixo da tela fica por volta de 0,75:
 * o piso perto do jogador continua legível e escurece rápido, para o olho ficar na faixa do meio.
 */
const SHADE: [number, number][] = [[0, 0.22], [0.3, 0.6], [0.7, 0.9], [1, 0.95]];
/** Viga sob a borda do teto. */
const BEAM_HEIGHT = 0.32;
const BEAM_DEPTH = 0.3;
/** Faixa escura na laje acima do teto (a massa manchada que aparecia no alto da tela). */
const SLAB_SHADE = 3.6;

let shadeMaterial: StandardMaterial | undefined;

/** Textura de degradê preto: `stops` = pares (posição de 0 a 1, de cima para baixo; opacidade). */
function gradient(scene: Scene, name: string, stops: [number, number][], size = 256): DynamicTexture {
  const texture = new DynamicTexture(name, { width: 4, height: size }, scene, true);
  const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;
  const g = ctx.createLinearGradient(0, 0, 0, size);
  for (const [at, alpha] of stops) g.addColorStop(at, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, size);
  texture.hasAlpha = true;
  texture.update(true);
  return texture;
}

function darkOverlay(scene: Scene, name: string, texture: DynamicTexture): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.Black();
  material.specularColor = Color3.Black();
  material.disableLighting = true;
  material.opacityTexture = texture;
  material.transparencyMode = Material.MATERIAL_ALPHABLEND;
  material.zOffset = -2;
  return material;
}

/**
 * Monta os trechos de piso e, sobre eles, a viga e a faixa escura de cada teto (paredes horizontais finas de
 * `ceilings` que ficam sobre algum trecho).
 */
export function createForeground(scene: Scene, materials: MaterialLibrary, aprons: ApronData[], ceilings: BlockData[], depth: number): void {
  if (aprons.length === 0) return;
  const frontZ = -depth / 2;
  const apronDepth = frontZ - NEAR_Z;
  const floors: AbstractMesh[] = [];
  shadeMaterial ??= darkOverlay(scene, "primeiro-plano-sombra", gradient(scene, "primeiro-plano-degrade", SHADE));
  aprons.forEach((apron, i) => {
    const y1 = apron.y1 ?? apron.y0;
    const run = apron.x1 - apron.x0;
    const rise = y1 - apron.y0;
    const length = Math.hypot(run, rise);
    const angle = Math.atan2(rise, run);
    const floor = CreateBox(`primeiro-plano-${i}`, { width: length, height: THICKNESS, depth: apronDepth }, scene);
    floor.material = materials.get(apron.material ?? "piso");
    floor.rotation.z = angle;
    // O topo da peça fica na linha do piso (no meio da rampa, na altura média).
    const cx = (apron.x0 + apron.x1) / 2;
    const cy = (apron.y0 + y1) / 2;
    floor.position.set(cx + Math.sin(angle) * (THICKNESS / 2), cy - Math.cos(angle) * (THICKNESS / 2), (frontZ + NEAR_Z) / 2);
    floor.receiveShadows = true;
    floor.isPickable = false;
    floor.freezeWorldMatrix();
    floors.push(floor);
    // Degradê deitado sobre o piso: quase nada perto da faixa de jogo, quase preto na borda da tela.
    const shade = CreatePlane(`primeiro-plano-${i}-sombra`, { width: length, height: apronDepth }, scene);
    shade.parent = floor;
    shade.position.y = THICKNESS / 2 + 0.012;
    shade.rotation.x = Math.PI / 2;
    shade.material = shadeMaterial!;
    shade.isPickable = false;
  });
  // A lanterna dos seguranças não acende o primeiro plano: o facho é para a faixa de jogo, e uma mancha clara
  // perto da câmera puxava o olho para fora dela.
  for (const light of scene.lights) if (light instanceof SpotLight) light.excludedMeshes.push(...floors);

  const beamMaterial = materials.get("concreto");
  const slabShade = darkOverlay(scene, "laje-sombra", gradient(scene, "laje-degrade", [[0, 0.92], [1, 0.45]], 128));
  const covered = (x0: number, x1: number) => aprons.some((a) => x0 < a.x1 && x1 > a.x0);
  ceilings
    .filter((wall) => wall.width >= 2 && wall.height <= 0.6 && (wall.depth === undefined || wall.depth >= depth))
    .filter((wall) => covered(wall.x - wall.width / 2, wall.x + wall.width / 2))
    .forEach((wall, i) => {
      const bottom = wall.y - wall.height / 2;
      const beam = CreateBox(`viga-${i}`, { width: wall.width, height: BEAM_HEIGHT, depth: BEAM_DEPTH }, scene);
      beam.material = beamMaterial;
      beam.position.set(wall.x, bottom - BEAM_HEIGHT / 2 + 0.02, frontZ - 0.32 + BEAM_DEPTH / 2);
      beam.receiveShadows = true;
      beam.isPickable = false;
      beam.freezeWorldMatrix();
      // A laje do andar de cima (a parte escura no alto da tela) fica em z −2,3: escurece de cima para baixo.
      const slab = CreatePlane(`laje-${i}`, { width: wall.width, height: SLAB_SHADE }, scene);
      slab.material = slabShade;
      slab.position.set(wall.x, bottom + SLAB_SHADE / 2, frontZ - 0.34);
      slab.isPickable = false;
      slab.freezeWorldMatrix();
    });
}
