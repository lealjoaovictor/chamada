import os
import sys

import bpy
from bpy_extras import anim_utils
from mathutils import Vector

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(RAIZ, "assets-brutos", "mixamo")
# Personagens do Mixamo (licença do Mixamo, ver PROJETO.md): Bryce = Zacarias, Alex = seguranças, Joe = professor,
# David = colega de sala.
# Cada perfil: (FBX do personagem em pose T, [(clipe, FBX da animação, travar no lugar)], acessórios).
PERFIS = {
    "personagem": (
        "Bryce.fbx",
        [
            ("parado", "Idle.fbx", False),
            ("andar", "Running.fbx", True),
            ("pular", "Jump.fbx", False),
            ("empurrar", "Pushing.fbx", True),
            ("deslizar", "Running Slide.fbx", True),
            ("agachado", "Crouch Idle.fbx", False),
            ("agachado_andar", "Crouched Walking.fbx", True),
            # Introdução: ele chega pela calçada lendo as mensagens do Davi.
            ("celular_andar", "Walking While Texting.fbx", True),
            ("celular_parado", "Texting While Standing.fbx", False),
        ],
        ["mochila"],
    ),
    "vigia": (
        "Alex.fbx",
        [
            ("parado", "Idle.fbx", False),
            ("andar", "Walking.fbx", True),
            ("correr", "Running.fbx", True),
            # Hábitos dos seguranças (thread da história e exploração).
            ("sentado", "Sitting Idle.fbx", False),
            ("torcer", "Cheering While Sitting.fbx", False),
            ("reclamar", "Sitting Yell.fbx", False),
            ("mao_na_cabeca", "Sitting Hands On Head.fbx", False),
            ("celular_andar", "Walking While Texting.fbx", True),
            ("celular_parado", "Texting While Standing.fbx", False),
            ("cochilando", "Sitting Head In Hands.fbx", False),
            ("susto", "Sitting Yell Up.fbx", False),
            ("levantar", "Stand Up.fbx", False),
            ("sentar", "Stand To Sit.fbx", False),
            ("olhar_em_volta", "Looking Around.fbx", False),
        ],
        [],
    ),
    "professor": (
        "Joe.fbx",
        [
            ("parado", "Idle.fbx", False),
            ("andar", "Walking.fbx", True),
        ],
        [],
    ),
    # Colegas de sala (Davi, no final, sentado com o celular).
    "aluno": (
        "David.fbx",
        [
            ("parado", "Idle.fbx", False),
            ("andar", "Walking.fbx", True),
        ],
        [],
    ),
}
PERFIL = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "personagem"
PERSONAGEM, ANIMACOES, ACESSORIOS = PERFIS[PERFIL]
DESTINO = os.path.join(RAIZ, "public", "models", f"{PERFIL}.glb")
CANAL_AVANCO = 2
# As texturas do Mixamo vêm em 2048 a 4096 px; no jogo o personagem ocupa pouco da tela.
TEXTURA_MAX = 512


def importar(arquivo):
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=os.path.join(ORIGEM, arquivo))
    novos = [o for o in bpy.data.objects if o not in antes]
    armature = next(o for o in novos if o.type == "ARMATURE")
    return armature, novos


def travar_no_lugar(acao, slot):
    canais = anim_utils.action_get_channelbag_for_slot(acao, slot)
    for curva in canais.fcurves:
        if curva.data_path.endswith('"mixamorig:Hips"].location') and curva.array_index == CANAL_AVANCO:
            inicio = curva.keyframe_points[0].co[1]
            for chave in curva.keyframe_points:
                chave.co[1] = inicio
                chave.handle_left[1] = inicio
                chave.handle_right[1] = inicio


def padronizar_ossos(armature):
    """Alguns personagens do Mixamo vêm com "mixamorig7:" ou "mixamorig10:"; o jogo e as animações usam "mixamorig:"."""
    for osso in armature.data.bones:
        prefixo, _, nome = osso.name.partition(":")
        if nome and prefixo.startswith("mixamorig") and prefixo != "mixamorig":
            osso.name = "mixamorig:" + nome


