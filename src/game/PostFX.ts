import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { ColorCurves } from "@babylonjs/core/Materials/colorCurves";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { Scene } from "@babylonjs/core/scene";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";

export interface VisualPreset {
  background: Color3;
  fogDensity: number;
  ambientIntensity: number;
  ambientColor: Color3;
  lampIntensity: number;
  saturation: number;
  contrast: number;
  exposure: number;
  grain: number;
  vignette: number;
  bloom: number;
  rim: number;
  dust: boolean;
}

export const VISUAL: VisualPreset = {
  background: new Color3(0.071, 0.075, 0.09),
  fogDensity: 0.045,
  ambientIntensity: 0.6,
  ambientColor: new Color3(0.62, 0.7, 0.86),
  lampIntensity: 3.6,
  saturation: -22,
  contrast: 1.2,
  exposure: 1.4,
  grain: 10,
  vignette: 1.6,
  bloom: 0.35,
  rim: 0.55,
  dust: true,
};

export class PostFX {
  static apply(scene: Scene, camera: Camera, ambient: HemisphericLight, preset: VisualPreset): void {
    scene.clearColor = Color4.FromColor3(preset.background, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = preset.fogDensity;
    scene.fogColor = preset.background;

    ambient.intensity = preset.ambientIntensity;
    ambient.diffuse = preset.ambientColor;

    const pipeline = new DefaultRenderingPipeline("postfx", true, scene, [camera]);
    pipeline.bloomEnabled = preset.bloom > 0;
    pipeline.bloomThreshold = 0.7;
    pipeline.bloomWeight = preset.bloom;
    pipeline.bloomKernel = 48;
    pipeline.bloomScale = 0.5;
    pipeline.grainEnabled = preset.grain > 0;
    pipeline.grain.intensity = preset.grain;
    pipeline.grain.animated = true;
    pipeline.imageProcessingEnabled = true;
    const processing = pipeline.imageProcessing;
    processing.contrast = preset.contrast;
    processing.exposure = preset.exposure;
    processing.toneMappingEnabled = preset.bloom > 0;
    processing.vignetteEnabled = preset.vignette > 0;
    processing.vignetteWeight = preset.vignette;
    processing.vignetteColor = new Color4(0, 0, 0, 0);
    processing.colorCurvesEnabled = true;
    const curves = new ColorCurves();
    curves.globalSaturation = preset.saturation;
    processing.colorCurves = curves;
  }
}
