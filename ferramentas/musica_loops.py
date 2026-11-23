# Prepara a trilha a partir dos MP3 originais do ElevenLabs (assets-brutos/musica/originais):
# corta o silêncio, faz a emenda dos loops em crossfade, iguala o volume e grava public/audio/musica/<nome>.ogg.
# Uso: python3 ferramentas/musica_loops.py   (precisa de numpy e ffmpeg)
import subprocess, numpy as np, sys, os
SR=44100
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL=os.path.join(ROOT,"assets-brutos","musica","originais")
OUT=os.path.join(ROOT,"public","audio","musica")
os.makedirs(OUT, exist_ok=True)
def load(name):
    raw=subprocess.run(["ffmpeg","-v","error","-i",os.path.join(DL,name),"-f","f32le","-ac","2","-ar",str(SR),"-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw,dtype=np.float32).reshape(-1,2).copy()
def save(x,base):
    raw=np.clip(x,-1,1).astype(np.float32).tobytes()
    subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ac","2","-ar",str(SR),"-i","-","-c:a","libvorbis","-q:a","4",os.path.join(OUT,f"{base}.ogg")],input=raw,check=True)
def rms_db(x): return 20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
def trim(x,th=-45):
    env=np.abs(x).max(axis=1); lim=10**(th/20)
    idx=np.where(env>lim)[0]
    return x[idx[0]:idx[-1]+1] if len(idx) else x
def norm(x,target):
    g=10**((target-rms_db(x))/20); y=x*g
    peak=np.abs(y).max()
    if peak>0.95: y*=0.95/peak
    return y
def loop(x,xf,cut_end=0.0,cut_start=0.0):
    x=x[int(cut_start*SR):len(x)-int(cut_end*SR)]
    n=int(xf*SR); L=len(x)
    t=np.linspace(0,np.pi/2,n)[:,None]
    head=x[:n]*np.sin(t); tail=x[L-n:]*np.cos(t)
    return np.concatenate([head+tail, x[n:L-n]])
def fadeout(x,s):
    n=int(s*SR); x=x.copy(); x[-n:]*=np.linspace(1,0,n)[:,None]; return x
def fadein(x,s):
    n=int(s*SR); x=x.copy(); x[:n]*=np.linspace(0,1,n)[:,None]; return x
jobs=[
 ("Fog_Outside_The_Hall_2026-11-23T150532.mp3","patio","loop",6,-22),
 ("Empty_Hall_After_Midnight_2026-11-23T150549.mp3","corredor","loop",6,-22),
 ("Close_Search_2026-11-23T150600.mp3","tensao","loop",5,-21),
 ("Basement_Chase_2026-11-23T150620.mp3","perseguicao","loop",1.5,-17),
 ("Empty_Campus_at_Night_2026-11-23T150631.mp3","menu","loop",4,-21),
 ("Made_It_In_Time_2026-11-23T150646.mp3","final","once",0,-20),
 ("Short_ominous_low_sy_#1-1795446518321.mp3","stinger-desconfia","once",0,-18),
 ("Deep_dull_low_boom_w_#1-1795446558664.mp3","stinger-pego","once",0,-18),
 ("Sudden_aggressive_ho_#1-1795446578893.mp3","stinger-perseguicao","once",0,-16),
]
for src,base,kind,xf,target in jobs:
    x=trim(load(src))
    before=len(x)/SR
    if kind=="loop":
        # pula o fim (fade/ending) e um pouco do início para cair no corpo da faixa
        x=loop(x,xf,cut_end=2.0 if base!="perseguicao" else 0.5,cut_start=0.0)
    else:
        x=fadein(x,0.005); x=fadeout(x,min(1.0,len(x)/SR*0.2))
    x=norm(x,target)
    save(x,base)
    print(f"{base:22s} {before:6.1f}s -> {len(x)/SR:6.1f}s rms {rms_db(x):6.1f} dB")
