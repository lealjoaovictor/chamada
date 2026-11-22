import type { AreaData } from "./types";
import { WORLD } from "./world.ts";

// Onde começa cada área no mundo contínuo (calculado em `world.ts`).
export const AREAS: AreaData[] = WORLD.areas;

export function areaAt(x: number): number {
  let numero = AREAS[0].numero;
  for (const area of AREAS) if (x >= area.inicioX) numero = area.numero;
  return numero;
}
