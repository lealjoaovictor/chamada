"""Converte um modelo glTF 1K do Poly Haven (CC0) para o GLB do kit do jogo.

Uso (Blender em modo texto):
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
    --python ferramentas/converter_kit.py -- <entrada.gltf> <saida.glb>

Mesmo tratamento dos outros modelos de `public/models/kit`: malha simplificada quando
passa de MAX_FACES triângulos, textura ORM descartada (o jogo usa StandardMaterial)
e cor/normal exportadas em JPEG de até MAX_TEXTURE px.
"""

import sys

import bpy

MAX_FACES = 12000
MAX_TEXTURE = 512


def main() -> None:
    args = sys.argv[sys.argv.index("--") + 1 :]
    src, dst = args[0], args[1]

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)

    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    total = sum(len(o.data.polygons) for o in meshes)
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
    if tris > MAX_FACES:
        ratio = MAX_FACES / tris
        for obj in meshes:
            mod = obj.modifiers.new("simplificar", "DECIMATE")
            mod.ratio = ratio
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=mod.name)
    print(f"faces: {total} -> {sum(len(o.data.polygons) for o in meshes)}")

    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        tree = mat.node_tree
        for node in list(tree.nodes):
            if node.type == "TEX_IMAGE" and node.image and "_arm" in node.image.name:
                tree.nodes.remove(node)
            elif node.type == "SEPARATE_COLOR":
                tree.nodes.remove(node)

    for image in bpy.data.images:
        if image.size[0] > MAX_TEXTURE:
            image.scale(MAX_TEXTURE, MAX_TEXTURE)

    bpy.ops.export_scene.gltf(
        filepath=dst,
        export_format="GLB",
        export_image_format="JPEG",
        export_jpeg_quality=75,
        export_apply=True,
    )


main()
