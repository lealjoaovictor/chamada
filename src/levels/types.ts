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
  | "quadro"
  | "papel"
  | "tecido"
  | "tela"
  | "interior"
  | "janela-acesa";

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
  /** Colisão sem visual (o visual vem de um modelo pronto em `props`). */
  hidden?: boolean;
}

export interface DecorData extends BlockData {
  id?: string;
  z: number;
  depth: number;
  shape?: "box" | "sphere" | "cylinder" | "disc";
}

/** Modelo pronto colocado no cenário (só visual; a colisão continua nos blocos). */
export interface PropData {
  model: string;
  /** Peças a usar: expressão regular com o nome inteiro das malhas (ex.: "wall_standard_standard_01|base_.*"). */
  part?: string;
  /** true = usa a origem do próprio modelo; padrão: centro da base (kits "modular_*" sempre usam a origem). */
  origin?: boolean;
  x: number;
  /** Altura onde a base do modelo encosta. */
  y: number;
  z: number;
  /** Rotação em graus em torno do eixo vertical. */
  rotY?: number;
  scale?: number;
  /** Escala uniforme para o modelo ficar com esta altura (m). */
  fitHeight?: number;
  /** Escala uniforme para o modelo ficar com esta largura em X antes de girar (m). */
  fitWidth?: number;
  /** Multiplicador por eixo depois da escala uniforme (usar pouco, para não deformar). */
  stretch?: [number, number, number];
  /** Projeta sombra na lanterna do Vigia. */
  shadow?: boolean;
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
  /** Modelos prontos usados como visual da caixa (o cubo segue como corpo físico). Posições relativas ao centro da base. */
  visual?: PropData[];
}

export interface PointData {
  x: number;
  y: number;
}

export interface LampData extends PointData {
  /** true = falha às vezes; "escuro" = quase sempre apagada, acende em lampejos curtos. */
  flicker?: boolean | "escuro";
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
  pauseMax?: number;
  startHeading?: 1 | -1;
  /** Perseguição elástica: acelera quando o jogador abre distância e alivia quando chega perto. */
  elastico?: { distancia: number; ganho: number; min: number; max: number };
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
  /** Modelos prontos (glTF) colocados só como visual. */
  props?: PropData[];
  /** Trechos em que o personagem anda agachado e devagar (furtividade). */
  furtivo?: { minX: number; maxX: number }[];
  /** Trechos em que a luz ambiente quase some: só as lâmpadas iluminam. */
  escuro?: { minX: number; maxX: number }[];
  /** Corredor que se repete: ao cruzar gatilhoX o jogador recua `recuo` metros; a cada volta apaga um grupo de lâmpadas (por X). */
  laco?: { gatilhoX: number; recuo: number; apagar: number[][] };
  /** Silhuetas de outros alunos que somem quando o jogador se aproxima. */
  vultos?: VultoData[];
}

export interface VultoData {
  x: number;
  y: number;
  z?: number;
  facing?: 1 | -1;
  /** Começa a andar quando o jogador se aproxima. */
  anda?: boolean;
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

export interface CallEntryData {
  nome: string;
  presente: boolean;
}

export interface CallData {
  aluno: string;
  entradas: CallEntryData[];
  inicio: number;
  tempoComResposta: number;
  tempoSemResposta: number;
  volumePorArea: number[];
  filtroPorArea: number[];
}

export interface AreaData {
  numero: number;
  inicioX: number;
}
