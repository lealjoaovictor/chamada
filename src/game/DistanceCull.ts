import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

/** Metade da largura, em x, do que fica ligado em volta da câmera (cobre o fundo mais distante e o zoom das perseguições). */
const RADIUS = 55;
/** De quanto em quanto tempo (s) refaz a lista e liga/desliga. */
const PERIOD = 0.25;
const REFRESH = 2;

interface Entry {
  mesh: AbstractMesh;
  off: boolean;
}

interface AnimEntry {
  group: AnimationGroup;
  target: TransformNode;
  zeroed: boolean;
  saved: number;
}

/**
 * O mundo inteiro (mais de 4 mil malhas e 16 personagens) fica carregado de uma vez. O Babylon testa cada malha
 * contra a câmera e anima cada personagem em todo quadro, e isso custava mais da metade do quadro na CPU.
 * Aqui o que está longe na horizontal fica desligado, e os personagens longe param de animar.
 * Só desliga malhas sem pai (cenário solto) ou de matriz congelada (cenário fixo), nunca as que têm instâncias, e
 * só religa as que ela mesma desligou: as que o jogo esconde por conta própria continuam como o jogo deixou.
 */
export class DistanceCull {
  private readonly meshes = new Map<AbstractMesh, Entry>();
  private anims: AnimEntry[] = [];
  private timer = 0;
  private refreshTimer = REFRESH;
  private lastX = Number.NaN;

  private readonly scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  update(dt: number, cameraX: number): void {
    this.refreshTimer += dt;
    if (this.refreshTimer >= REFRESH) {
      this.refreshTimer = 0;
      this.refresh();
    }
    this.timer += dt;
    // Pulo de câmera (checkpoint, troca de área): atualiza na hora, sem esperar o próximo ciclo.
    if (!(Math.abs(cameraX - this.lastX) < 10)) this.timer = PERIOD;
    this.lastX = cameraX;
    if (this.timer >= PERIOD) {
      this.timer = 0;
      for (const entry of this.meshes.values()) {
        const box = entry.mesh.getBoundingInfo().boundingBox;
        const near = box.maximumWorld.x > cameraX - RADIUS && box.minimumWorld.x < cameraX + RADIUS;
        if (near && entry.off) {
          entry.off = false;
          entry.mesh.setEnabled(true);
        } else if (!near && !entry.off && entry.mesh.isEnabled(false)) {
          entry.off = true;
          entry.mesh.setEnabled(false);
        }
      }
    }
    // Todo quadro, depois das entidades: o peso zero faz o Babylon pular a animação inteira.
    for (const a of this.anims) {
      const far = Math.abs(a.target.getAbsolutePosition().x - cameraX) > RADIUS;
      if (far) {
        if (a.group.weight !== 0) {
          a.saved = a.group.weight;
          a.group.weight = 0;
          a.zeroed = true;
        }
      } else if (a.zeroed) {
        a.zeroed = false;
        a.group.weight = a.saved;
      }
    }
  }

  private refresh(): void {
    const live = new Set(this.scene.meshes);
    for (const mesh of this.meshes.keys()) if (!live.has(mesh) || mesh.isDisposed()) this.meshes.delete(mesh);
    for (const mesh of this.scene.meshes) {
      if (this.meshes.has(mesh)) continue;
      const hasInstances = "instances" in mesh && (mesh as unknown as { instances: unknown[] }).instances.length > 0;
      if (hasInstances || mesh.skeleton) continue;
      if (!mesh.isWorldMatrixFrozen && mesh.parent) continue;
      if (!mesh.isEnabled(false)) continue;
      this.meshes.set(mesh, { mesh, off: false });
    }
    const known = new Set(this.anims.map((a) => a.group));
    for (const group of this.scene.animationGroups) {
      if (known.has(group)) continue;
      const target = group.targetedAnimations[0]?.target as TransformNode | undefined;
      if (!target || typeof target.getAbsolutePosition !== "function") continue;
      this.anims.push({ group, target, zeroed: false, saved: group.weight });
    }
    this.anims = this.anims.filter((a) => this.scene.animationGroups.includes(a.group));
  }
}
