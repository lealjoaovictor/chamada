import type { DecorData, RampData } from "./types";

// Escadas: por baixo são rampas escondidas (o personagem sobe e desce liso, sem tropeçar em quinas),
// por cima são degraus de verdade. As funções daqui dão os degraus visíveis e a altura do piso de cada
// degrau, que os pés usam para pisar certinho (FootIK).

export function isStair(ramp: RampData): boolean {
  return (ramp.steps ?? 0) > 0;
}

/** Altura do piso do degrau sob `x`, ou nulo fora da escada. Vale para escadas que sobem ou descem em X. */
export function treadHeight(stair: RampData, x: number): number | null {
  const steps = stair.steps ?? 0;
  if (steps <= 0) return null;
  const left = Math.min(stair.x0, stair.x1);
  const right = Math.max(stair.x0, stair.x1);
  if (x < left || x > right) return null;
  // Degrau 0 = o mais baixo; a rampa encosta na quina de trás de cada degrau.
  const run = (right - left) / steps;
  const low = Math.min(stair.y0, stair.y1);
  const rise = Math.abs(stair.y1 - stair.y0) / steps;
  const upToRight = (stair.x1 > stair.x0) === (stair.y1 > stair.y0);
  const fromLow = upToRight ? x - left : right - x;
  const index = Math.min(Math.floor(fromLow / run), steps - 1);
  return low + (index + 1) * rise;
}

/** Piso de degrau sob `x` na primeira escada que cobre esse ponto. */
export function treadHeightAt(stairs: readonly RampData[], x: number): number | null {
  for (const stair of stairs) {
    const y = treadHeight(stair, x);
    if (y !== null) return y;
  }
  return null;
}

/** Blocos dos degraus, do chão (ou um pouco abaixo do pé da escada) até o piso de cada um. */
export function stairSteps(stair: RampData, levelDepth: number): DecorData[] {
  const steps = stair.steps ?? 0;
  const left = Math.min(stair.x0, stair.x1);
  const right = Math.max(stair.x0, stair.x1);
  const run = (right - left) / steps;
  const low = Math.min(stair.y0, stair.y1);
  const bottom = low >= 0 ? 0 : low - 0.3;
  return Array.from({ length: steps }, (_, i): DecorData => {
    const x = left + run * (i + 0.5);
    const top = treadHeight(stair, x) ?? low;
    return {
      x,
      y: (top + bottom) / 2,
      z: stair.stepZ ?? 0,
      width: run,
      height: top - bottom,
      depth: stair.stepDepth ?? levelDepth,
      material: stair.material ?? "pedra",
    };
  });
}
