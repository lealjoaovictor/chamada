import type { LevelData } from "./types";

export const pipelineLevel: LevelData = {
  checkpoints: [
    { x: -8, y: 1.2 },
    { x: 5, y: 1.2 },
  ],
  killY: -5,
  bounds: { minX: -21, maxX: 21 },
  depth: 4,
  ground: [
    { x: -3.5, y: -0.5, width: 33, height: 1 },
    { x: 17.5, y: -0.5, width: 5, height: 1 },
  ],
  walls: [
    { x: -20.5, y: 3, width: 1, height: 8 },
    { x: 20.5, y: 3, width: 1, height: 8 },
  ],
  platforms: [
    { x: 7, y: 1, width: 3, height: 0.4 },
    { x: 11, y: 2.2, width: 3, height: 0.4 },
  ],
  obstacles: [{ x: 2, y: 1.7, width: 1.5, height: 1.2 }],
  ramps: [],
  boxes: [{ x: -3, y: 0.5, size: 1, mass: 20 }],
  lamps: [
    { x: -3, y: 3.2 },
    { x: 9, y: 4 },
  ],
  decor: [],
};
