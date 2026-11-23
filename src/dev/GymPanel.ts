import type { Vigia } from "../game/entities/Vigia";
import type { CallClock, GuardLine } from "../game/CallClock";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Sfx } from "../game/Sfx";
import { Lanterna } from "../game/entities/Lanterna";
import { TUNING } from "../game/Tuning";

// Painel da sala de teste (`?gym`): ajusta a furtividade ao vivo. Os mesmos valores entram pela URL
// (ex.: `?gym&alcance=8&cone=25&reacao=1.2&mudo`), e o painel mostra a URL com os valores atuais para copiar.
interface Slider {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  get: () => number;
  set: (value: number) => void;
}

export class GymPanel {
  private readonly root = document.createElement("div");
  private readonly alertBar = document.createElement("div");
  private readonly alertText = document.createElement("span");
  private readonly url = document.createElement("input");
  private readonly sliders: Slider[];
  private readonly clock: CallClock;
  private readonly sfx: Sfx;
  private readonly vigia: Vigia;
  private closeCam: FreeCamera | null = null;
  private gameCam: Camera | null = null;

  constructor(vigia: Vigia, clock: CallClock, sfx: Sfx) {
    this.clock = clock;
    this.sfx = sfx;
    this.vigia = vigia;
    const deg = (rad: number): number => Math.round((rad * 180) / Math.PI);
    this.sliders = [
      { key: "alcance", label: "alcance da lanterna (m)", min: 3, max: 18, step: 0.5, get: () => vigia.settings.range, set: (v) => vigia.tune({ range: v }) },
      { key: "cone", label: "abertura do cone (graus, metade)", min: 10, max: 50, step: 1, get: () => deg(vigia.settings.coneAngle), set: (v) => vigia.tune({ coneAngle: (v * Math.PI) / 180 }) },
      { key: "facho", label: "facho visível (força)", min: 0, max: 0.6, step: 0.01, get: () => Lanterna.beamStrength, set: (v) => (Lanterna.beamStrength = v) },
      { key: "ronda", label: "velocidade da ronda (m/s)", min: 0.4, max: 3, step: 0.1, get: () => vigia.settings.speed, set: (v) => vigia.tune({ speed: v }) },
      { key: "reacao", label: "reação: segundos vendo até pegar", min: 0.2, max: 3, step: 0.05, get: () => TUNING.reacao, set: (v) => (TUNING.reacao = v) },
      { key: "esquecer", label: "esquecer: alerta que baixa por segundo", min: 0.1, max: 2, step: 0.05, get: () => TUNING.esquecer, set: (v) => (TUNING.esquecer = v) },
      { key: "agachado", label: "agachado: silhueta mais baixa (%)", min: 0, max: 60, step: 1, get: () => Math.round(TUNING.agachadoAltura * 100), set: (v) => (TUNING.agachadoAltura = v / 100) },
      { key: "agachadoVel", label: "agachado: velocidade (m/s)", min: 1, max: 4.5, step: 0.1, get: () => TUNING.agachadoVelocidade, set: (v) => (TUNING.agachadoVelocidade = v) },
    ];
    const params = new URLSearchParams(location.search);
    for (const slider of this.sliders) {
      const value = Number(params.get(slider.key));
      if (params.has(slider.key) && Number.isFinite(value)) slider.set(value);
    }
    if (params.has("mudo")) sfx.muted = true;
    this.build();
    this.refreshUrl();
    const loop = (): void => {
      const alert = vigia.alertLevel;
      this.alertBar.style.width = `${Math.round(alert * 100)}%`;
      this.alertBar.style.background = alert > 0.12 ? "#e0583a" : "#8fa4b8";
      this.alertText.textContent = alert >= 1 ? "pego" : alert > 0.12 ? "desconfiado" : "tranquilo";
      requestAnimationFrame(loop);
    };
    loop();
  }