def simplificar_materiais(objetos):
    """Fica só a cor base (sem normal, brilho e opacidade) e reduz as texturas."""
    for material in {s.material for o in objetos if o.type == "MESH" for s in o.material_slots if s.material}:
        if not material.use_nodes:
            continue
        arvore = material.node_tree
        bsdf = next((n for n in arvore.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if not bsdf:
            continue
        for entrada in bsdf.inputs:
            if entrada.name != "Base Color":
                for ligacao in list(entrada.links):
                    arvore.links.remove(ligacao)
        bsdf.inputs["Roughness"].default_value = 0.8
        bsdf.inputs["Metallic"].default_value = 0.0
        material.blend_method = "OPAQUE" if hasattr(material, "blend_method") else None
    for imagem in bpy.data.images:
        largura, altura = imagem.size
        if max(largura, altura) > TEXTURA_MAX:
            fator = TEXTURA_MAX / max(largura, altura)
            imagem.scale(max(1, int(largura * fator)), max(1, int(altura * fator)))


def caixa(nome, centro, tamanho, material, chanfro):
    bpy.ops.mesh.primitive_cube_add(size=1, location=centro)
    objeto = bpy.context.object
    objeto.name = nome
    objeto.scale = tamanho
    bpy.ops.object.transform_apply(scale=True)
    modificador = objeto.modifiers.new("chanfro", "BEVEL")
    modificador.width = chanfro
    modificador.segments = 3
    bpy.ops.object.modifier_apply(modifier=modificador.name)
    bpy.ops.object.shade_smooth()
    objeto.data.materials.append(material)
    return objeto


def mochila(personagem, malhas):
    """Mochila escolar presa ao osso Spine2, encostada nas costas do personagem."""
    ossos = personagem.data.bones
    def ponto(nome):
        return personagem.matrix_world @ ossos["mixamorig:" + nome].head_local
    peito = ponto("Spine2")
    pescoco = ponto("Neck")
    cintura = ponto("Spine")
    # Costas: o ponto mais atrás (+Y) do corpo entre a cintura e o peito.
    costas = max(
        (o.matrix_world @ v.co).y
        for o in malhas
        for v in o.data.vertices
        if cintura.z <= (o.matrix_world @ v.co).z <= peito.z and abs((o.matrix_world @ v.co).x) < 0.12
    )
    cor = bpy.data.materials.new("mochila")
    cor.use_nodes = True
    cor.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.08, 0.12, 0.22, 1)
    cor.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.8
    alca = bpy.data.materials.new("mochila-alca")
    alca.use_nodes = True
    alca.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.02, 0.02, 0.025, 1)
    meio = (peito.z + cintura.z) / 2 + 0.02
    partes = [
        caixa("mochila", (0, costas + 0.085, meio), (0.30, 0.15, 0.40), cor, 0.05),
        caixa("mochila-bolso", (0, costas + 0.175, meio - 0.08), (0.22, 0.05, 0.16), cor, 0.02),
    ]
    def extremo(lado, z, frente):
        """Superfície do corpo na frente (menor Y) ou no alto do ombro, perto de x = lado * 0,10."""
        pontos = [o.matrix_world @ v.co for o in malhas for v in o.data.vertices]
        perto = [p for p in pontos if abs(p.x - lado * 0.10) < 0.025]
        if frente:
            return min(p.y for p in perto if abs(p.z - z) < 0.025)
        return max(p.z for p in perto if abs(p.y - (costas - 0.08)) < 0.06 and p.z < pescoco.z)

    for lado in (1, -1):
        # Alça: sai do topo da mochila, passa por cima do ombro e desce pela frente do peito.
        topo = extremo(lado, 0, False)
        alto = peito.z + 0.02
        baixo = cintura.z + 0.06
        trajeto = [
            (lado * 0.09, costas + 0.03, meio + 0.16),
            (lado * 0.10, costas - 0.02, topo + 0.012),
            (lado * 0.10, (costas + extremo(lado, alto, True)) / 2 - 0.02, topo + 0.018),
            (lado * 0.10, extremo(lado, alto + 0.08, True) - 0.012, alto + 0.08),
            (lado * 0.105, extremo(lado, alto, True) - 0.012, alto),
            (lado * 0.11, extremo(lado, baixo, True) - 0.012, baixo),
            (lado * 0.13, costas, baixo + 0.02),
        ]
        malha = bpy.data.meshes.new("alca")
        malha.from_pydata(trajeto, [(i, i + 1) for i in range(len(trajeto) - 1)], [])
        objeto = bpy.data.objects.new("alca", malha)
        bpy.context.collection.objects.link(objeto)
        pele = objeto.modifiers.new("pele", "SKIN")
        for vertice in malha.skin_vertices[0].data:
            vertice.radius = (0.022, 0.006)
        bpy.context.view_layer.objects.active = objeto
        objeto.select_set(True)
        objeto.modifiers.new("suave", "SUBSURF").levels = 1
        for modificador in list(objeto.modifiers):
            bpy.ops.object.modifier_apply(modifier=modificador.name)
        bpy.ops.object.shade_smooth()
        objeto.data.materials.append(alca)
        objeto.select_set(False)
        partes.append(objeto)
    bpy.ops.object.select_all(action="DESELECT")
    for parte in partes:
        parte.select_set(True)
    bpy.context.view_layer.objects.active = partes[0]
    bpy.ops.object.join()
    objeto = bpy.context.object
    grupo = objeto.vertex_groups.new(name="mixamorig:Spine2")
    grupo.add(list(range(len(objeto.data.vertices))), 1.0, "REPLACE")
    matriz = objeto.matrix_world.copy()
    objeto.parent = personagem
    objeto.matrix_world = matriz
    objeto.modifiers.new("Armature", "ARMATURE").object = personagem


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    personagem, objetos = importar(PERSONAGEM)
    malhas = [o for o in objetos if o.type == "MESH"]
    padronizar_ossos(personagem)
    simplificar_materiais(objetos)
    if "mochila" in ACESSORIOS:
        mochila(personagem, malhas)
    acao_pose = personagem.animation_data.action if personagem.animation_data else None
    personagem.animation_data_create()
    personagem.animation_data.action = None
    if acao_pose:
        bpy.data.actions.remove(acao_pose)

    for nome, arquivo, no_lugar in ANIMACOES:
        origem, objetos = importar(arquivo)
        acao = origem.animation_data.action
        slot = origem.animation_data.action_slot
        acao.name = nome
        if no_lugar:
            travar_no_lugar(acao, slot)
        trilha = personagem.animation_data.nla_tracks.new()
        trilha.name = nome
        trilha.strips.new(nome, int(acao.frame_range[0]), acao)
        trilha.mute = False
        for objeto in objetos:
            bpy.data.objects.remove(objeto, do_unlink=True)

    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=DESTINO,
        export_format="GLB",
        export_animation_mode="NLA_TRACKS",
        export_yup=True,
        export_image_format="JPEG",
        export_jpeg_quality=80,
    )
    print("CONVERTIDO", DESTINO)


main()
sys.exit(0)
