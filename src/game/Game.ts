import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Material } from "@babylonjs/core/Materials/material";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Input } from "./Input";
import { Physics } from "./Physics";
import { CAPSULE_HEIGHT, CAPSULE_RADIUS, Player } from "./Player";
import { CameraRig } from "./CameraRig";
import { PostFX, VISUAL } from "./PostFX";
import { Box } from "./entities/Box";
import { Door } from "./entities/Door";
import { Lamp } from "./entities/Lamp";
import { PressurePlate } from "./entities/PressurePlate";
import { Vigia } from "./entities/Vigia";
import { Figurante } from "./entities/Figurante";
import { Elevator } from "./entities/Elevator";
import { FinalDoor } from "./entities/FinalDoor";
import { Hints } from "./Hints";
import { Sfx } from "./Sfx";
import { coverFromBlocks, solidsFromBlocks } from "./sightCover";
import { createDust } from "./Dust";
import { Vultos } from "./entities/Vultos";
import { applyWorldUVs } from "./WorldUV";
import { Props } from "./Props";
import { Kit } from "./Kit";
import { createBackdrop } from "./Backdrop";
import { FresnelParameters } from "@babylonjs/core/Materials/fresnelParameters";
import { Soundscape } from "./Soundscape";
import { Checkpoints } from "./Checkpoints";
import { Fade } from "../ui/Fade";
import { EndScreen, LateScreen, MenuScreen, RoomCaption } from "../ui/Screens";
import { CallScreen } from "../ui/CallScreen";
import { CallClock } from "./CallClock";
import { Telemetry } from "./Telemetry";
import { CHAMADA } from "../levels/chamada";
import { AREAS, areaAt } from "../levels/areas";
import { TouchControls, touchMode } from "../ui/TouchControls";
import { GestureControls } from "../ui/GestureControls";
import { MaterialLibrary } from "./MaterialLibrary";
import type { BlockData, CameraBeatData, DecorData, LevelData, RampData } from "../levels/types";
import { pipelineLevel } from "../levels/pipeline";
import { gymLevel } from "../levels/gym";
import { TUNING } from "./Tuning";
import { WORLD, worldLevel } from "../levels/world";

const DARK_AMBIENT = 0.2;
const MAX_DT = 1 / 30;
const PUSH_REACH = 0.5;
const PUSH_GRACE = 0.2;
const DEATH_FADE_OUT = 0.25;
const DEATH_FADE_IN = 0.25;
const DOOR_CLEARANCE = 0.05;
const LIGHT_CULL_DISTANCE = 17;
const MAX_LIGHTS_PER_MATERIAL = 8;
// Blocos de uniforms que o material usa além das luzes (cena, malha, material e um de folga).
const NON_LIGHT_UNIFORM_BLOCKS = 4;

/** Quantas luzes cabem num material nesta placa de vídeo, pelo limite de blocos de uniforms do vertex shader. */
function lightBudget(engine: AbstractEngine): number {
  const gl = (engine as AbstractEngine & { _gl?: WebGL2RenderingContext })._gl;
  const blocks = gl && "MAX_VERTEX_UNIFORM_BLOCKS" in gl ? Number(gl.getParameter(gl.MAX_VERTEX_UNIFORM_BLOCKS)) : 0;
  if (!blocks) return MAX_LIGHTS_PER_MATERIAL;
  return Math.max(1, blocks - NON_LIGHT_UNIFORM_BLOCKS);
}
const WARMUP_STEP = 2;
const ARRIVAL_PAUSE = 0.6;
// Final bom: depois de o professor chamar, o jogador tem ~4 s para responder "presente" (contados do fim da fala).
const ANSWER_WINDOW = 4;
const ANSWER_EARLIEST = 0.5;
const CUT_AFTER_ANSWER = 1.3;
// Final ruim: o nome, o silêncio, "...ele chamou" e a caneta, depois escurece.
const LATE_HOLD = 6;
// Ser pego: a tela escurece devagar (dá tempo de ouvir o segurança) e o jogador volta ao checkpoint.
const CAUGHT_FADE_OUT = 0.7;
const CAUGHT_HOLD = 0.5;
const CAUGHT_FADE_IN = 0.4;
const SUSPICION_LINE_COOLDOWN = 6;
const GUARD_VOICE_RANGE = 22;
const MAX_CLOCK_STEP = 0.25;
const END_FADE = 1.5;
const END_SCREEN_DELAY = 0.6;
const RESTART_LOCK = 1.5;
const LIGHT_DEATH_COLOR = "#3a2306";
const DEFAULT_FADE_COLOR = "#000";
const RAMP_THICKNESS = 0.4;

type GameState = "menu" | "jogando" | "morto" | "chegada" | "fim" | "atrasado";

/** Camada que a câmera não desenha, mas o mapa de sombra da lanterna desenha. */
const SHADOW_ONLY_LAYER = 0x10000000;

