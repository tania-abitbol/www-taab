"""Mixe voix (vitesse d'origine), effets et musique en une piste de 30 s (ffmpeg)."""
import json, subprocess, hashlib
from pathlib import Path
P = Path(__file__).resolve().parents[1]; T = json.load(open(P/'b6/timing.json')); LIB = P/'audio/library/audio'
def lib(name): return str(next(LIB.rglob(name)))
D = T['duration']; ins = []; fl = []; labels = []
def add(path, at, gain_db, extra='', lavfi=False):
    i = len(ins); ins.append((path, lavfi))
    fl.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo{(','+extra) if extra else ''},volume={gain_db}dB,adelay={int(at*1000)}:all=1[a{i}]"); labels.append(f"[a{i}]")
for lid, at in T['lines'].items(): add(str(P/f'audio/lines/{lid}.mp3'), at, 1.5)
# musique : comédie pendant la dispute, coupure nette au mur, chaleur à la réconciliation
add(lib('bgm-monkeys*'), 0, -19, f"atrim=0:{T['cut_wall']},afade=t=in:d=0.4,afade=t=out:st={T['cut_wall']-0.12}:d=0.12")
add(lib('bgm-morning*'), T['cut_wide'], -15, f"atrim=6:{6+D-T['cut_wide']},asetpts=PTS-STARTPTS,afade=t=in:d=0.5,afade=t=out:st={D-T['cut_wide']-0.9}:d=0.9")
pop = lib('bubble_02*')
sfx = [(pop, T['card1_pop'], -6, ''), (lib('swish-1.*'), T['point'], -4, ''),
       (lib('zap1.*'), T['bolt'], -12, 'atrim=0:0.7,afade=t=out:st=0.4:d=0.3'), (lib('*wood_hit_03*'), T['split'], -3, ''),
       (lib('*stones_01*'), T['split']+0.35, -8, ''), (pop, T['bubble1'], -8, ''), (pop, T['bubble2'], -8, 'asetrate=48000*0.9,aresample=48000'),
       (lib('*scratch-speed*'), T['cut_wall']-0.05, -6, ''),
       (lib('*stones_02*'), T['cut_wall']+0.15, -5, ''), (lib('*stones_01*'), T['cut_wall']+0.65, -6, ''), (lib('*wood_hit_03*'), T['wall_up_end']-0.1, -8, 'asetrate=48000*0.7,aresample=48000'),
       (pop, T['card2_pop'], -6, 'asetrate=48000*1.15,aresample=48000'), (lib('*glass_004*'), T['crack'], -6, ''),
       (lib('*glass_004*'), T['burst'], -4, 'asetrate=48000*1.25,aresample=48000'), (lib('handleCoins2*'), T['burst']+0.1, -8, ''), (pop, T['burst'], -5, ''),
       (lib('*glass_004*'), T['heart'], -9, 'asetrate=48000*1.5,aresample=48000')]
for path, at, g, extra in sfx: add(path, at, g, extra)
# vibration du téléphone : synthèse locale (3 impulsions graves)
add("sine=frequency=165:duration=0.75", T['buzz'], -14, "tremolo=f=28:d=0.9,volume='if(lt(mod(t,0.27),0.19),1,0)':eval=frame,lowpass=f=900", lavfi=True)
cmd = ['ffmpeg', '-v', 'error', '-y']
for path, lavfi in ins: cmd += (['-f', 'lavfi', '-i', path] if lavfi else ['-i', path])
graph = ';'.join(fl) + ';' + ''.join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{D},apad=whole_dur={D},alimiter=limit=0.89[m]"
out = P/'b6/audio/mix.wav'; out.parent.mkdir(exist_ok=True)
subprocess.run(cmd + ['-filter_complex', graph, '-map', '[m]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', str(out)], check=True)
print(out, hashlib.sha256(out.read_bytes()).hexdigest())
