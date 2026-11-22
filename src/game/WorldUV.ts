import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

const position = new Vector3();
const normal = new Vector3();

export function applyWorldUVs(mesh: Mesh, tileSize: number): void {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
  if (!positions || !normals) return;
  const world = mesh.computeWorldMatrix(true);
  const uvs = new Float32Array((positions.length / 3) * 2);
  for (let i = 0; i < positions.length / 3; i++) {
    Vector3.TransformCoordinatesFromFloatsToRef(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2], world, position);
    Vector3.TransformNormalFromFloatsToRef(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2], world, normal);
    const ax = Math.abs(normal.x);
    const ay = Math.abs(normal.y);
    const az = Math.abs(normal.z);
    let u: number;
    let v: number;
    if (ay >= ax && ay >= az) {
      u = position.x;
      v = position.z;
    } else if (ax >= az) {
      u = position.z;
      v = position.y;
    } else {
      u = position.x;
      v = position.y;
    }
    uvs[i * 2] = u / tileSize;
    uvs[i * 2 + 1] = v / tileSize;
  }
  mesh.setVerticesData(VertexBuffer.UVKind, uvs, false);
}
