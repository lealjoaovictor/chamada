import type { BlockData } from "../levels/types";

// Cobertura para a visão dos seguranças.
// O jogo é visto de lado: as estantes ficam numa faixa atrás do jogador (z > 0) e o segurança mais ao fundo.
// Para o jogador, "atrás da estante" é estar na mesma faixa de x que ela, mesmo que, em 3D, a estante fique
// um pouco mais ao fundo. Por isso cada obstáculo fora da faixa do jogador vira um volume de cobertura que
// vai da estante até a faixa do jogador: se a linha da lente até o ponto do corpo cruza esse volume, não vê.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CoverBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  /** Frente da estante de verdade (a cobertura vai além dela, até o plano do jogador). */
  frontZ?: number;
}

/** Quanto o corpo precisa estar "dentro" da largura da estante para contar como escondido (m, de cada lado). */
export const COVER_INSET = 0.15;
/** Obstáculos com o centro a mais que isso do plano do jogador são cobertura (não bloqueiam o caminho). */
const OFF_LANE = 0.5;
/** A cobertura avança um pouco à frente do plano do jogador, para os pontos do corpo ficarem dentro dela. */
const LANE_FRONT = 0.3;

export function coverFromBlocks(blocks: readonly BlockData[], depth: number): CoverBox[] {
  const covers: CoverBox[] = [];
  for (const block of blocks) {
    const z = block.z ?? 0;
    if (z < OFF_LANE) continue;
    const halfDepth = (block.depth ?? depth) / 2;
    covers.push({
      minX: block.x - block.width / 2 + COVER_INSET,
      maxX: block.x + block.width / 2 - COVER_INSET,
      minY: block.y - block.height / 2,
      maxY: block.y + block.height / 2,
      minZ: -LANE_FRONT,
      maxZ: z + halfDepth,
      frontZ: z - halfDepth,
    });
  }
  return covers;
}

/** Caixa real de cada obstáculo fora da faixa do jogador (corta o facho visível da lanterna). */
export function solidsFromBlocks(blocks: readonly BlockData[], depth: number, offLaneOnly = true): CoverBox[] {
  return blocks
    .filter((block) => !offLaneOnly || (block.z ?? 0) >= OFF_LANE)
    .map((block) => {
      const z = block.z ?? 0;
      const halfDepth = (block.depth ?? depth) / 2;
      return {
        minX: block.x - block.width / 2,
        maxX: block.x + block.width / 2,
        minY: block.y - block.height / 2,
        maxY: block.y + block.height / 2,
        minZ: z - halfDepth,
        maxZ: z + halfDepth,
      };
    });
}

/** O segmento de `from` até `to` passa por dentro da caixa? (teste de lajes) */
export function segmentHitsBox(from: Vec3, to: Vec3, box: CoverBox): boolean {
  let t0 = 0;
  let t1 = 1;
  const axes: [number, number, number, number][] = [
    [from.x, to.x - from.x, box.minX, box.maxX],
    [from.y, to.y - from.y, box.minY, box.maxY],
    [from.z, to.z - from.z, box.minZ, box.maxZ],
  ];
  for (const [start, delta, min, max] of axes) {
    if (Math.abs(delta) < 1e-9) {
      if (start < min || start > max) return false;
      continue;
    }
    let a = (min - start) / delta;
    let b = (max - start) / delta;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
}

/** O segurança na lente `lens` tem a visão do ponto bloqueada por alguma cobertura entre os dois? */
export function coverBlocks(lens: Vec3, point: Vec3, covers: readonly CoverBox[]): boolean {
  for (const box of covers) {
    // Só cobre quem está do outro lado: a lente precisa estar mais ao fundo que a frente da estante
    // (o braço do segurança pode chegar perto dela quando ele vira para a câmera).
    if (lens.z <= (box.frontZ ?? box.maxZ)) continue;
    if (segmentHitsBox(lens, point, box)) return true;
  }
  return false;
}
