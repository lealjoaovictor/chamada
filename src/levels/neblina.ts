import type { LevelData, MistData } from "./types";

/** Altura da faixa que sai do piso de primeiro plano: cobre o pé da parede e some antes da metade dela. */
export const MIST_HEIGHT = 3.2;
/** A faixa fica logo à frente da parede do fundo (a parede dos interiores está em depth/2). */
export const MIST_BACK_OFFSET = 0.25;
/** A base desce um pouco abaixo do piso: o piso esconde a borda de baixo e não aparece linha reta no chão. */
export const MIST_SINK = 0.3;

/**
 * Faixas de neblina do mundo: uma atrás de cada trecho de piso de primeiro plano (interiores), mais as que a área
 * declara em `neblina` (área externa). Numa rampa ou escada, a faixa começa no ponto mais baixo e cresce o desnível.
 */
export function mistBands(level: LevelData): MistData[] {
  const z = level.depth / 2 - MIST_BACK_OFFSET;
  const fromFloor = (level.primeiroPlano ?? []).map((apron): MistData => {
    const y1 = apron.y1 ?? apron.y0;
    return { x0: apron.x0, x1: apron.x1, y: Math.min(apron.y0, y1) - MIST_SINK, z, altura: MIST_HEIGHT + Math.abs(y1 - apron.y0) };
  });
  return [...fromFloor, ...(level.neblina ?? [])];
}

/** Força da neblina em `x`: a do trecho de ambiente que contém o ponto, ou `fallback`. */
export function mistStrengthAt(level: LevelData, x: number, fallback: number): number {
  return (level.ambiente ?? []).find((z) => x >= z.minX && x < z.maxX)?.neblina ?? fallback;
}
