import type { LevelData, MistData } from "./types";

/**
 * Faixas de neblina baixa do mundo: só as que a área declara em `neblina` (ao ar livre). Dentro da faculdade não há
 * neblina: o ar de dentro fica limpo na faixa de jogo e na dos seguranças.
 */
export function mistBands(level: LevelData): MistData[] {
  return level.neblina ?? [];
}

/** Força da neblina em `x`: a do trecho de ambiente que contém o ponto, ou `fallback`. */
export function mistStrengthAt(level: LevelData, x: number, fallback: number): number {
  return (level.ambiente ?? []).find((z) => x >= z.minX && x < z.maxX)?.neblina ?? fallback;
}

/** `x` está num trecho ao ar livre (os que mostram a cidade no horizonte)? */
export function isOutdoors(level: LevelData, x: number): boolean {
  return (level.cidade ?? []).some((c) => x >= c.minX && x <= c.maxX);
}
