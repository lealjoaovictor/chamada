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
}

const PRESETS: Record<string, VisualPreset> = {
  a: {
    background: new Color3(0.05, 0.06, 0.08),
    fogDensity: 0.05,
    ambientIntensity: 0.6,
    ambientColor: new Color3(0.7, 0.78, 0.9),
    lampIntensity: 2,
    saturation: -40,
    contrast: 1.1,
    exposure: 1,
    grain: 8,
    vignette: 1.5,
  },
  b: {
    background: new Color3(0.035, 0.045, 0.06),
    fogDensity: 0.075,
    ambientIntensity: 0.4,
    ambientColor: new Color3(0.6, 0.7, 0.88),
    lampIntensity: 2.8,
    saturation: -65,
    contrast: 1.25,
    exposure: 1,
    grain: 14,
    vignette: 2.5,
  },
  c: {
    background: new Color3(0.03, 0.03, 0.035),
    fogDensity: 0.1,
    ambientIntensity: 0.3,
    ambientColor: new Color3(0.75, 0.75, 0.8),
    lampIntensity: 3.4,
    saturation: -90,
    contrast: 1.4,
    exposure: 1.05,
    grain: 20,
    vignette: 3.5,
  },
};

const DEFAULT_PRESET = "b";

export class PostFX {
  static preset(): VisualPreset {
    const key = new URLSearchParams(window.location.search).get("visual") ?? DEFAULT_PRESET;
    return PRESETS[key] ?? PRESETS[DEFAULT_PRESET];
  }

  static apply(scene: Scene, camera: Camera, ambient: HemisphericLight, preset: VisualPreset): void {
    scene.clearColor = Color4.FromColor3(preset.background, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = preset.fogDensity;
    scene.fogColor = preset.background;

    ambient.intensity = preset.ambientIntensity;
    ambient.diffuse = preset.ambientColor;

    const pipeline = new DefaultRenderingPipeline("postfx", false, scene, [camera]);
    pipeline.grainEnabled = preset.grain > 0;
    pipeline.grain.intensity = preset.grain;
    pipeline.grain.animated = true;
    pipeline.imageProcessingEnabled = true;
    const processing = pipeline.imageProcessing;
    processing.contrast = preset.contrast;
    processing.exposure = preset.exposure;
    processing.vignetteEnabled = preset.vignette > 0;
    processing.vignetteWeight = preset.vignette;
    processing.vignetteColor = new Color4(0, 0, 0, 0);
    processing.colorCurvesEnabled = true;
    const curves = new ColorCurves();
    curves.globalSaturation = preset.saturation;
    processing.colorCurves = curves;
  }
}
