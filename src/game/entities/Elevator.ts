import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { ElevatorData } from "../../levels/types";
import type { MaterialLibrary } from "../MaterialLibrary";

// Elevador de verdade: poço de concreto aberto na frente (corte, para ver a cabine), cabine de aço com lambri,
// porta de correr dupla em cada pavimento e botoeira na parede. O jogador para em frente à botoeira para chamar;
// a cabine desce pelo poço, abre a porta, ele entra, a porta fecha, sobe e abre na galeria.

const THICKNESS = 0.3;
const SPEED = 0.9;
/** Altura interna da cabine e do vão da porta. */
const CAB_HEIGHT = 2.4;
const DOOR_HEIGHT = 2.2;
/** Profundidade da cabine (eixo z) e do vão da porta. */
const CAB_DEPTH = 2.2;
const DOOR_GAP = 1.2;
const WALL = 0.25;
/** Plano da parede do fundo do poço (e da botoeira e dos mostradores). */
const BACK_Z = CAB_DEPTH / 2 + 0.35;
const DOOR_TIME = 0.9;
/** Pausa entre a porta fechar e o motor arrancar (e entre parar e abrir). */
const MOTOR_DELAY = 0.5;
const CALL_HOLD = 0.45;
const CALL_REACH = 0.45;
const RIDE_DELAY = 0.6;
const STILL_SPEED = 0.4;
const BUTTON_IDLE = new Color3(0.35, 0.3, 0.22);
const BUTTON_ACTIVE = new Color3(1, 0.62, 0.22);
const CAB_LIGHT = new Color3(1, 0.86, 0.66);

export interface Rider {
  x: number;
  feetY: number;
  topY: number;
  grounded: boolean;
}

type Stop = "bottom" | "top";
type State = "parado" | "abrindo" | "aberto" | "fechando" | "partindo" | "andando" | "chegando";

interface Landing {
  /** Plano da porta (x). */
  x: number;
  floorY: number;
  panels: Mesh[];
  cabPanels: Mesh[];
  indicator: DynamicTexture;
  shown: string;
}

export class Elevator {
  readonly mesh: Mesh;
  readonly button: Mesh;
  private readonly data: ElevatorData;
  private readonly body: PhysicsBody;
  private readonly roofBody: PhysicsBody;
  private readonly roof: Mesh;
  private readonly buttonMaterial: StandardMaterial;
  private readonly cable: Mesh;
  private readonly cabLight: PointLight;
  private readonly shaftTop: number;
  private readonly landings: Record<Stop, Landing>;
  private readonly target = new Vector3();
  private readonly rotation = Quaternion.Identity();
  private surface: number;
  private stop: Stop | null = "top";
  private goal: Stop = "top";
  private state: State = "parado";
  private door = 0;
  private timer = 0;
  private callTimer = 0;
  private rideTimer = 0;
  private lastX: number | null = null;
  private calledFlag = false;
  private arrivalCount = 0;

