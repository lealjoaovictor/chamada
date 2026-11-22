import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Scene } from "@babylonjs/core/scene";

const BACKGROUND = new Color3(0.05, 0.06, 0.08);
const FOG_DENSITY = 0.06;

export class PostFX {
  static apply(scene: Scene): void {
    scene.clearColor = Color4.FromColor3(BACKGROUND, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = FOG_DENSITY;
    scene.fogColor = BACKGROUND;
  }
}
