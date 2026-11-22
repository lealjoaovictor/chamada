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
  | "carrinho"
  | "livros"
  | "luar"
  | "quadro";

export type ModelName = "estante-1" | "estante-2" | "estante-3";

export interface BlockData {
  x: number;
  y: number;
  width: number;
  height: number;
  material?: MaterialName;
  z?: number;
  depth?: number;
  model?: ModelName;
}

export interface DecorData extends BlockData {
  id?: string;
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
  moonlight?: boolean;
  diesWhenPassed?: boolean;
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
  closeAfterX?: number;
}

export interface VigiaData {
  mode?: "patrulha" | "perseguicao";
  triggerX?: number;
  x0: number;
  x1: number;
  y: number;
  z: number;
  speed: number;
  pause: number;
  aimAhead: number;
  aimY: number;
  coneAngle: number;
  range: number;
}

export interface ElevatorData {
  x: number;
  width: number;
  bottomY: number;
  topY: number;
  buttonX: number;
  buttonY: number;
}

export interface FinalDoorData {
  x: number;
  floorY: number;
  height: number;
  depth: number;
  triggerX: number;
  walkToX: number;
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
  vigias: VigiaData[];
  elevators: ElevatorData[];
  finalDoor?: FinalDoorData;
  decor: DecorData[];
}

export type HintAction = "empurrar" | "deslizar" | "pular";

export interface HintData {
  zone: { minX: number; maxX: number };
  trigger: "tempo" | "encostado" | "mortes";
  glowAfter?: number;
  iconAfter?: number;
  deaths?: number;
  deathZone?: { minX: number; maxX: number };
  icon?: { action: HintAction; x: number; y: number; followBox?: number };
  glow?: { box?: number; plate?: number; elevator?: number };
  requires?: { platePressed?: number };
  doneWhen: { boxMoved?: number; platePressed?: number; elevatorCalled?: number; passedX?: number };
}

export interface CameraBeatData {
  triggerX: number;
  focusX: number;
  seconds: number;
}

export interface RattleData {
  meshId: string;
  minX: number;
  maxX: number;
  minFeetY: number;
}
