import os
import random
import sys

import bmesh
import bpy

LARGURA = 1.4
ALTURA = 2.6
PROFUNDIDADE = 1.1
TABUA = 0.05
FUNDO = 0.03
PRATELEIRAS = 4
MADEIRA = (0.30, 0.19, 0.11)
CORES_LIVROS = [
    (0.42, 0.12, 0.10),
    (0.18, 0.26, 0.20),
    (0.16, 0.20, 0.32),
    (0.45, 0.36, 0.22),
    (0.30, 0.22, 0.16),
    (0.52, 0.48, 0.40),
    (0.26, 0.14, 0.22),
    (0.12, 0.12, 0.12),
]

PASTA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "models")

partes = []


def caixa(cx, cy, cz, sx, sy, sz, cor, giro=0.0):
    malha = bpy.data.meshes.new("parte")
    objeto = bpy.data.objects.new("parte", malha)
    bpy.context.collection.objects.link(objeto)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    bm.to_mesh(malha)
    bm.free()
    objeto.location = (cx, cy, cz)
    objeto.rotation_euler = (0.0, giro, 0.0)
    atributo = malha.color_attributes.new("cor", "BYTE_COLOR", "CORNER")
    for item in atributo.data:
        item.color = (*cor, 1.0)
    partes.append(objeto)


def variar(cor, quanto):
    return tuple(min(1.0, max(0.0, c * (1 + random.uniform(-quanto, quanto)))) for c in cor)


def montar_estrutura():
    meia_l = LARGURA / 2
    meia_p = PROFUNDIDADE / 2
    caixa(-meia_l + TABUA / 2, 0, ALTURA / 2, TABUA, PROFUNDIDADE, ALTURA, MADEIRA)
    caixa(meia_l - TABUA / 2, 0, ALTURA / 2, TABUA, PROFUNDIDADE, ALTURA, MADEIRA)
    caixa(0, meia_p - FUNDO / 2, ALTURA / 2, LARGURA - 2 * TABUA, FUNDO, ALTURA, variar(MADEIRA, 0.25))
    vao = (ALTURA - TABUA) / PRATELEIRAS
    for i in range(PRATELEIRAS + 1):
        caixa(0, 0, TABUA / 2 + i * vao, LARGURA - 2 * TABUA, PROFUNDIDADE, TABUA, MADEIRA)
    caixa(0, -meia_p + 0.01, 0.06, LARGURA - 2 * TABUA, 0.02, 0.12, variar(MADEIRA, 0.3))
    return vao


def encher_prateleira(base, vao):
    x = -LARGURA / 2 + TABUA + 0.02
    limite = LARGURA / 2 - TABUA - 0.02
    frente = -PROFUNDIDADE / 2 + 0.06
    while x < limite:
        sorteio = random.random()
        if sorteio < 0.08:
            x += random.uniform(0.06, 0.14)
            continue
        if sorteio < 0.14 and limite - x > 0.3:
            pilha_l = random.uniform(0.22, 0.28)
            z = base
            for _ in range(random.randint(3, 5)):
                h = random.uniform(0.035, 0.06)
                caixa(x + pilha_l / 2, frente + 0.14, z + h / 2, pilha_l * random.uniform(0.9, 1.0), 0.26, h, variar(random.choice(CORES_LIVROS), 0.2))
                z += h
            x += pilha_l + 0.02
            continue
        largura = random.uniform(0.025, 0.065)
        altura = random.uniform(0.55, 0.85) * (vao - TABUA)
        profundidade = random.uniform(0.2, 0.3)
        if x + largura > limite:
            break
        giro = 0.0
        deslocamento = 0.0
        if sorteio > 0.95 and limite - x > 0.2:
            giro = random.uniform(0.18, 0.32)
            deslocamento = altura * 0.5 * giro
        caixa(x + largura / 2 + deslocamento, frente + profundidade / 2 + random.uniform(0, 0.04), base + altura / 2, largura, profundidade, altura, variar(random.choice(CORES_LIVROS), 0.2), giro)
        x += largura + deslocamento * 2 + random.uniform(0.0, 0.006)


def main():
    variante = int(sys.argv[sys.argv.index("--") + 1]) if "--" in sys.argv else 1
    random.seed(variante * 101)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    vao = montar_estrutura()
    for i in range(PRATELEIRAS):
        encher_prateleira(TABUA + i * vao, vao)
    bpy.ops.object.select_all(action="DESELECT")
    for parte in partes:
        parte.select_set(True)
    bpy.context.view_layer.objects.active = partes[0]
    bpy.ops.object.join()
    estante = bpy.context.view_layer.objects.active
    estante.name = "estante"
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for vertice in estante.data.vertices:
        vertice.co.z -= ALTURA / 2
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(os.path.join(PASTA, f"estante-{variante}.glb")),
        export_format="GLB",
        export_vertex_color="ACTIVE",
        export_materials="NONE",
        export_animations=False,
        export_yup=True,
    )
    print("estante exportada:", len(estante.data.polygons), "faces")


main()
