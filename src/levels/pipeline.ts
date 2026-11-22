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

export interface LevelData {
  spawn: { x: number; y: number };
  depth: number;
  ground: BlockData;
  walls: BlockData[];
  platforms: BlockData[];
  boxes: BoxData[];
}

export const pipelineLevel: LevelData = {
  spawn: { x: -8, y: 1 },
  depth: 4,
  ground: { x: 0, y: -0.5, width: 40, height: 1 },
  walls: [
    { x: -20.5, y: 3, width: 1, height: 8 },
    { x: 20.5, y: 3, width: 1, height: 8 },
  ],
  platforms: [
    { x: 7, y: 1, width: 3, height: 0.4 },
    { x: 11, y: 2.2, width: 3, height: 0.4 },
  ],
  boxes: [{ x: -3, y: 0.5, size: 1, mass: 20 }],
};
