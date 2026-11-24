"""Mixe voix (vitesse d'origine), effets et musique en une piste de 30 s (ffmpeg)."""
import json, subprocess, hashlib
from pathlib import Path
P = Path(__file__).resolve().parents[1]; T = json.load(open(P/'b6/timing.json')); LIB = P/'audio/library/audio'
def lib(name): return str(next(LIB.rglob(name)))
D = T['duration']; ins = []; fl = []; labels = []
def add(path, at, gain_db, extra='', lavfi=False):
    i = len(ins); ins.append((path, lavfi))
    fl.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo{(','+extra) if extra else ''},volume={gain_db}dB,adelay={int(at*1000)}:all=1[a{i}]"); labels.append(f"[a{i}]")
GAIN = {'01_elle_vo': 4.5, '02_elle': -1.5, '03_lui': -1, '04_elle': -1.5, '05_lui': -1.5, '06_lui': 11, '07_elle': 4.5, '08_elle_vo': 2}
for lid, at in T['lines'].items(): add(str(P/f'audio/lines/{lid}.mp3'), at, GAIN[lid], f"atrim=0:{T['dur'][lid]},afade=t=out:st={T['dur'][lid]-0.06}:d=0.06")
cw, cz = T['cut_wall'], T['cut_wide']
# musique : comédie forte pendant la dispute, coupure nette au mur, silence avant « Ton rire », chaleur à la réconciliation
add(lib('bgm-monkeys*'), 0, -13.5, f"atrim=7.4:{7.4+cw},asetpts=PTS-STARTPTS,afade=t=in:d=0.08,afade=t=out:st={cw-0.1}:d=0.1")
add(lib('bgm-morning*'), cz, -10.5, f"atrim=6:{6+D-cz},asetpts=PTS-STARTPTS,afade=t=in:d=0.35,afade=t=out:st={D-cz-0.8}:d=0.8")
pop = lib('bubble_02*'); sw = lib('swish-1.*'); hit = lib('*wood_hit_03*'); gl = lib('*glass_004*')
sfx = [(lib('zap1.*'), 0.0, -9, 'atrim=0:0.8,afade=t=out:st=0.5:d=0.3'), (hit, 0.02, -6, ''),
       (pop, T['card1_pop'], -3, ''), (sw, T['cut_card'], -2, ''), (sw, T['cut_dispute'], -3, ''), (hit, T['lines']['03_lui'], -8, 'asetrate=48000*1.2,aresample=48000'),
       (hit, T['split'], 0, ''), (lib('*stones_01*'), T['split']+0.2, -5, ''), (lib('zap1.*'), T['split'], -12, 'atrim=0:0.5,afade=t=out:st=0.3:d=0.2'),
       (sw, T['cut_elle1'], -2, ''), (pop, T['bubble1'], -4, ''), (sw, T['cut_lui1'], -2, ''), (pop, T['bubble2'], -4, 'asetrate=48000*0.9,aresample=48000'),
       (lib('*scratch-speed*'), cw-0.05, -3, ''), (lib('*stones_02*'), cw+0.08, -2, ''), (lib('*stones_01*'), cw+0.3, -4, ''), (hit, T['wall_up_end'], -3, 'asetrate=48000*0.7,aresample=48000'),
       (pop, T['card2_pop'], -3, 'asetrate=48000*1.15,aresample=48000'), (sw, T['cut_card2'], -4, ''), (gl, T['crack'], -3, ''),
       (gl, T['burst'], -1, 'asetrate=48000*1.25,aresample=48000'), (lib('handleCoins2*'), T['burst']+0.08, -4, ''), (pop, T['burst'], -2, ''), (hit, T['burst'], -6, ''),
       (gl, T['heart'], -6, 'asetrate=48000*1.5,aresample=48000'), (pop, T['endcard'], -5, 'asetrate=48000*1.3,aresample=48000')]
for path, at, g, extra in sfx: add(path, at, g, extra)
# vibration du téléphone : synthèse locale
add("sine=frequency=165:duration=0.5", T['buzz'], -10, "tremolo=f=28:d=0.9,volume='if(lt(mod(t,0.27),0.19),1,0)':eval=frame,lowpass=f=900", lavfi=True)
cmd = ['ffmpeg', '-v', 'error', '-y']
for path, lavfi in ins: cmd += (['-f', 'lavfi', '-i', path] if lavfi else ['-i', path])
graph = ';'.join(fl) + ';' + ''.join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{D},apad=whole_dur={D},alimiter=limit=0.89[m]"
out = P/'b6/audio/mix.wav'; out.parent.mkdir(exist_ok=True)
subprocess.run(cmd + ['-filter_complex', graph, '-map', '[m]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', str(out)], check=True)
print(out, hashlib.sha256(out.read_bytes()).hexdigest())
