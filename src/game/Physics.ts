import HavokPhysics from "@babylonjs/havok";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent";

export const GRAVITY = new Vector3(0, -20, 0);

export class Physics {
  static async enable(scene: Scene): Promise<HavokPlugin> {
    const havok = await HavokPhysics();
    const plugin = new HavokPlugin(true, havok);
    scene.enablePhysics(GRAVITY, plugin);
    return plugin;
  }
}
