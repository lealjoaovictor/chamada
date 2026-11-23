import { Material } from "@babylonjs/core/Materials/material";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";

/**
 * Personagens do Mixamo (Bryce, Alex, Joe, David): troca o PBR do glTF por StandardMaterial com a textura
 * original escurecida por `tom`, para seguir a mesma luz e névoa do cenário e aceitar o contorno (fresnel).
 * As malhas do mesmo personagem compartilham materiais; por isso troca todas antes de descartar os originais.
 */
export function dressCharacter(meshes: AbstractMesh[], scene: Scene, name: string, tom: Color3): StandardMaterial[] {
  const converted = new Map<Material, StandardMaterial>();
  for (const mesh of meshes) {
    const original = mesh.material;
    if (!original) continue;
    let standard = converted.get(original);
    if (!standard) {
      standard = new StandardMaterial(`${name}-${original.name}`, scene);
      standard.specularColor = Color3.Black();
      standard.diffuseColor = tom.clone();
      if (original instanceof PBRMaterial) {
        if (original.albedoTexture) standard.diffuseTexture = original.albedoTexture;
        else standard.diffuseColor = original.albedoColor.multiply(tom);
      }
      converted.set(original, standard);
    }
    mesh.material = standard;
  }
  for (const original of converted.keys()) original.dispose(false, false);
  return [...converted.values()];
}
