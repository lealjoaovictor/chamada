import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { StickerData } from "../levels/types";

/**
 * Adesivos do cenário: cartazes, pichação, placas, manchas, folhas e rachaduras desenhados num canvas na hora de
 * carregar (nada de arquivo novo para baixar). Cada um é um plano fino encostado numa parede ou deitado no chão,
 * que recebe a luz dos postes como o resto do cenário.
 */
const PX_PER_M = 220;
const MAX_SIDE = 512;

type Ctx = CanvasRenderingContext2D;

function rng(seed: number): () => number {
  let s = Math.abs(Math.floor(seed * 9301 + 49297)) % 233280 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function hashOf(data: StickerData): number {
  const text = `${data.kind}|${data.x}|${data.y}|${data.z}|${(data.text ?? []).join("/")}`;
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000003;
  return h;
}

function wrapLines(ctx: Ctx, lines: string[], x: number, y: number, size: number, step: number): void {
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * step * size));
}

/** Papel com sujeira, dobras e a borda de baixo rasgada. */
function poster(ctx: Ctx, w: number, h: number, data: StickerData, rand: () => number): void {
  const [title, ...rest] = data.text ?? ["AVISO"];
  ctx.fillStyle = data.color ?? "#e8e0c8";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  // Rasgo: a parte de baixo some em zigue-zague.
  const torn = h * (0.75 + rand() * 0.2);
  ctx.lineTo(w, torn);
  for (let x = w; x > 0; x -= w / 12) ctx.lineTo(x, torn + (rand() - 0.3) * h * 0.18);
  ctx.lineTo(0, h * (0.85 + rand() * 0.15));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = data.ink ?? "#1a1a1a";
  ctx.textAlign = "center";
  const titleSize = Math.min(w / Math.max(4, title.length * 0.62), h * 0.22);
  ctx.font = `900 ${titleSize}px Impact, 'Arial Black', sans-serif`;
  ctx.fillText(title, w / 2, titleSize * 1.15);
  const size = Math.min(titleSize * 0.42, w / 16);
  ctx.font = `700 ${size}px Arial, sans-serif`;
  wrapLines(ctx, rest, w / 2, titleSize * 1.15 + size * 1.8, size, 1.35);
  // Desbotado e sujo.
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(60,50,30,${rand() * 0.12})`;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, rand() * w * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = "rgba(0,0,0,0.92)";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
}

/** Tinta spray: letras tortas com contorno, névoa em volta e escorridos. */
function graffiti(ctx: Ctx, w: number, h: number, data: StickerData, rand: () => number): void {
  const text = (data.text ?? ["ZK"]).join(" ");
  const color = data.color ?? "#d8d8d0";
  const size = Math.min(h * 0.62, (w / Math.max(2, text.length)) * 1.5);
  ctx.save();
  ctx.translate(w / 2, h * 0.55);
  ctx.rotate((rand() - 0.5) * 0.12);
  ctx.font = `italic 900 ${size}px 'Arial Black', Impact, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.12;
  ctx.lineWidth = size * 0.08;
  ctx.strokeStyle = data.ink ?? "rgba(10,10,10,0.9)";
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
  // Escorridos.
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.035);
  for (let i = 0; i < 6; i++) {
    const x = w * (0.15 + rand() * 0.7);
    const y = h * 0.6 + rand() * h * 0.1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 3, y + rand() * h * 0.35);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Placa pintada: fundo liso, borda e texto centralizado. */
function sign(ctx: Ctx, w: number, h: number, data: StickerData): void {
  const lines = data.text ?? [""];
  ctx.fillStyle = data.color ?? "#1d4f91";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = data.ink ?? "#f2f2f2";
  ctx.lineWidth = Math.max(3, h * 0.05);
  ctx.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
  ctx.fillStyle = data.ink ?? "#f2f2f2";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min((h * 0.7) / lines.length, (w * 1.6) / Math.max(4, longest));
  ctx.font = `700 ${size}px Arial, Helvetica, sans-serif`;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.15));
}