  constructor(scene: Scene, data: ElevatorData, materials: MaterialLibrary, name: string) {
    this.data = data;
    this.surface = data.topY;
    this.shaftTop = data.shaftTop ?? data.topY + CAB_HEIGHT + 1;
    const half = data.width / 2;
    const x0 = data.x - half;
    const x1 = data.x + half;

    const steel = new StandardMaterial(`${name}-aco`, scene);
    steel.diffuseColor = new Color3(0.5, 0.52, 0.55);
    steel.specularColor = new Color3(0.35, 0.35, 0.35);
    steel.specularPower = 24;
    const dark = materials.get("metal");
    const concrete = materials.get("concreto");
    const panel = materials.get("madeira");

    // Poço: parede do fundo, paredes laterais acima dos vãos e trilhos (fixos).
    const shaftHeight = this.shaftTop - data.bottomY;
    // A parede do fundo do poço se estende até a botoeira (térreo) e um pouco sobre a galeria.
    const backX0 = Math.min(data.buttonX - 0.6, x0 - 1);
    const backX1 = x1 + 1;
    const back = CreateBox(`${name}-poco-fundo`, { width: backX1 - backX0, height: shaftHeight, depth: 0.2 }, scene);
    back.position.set((backX0 + backX1) / 2, data.bottomY + shaftHeight / 2, BACK_Z);
    back.material = concrete;
    this.staticBox(scene, back, false);
    // Lado esquerdo: só acima da porta do térreo. Lado direito: só acima da porta da galeria (abaixo é o próprio piso).
    this.sideWall(scene, `${name}-poco-esq`, x0 - WALL / 2, data.bottomY + DOOR_HEIGHT, this.shaftTop, concrete);
    this.sideWall(scene, `${name}-poco-dir`, x1 + WALL / 2, data.topY + DOOR_HEIGHT, this.shaftTop, concrete);
    for (const z of [-1, 1]) {
      const rail = CreateBox(`${name}-trilho`, { width: 0.08, height: shaftHeight, depth: 0.08 }, scene);
      rail.position.set(data.x + z * (half - 0.25), data.bottomY + shaftHeight / 2, CAB_DEPTH / 2 + 0.2);
      rail.material = dark;
      rail.freezeWorldMatrix();
    }
    const beam = CreateBox(`${name}-viga`, { width: data.width + WALL * 2, height: 0.3, depth: CAB_DEPTH + 0.6 }, scene);
    beam.position.set(data.x, this.shaftTop - 0.15, 0);
    beam.material = dark;
    beam.freezeWorldMatrix();

    // Cabine (piso e teto têm corpo físico; o resto é visual e vai junto com o piso).
    this.mesh = CreateBox(name, { width: data.width, height: THICKNESS, depth: CAB_DEPTH }, scene);
    this.mesh.material = dark;
    this.mesh.position.set(data.x, data.topY - THICKNESS / 2, 0);
    const aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, scene);
    this.body = aggregate.body;
    this.body.setMotionType(PhysicsMotionType.ANIMATED);

    this.roof = CreateBox(`${name}-teto`, { width: data.width, height: 0.15, depth: CAB_DEPTH }, scene);
    this.roof.material = steel;
    this.roof.position.set(data.x, data.topY + CAB_HEIGHT + 0.075, 0);
    const roofAggregate = new PhysicsAggregate(this.roof, PhysicsShapeType.BOX, { mass: 0 }, scene);
    this.roofBody = roofAggregate.body;
    this.roofBody.setMotionType(PhysicsMotionType.ANIMATED);

