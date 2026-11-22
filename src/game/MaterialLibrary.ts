import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { MaterialName } from "../levels/types";

const PALETTE: Record<MaterialName, Color3> = {
  pedra: new Color3(0.4, 0.36, 0.28),
  concreto: new Color3(0.27, 0.27, 0.27),
  asfalto: new Color3(0.14, 0.14, 0.15),
  madeira: new Color3(0.3, 0.19, 0.11),
  metal: new Color3(0.26, 0.28, 0.31),
  listrado: new Color3(0.5, 0.42, 0.08),
  janela: new Color3(0.07, 0.08, 0.1),
  moldura: new Color3(0.55, 0.55, 0.52),
  vegetacao: new Color3(0.09, 0.14, 0.09),
  lixeira: new Color3(0.1, 0.3, 0.13),
  caixa: new Color3(0.35, 0.28, 0.2),
  parede: new Color3(0.55, 0.55, 0.52),
  piso: new Color3(0.42, 0.41, 0.38),
  tatil: new Color3(0.12, 0.2, 0.45),
  vidro: new Color3(0.6, 0.7, 0.75),
  carrinho: new Color3(0.16, 0.26, 0.38),
};

const ALPHA: Partial<Record<MaterialName, number>> = {
  vidro: 0.18,
};

export class MaterialLibrary {
  private readonly scene: Scene;
  private readonly cache = new Map<MaterialName, StandardMaterial>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  get(name: MaterialName): StandardMaterial {
    let material = this.cache.get(name);
    if (!material) {
      material = new StandardMaterial(`mat-${name}`, this.scene);
      material.diffuseColor = PALETTE[name];
      material.specularColor = Color3.Black();
      material.alpha = ALPHA[name] ?? 1;
      this.cache.set(name, material);
    }
    return material;
  }
}