/** Mancha de umidade, óleo ou sujeira: manchas suaves sobrepostas. */
function stain(ctx: Ctx, w: number, h: number, data: StickerData, rand: () => number): void {
  const color = data.color ?? "20,16,12";
  for (let i = 0; i < 14; i++) {
    const x = w * (0.2 + rand() * 0.6);
    const y = h * (0.2 + rand() * 0.6);
    const r = Math.min(w, h) * (0.12 + rand() * 0.3);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${0.18 + rand() * 0.2})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Escorrido de umidade na parede: faixas verticais mais escuras embaixo. */
function damp(ctx: Ctx, w: number, h: number, rand: () => number): void {
  for (let i = 0; i < 18; i++) {
    const x = rand() * w;
    const top = rand() * h * 0.5;
    const width = w * (0.02 + rand() * 0.08);
    const g = ctx.createLinearGradient(0, top, 0, h);
    g.addColorStop(0, "rgba(15,14,10,0)");
    g.addColorStop(1, `rgba(15,14,10,${0.25 + rand() * 0.3})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, top, width, h - top);
  }
  const g = ctx.createLinearGradient(0, h * 0.6, 0, h);
  g.addColorStop(0, "rgba(15,14,10,0)");
  g.addColorStop(1, "rgba(15,14,10,0.45)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Folhas secas espalhadas. */
function leaves(ctx: Ctx, w: number, h: number, rand: () => number): void {
  const tones = ["#5b4a22", "#6e5a2a", "#3f3a1c", "#7a4e1e", "#4c4f22"];
  const count = Math.floor((w * h) / 900);
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    // Mais folhas no meio, menos nas bordas.
    if (Math.hypot((x - w / 2) / w, (y - h / 2) / h) > 0.35 + rand() * 0.2) continue;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rand() * Math.PI * 2);
    ctx.fillStyle = tones[Math.floor(rand() * tones.length)];
    ctx.beginPath();
    ctx.ellipse(0, 0, 6 + rand() * 6, 3 + rand() * 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Rachadura: caminho torto com galhos finos. */
function crack(ctx: Ctx, w: number, h: number, rand: () => number): void {
  ctx.strokeStyle = "rgba(8,8,8,0.85)";
  ctx.lineCap = "round";
  const branch = (x: number, y: number, angle: number, length: number, width: number): void => {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let cx = x;
    let cy = y;
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      angle += (rand() - 0.5) * 0.7;
      cx += (Math.cos(angle) * length) / steps;
      cy += (Math.sin(angle) * length) / steps;
      ctx.lineTo(cx, cy);
      if (width > 1.2 && rand() < 0.15) {
        ctx.stroke();
        branch(cx, cy, angle + (rand() < 0.5 ? 0.9 : -0.9), length * 0.4, width * 0.55);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
      }
    }
    ctx.stroke();
  };
  branch(w * 0.05, h * (0.3 + rand() * 0.4), (rand() - 0.5) * 0.4, w * 0.95, 3);
}

function draw(ctx: Ctx, w: number, h: number, data: StickerData): void {
  const rand = rng(hashOf(data));
  switch (data.kind) {
    case "cartaz":
      return poster(ctx, w, h, data, rand);
    case "pichacao":
      return graffiti(ctx, w, h, data, rand);
    case "placa":
      return sign(ctx, w, h, data);
    case "mancha":
      return stain(ctx, w, h, data, rand);
    case "umidade":
      return damp(ctx, w, h, rand);
    case "folhas":
      return leaves(ctx, w, h, rand);
    case "rachadura":
      return crack(ctx, w, h, rand);
  }
}

const DEFAULT_GLOW: Partial<Record<StickerData["kind"], number>> = {
  cartaz: 0.22,
  pichacao: 0.25,
  placa: 0.12,
};

const SOFT_KINDS = new Set<StickerData["kind"]>(["mancha", "umidade"]);

export function createStickers(scene: Scene, stickers: StickerData[]): void {
  stickers.forEach((data, i) => {
    const scale = Math.min(PX_PER_M, MAX_SIDE / Math.max(data.width, data.height));
    const w = Math.max(16, Math.round(data.width * scale));
    const h = Math.max(16, Math.round(data.height * scale));
    const texture = new DynamicTexture(`adesivo-${i}`, { width: w, height: h }, scene, true);
    const ctx = texture.getContext() as unknown as Ctx;
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h, data);
    texture.hasAlpha = true;
    texture.update(true);

    const material = new StandardMaterial(`adesivo-${i}-mat`, scene);
    material.diffuseTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.specularColor = Color3.Black();
    material.backFaceCulling = true;
    // Empurra o adesivo para a frente da superfície onde ele encosta, sem piscar (z-fighting).
    material.zOffset = -2;
    material.transparencyMode = SOFT_KINDS.has(data.kind) || data.kind === "folhas" ? Material.MATERIAL_ALPHABLEND : Material.MATERIAL_ALPHATEST;
    // Brilho próprio a partir da própria imagem: o muro e a doca ficam de costas para os postes e, sem isso,
    // os cartazes somem no preto.
    const glow = data.glow ?? DEFAULT_GLOW[data.kind] ?? 0;
    if (glow > 0) {
      material.emissiveTexture = texture;
      material.emissiveTexture.level = glow;
    }

    const plane = CreatePlane(`adesivo-${i}`, { width: data.width, height: data.height }, scene);
    plane.material = material;
    plane.position.set(data.x, data.y, data.z);
    if (data.chao) {
      // Deitado no chão, virado para cima.
      plane.rotation.x = Math.PI / 2;
      plane.rotation.y = data.rot ?? 0;
    } else {
      // Em pé, virado para a câmera (que olha para +z).
      plane.rotation.z = data.rot ?? 0;
    }
    plane.isPickable = false;
    plane.freezeWorldMatrix();
  });
}