export class Game {
  private readonly boxes: Box[] = [];
  private ambient: HemisphericLight | null = null;
  private darkZones: { minX: number; maxX: number }[] = [];
  private vultos: Vultos | null = null;
  private readonly lamps: Lamp[] = [];
  private readonly doors: Door[] = [];
  private readonly plates: PressurePlate[] = [];
  private readonly vigias: Vigia[] = [];
  /** Só no modo dev: os Vigias não veem o jogador (para tirar fotos das fases). */
  devInvisible = false;
  private readonly elevators: Elevator[] = [];
  private readonly obstacleMeshes: AbstractMesh[] = [];
  private readonly propShadowCasters: AbstractMesh[] = [];
  private readonly sightPoints = [new Vector3(), new Vector3(), new Vector3()];
  private warming = false;
  private finalDoor: FinalDoor | null = null;
  private arrivalTimer = 0;
  private readonly menu = new MenuScreen();
  private readonly endScreen = new EndScreen();
  private readonly lateScreen = new LateScreen();
  private endShownAt = -1;
  private readonly callScreen = new CallScreen("");
  private readonly roomCaption = new RoomCaption();
  private cutAt = -1;
  private answerFrom = 0;
  private answerUntil = 0;
  private fadeOut = DEATH_FADE_OUT;
  private fadeIn = DEATH_FADE_IN;
  private hold = 0;
  private readonly suspicionLineAt = new Map<Vigia, number>();
  private readonly wasSuspicious = new Map<Vigia, boolean>();
  /** Perseguições que já começaram (o segurança já gritou ao sair pela porta). */
  private readonly chasesAnnounced = new Set<Vigia>();
  private clock!: CallClock;
  private telemetry!: Telemetry;
  private startArea = 1;
  private audioPrimed = false;
  private hints!: Hints;
  private props!: Props;
  private kit!: Kit;
  private focusLock = false;
  private readonly sfx = new Sfx();
  private readonly soundscape = new Soundscape(this.sfx);
  private player!: Player;
  private cameraRig!: CameraRig;
  private checkpoints!: Checkpoints;
  private killY = -Infinity;
  private state: GameState = "menu";
  private level: LevelData = worldLevel;
  private gym = false;
  private deathTimer = 0;
  private respawned = false;
  private readonly fade = new Fade();
  private readonly scene: Scene;
  private readonly input = new Input();
  private pushTimer = 0;
  private pushGrip: Box | null = null;
  private pushDir = 0;
  private materials!: MaterialLibrary;

  private constructor(engine: AbstractEngine) {
    this.scene = new Scene(engine);
    const mode = touchMode();
    if (mode === "botoes") new TouchControls(this.input);
    else if (mode === "gestos") new GestureControls(this.input);
    const unlock = (): void => {
      this.sfx.unlock();
      if (this.clock && !this.audioPrimed) {
        this.audioPrimed = true;
        this.clock.primeSpeech();
      }
    };
    for (const type of ["pointerdown", "touchend", "keydown"]) window.addEventListener(type, unlock, { capture: true });
  }

  static async create(engine: AbstractEngine): Promise<Game> {
    const game = new Game(engine);
    const params = new URLSearchParams(location.search);
    const gym = params.has("gym");
    const debugLevel = params.get("fase") === "teste" || gym;
    const level = gym ? gymLevel : debugLevel ? pipelineLevel : worldLevel;
    game.level = level;
    game.gym = gym;
    const area = Number(params.get("area"));
    if (!debugLevel && Number.isInteger(area) && area >= 1 && area <= AREAS.length) game.startArea = area;
    game.callScreen.setContact(CHAMADA.colegaNome);
    game.clock = new CallClock(CHAMADA, game.sfx, game.callScreen);
    const clockStart = Number(params.get("chamada"));
    if (clockStart > 0) game.clock.setTime(clockStart);
    game.telemetry = new Telemetry(game.startArea);
    await Promise.all([game.load(level), game.sfx.load()]);
    await game.clock.load();
    if (params.get("telemetria") === "1") {
      (window as unknown as { chamadaDebug: () => unknown }).chamadaDebug = () => ({
        caixas: game.boxes.map((b) => [+b.mesh.position.x.toFixed(2), +b.mesh.position.y.toFixed(2)]),
        placas: game.plates.map((p) => p.pressed),
        portas: game.doors.map((d) => +d.bottom.toFixed(2)),
        vigias: game.vigias.map((v) => v.debugState),
      });
    }
    game.hints = debugLevel ? new Hints(game.scene, [], [], []) : new Hints(game.scene, WORLD.hints, WORLD.beats, WORLD.rattles);
    await game.warmUp(level.bounds.minX, level.bounds.maxX);
    if (gym && game.vigias[0]) {
      const { GymPanel } = await import("../dev/GymPanel");
      new GymPanel(game.vigias[0], game.clock, game.sfx);
    }
    if (import.meta.env.DEV) {
      // Só em desenvolvimento: teletransporte para capturas automáticas.
      (window as unknown as { chamadaTp: (x: number, y: number) => void }).chamadaTp = (x, y) => {
        // Pula os focos de câmera que ficaram para trás, senão a câmera volta para mostrá-los.
        while (game.hints.cameraBeat(x)) {
          /* consome */
        }
        game.player.respawn({ x, y });
        game.cameraRig.focus(x, 0);
        game.cameraRig.snap(x, y);
      };
      (window as unknown as { chamadaScene: Scene }).chamadaScene = game.scene;
      (window as unknown as { chamadaInvisivel: (on: boolean) => void }).chamadaInvisivel = (on) => (game.devInvisible = on);
      (window as unknown as { chamadaGame: Game }).chamadaGame = game;
    }
    return game;
  }