    const cab = new TransformNode(`${name}-cabine`, scene);
    cab.parent = this.mesh;
    cab.position.y = THICKNESS / 2;
    const part = (id: string, w: number, h: number, d: number, x: number, y: number, z: number, material: StandardMaterial): Mesh => {
      const mesh = CreateBox(`${name}-${id}`, { width: w, height: h, depth: d }, scene);
      mesh.position.set(x, y, z);
      mesh.material = material;
      mesh.parent = cab;
      return mesh;
    };
    // Fundo de lambri com rodapé e corrimão de aço; colunas nos quatro cantos; faixa de luz no teto.
    part("fundo", data.width, CAB_HEIGHT, 0.06, 0, CAB_HEIGHT / 2, CAB_DEPTH / 2 - 0.03, panel);
    part("rodape", data.width, 0.15, 0.07, 0, 0.075, CAB_DEPTH / 2 - 0.06, steel);
    part("corrimao", data.width - 0.3, 0.05, 0.05, 0, 0.95, CAB_DEPTH / 2 - 0.16, steel);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        part(`coluna${sx}${sz}`, 0.08, CAB_HEIGHT, 0.08, sx * (half - 0.04), CAB_HEIGHT / 2, sz * (CAB_DEPTH / 2 - 0.04), steel);
      }
      // Lateral: painel de aço do canto até o vão da porta, dos dois lados do vão.
      for (const sz of [-1, 1]) {
        const w = (CAB_DEPTH - DOOR_GAP) / 2;
        part(`lateral${sx}${sz}`, 0.04, CAB_HEIGHT, w, sx * (half - 0.02), CAB_HEIGHT / 2, sz * (DOOR_GAP / 2 + w / 2), steel);
      }
      part(`verga${sx}`, 0.04, CAB_HEIGHT - DOOR_HEIGHT, DOOR_GAP, sx * (half - 0.02), (CAB_HEIGHT + DOOR_HEIGHT) / 2, 0, steel);
    }
    const lightMaterial = new StandardMaterial(`${name}-luz`, scene);
    lightMaterial.emissiveColor = CAB_LIGHT;
    lightMaterial.disableLighting = true;
    const strip = CreatePlane(`${name}-faixa`, { width: data.width - 0.5, height: 0.5 }, scene);
    strip.material = lightMaterial;
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, CAB_HEIGHT - 0.01, 0.2);
    strip.parent = cab;
    this.cabLight = new PointLight(`${name}-lampada`, new Vector3(0, CAB_HEIGHT - 0.25, -0.2), scene);
    this.cabLight.diffuse = CAB_LIGHT;
    this.cabLight.specular = CAB_LIGHT.scale(0.3);
    this.cabLight.intensity = 1.8;
    this.cabLight.range = 3.8;
    this.cabLight.parent = cab;

    // Cabo de aço do teto da cabine até a viga.
    this.cable = CreateCylinder(`${name}-cabo`, { diameter: 0.03, height: 1, tessellation: 6 }, scene);
    this.cable.material = dark;

    // Portas: em cada pavimento, duas folhas de pavimento (com corpo físico) e duas da cabine (visuais).
    const cabPanels = (sx: number): Mesh[] =>
      [-1, 1].map((sz) => part(`porta-cab${sx}${sz}`, 0.03, DOOR_HEIGHT, DOOR_GAP / 2, sx * (half - 0.07), DOOR_HEIGHT / 2, (sz * DOOR_GAP) / 4, steel));
    this.landings = {
      bottom: this.landing(scene, `${name}-terreo`, x0 - WALL / 2, data.bottomY, steel, dark, concrete, cabPanels(-1)),
      top: this.landing(scene, `${name}-galeria`, x1 + WALL / 2, data.topY, steel, dark, concrete, cabPanels(1)),
    };

    // Botoeira: espelho de aço na parede do fundo, com o botão redondo.
    const plate = CreateBox(`${name}-botoeira`, { width: 0.2, height: 0.36, depth: 0.04 }, scene);
    plate.position.set(data.buttonX, data.buttonY, BACK_Z - 0.12);
    plate.material = steel;
    plate.freezeWorldMatrix();
    const button = CreateCylinder(`${name}-botao`, { diameter: 0.09, height: 0.03, tessellation: 16 }, scene);
    button.rotation.x = Math.PI / 2;
    button.position.set(data.buttonX, data.buttonY + 0.05, BACK_Z - 0.15);
    this.button = button;
    this.buttonMaterial = new StandardMaterial(`${name}-botao-mat`, scene);
    this.buttonMaterial.emissiveColor = BUTTON_IDLE;
    this.buttonMaterial.disableLighting = true;
    button.material = this.buttonMaterial;

    this.reset();
  }

  private staticBox(scene: Scene, mesh: Mesh, collide: boolean): void {
    mesh.receiveShadows = true;
    if (collide) new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0 }, scene);
    mesh.freezeWorldMatrix();
  }

  private sideWall(scene: Scene, name: string, x: number, y0: number, y1: number, material: StandardMaterial): void {
    if (y1 <= y0) return;
    const wall = CreateBox(name, { width: WALL, height: y1 - y0, depth: CAB_DEPTH + 0.6 }, scene);
    wall.position.set(x, (y0 + y1) / 2, 0);
    wall.material = material;
    this.staticBox(scene, wall, true);
  }

  private landing(
    scene: Scene,
    name: string,
    x: number,
    floorY: number,
    steel: StandardMaterial,
    dark: StandardMaterial,
    concrete: StandardMaterial,
    cabPanels: Mesh[],
  ): Landing {
    const depth = CAB_DEPTH + 0.6;
    // Ombreiras de concreto dos dois lados do vão (as folhas abertas se escondem dentro delas).
    const jamb = (depth - DOOR_GAP) / 2;
    for (const sz of [-1, 1]) {
      const wall = CreateBox(`${name}-ombreira${sz}`, { width: WALL, height: DOOR_HEIGHT, depth: jamb }, scene);
      wall.position.set(x, floorY + DOOR_HEIGHT / 2, sz * (DOOR_GAP / 2 + jamb / 2));
      wall.material = concrete;
      this.staticBox(scene, wall, false);
    }
    // Batente de aço em volta do vão.
    const frame = (id: string, w: number, h: number, d: number, y: number, z: number): void => {
      const mesh = CreateBox(`${name}-${id}`, { width: w, height: h, depth: d }, scene);
      mesh.position.set(x, y, z);
      mesh.material = steel;
      mesh.freezeWorldMatrix();
    };
    for (const sz of [-1, 1]) frame(`batente${sz}`, WALL + 0.06, DOOR_HEIGHT, 0.06, floorY + DOOR_HEIGHT / 2, sz * (DOOR_GAP / 2 + 0.03));
    frame("verga", WALL + 0.06, 0.08, DOOR_GAP + 0.12, floorY + DOOR_HEIGHT + 0.04, 0);
    frame("soleira", WALL + 0.1, 0.02, DOOR_GAP, floorY + 0.01, 0);

    const panels = [-1, 1].map((sz) => {
      const leaf = CreateBox(`${name}-folha${sz}`, { width: 0.06, height: DOOR_HEIGHT, depth: DOOR_GAP / 2 }, scene);
      leaf.material = steel;
      leaf.position.set(x, floorY + DOOR_HEIGHT / 2, (sz * DOOR_GAP) / 4);
      const body = new PhysicsAggregate(leaf, PhysicsShapeType.BOX, { mass: 0 }, scene).body;
      body.setMotionType(PhysicsMotionType.ANIMATED);
      body.disablePreStep = false;
      return leaf;
    });

    // Mostrador do andar em cima da porta, virado para a câmera.
    const indicator = new DynamicTexture(`${name}-mostrador`, { width: 128, height: 64 }, scene, false);
    const screenMaterial = new StandardMaterial(`${name}-mostrador-mat`, scene);
    screenMaterial.emissiveTexture = indicator;
    screenMaterial.diffuseColor = Color3.Black();
    screenMaterial.disableLighting = true;
    const box = CreateBox(`${name}-mostrador-caixa`, { width: 0.5, height: 0.24, depth: 0.08 }, scene);
    box.position.set(x - 0.5 * Math.sign(this.data.x - x), floorY + DOOR_HEIGHT - 0.1, BACK_Z - 0.14);
    box.material = dark;
    box.freezeWorldMatrix();
    const screen = CreatePlane(`${name}-mostrador-tela`, { width: 0.44, height: 0.2 }, scene);
    screen.material = screenMaterial;
    screen.position.set(box.position.x, box.position.y, box.position.z - 0.041);
    screen.freezeWorldMatrix();

    return { x, floorY, panels, cabPanels, indicator, shown: "" };
  }

  update(dt: number, rider: Rider): void {
    const vx = this.lastX === null ? 0 : Math.abs(rider.x - this.lastX) / Math.max(dt, 1e-4);
    this.lastX = rider.x;
    const { data } = this;
    const half = data.width / 2;

    // Chamar: parado em frente à botoeira, no térreo.
    const atButton =
      Math.abs(rider.x - data.buttonX) < CALL_REACH && rider.grounded && Math.abs(rider.feetY - data.bottomY) < 0.4 && vx < STILL_SPEED;
    this.callTimer = atButton ? this.callTimer + dt : 0;
    if (this.callTimer >= CALL_HOLD && !this.calledFlag) {
      this.calledFlag = true;
      this.goal = "bottom";
    }

    const inside = Math.abs(rider.x - data.x) < half - 0.35 && rider.grounded && Math.abs(rider.feetY - this.surface) < 0.3;
    const inDoorway = this.stop !== null && Math.abs(rider.x - this.landings[this.stop].x) < 0.55 && Math.abs(rider.feetY - this.landings[this.stop].floorY) < 1;

    this.timer += dt;
    switch (this.state) {
      case "parado":
        if (this.stop !== this.goal) this.go("fechando");
        else if (this.calledFlag) this.go("abrindo");
        break;
      case "abrindo":
        this.door = Math.min(1, this.door + dt / DOOR_TIME);
        if (this.door >= 1) this.go("aberto");
        break;
      case "aberto":
        // Embaixo: o jogador entra e espera um instante; a cabine sobe.
        this.rideTimer = this.stop === "bottom" && inside ? this.rideTimer + dt : 0;
        if (this.rideTimer >= RIDE_DELAY) this.goal = "top";
        if (this.goal !== this.stop) this.go("fechando");
        break;
      case "fechando":
        if (inDoorway) {
          this.go("abrindo");
          break;
        }
        this.door = Math.max(0, this.door - dt / DOOR_TIME);
        if (this.door <= 0) this.go(this.stop === this.goal ? "parado" : "partindo");
        break;
      case "partindo":
        if (this.timer >= MOTOR_DELAY) {
          this.stop = null;
          this.go("andando");
        }
        break;
      case "andando": {
        const goalY = this.goal === "top" ? data.topY : data.bottomY;
        const delta = goalY - this.surface;
        // Embaixo da cabine descendo não há como ficar (a porta do térreo está fechada), mas por garantia não esmaga.
        const under = Math.abs(rider.x - data.x) < half && rider.topY < this.surface - THICKNESS && rider.feetY < this.surface;
        if (!(under && delta < 0)) this.surface += Math.sign(delta) * Math.min(Math.abs(delta), SPEED * dt);
        if (Math.abs(goalY - this.surface) < 0.001) {
          this.surface = goalY;
          this.stop = this.goal;
          this.arrivalCount++;
          this.go("chegando");
        }
        break;
      }
      case "chegando":
        if (this.timer >= MOTOR_DELAY) this.go("abrindo");
        break;
    }

    this.place();
    this.buttonMaterial.emissiveColor = this.calledFlag && !(this.stop === "bottom" && this.door > 0) ? BUTTON_ACTIVE : BUTTON_IDLE;
  }

  private go(state: State): void {
    this.state = state;
    this.timer = 0;
    this.rideTimer = 0;
  }

  private place(): void {
    const { data } = this;
    this.target.set(data.x, this.surface - THICKNESS / 2, 0);
    this.body.setTargetTransform(this.target, this.rotation);
    this.target.set(data.x, this.surface + CAB_HEIGHT + 0.075, 0);
    this.roofBody.setTargetTransform(this.target, this.rotation);

    const roofTop = this.surface + CAB_HEIGHT + 0.15;
    const length = Math.max(0.01, this.shaftTop - 0.3 - roofTop);
    this.cable.scaling.y = length;
    this.cable.position.set(data.x, roofTop + length / 2, 0.3);

    // Folhas: fechadas no meio do vão, abertas para dentro das ombreiras. Só abre a porta do andar onde a cabine está.
    const ease = this.door * this.door * (3 - 2 * this.door);
    for (const stop of ["bottom", "top"] as Stop[]) {
      const landing = this.landings[stop];
      const open = this.stop === stop ? ease : 0;
      landing.panels.forEach((leaf, i) => {
        const sz = i === 0 ? -1 : 1;
        leaf.position.z = sz * (DOOR_GAP / 4 + open * (DOOR_GAP / 2 - 0.02));
      });
      const cabOpen = this.stop === stop ? ease : 0;
      landing.cabPanels.forEach((leaf, i) => {
        const sz = i === 0 ? -1 : 1;
        leaf.position.z = sz * (DOOR_GAP / 4 + cabOpen * (DOOR_GAP / 2 - 0.04));
      });
      this.drawIndicator(landing);
    }
  }

  private drawIndicator(landing: Landing): void {
    const floor = this.surface < (this.data.bottomY + this.data.topY) / 2 ? "T" : "1";
    const arrow = this.state === "andando" ? (this.goal === "top" ? "▲" : "▼") : "";
    const text = `${arrow}${floor}`;
    if (landing.shown === text) return;
    landing.shown = text;
    landing.indicator.drawText(text, null, 50, "bold 44px monospace", "#ff8a2a", "#050302", true, true);
  }

  get moving(): boolean {
    return this.state === "andando";
  }

  get called(): boolean {
    return this.calledFlag;
  }

  /** Quanto a porta do andar atual está aberta (0 a 1) e para onde ela vai (+1 abrindo, -1 fechando). */
  get doorMotion(): number {
    return this.state === "abrindo" ? 1 : this.state === "fechando" ? -1 : 0;
  }

  /** Conta as chegadas, para o "plim". */
  get arrivals(): number {
    return this.arrivalCount;
  }

  reset(): void {
    this.surface = this.data.topY;
    this.stop = "top";
    this.goal = "top";
    this.door = 0;
    this.calledFlag = false;
    this.callTimer = 0;
    this.lastX = null;
    this.go("parado");
    this.place();
  }
}