  private build(): void {
    const r = this.root;
    r.className = "gym-painel";
    const title = document.createElement("div");
    title.className = "gym-titulo";
    title.textContent = "sala de teste";
    r.append(title);
    const alert = document.createElement("div");
    alert.className = "gym-alerta";
    const track = document.createElement("div");
    track.className = "gym-trilho";
    track.append(this.alertBar);
    alert.append(track, this.alertText);
    r.append(alert);
    for (const slider of this.sliders) {
      const row = document.createElement("label");
      row.className = "gym-linha";
      const name = document.createElement("span");
      const value = document.createElement("b");
      const input = document.createElement("input");
      input.type = "range";
      input.min = String(slider.min);
      input.max = String(slider.max);
      input.step = String(slider.step);
      input.value = String(slider.get());
      name.textContent = slider.label;
      value.textContent = String(slider.get());
      input.addEventListener("input", () => {
        slider.set(Number(input.value));
        value.textContent = input.value;
        this.refreshUrl();
      });
      // Solta o foco para as setas voltarem a mover o personagem.
      input.addEventListener("change", () => input.blur());
      row.append(name, value, input);
      r.append(row);
    }
    const buttons = document.createElement("div");
    buttons.className = "gym-botoes";
    const button = (label: string, action: (b: HTMLButtonElement) => void): HTMLButtonElement => {
      const b = document.createElement("button");
      b.textContent = label;
      b.addEventListener("click", () => {
        action(b);
        b.blur();
      });
      buttons.append(b);
      return b;
    };
    const muteLabel = (): string => (this.sfx.muted ? "som: mudo" : "som: ligado");
    const mute = button(muteLabel(), (b) => {
      this.sfx.muted = !this.sfx.muted;
      b.textContent = muteLabel();
      b.classList.toggle("gym-ativo", this.sfx.muted);
      this.refreshUrl();
    });
    mute.classList.toggle("gym-ativo", this.sfx.muted);
    button("câmera: jogo", (b) => {
      const on = this.toggleCloseUp();
      b.textContent = on ? "câmera: segurança" : "câmera: jogo";
      b.classList.toggle("gym-ativo", on);
    });
    button("tocar celular", () => this.clock.ring());
    for (const [label, kind] of [["fala: desconfia", "desconfia"], ["fala: barulho", "barulho"], ["fala: pego", "pego"]] as [string, GuardLine][]) {
      button(label, () => this.clock.guard(kind, 1, true));
    }
    r.append(buttons);
    this.url.readOnly = true;
    this.url.className = "gym-url";
    this.url.addEventListener("focus", () => this.url.select());
    r.append(this.url);
    // Cliques e teclas no painel não chegam ao jogo.
    for (const type of ["keydown", "pointerdown"]) r.addEventListener(type, (event) => event.stopPropagation());
    document.body.append(r);
  }

  /** Câmera de perto que acompanha a mão do segurança, para ver a lanterna e o facho. */
  private toggleCloseUp(): boolean {
    const scene = this.vigia.scene3d;
    if (!this.closeCam) {
      const cam = new FreeCamera("gym-perto", new Vector3(), scene);
      cam.fov = 0.55;
      cam.minZ = 0.05;
      const pipeline = scene.postProcessRenderPipelineManager.supportedPipelines[0] as { addCamera?: (c: Camera) => void } | undefined;
      pipeline?.addCamera?.(cam);
      const target = new Vector3();
      scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
        if (scene.activeCamera !== cam) return;
        const lens = this.vigia.lensPosition;
        // De lado e um pouco atrás do segurança, para ver a mão, a lanterna e o facho saindo dela.
        const side = this.vigia.debugState.facing >= 0 ? 1 : -1;
        target.set(lens.x + side * 0.4, lens.y - 0.25, lens.z);
        cam.position.set(lens.x - side * 0.6, lens.y + 0.4, lens.z - 3.6);
        cam.setTarget(target);
      });
      this.closeCam = cam;
    }
    if (scene.activeCamera === this.closeCam) {
      scene.activeCamera = this.gameCam;
      return false;
    }
    this.gameCam = scene.activeCamera;
    scene.activeCamera = this.closeCam;
    return true;
  }

  private refreshUrl(): void {
    const params = new URLSearchParams({ gym: "" });
    for (const slider of this.sliders) params.set(slider.key, String(slider.get()));
    if (this.sfx.muted) params.set("mudo", "");
    this.url.value = `?${params.toString().replace("gym=", "gym").replace("mudo=", "mudo")}`;
  }
}