  render(): void {
    this.scene.render();
  }

  private async load(level: LevelData): Promise<void> {
    const scene = this.scene;
    await Physics.enable(scene);

    const light = new HemisphericLight("light", new Vector3(0.3, 1, -0.4), scene);
    this.ambient = light;
    this.darkZones = level.escuro ?? [];
    light.groundColor = new Color3(0.08, 0.08, 0.1);
    level.lamps.forEach((lamp, i) => this.lamps.push(new Lamp(scene, lamp, VISUAL.lampIntensity, `lamp-${i}`)));

    this.materials = new MaterialLibrary(scene);
    this.props = new Props(scene);
    await this.props.load([...level.obstacles, ...level.decor].flatMap((block) => (block.model ? [block.model] : [])));
    for (const [i, block] of [...level.ground, ...level.walls, ...level.platforms].entries()) {
      this.createStatic(block, level.depth, `solid-${i}`);
    }
    level.obstacles.forEach((block, i) => {
      const mesh = this.createStatic(block, level.depth, `obstacle-${i}`);
      // Obstáculos sem visual próprio (modelo pronto por cima, ou só colisão): a caixa de colisão continua
      // projetando sombra na lanterna, sem aparecer na câmera. Assim a estante bloqueia a luz inteira, como
      // bloqueia a visão do segurança (os modelos instanciados e com vãos entre os livros deixavam a luz passar).
      if (block.hidden || block.model) mesh.layerMask = SHADOW_ONLY_LAYER;
      this.obstacleMeshes.push(mesh);
      if (!block.model) return;
      const size = { width: block.width, height: block.height, depth: block.depth ?? level.depth };
      this.props.place(block, block.model, size);
    });
    level.ramps.forEach((ramp, i) => this.createRamp(ramp, level.depth, `ramp-${i}`));
    level.decor.forEach((decor, i) => {
      // Decoração com modelo: só o visual, sem colisão (não bloqueia o jogador nem a visão dos Vigias).
      if (decor.model) this.props.place(decor, decor.model, { width: decor.width, height: decor.height, depth: decor.depth });
      else this.createDecor(decor, `decor-${i}`);
    });
    this.kit = new Kit(scene);
    const kitModels = [
      ...(level.props ?? []).map((prop) => prop.model),
      ...level.boxes.flatMap((box) => (box.visual ?? []).map((prop) => prop.model)),
    ];
    await this.kit.load(kitModels);
    (level.props ?? []).forEach((prop, i) => {
      const root = this.kit.place(prop, `prop-${i}`);
      if (prop.shadow) this.propShadowCasters.push(...root.getChildMeshes());
    });
    level.doors.forEach((door, i) =>
      this.doors.push(new Door(scene, door, level.depth, this.materials.get("metal"), `door-${i}`)),
    );
    level.plates.forEach((plate, i) =>
      this.plates.push(new PressurePlate(scene, plate, level.depth, this.materials, `plate-${i}`)),
    );
    if (level.finalDoor) this.finalDoor = new FinalDoor(scene, level.finalDoor, this.materials.get("madeira"), "porta-final");
    level.elevators.forEach((elevator, i) =>
      this.elevators.push(new Elevator(scene, elevator, level.depth, this.materials.get("metal"), `elevator-${i}`)),
    );

    level.boxes.forEach((data, i) => {
      const box = new Box(scene, data, `box-${i}`, this.materials.get(data.material ?? "caixa"));
      if (data.visual) {
        // O cubo continua sendo o corpo físico; os modelos prontos vão junto, como visual.
        data.visual.forEach((prop, j) => {
          const visual = this.kit.place({ ...prop, y: prop.y - data.size / 2 }, `box-${i}-visual-${j}`);
          visual.parent = box.mesh;
          for (const child of visual.getChildMeshes()) child.unfreezeWorldMatrix();
        });
        box.mesh.isVisible = false;
      }
      this.boxes.push(box);
    });

    this.checkpoints = new Checkpoints(level.checkpoints);
    if (this.startArea > 1) this.checkpoints.jumpTo(this.checkpoints.indexBefore(AREAS[this.startArea - 1].inicioX));
    const checkpoint = Number(new URLSearchParams(location.search).get("checkpoint"));
    if (level === worldLevel && Number.isInteger(checkpoint) && checkpoint > 0) this.checkpoints.jumpTo(checkpoint);
    this.killY = level.killY;
    const spawn = this.checkpoints.current;
    this.player = await Player.create(scene, spawn);
    await Promise.all((level.figurantes ?? []).map((data, i) => Figurante.create(scene, data, `figurante-${i}`)));
    for (const data of level.vigias) {
      const vigia = await Vigia.create(scene, data);
      vigia.setCovers(
        coverFromBlocks(level.obstacles, level.depth),
        // Todos os obstáculos, o chão e as paredes cortam o facho (senão o cone atravessa barreiras e o piso).
        solidsFromBlocks([...level.obstacles, ...level.ground, ...level.walls], level.depth, false),
        // Portões sobem e descem: a caixa é lida a cada quadro, e o portão fechado barra a luz.
        () => this.doors.map((door) => door.occluder),
      );
      vigia.addShadowCasters([...this.obstacleMeshes, ...this.doors.map((door) => door.mesh), ...this.propShadowCasters, ...this.player.meshes, ...this.boxes.flatMap((box) => [box.mesh, ...box.mesh.getChildMeshes()])]);
      this.vigias.push(vigia);
    }
    this.cameraRig = new CameraRig(scene, { x: spawn.x, feetY: this.player.feetY }, level.bounds);
    PostFX.apply(scene, this.cameraRig.camera, light, VISUAL);
    createBackdrop(scene, (level.bounds.minX + level.bounds.maxX) / 2, VISUAL.background.scale(1.6), VISUAL.background.scale(0.3));
    this.applySurfaceUVs();
    this.vultos = await Vultos.create(scene, level.vultos ?? []);
    if (VISUAL.dust) createDust(scene, level.lamps);
    if (VISUAL.rim > 0) {
      const rim = new FresnelParameters({
        leftColor: new Color3(0.62, 0.72, 0.9).scale(VISUAL.rim),
        rightColor: Color3.Black(),
        power: 2.5,
        bias: 0.1,
      });
      for (const mesh of [...this.player.meshes, ...this.vigias.flatMap((vigia) => vigia.meshes)]) {
        if (mesh.material instanceof StandardMaterial) mesh.material.emissiveFresnelParameters = rim;
      }
    }

    // Cada luz ocupa um bloco de uniforms no shader. Placas que aceitam menos blocos (comum no Windows, onde o
    // navegador traduz o WebGL para DirectX) não compilam o material com luzes demais, e o carregamento travava
    // esperando um shader que nunca fica pronto. Por isso o limite de luzes por material segue o limite da placa.
    const lightCap = lightBudget(scene.getEngine());
    const capLights = (material: Material): void => {
      const lit = material as Material & { maxSimultaneousLights?: number };
      if (typeof lit.maxSimultaneousLights !== "number") return;
      if (material instanceof StandardMaterial) lit.maxSimultaneousLights = Math.min(MAX_LIGHTS_PER_MATERIAL, lightCap);
      else if (lit.maxSimultaneousLights > lightCap) lit.maxSimultaneousLights = lightCap;
    };
    scene.materials.forEach(capLights);
    scene.onNewMaterialAddedObservable.add(capLights);

    scene.onBeforeRenderObservable.add(() => this.update());
    scene.onAfterPhysicsObservable.add(() => {
      for (const box of this.boxes) box.lockToPlane();
    });
  }

