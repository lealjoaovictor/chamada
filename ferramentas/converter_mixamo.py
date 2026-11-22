import os
import sys

import bpy
from bpy_extras import anim_utils

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(RAIZ, "assets-brutos", "mixamo")
DESTINO = os.path.join(RAIZ, "public", "models", "personagem.glb")

PERSONAGEM = "Y Bot.fbx"
ANIMACOES = [
    ("parado", "Idle.fbx", False),
    ("andar", "Running.fbx", True),
    ("pular", "Jump.fbx", False),
    ("empurrar", "Pushing.fbx", True),
    ("deslizar", "Running Slide.fbx", True),
]
CANAL_AVANCO = 2


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


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    personagem, _ = importar(PERSONAGEM)
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
    )
    print("CONVERTIDO", DESTINO)


main()
sys.exit(0)
