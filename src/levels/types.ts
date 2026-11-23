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
  | "janela-acesa" | "saida"
  | "sinal";

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
  /** Texto escrito a giz na face da frente (quadro-negro), em linhas separadas por "\n". */
  giz?: string;
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
  /** De cabeça para baixo: a base do modelo fica em cima, na altura `y`. */
  virada?: boolean;
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
  /**
   * Onde as mãos do jogador seguram ao empurrar (alça, borda): `y` = altura acima da base,
   * `x` = quanto para dentro da face encostada (negativo = alça para fora). Padrão: borda de cima.
   */
  pegada?: { y: number; x?: number };
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
  /** Tipo de lâmpada (cor real): sódio nos postes, fluorescente dentro, tubo velho no subsolo, luz quente da sala. */
  tom?: LampTone;
  /** Multiplica a intensidade padrão (o prédio apagando aos poucos). */
  forca?: number;
  /** Lâmpada desligada: a luminária aparece, mas não acende. */
  desligada?: boolean;
}

export type LampTone = "sodio" | "fluorescente" | "subsolo" | "sala";

/** Luz ambiente de um trecho: quanto sobra de luz geral e de que cor. */
export interface AmbientZone {
  minX: number;
  maxX: number;
  intensidade: number;
  cor: [number, number, number];
  /** Cor da névoa no trecho (ex.: brilho alaranjado de cidade à noite). Fora das zonas, vale a do visual. */
  nevoa?: [number, number, number];
}

export interface PlateData {
  x: number;
  y: number;
  width: number;
  door: number;
  /** "sensor" (padrão): sensor de portão automático. "contrapeso": estrado pendurado que puxa a porta por uma roldana. */
  tipo?: "sensor" | "contrapeso";
  /** Contrapeso: altura do teto (onde fica a roldana). */
  topo?: number;
  /** Contrapeso: x da porta puxada pela corda. */
  portaX?: number;
}

export interface DoorData {
  x: number;
  y: number;
  width: number;
  height: number;
  openHeight: number;
  closeAfterX?: number;
}

/**
 * O hábito do segurança (cada um tem o seu jeito de fazer a ronda):
 * - celular: na ronda, um trecho mexendo no celular (lanterna guardada) e o outro atento;
 * - futebol: sentado no posto, alterna entre vigiar a entrada e assistir ao jogo na TV (lado `tvLado`);
 * - cochilo: sentado, cochilando; barulho perto (pulo, deslize, caixa) ou encostar nele acorda.
 */
export type HabitoVigia = { tipo: "celular" } | { tipo: "futebol"; tvLado: 1 | -1 } | { tipo: "cochilo" };

export interface VigiaData {
  habito?: HabitoVigia;
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
  /** Segundos vendo o jogador até pegá-lo (padrão: `TUNING.reacao`). Menor = quem passa correndo na frente é pego. */
  reacao?: number;
  /** Perseguição: o segurança entra por uma porta na parede do fundo (em x0), em vez de surgir do nada. */
  porta?: { z: number; largura?: number; altura?: number };
}

export interface ElevatorData {
  x: number;
  width: number;
  bottomY: number;
  topY: number;
  buttonX: number;
  buttonY: number;
  /** Topo do poço (onde fica a viga e o cabo). */
  shaftTop?: number;
}

export interface FinalDoorData {
  x: number;
  floorY: number;
  height: number;
  depth: number;
  triggerX: number;
  walkToX: number;
}

/**
 * A sala de sempre, vazia: a aula mudou de lugar. Ao chegar na porta, o Zacarias entra, vê o quadro,
 * fala com o Davi pelo celular e segue para a sala nova (pela janela do fundo da sala).
 */
export interface SalaVaziaData {
  porta: FinalDoorData;
  /** Onde a câmera para para mostrar o quadro com o recado. */
  quadroX: number;
}

export interface LevelData {
  salaVazia?: SalaVaziaData;
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
  /** Luz ambiente por trecho (o prédio apagando aos poucos). Fora de todas, vale o padrão do visual. */
  ambiente?: AmbientZone[];
  /** Trechos ao ar livre com silhueta de cidade no horizonte. */
  cidade?: { minX: number; maxX: number }[];
  /** Fios elétricos (curva pendurada entre dois pontos). */
  fios?: WireData[];
  /** Grades baixas de ferro (barras verticais com corrimão), só decoração. */
  grades?: RailData[];
  /** Cartazes, pichação, placas, manchas, folhas e rachaduras (desenhados na hora de carregar). */
  adesivos?: StickerData[];
  /** Trechos com vida no fundo: janelas que acendem e apagam, TVs, antenas pulsando e folhas ao vento. */
  vida?: LifeData[];
  figurantes?: FiguranteData[];
  /** Silhuetas de outros alunos que somem quando o jogador se aproxima. */
  vultos?: VultoData[];
}

/** Pessoa parada em cena (professor e colega no final), feita com personagens do Mixamo. */
export interface FiguranteData {
  modelo: "personagem" | "vigia" | "professor" | "aluno";
  x: number;
  y: number;
  z: number;
  rotY?: number;
  pose: "em-pe" | "sentado";
  /** Quanto escurece a textura do personagem (1 = textura original). */
  tom: [number, number, number];
  segura?: "lista" | "celular";
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
  /** Mostra o segurança de ronda mais perto de `focusX`, onde ele estiver agora (a ronda não para). */
  seguranca?: boolean;
}

