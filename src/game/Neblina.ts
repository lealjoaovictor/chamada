import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { MistData } from "../levels/types";

/**
 * Neblina baixa: um plano translúcido atrás da faixa de jogo, da cor da névoa do trecho, mais denso embaixo e com
 * falhas irregulares. Separa o fundo do plano de jogo (a parede deixa de colar no Zacarias) sem luz nova e sem
 * custo de sombra. Fica atrás do jogador, então nunca cobre o Zacarias nem os seguranças.
 */

/** Quantos metros de faixa cada repetição da textura cobre (as falhas não podem esticar demais nem repetir perto). */
const TILE_METERS = 24;
/** A neblina é um pouco mais clara que a névoa: é ar iluminado, não fumaça. */
const LIFT = 1.15;

let textureUrl: string | undefined;

/**
 * Degradê vertical (transparente em cima, denso embaixo) com manchas apagadas para não parecer uma faixa reta.
 * Vira uma imagem (data URL): cada faixa abre a própria `Texture` com a repetição dela, e o Babylon reaproveita a
 * mesma imagem na placa de vídeo para todas.
 */
function mistTextureUrl(): string {
  if (textureUrl) return textureUrl;
  const width = 512;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.45, "rgba(255,255,255,0.18)");
  g.addColorStop(0.8, "rgba(255,255,255,0.6)");
  g.addColorStop(0.93, "rgba(255,255,255,0.8)");
  g.addColorStop(1, "rgba(255,255,255,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  // Falhas: semente fixa, para a neblina ser a mesma a cada partida. As que cruzam a borda são repetidas do outro
  // lado, senão a emenda da repetição aparece como uma linha.
  ctx.globalCompositeOperation = "destination-out";
  let seed = 7;
  const rnd = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) {
    const x = rnd() * width;
    const y = rnd() * height * 0.7;
    const r = 30 + rnd() * 60;
    for (const dx of [-width, 0, width]) {
      const hole = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
      hole.addColorStop(0, "rgba(0,0,0,0.5)");
      hole.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = hole;
      ctx.fillRect(x + dx - r, y - r, 2 * r, 2 * r);
    }
  }
  textureUrl = canvas.toDataURL("image/png");
  return textureUrl;
}

/** Cria as faixas. `look(x)` dá a cor da névoa e a força da neblina no meio de cada faixa. */
export function createMist(scene: Scene, bands: MistData[], look: (x: number) => { color: Color3; strength: number }): void {
  const url = mistTextureUrl();
  bands.forEach((band, i) => {
    const width = band.x1 - band.x0;
    const { color, strength } = look((band.x0 + band.x1) / 2);
    if (width <= 0 || strength <= 0) return;
    const plane = CreatePlane(`neblina-${i}`, { width, height: band.altura }, scene);
    plane.position.set((band.x0 + band.x1) / 2, band.y + band.altura / 2, band.z);
    const material = new StandardMaterial(`neblina-${i}-mat`, scene);
    material.disableLighting = true;
    material.diffuseColor = Color3.Black();
    material.specularColor = Color3.Black();
    material.emissiveColor = color.scale(LIFT);
    const opacity = new Texture(url, scene, false, true);
    opacity.hasAlpha = true;
    opacity.wrapU = Texture.WRAP_ADDRESSMODE;
    opacity.wrapV = Texture.CLAMP_ADDRESSMODE;
    opacity.uScale = width / TILE_METERS;
    // Cada faixa começa num ponto diferente da textura, para duas faixas vizinhas não repetirem as mesmas falhas.
    opacity.uOffset = (i * 0.37) % 1;
    material.opacityTexture = opacity;
    material.alpha = strength;
    material.transparencyMode = Material.MATERIAL_ALPHABLEND;
    material.disableDepthWrite = true;
    material.backFaceCulling = false;
    // A cor já é a da névoa: aplicar a névoa por cima apagaria a faixa ao longe.
    material.fogEnabled = false;
    plane.material = material;
    plane.isPickable = false;
    plane.freezeWorldMatrix();
  });
}
