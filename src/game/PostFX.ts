import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { ColorCurves } from "@babylonjs/core/Materials/colorCurves";
import { ImageProcessingConfiguration } from "@babylonjs/core/Materials/imageProcessingConfiguration";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { Scene } from "@babylonjs/core/scene";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";

export interface VisualPreset {
  background: Color3;
  /**
   * Névoa linear (metros a partir da câmera). A faixa de jogo fica a 12 m da câmera, então começa logo atrás dela e
   * fecha nos prédios do fundo: o que está longe fica mais claro e frio, e cada camada se separa da seguinte.
   */
  fogStart: number;
  fogEnd: number;
  /**
   * Névoa dentro da faculdade: começa bem atrás da parede do fundo (a 14 m da câmera), então só a vista pelas janelas
   * ganha ar. A faixa de jogo e a dos seguranças ficam limpas.
   */
  interiorFogStart: number;
  interiorFogEnd: number;
  /** Cor padrão da névoa (os trechos de `ambiente` podem trocar). Clara e fria: ar úmido iluminado, não fumaça. */
  fog: Color3;
  /** O céu (cor de fundo) é a névoa um pouco mais escura, para o horizonte não brilhar mais que o ar. */
  skyFromFog: number;
  /** Multiplica a luz ambiente de todos os trechos: as lâmpadas passam a desenhar a cena em poças de luz. */
  ambientScale: number;
  /** Força padrão da neblina baixa atrás da faixa de jogo (cada trecho pode trocar em `ambiente.neblina`). */
  mist: number;
  ambientIntensity: number;
  ambientColor: Color3;
  lampIntensity: number;
  saturation: number;
  contrast: number;
  exposure: number;
  grain: number;
  vignette: number;
  bloom: number;
  bloomThreshold: number;
  bloomKernel: number;
  /** Resolução do brilho em relação à tela. O brilho é borrado de qualquer jeito: em resolução baixa custa bem menos. */
  bloomScale: number;
  /** Curva de cor: sombras puxadas para um tom (matiz em graus) e luzes para outro. Densidade de 0 a 100. */
  grade: { shadowsHue: number; shadowsDensity: number; shadowsSaturation: number; highlightsHue: number; highlightsDensity: number; highlightsSaturation: number };
  fxaa: boolean;
  /**
   * Dentro da faculdade as paredes são claras e as lâmpadas ficam perto: o mesmo brilho de fora estoura. Lá dentro o
   * brilho é mais fraco, pega só o que é bem claro, e a exposição baixa um pouco.
   */
  interiorBloom: number;
  interiorBloomThreshold: number;
  interiorExposure: number;
  rim: number;
  dust: boolean;
}

export const VISUAL: VisualPreset = {
  background: new Color3(0.071, 0.075, 0.09),
  fogStart: 11.5,
  fogEnd: 34,
  interiorFogStart: 20,
  interiorFogEnd: 55,
  fog: new Color3(0.3, 0.36, 0.42),
  skyFromFog: 0.8,
  ambientScale: 0.7,
  mist: 0.5,
  ambientIntensity: 0.6,
  ambientColor: new Color3(0.62, 0.7, 0.86),
  lampIntensity: 3.6,
  saturation: -30,
  contrast: 1.25,
  exposure: 2.7,
  grain: 6,
  vignette: 2,
  bloom: 0.5,
  bloomThreshold: 0.5,
  bloomKernel: 64,
  bloomScale: 0.25,
  grade: { shadowsHue: 205, shadowsDensity: 45, shadowsSaturation: 20, highlightsHue: 32, highlightsDensity: 30, highlightsSaturation: 10 },
  // Na tela retina o serrilhado quase não aparece, e o FXAA custava cerca de 3 ms por quadro no MacBook.
  fxaa: false,
  interiorBloom: 0.25,
  interiorBloomThreshold: 0.75,
  interiorExposure: 2.4,
  rim: 0.55,
  dust: true,
};

export class PostFX {
  static apply(scene: Scene, camera: Camera, ambient: HemisphericLight, preset: VisualPreset): DefaultRenderingPipeline {
    // O céu e a névoa mudam de cor por trecho (o loop do jogo puxa os dois): cópias, para não alterar o visual.
    scene.clearColor = Color4.FromColor3(preset.fog.scale(preset.skyFromFog), 1);
    scene.fogMode = Scene.FOGMODE_LINEAR;
    scene.fogStart = preset.fogStart;
    scene.fogEnd = preset.fogEnd;
    scene.fogColor = preset.fog.clone();

    ambient.intensity = preset.ambientIntensity;
    ambient.diffuse = preset.ambientColor;

    const pipeline = new DefaultRenderingPipeline("postfx", true, scene, [camera]);
    pipeline.bloomEnabled = preset.bloom > 0;
    // Brilho largo e de limiar baixo: a luz vaza um pouco das lâmpadas e das paredes claras, como ar úmido.
    pipeline.bloomThreshold = preset.bloomThreshold;
    pipeline.bloomWeight = preset.bloom;
    pipeline.bloomKernel = preset.bloomKernel;
    pipeline.bloomScale = preset.bloomScale;
    pipeline.grainEnabled = preset.grain > 0;
    pipeline.grain.intensity = preset.grain;
    pipeline.grain.animated = true;
    pipeline.fxaaEnabled = preset.fxaa;
    pipeline.imageProcessingEnabled = true;
    const processing = pipeline.imageProcessing;
    processing.contrast = preset.contrast;
    processing.exposure = preset.exposure;
    // ACES: as luzes fortes saturam suaves em vez de estourar em branco, e as sombras ficam densas.
    processing.toneMappingEnabled = true;
    processing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    processing.vignetteEnabled = preset.vignette > 0;
    processing.vignetteWeight = preset.vignette;
    processing.vignetteColor = new Color4(0, 0, 0, 0);
    processing.colorCurvesEnabled = true;
    const curves = new ColorCurves();
    curves.globalSaturation = preset.saturation;
    curves.shadowsHue = preset.grade.shadowsHue;
    curves.shadowsDensity = preset.grade.shadowsDensity;
    curves.shadowsSaturation = preset.grade.shadowsSaturation;
    curves.highlightsHue = preset.grade.highlightsHue;
    curves.highlightsDensity = preset.grade.highlightsDensity;
    curves.highlightsSaturation = preset.grade.highlightsSaturation;
    processing.colorCurves = curves;
    return pipeline;
  }
}
