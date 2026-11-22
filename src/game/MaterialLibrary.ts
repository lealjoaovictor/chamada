import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
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
  livros: new Color3(0.32, 0.12, 0.1),
  luar: new Color3(0.05, 0.06, 0.08),
  quadro: new Color3(0.07, 0.12, 0.09),
  papel: new Color3(0.72, 0.7, 0.63),
  tecido: new Color3(0.1, 0.14, 0.24),
  tela: new Color3(0.05, 0.06, 0.08),
};

const EMISSIVE: Partial<Record<MaterialName, Color3>> = {
  luar: new Color3(0.16, 0.21, 0.3),
  tela: new Color3(0.45, 0.6, 0.85),
};

const ALPHA: Partial<Record<MaterialName, number>> = {
  vidro: 0.3,
};

interface Surface {
  tile: number;
  average: number;
  relief: number;
}

const SURFACES: Partial<Record<MaterialName, Surface>> = {
  asfalto: { tile: 4, average: 216, relief: 0.6 },
  concreto: { tile: 3, average: 216, relief: 0.5 },
  pedra: { tile: 3, average: 206, relief: 0.7 },
  madeira: { tile: 2.4, average: 215, relief: 0.6 },
  metal: { tile: 2, average: 220, relief: 0.5 },
  parede: { tile: 3, average: 211, relief: 0.4 },
  piso: { tile: 1.5, average: 218, relief: 0.4 },
};

export class MaterialLibrary {
  private readonly scene: Scene;
  private readonly cache = new Map<MaterialName, StandardMaterial>();
  private readonly textures: Texture[] = [];

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
      material.emissiveColor = EMISSIVE[name] ?? Color3.Black();
      const surface = SURFACES[name];
      if (surface) {
        material.diffuseColor = PALETTE[name].scale(255 / surface.average);
        const color = new Texture(`textures/${name}_cor.jpg`, this.scene);
        material.diffuseTexture = color;
        const relief = new Texture(`textures/${name}_normal.jpg`, this.scene);
        this.textures.push(color, relief);
        relief.level = surface.relief;
        material.bumpTexture = relief;
      }
      this.cache.set(name, material);
    }
    return material;
  }

  whenTexturesReady(): Promise<void> {
    return new Promise((resolve) => Texture.WhenAllReady(this.textures, resolve));
  }

  tileSizeOf(material: unknown): number | undefined {
    for (const [name, cached] of this.cache) {
      if (cached === material) return SURFACES[name]?.tile;
    }
    return undefined;
  }
}
