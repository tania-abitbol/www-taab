"""Calcule le minutage v2 (serré, sans temps mort) à partir des durées réelles des répliques."""
import json, subprocess
from pathlib import Path
P = Path(__file__).resolve().parents[1]
d = {f.stem: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)], capture_output=True, text=True).stdout) for f in (P/'audio/lines').glob('*.mp3')}
import re
def effective(f, dur):
    """Coupe le silence de fin de réplique (pas de temps mort entre deux répliques)."""
    log = subprocess.run(['ffmpeg', '-v', 'info', '-i', str(f), '-af', 'silencedetect=noise=-38dB:d=0.12', '-f', 'null', '-'], capture_output=True, text=True).stderr
    pairs = re.findall(r'silence_start: ([0-9.]+)[\s\S]*?silence_end: ([0-9.]+)', log)
    for a_, b_ in pairs:
        if float(a_) > .5*dur and float(b_) >= dur-.12: return float(a_)+.12
    return dur
d = {k: effective(P/f'audio/lines/{k}.mp3', v) for k, v in d.items()}
T = {}; L = {}; r = lambda x: round(x*30)/30
L['01_elle_vo'] = 0.10; T['card1_pop'] = 1.85; T['cut_card'] = r(1.9)
L['02_elle'] = r(L['01_elle_vo']+d['01_elle_vo']+.1); T['cut_dispute'] = L['02_elle']
L['03_lui'] = r(L['02_elle']+d['02_elle']-.05)
T['split'] = r(L['03_lui']+d['03_lui']+.05); T['split_end'] = T['split']+.5
L['04_elle'] = r(T['split']+.5); T['cut_elle1'] = L['04_elle']; T['bubble1'] = L['04_elle']+.3
L['05_lui'] = r(L['04_elle']+d['04_elle']+.05); T['cut_lui1'] = L['05_lui']; T['bubble2'] = L['05_lui']+.3
T['cut_wall'] = r(L['05_lui']+d['05_lui']+.15); T['bubbles_out'] = T['cut_wall']-.05; T['wall_up_end'] = T['cut_wall']+.45
T['buzz'] = T['cut_wall']+.6; T['card2_pop'] = T['buzz']+.5; T['freeze'] = T['card2_pop']+.45; T['cut_card2'] = r(T['card2_pop']+.3)
T['cut_close'] = r(T['card2_pop']+1.55); T['hand_wall'] = T['cut_close']+.3; T['crack'] = T['hand_wall']+.1
L['06_lui'] = r(T['cut_close']+.55)
T['cut_elle2'] = r(L['06_lui']+d['06_lui']+.2); T['cut_wide'] = r(T['cut_elle2']+.9); T['burst'] = T['cut_wide']+.03
T['rejoin'] = T['cut_wide']+.12; T['rejoin_end'] = T['rejoin']+.55; T['lean'] = T['rejoin_end']-.05; T['lean_end'] = T['lean']+.45; T['heart'] = T['lean']+.25
L['07_elle'] = r(T['lean']+.2); T['endcard'] = r(L['07_elle']+d['07_elle']+.0); L['08_elle_vo'] = r(T['endcard']+.15)
T['duration'] = r(L['08_elle_vo']+d['08_elle_vo']+.35); T['lines'] = L; T['dur'] = {k: round(v, 3) for k, v in d.items()}
json.dump(T, open(P/'b6/timing.json', 'w'), indent=1)
for k, v in sorted(((k, v) for k, v in T.items() if isinstance(v, float)), key=lambda x: x[1]): print(f'{v:6.2f} {k}')
print(L)
