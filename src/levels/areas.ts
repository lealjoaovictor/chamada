import type { AreaData } from "./types";

// Onde começa cada área no mundo contínuo (mesmo X de `bounds.minX` de cada fase).
export const AREAS: AreaData[] = [
  { numero: 1, inicioX: -5 },
  { numero: 2, inicioX: 48 },
  { numero: 3, inicioX: 80 },
  { numero: 4, inicioX: 117 },
  { numero: 5, inicioX: 166 },
];

export function areaAt(x: number): number {
  let numero = AREAS[0].numero;
  for (const area of AREAS) if (x >= area.inicioX) numero = area.numero;
  return numero;
}
