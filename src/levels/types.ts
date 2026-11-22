export type MaterialName =
  | "pedra"
  | "concreto"
  | "asfalto"
  | "madeira"
  | "metal"
  | "listrado"
  | "janela"
  | "moldura"
  | "vegetacao"
  | "lixeira"
  | "caixa"
  | "parede"
  | "piso"
  | "tatil"
  | "vidro"
  | "carrinho";

export interface BlockData {
  x: number;
  y: number;
  width: number;
  height: number;
  material?: MaterialName;
}

export interface DecorData extends BlockData {
  z: number;
  depth: number;
  shape?: "box" | "sphere" | "cylinder" | "disc";
}

export interface RampData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  material?: MaterialName;
  hidden?: boolean;
}

export interface BoxData {
  x: number;
  y: number;
  size: number;
  mass: number;
  material?: MaterialName;
}

export interface PointData {
  x: number;
  y: number;
}

export interface LampData extends PointData {
  flicker?: boolean;
}

export interface PlateData {
  x: number;
  y: number;
  width: number;
  door: number;
}

export interface DoorData {
  x: number;
  y: number;
  width: number;
  height: number;
  openHeight: number;
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
  ramps: RampData[];
  boxes: BoxData[];
  lamps: LampData[];
  plates: PlateData[];
  doors: DoorData[];
  decor: DecorData[];
}