  private async warmUp(minX: number, maxX: number): Promise<void> {
    this.warming = true;
    this.fade.set(1);
    const camera = this.cameraRig.camera;
    const startX = camera.position.x;
    await this.materials.whenTexturesReady();
    await this.kit.whenReady();
    for (let x = minX; x <= maxX + WARMUP_STEP; x += WARMUP_STEP) {
      camera.position.x = x;
      this.player.placeVisual(x, camera.position.y - 2.5);
      for (const vigia of this.vigias) vigia.placeVisual(x + 1, camera.position.y - 2.5);
      this.cullLights();
      this.scene.render();
      await this.scene.whenReadyAsync();
    }
    camera.position.x = startX;
    this.player.placeVisual(this.player.position.x, this.player.feetY);
    for (const vigia of this.vigias) vigia.reset();
    this.cullLights();
    this.fade.set(0);
    this.input.setAutopilot(0);
    this.input.consumeAnyPress();
    document.getElementById("carregando")?.remove();
    this.menu.show();
    this.warming = false;
  }

  private update(): void {
    if (this.warming) return;
    const realDt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, MAX_CLOCK_STEP);
    const dt = Math.min(realDt, MAX_DT);
    this.input.update();
    const area = areaAt(this.player.position.x);
    const running = this.state === "jogando" || this.state === "morto";
    this.clock.update(realDt, area, running, this.salaProximity(area));
    if (running) {
      this.telemetry.update(realDt, area, this.clock.calledCount, this.clock.schedule.total, this.player.position.x, this.player.feetY);
      if (this.clock.studentNameReached) this.late();
    }
    for (const lamp of this.lamps) lamp.update(dt, this.player.position.x);
    this.finalDoor?.update(dt);
    this.updateDoors(dt);
    for (const vigia of this.vigias) vigia.update(dt, this.player.position.x);
    this.announceChases();
    this.updateElevators(dt);
    if (this.state === "menu") {
      this.updateMenu(dt);
      this.input.endFrame();
      return;
    }
    if (this.state === "atrasado") {
      this.updateLate(dt);
      this.input.endFrame();
      return;
    }
    if (this.state === "chegada" || this.state === "fim") {
      this.updateArrival(dt);
      this.input.endFrame();
      return;
    }
    if (this.state === "morto") {
      this.updateDeath(dt);
      this.input.endFrame();
      return;
    }
    const dir = this.input.axisX();
    const pushed = this.pushedBox();
    if (pushed) {
      this.pushTimer = PUSH_GRACE;
      this.pushDir = dir;
      this.pushGrip = pushed;
    } else {
      this.pushTimer = dir === this.pushDir ? Math.max(0, this.pushTimer - dt) : 0;
    }
    const beat = this.hints.cameraBeat(this.player.position.x);
    if (beat) {
      this.cameraRig.focus(this.beatFocusX(beat), beat.seconds);
      this.focusLock = true;
      this.input.setAutopilot(0);
    } else if (this.focusLock && !this.cameraRig.focusing) {
      this.focusLock = false;
      this.input.setAutopilot(null);
    }
    const px = this.player.position.x;
    if (this.ambient) {
      const dark = this.darkZones.some((z) => px >= z.minX && px <= z.maxX);
      // O prédio apaga aos poucos: cada trecho tem quanto sobra de luz geral e de que cor.
      const zone = (this.level.ambiente ?? []).find((z) => px >= z.minX && px < z.maxX);
      const target = (zone?.intensidade ?? 1) * (dark ? DARK_AMBIENT : 1);
      const k = Math.min(1, dt * 1.5);
      this.ambient.intensity += (target - this.ambient.intensity) * k;
      if (zone) {
        const c = this.ambient.diffuse;
        c.r += (zone.cor[0] - c.r) * k;
        c.g += (zone.cor[1] - c.g) * k;
        c.b += (zone.cor[2] - c.b) * k;
      }
    }
    this.player.setCrouch((this.level.furtivo ?? []).some((f) => px >= f.minX && px <= f.maxX));
    this.player.setGrip(this.pushTimer > 0 ? this.gripPoint() : null);
    this.player.update(dt, this.input, this.pushTimer > 0);
    this.vultos?.update(dt, this.player.position.x);
    this.updateNoise();
    this.cameraRig.update(dt, {
      x: this.player.position.x,
      feetY: this.player.feetY,
      grounded: this.player.isGrounded,
      facing: this.player.facingDirection,
    });
    this.checkpoints.update(this.player.position.x);
    this.cullLights();
    this.hints.update(dt, this.hintWorld(), this.cameraRig.camera);
    this.soundscape.update(dt, this.soundState());
    const cause = this.player.position.y < this.killY ? "queda" : this.isSeen(dt);
    if (cause) this.die(cause);
    else if (this.finalDoor && this.player.position.x >= this.finalDoor.data.triggerX) this.arrive();
    this.input.endFrame();
  }

  private hintWorld() {
    const player = this.player;
    return {
      playerX: player.position.x,
      feetY: player.feetY,
      axis: this.input.axisX(),
      sliding: player.isSliding,
      grounded: player.isGrounded,
      boxOffset: (i: number) => this.boxes[i]?.offset ?? 0,
      boxTop: (i: number) => {
        const box = this.boxes[i];
        return box ? { x: box.mesh.position.x, y: box.mesh.position.y + box.halfSize } : { x: 0, y: 0 };
      },
      platePressed: (i: number) => this.plates[i]?.pressed ?? false,
      elevatorCalled: (i: number) => this.elevators[i]?.called ?? false,
      glowMesh: (target: "box" | "plate" | "elevator", i: number) => {
        if (target === "box") return this.boxes[i]?.mesh ?? null;
        if (target === "plate") return this.plates[i]?.mesh ?? null;
        return this.elevators[i]?.button ?? null;
      },
    };
  }

  private die(cause: "queda" | "luz" | "toque"): void {
    // Seguranças não matam: ser pego é ser levado para fora (volta ao checkpoint).
    const caught = cause !== "queda";
    this.fadeOut = caught ? CAUGHT_FADE_OUT : DEATH_FADE_OUT;
    this.fadeIn = caught ? CAUGHT_FADE_IN : DEATH_FADE_IN;
    this.hold = caught ? CAUGHT_HOLD : 0;
    if (caught) this.clock.guard("pego");
    this.hints.registerDeath(this.player.position.x);
    this.telemetry.death(areaAt(this.player.position.x), cause, this.player.position.x);
    if (cause === "queda") this.soundscape.death(cause);
    else this.soundscape.caught(cause);
    this.soundscape.forget();
    this.fade.setColor(cause === "luz" ? LIGHT_DEATH_COLOR : DEFAULT_FADE_COLOR);
    this.state = "morto";
    this.deathTimer = 0;
    this.respawned = false;
  }

  private updateMenu(dt: number): void {
    this.player.update(dt, this.input, false);
    this.cullLights();
    if (!this.input.consumeAnyPress()) return;
    this.menu.hide();
    this.sfx.unlock();
    this.clock.start();
    this.input.setAutopilot(null);
    if (!this.gym) document.body.style.cursor = "none";
    this.state = "jogando";
  }

  // Final ruim: o nome do aluno foi chamado antes de ele chegar.
  private late(): void {
    this.state = "atrasado";
    this.arrivalTimer = 0;
    this.endShownAt = -1;
    this.input.setAutopilot(0);
    this.fade.setColor(DEFAULT_FADE_COLOR);
    this.clock.badEnding();
    this.telemetry.finish("ruim");
  }

  private updateLate(dt: number): void {
    this.arrivalTimer += dt;
    if (this.arrivalTimer > LATE_HOLD + END_FADE) this.clock.silence();
    this.fade.set(Math.min(Math.max((this.arrivalTimer - LATE_HOLD) / END_FADE, 0), 1));
    this.updateEndScreen(this.lateScreen, LATE_HOLD + END_FADE + END_SCREEN_DELAY);
    this.player.update(dt, this.input, false);
    this.cullLights();
  }

  private arrive(): void {
    this.state = "chegada";
    this.arrivalTimer = 0;
    this.input.setAutopilot(0);
    this.finalDoor?.open();
  }

  private soundState() {
    return {
      playerX: this.player.position.x,
      playerY: this.player.position.y,
      moving: this.input.axisX() !== 0,
      grounded: this.player.isGrounded,
      sliding: this.player.isSliding,
      pushing: this.pushTimer > 0,
      plates: this.plates.map((plate) => plate.pressed),
      doorBottoms: this.doors.map((door) => door.bottom),
      elevatorsMoving: this.elevators.map((elevator) => elevator.moving),
      elevatorsCalled: this.elevators.map((elevator) => elevator.called),
      lampsDead: this.lamps.map((lamp) => lamp.isDead),
      vigias: this.vigias.map((vigia) => ({
        x: vigia.positionX,
        walking: vigia.walking,
        chases: vigia.chases,
        shown: vigia.shown,
        suspicious: vigia.suspicious,
      })),
      finalDoorOpen: this.finalDoor?.isOpening ?? false,
      lockedDoorTouched: this.hints.touchingLocked,
    };
  }

  private updateArrival(dt: number): void {
    this.arrivalTimer += dt;
    this.soundscape.update(dt, this.soundState());
    const target = this.finalDoor?.data.walkToX ?? this.player.position.x;
    if (this.state === "chegada") {
      const walking = this.arrivalTimer > ARRIVAL_PAUSE && this.player.position.x < target;
      this.input.setAutopilot(walking ? 1 : 0);
      if (this.arrivalTimer > ARRIVAL_PAUSE && !walking) {
        // O professor ergue os olhos e chama o nome fora da ordem.
        this.state = "fim";
        this.arrivalTimer = 0;
        this.cutAt = -1;
        this.endShownAt = -1;
        const duration = this.clock.goodEnding();
        this.answerFrom = Math.min(ANSWER_EARLIEST, duration);
        this.answerUntil = duration + ANSWER_WINDOW;
        this.roomCaption.show(CHAMADA.falas.salaChama.texto, duration + 1);
        this.input.consumeAnyPress();
        this.telemetry.finish("bom");
      }
    } else if (this.cutAt < 0) {
      // Qualquer botão: "presente". Sem resposta em ~4 s, corta em silêncio.
      const pressed = this.input.consumeAnyPress();
      if (this.arrivalTimer >= this.answerFrom && pressed) {
        this.clock.answer();
        this.roomCaption.show(CHAMADA.falas.zacariasPresente.texto, CUT_AFTER_ANSWER);
        this.cutAt = this.arrivalTimer + CUT_AFTER_ANSWER;
      } else if (this.arrivalTimer > this.answerUntil) {
        this.cutAt = this.arrivalTimer;
      }
    } else if (this.arrivalTimer >= this.cutAt) {
      // Corte seco para preto.
      this.fade.set(1);
      this.roomCaption.hide();
      this.clock.silence();
      this.updateEndScreen(this.endScreen, this.cutAt + END_FADE);
    }
    this.player.update(dt, this.input, false);
    this.cameraRig.update(dt, {
      x: this.player.position.x,
      feetY: this.player.feetY,
      grounded: this.player.isGrounded,
      facing: this.player.facingDirection,
    });
    this.cullLights();
  }

  private updateEndScreen(screen: EndScreen | LateScreen, showAt: number): void {
    if (this.endShownAt < 0) {
      if (this.arrivalTimer < showAt) return;
      this.endShownAt = this.arrivalTimer;
      this.input.consumeAnyPress();
      document.body.style.cursor = "";
      screen.show();
      return;
    }
    if (this.arrivalTimer - this.endShownAt < RESTART_LOCK) {
      this.input.consumeAnyPress();
      return;
    }
    if (this.input.consumeAnyPress()) location.reload();
  }

  private updateDeath(dt: number): void {
    this.deathTimer += dt;
    if (this.deathTimer < this.fadeOut) {
      this.fade.set(this.deathTimer / this.fadeOut);
      return;
    }
    if (!this.respawned) {
      this.respawned = true;
      const point = this.checkpoints.current;
      this.player.respawn(point);
      for (const box of this.boxes) box.reset();
      for (const door of this.doors) door.reset();
      for (const vigia of this.vigias) vigia.reset();
      this.chasesAnnounced.clear();
      for (const elevator of this.elevators) elevator.reset();
      this.cameraRig.snap(point.x, this.player.feetY);
      this.pushTimer = 0;
    }
    const t = Math.max(0, this.deathTimer - this.fadeOut - this.hold) / this.fadeIn;
    this.fade.set(1 - Math.min(t, 1));
    if (t >= 1) {
      this.state = "jogando";
      this.fade.setColor(DEFAULT_FADE_COLOR);
    }
  }

  /** Onde a câmera para num foco: um ponto fixo ou o segurança de ronda mais perto dele, onde ele estiver. */
  private beatFocusX(beat: CameraBeatData): number {
    if (!beat.seguranca) return beat.focusX;
    let best: Vigia | null = null;
    for (const vigia of this.vigias) {
      if (vigia.chases) continue;
      if (!best || Math.abs(vigia.positionX - beat.focusX) < Math.abs(best.positionX - beat.focusX)) best = vigia;
    }
    return best?.positionX ?? beat.focusX;
  }

  /** Na área 5, de 0 (começo do corredor) a 1 (porta da sala): a voz real do professor vai ficando mais alta. */
  private salaProximity(area: number): number {
    const door = this.finalDoor?.data.triggerX;
    const start = AREAS.find((a) => a.numero === area)?.inicioX;
    if (area !== AREAS[AREAS.length - 1].numero || door === undefined || start === undefined) return 0;
    return Math.min(Math.max((this.player.position.x - start) / (door - start), 0), 1);
  }

  /** Fala de um segurança, mais baixa quanto mais longe ele está. */
  /** Quando um segurança de perseguição aparece, ele grita antes de sair correndo. */
  private announceChases(): void {
    for (const vigia of this.vigias) {
      if (!vigia.chases || !vigia.shown || this.chasesAnnounced.has(vigia)) continue;
      this.chasesAnnounced.add(vigia);
      if (!this.warming) this.clock.guard("persegue", 1, true);
    }
  }

    private guardSays(vigia: Vigia, kind: "desconfia" | "barulho"): void {
    const distance = Math.abs(vigia.positionX - this.player.position.x);
    if (distance > GUARD_VOICE_RANGE) return;
    this.clock.guard(kind, 1 - 0.6 * (distance / GUARD_VOICE_RANGE));
  }

  // Caixa que cai com força faz barulho: os Vigias de patrulha por perto vão investigar.
  private updateNoise(): void {
    for (const box of this.boxes) {
      const impact = box.takeImpact();
      if (impact <= 0) continue;
      const p = box.mesh.position;
      this.sfx.play("aterrissar", { volume: Math.min(1, 0.4 + impact * 0.08), pitch: 0.55 });
      let heard = false;
      for (const vigia of this.vigias) {
        if (vigia.hear(p.x, p.y) && !heard) {
          heard = true;
          this.guardSays(vigia, "barulho");
        }
      }
    }
  }

  private updateDoors(dt: number): void {
    const open = this.doors.map(() => false);
    for (const plate of this.plates) {
      if (plate.update(this.boxes)) open[plate.door] = true;
    }
    const p = this.player.position;
    this.doors.forEach((door, i) => {
      if (door.closeAfterX !== undefined && p.x < door.closeAfterX) open[i] = true;
      const under = door.isOver(p.x, CAPSULE_RADIUS + DOOR_CLEARANCE) && this.player.feetY < door.bottom;
      door.update(dt, open[i], under);
    });
  }

  private cullLights(): void {
    const cameraX = this.cameraRig.camera.position.x;
    for (const light of this.scene.lights) {
      if (!(light instanceof PointLight || light instanceof SpotLight)) continue;
      const near = Math.abs(light.position.x - cameraX) < LIGHT_CULL_DISTANCE;
      if (light.isEnabled() !== near) light.setEnabled(near);
    }
  }

  private updateElevators(dt: number): void {
    const p = this.player.position;
    const feetY = this.player.feetY;
    const rider = { x: p.x, feetY, topY: feetY + (p.y - feetY) * 2, grounded: this.player.isGrounded };
    for (const elevator of this.elevators) elevator.update(dt, rider);
  }

  private isSeen(dt: number): "luz" | "toque" | null {
    if (this.vigias.length === 0 || this.devInvisible) return null;
    const p = this.player.position;
    const feetY = this.player.feetY;
    const height = (p.y - feetY) * 2 * (1 - TUNING.agachadoAltura * this.player.crouchAmount);
    this.sightPoints[0].set(p.x, feetY + 0.25, 0);
    this.sightPoints[1].set(p.x, feetY + height * 0.55, 0);
    this.sightPoints[2].set(p.x, feetY + height - 0.15, 0);
    if (this.vigias.some((vigia) => vigia.catches(p.x))) return "toque";
    // Desconfiança: a lanterna esquenta enquanto o jogador está no cone e esfria quando ele sai.
    let caught = false;
    for (const vigia of this.vigias) {
      if (vigia.chases) continue;
      if (vigia.updateAlert(dt, vigia.sees(this.sightPoints))) caught = true;
      // Começou a desconfiar: "Ei? Tem alguém aí?"
      const now = performance.now() / 1000;
      if (vigia.suspicious && !this.wasSuspicious.get(vigia) && now - (this.suspicionLineAt.get(vigia) ?? -99) > SUSPICION_LINE_COOLDOWN && !caught) {
        this.suspicionLineAt.set(vigia, now);
        this.guardSays(vigia, "desconfia");
      }
      this.wasSuspicious.set(vigia, vigia.suspicious);
    }
    return caught ? "luz" : null;
  }

  /** Ponto onde as mãos seguram a caixa empurrada (face voltada para o jogador). */
  private gripPoint(): { x: number; y: number } | null {
    const box = this.pushGrip;
    if (!box) return null;
    const p = box.mesh.position;
    // Caiu da doca ou do palco: as mãos soltam, em vez de irem atrás dela.
    if (p.y - box.halfSize < this.player.feetY - 0.2) return null;
    const side = Math.sign(p.x - this.player.position.x) || 1;
    return { x: p.x - side * (box.halfSize - box.grip.x), y: p.y - box.halfSize + box.grip.y };
  }

  private pushedBox(): Box | null {
    const dir = this.input.axisX();
    if (dir === 0 || !this.player.isGrounded) return null;
    const p = this.player.position;
    return this.boxes.find((box) => {
      const ahead = (box.mesh.position.x - p.x) * dir;
      const feet = p.y - CAPSULE_HEIGHT / 2;
      const overlapY = box.mesh.position.y + box.halfSize > feet + 0.1 && box.mesh.position.y - box.halfSize < feet + CAPSULE_HEIGHT;
      return ahead > 0 && ahead < CAPSULE_RADIUS + box.halfSize + PUSH_REACH && overlapY;
    }) ?? null;
  }

  private createStatic(block: BlockData, depth: number, name: string): Mesh {
    const mesh = CreateBox(name, { width: block.width, height: block.height, depth: block.depth ?? depth }, this.scene);
    mesh.position.set(block.x, block.y, block.z ?? 0);
    mesh.receiveShadows = true;
    mesh.material = this.materials.get(block.material ?? "concreto");
    new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, this.scene);
    mesh.freezeWorldMatrix();
    return mesh;
  }

  private applySurfaceUVs(): void {
    for (const mesh of this.scene.meshes) {
      if (!(mesh instanceof Mesh)) continue;
      const tile = this.materials.tileSizeOf(mesh.material);
      if (tile !== undefined && mesh.getTotalVertices() <= 24) applyWorldUVs(mesh, tile);
    }
  }

  private createRamp(ramp: RampData, depth: number, name: string): void {
    const dx = ramp.x1 - ramp.x0;
    const dy = ramp.y1 - ramp.y0;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const mesh = CreateBox(name, { width: length, height: RAMP_THICKNESS, depth }, this.scene);
    mesh.rotation.z = angle;
    mesh.position.set(
      (ramp.x0 + ramp.x1) / 2 + Math.sin(angle) * RAMP_THICKNESS / 2,
      (ramp.y0 + ramp.y1) / 2 - Math.cos(angle) * RAMP_THICKNESS / 2,
      0,
    );
    mesh.material = this.materials.get(ramp.material ?? "concreto");
    mesh.isVisible = !ramp.hidden;
    new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, this.scene);
    mesh.freezeWorldMatrix();
  }

  private createDecor(decor: DecorData, name: string): void {
    let mesh: Mesh;
    if (decor.shape === "sphere") {
      mesh = CreateSphere(name, { diameterX: decor.width, diameterY: decor.height, diameterZ: decor.depth, segments: 8 }, this.scene);
    } else if (decor.shape === "cylinder") {
      mesh = CreateCylinder(name, { diameter: decor.width, height: decor.height, tessellation: 10 }, this.scene);
    } else if (decor.shape === "disc") {
      mesh = CreateCylinder(name, { diameter: decor.width, height: decor.depth, tessellation: 24 }, this.scene);
      mesh.rotation.x = Math.PI / 2;
    } else {
      mesh = CreateBox(name, { width: decor.width, height: decor.height, depth: decor.depth }, this.scene);
    }
    mesh.position.set(decor.x, decor.y, decor.z);
    if (decor.id) mesh.name = decor.id;
    mesh.material = this.materials.get(decor.material ?? "concreto");
    mesh.isPickable = false;
    mesh.receiveShadows = true;
    mesh.freezeWorldMatrix();
  }
}
