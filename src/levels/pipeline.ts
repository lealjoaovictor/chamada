export interface BlockData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoxData {
  x: number;
  y: number;
  size: number;
  mass: number;
}

export interface PointData {
  x: number;
  y: number;
}

export interface LevelData {
  checkpoints: PointData[];
  killY: number;
  bounds: { minX: number; maxX: number };
  depth: number;
  ground: BlockData[];
  walls: BlockData[];
  platforms: BlockData[];
  obstacles: BlockData[];
  boxes: BoxData[];
}

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
  boxes: [{ x: -3, y: 0.5, size: 1, mass: 20 }],
};