export interface RattleData {
  meshId: string;
  minX: number;
  maxX: number;
  minFeetY: number;
}

/** Quem fala: decide a voz (ElevenLabs ou provisória) e por onde o som passa. */
export type Voz = "professor" | "colega" | "aluno" | "aluna" | "zacarias" | "seguranca";

/** Uma fala gravada. `id` é o nome do arquivo em `public/audio/vozes/` (sem extensão). */
export interface Fala {
  id: string;
  voz: Voz;
  texto: string;
  /** Texto curto na tela da ligação (acessibilidade). Sem ele, a fala não tem legenda. */
  legenda?: string;
}

export interface CallEntryData {
  nome: string;
  presente: boolean;
  /** Voz de quem responde "presente". */
  voz: "aluno" | "aluna";
}

/** Uma pausa no meio da chamada, depois de um nome. */
export interface InterrupcaoData {
  depoisDe: string;
  duracao: number;
  falas: { em: number; fala: Fala }[];
  /** Comentário do colega, `em` segundos depois do começo da interrupção. */
  comentario: { em: number; fala: Fala };
}

/** Quando o colega fala: num instante fixo, no primeiro nome de uma letra ou logo antes do último nome. */
export type AncoraColega = { t: number } | { letra: string } | { antesDoAluno: true };

export interface CallData {
  aluno: string;
  /** Nome do contato na tela da ligação. */
  colegaNome: string;
  /** Falas do professor antes da chamada (fim da aula), com o instante de cada uma. */
  fimDaAula: { t: number; fala: Fala }[];
  /** Instante do primeiro nome. */
  inicio: number;
  turma: CallEntryData[];
  /** Tempo de cada nome com "presente", do nome ao próximo nome. */
  tempoComResposta: number;
  /** Tempo de cada falta: nome, silêncio, nome de novo, "Falta.". */
  tempoFalta: number;
  /** Quanto depois do nome vem o "presente". */
  atrasoPresente: number;
  /** Quanto depois do nome o professor repete o nome de quem faltou, e quando diz "Falta.". */
  atrasoRepete: number;
  atrasoFalta: number;
  interrupcoes: InterrupcaoData[];
  colega: { quando: AncoraColega; fala: Fala }[];
  /** Quanto depois do nome âncora (ou da interrupção) o colega fala. */
  atrasoComentario: number;
  /**
   * Sala 204 vazia: a conversa do Zacarias (ao vivo) com o Davi (no celular), uma fala depois da outra.
   * A chamada fica parada enquanto ela dura.
   */
  salaVazia: Fala[];
  /** O Davi enrolando o professor: a chamada para por `duracao` segundos enquanto essas falas tocam. */
  enrola: { duracao: number; falas: { em: number; fala: Fala }[] };
  falas: {
    nome: (indice: number, nome: string) => Fala;
    nomeAluno: Fala;
    presente: Fala[];
    falta: Fala[];
    eleChamou: Fala;
    salaChama: Fala;
    zacariasPresente: Fala;
    seguranca: {
      desconfia: Fala[];
      barulho: Fala[];
      pego: Fala[];
      persegue: Fala[];
      /** Futebol na TV: lance perigoso, gol, chance perdida e reclamação com o juiz. */
      lance: Fala[];
      gol: Fala[];
      perdeu: Fala[];
      reclama: Fala[];
      /** Cochilo: acorda assustado; não vê ninguém e volta a sentar. */
      acorda: Fala[];
      voltaDormir: Fala[];
    };
  };
  /** Força do sinal da ligação por área (1 a 5); no subsolo ela picota. */
  sinalPorArea: number[];
  /** Áreas em que a ligação picota e quase some. */
  picotaNasAreas: number[];
}

export interface AreaData {
  numero: number;
  inicioX: number;
}

/** Fio elétrico pendurado entre `a` e `b` (x, y, z), com a barriga no meio descendo `sag` metros. */
export interface WireData {
  a: [number, number, number];
  b: [number, number, number];
  sag: number;
  /** Espessura do fio (m). Mais grosso no primeiro plano, para não sumir na tela. */
  thickness?: number;
}

/** Grade baixa de ferro de x0 a x1, no plano z. */
export interface RailData {
  x0: number;
  x1: number;
  z: number;
  height: number;
}

/** Adesivo plano encostado numa parede (virado para a câmera) ou deitado no chão. */
export interface StickerData {
  kind: "cartaz" | "pichacao" | "placa" | "mancha" | "umidade" | "folhas" | "rachadura" | "sombra" | "pe-de-parede" | "luz" | "poca" | "reflexo";
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  /** Linhas de texto (cartaz: a primeira é o título). */
  text?: string[];
  /** Cor de fundo (cartaz, placa), da tinta (pichação) ou "r,g,b" da mancha. */
  color?: string;
  /** Cor do texto ou do contorno. */
  ink?: string;
  /** Giro em radianos (no plano da parede, ou em volta do eixo vertical quando no chão). */
  rot?: number;
  chao?: boolean;
  /** Brilho próprio (0 a 1), para placas iluminadas. */
  glow?: number;
  /** Força da sombra ou da poça de luz (0 a 1). */
  strength?: number;
}

export interface LifeData {
  minX: number;
  maxX: number;
  /** Folhas secas levadas pelo vento rente ao chão. */
  folhas?: boolean;
  /** Janelas com TV ligada (luz azul que muda em cortes). */
  tvs?: { x: number; y: number; z: number }[];
}
