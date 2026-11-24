"""Écrit captions.json, story.json, le plan natif 9:16 et project.json à partir du minutage réel des voix."""
import json, hashlib, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
P = Path(__file__).resolve().parents[1]; B = P/'b6'; T = json.load(open(B/'timing.json'))
PHRASES = {'01_elle_vo': ['Ce jeu de couple', 'a failli nous séparer.'], '02_elle': ['Attends…', 'pourquoi tu me', 'montres du doigt ?'], '03_lui': ['Parce que', "c'est évident !"],
           '04_elle': ['Et le cadeau', 'perdu par la poste ?'], '05_lui': ['Et toi,', "« j'arrive dans", 'cinq minutes » ?!'], '06_lui': ['…Ton rire.'],
           '07_elle': ['…Ok.', 'Question suivante.'], '08_elle_vo': ['Et vous,', 'quelle question', 'a lancé la guerre ?']}
font = ImageFont.truetype(str(B/'fonts/ArchivoBlack.ttf'), 47); dr = ImageDraw.Draw(Image.new('RGB', (8, 8)))
cues = []
for lid, at in T['lines'].items():
    meta = json.load(open(P/f'audio/lines/{lid}.json')); al = meta['alignment']; chars = ''.join(al['characters']); st = al['character_start_times_seconds']
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(P/f'audio/lines/{lid}.mp3')], capture_output=True, text=True).stdout)
    pos = 0; starts = []
    for ph in PHRASES[lid]:
        core = ph.lstrip('…« ').split(' ')[0]; j = chars.find(core, pos); assert j >= 0, (lid, ph, chars)
        starts.append(st[j]); pos = j+len(core)
    starts[0] = max(0., starts[0]-.05)
    for n, ph in enumerate(PHRASES[lid]):
        w = dr.textlength(ph, font=font)+8; assert w <= 720-88, (ph, w)
        cues.append(dict(start=round(at+starts[n], 3), end=round(at+(starts[n+1] if n+1 < len(starts) else dur), 3), text=ph))
for a, b in zip(cues, cues[1:]): assert a['end'] <= b['start']+1e-6, (a, b)
cues[-1]['end'] = min(cues[-1]['end'], T['duration'])
json.dump(cues, open(B/'captions.json', 'w'), ensure_ascii=False, indent=1)
json.dump({'narration': ' '.join(c['text'] for c in cues), 'language': 'fr', 'status': 'authored',
           'beats': [{'id': 'etincelle', 'start': 0, 'end': T['split'], 'action': 'La carte rose sort du téléphone ; ils se pointent du doigt en même temps, éclair rouge.'},
                     {'id': 'escalade', 'start': T['split'], 'end': T['cut_wall'], 'action': 'Le canapé se fend, bulles rouges de preuves (cadeau barré, horloge affolée).'},
                     {'id': 'rupture', 'start': T['cut_wall'], 'end': T['cut_wide'], 'action': 'Mur rouge, dos à dos ; nouvelle carte ; il pose la main sur le mur, fissure dorée.'},
                     {'id': 'chute', 'start': T['cut_wide'], 'end': T['duration'], 'action': 'Le mur éclate en confettis dorés, le canapé se recolle, tête contre lui, cœur doré.'}]},
          open(B/'story.json', 'w'), ensure_ascii=False, indent=1)
plan = json.load(open(B/'formats/portrait.json'))
sh = lambda i, a, b, comp, act, cam, tr, assets: dict(id=i, start=a, end=b, composition=comp, action=act, camera=cam, transition=tr, asset_inputs=assets)
base_assets = ['art/room.png', 'art/sofa_left.png', 'art/sofa_right.png', 'art/phone.png']
plan['shots'] = [
 sh('etincelle', 0, T['split'], 'Plan large natif 9:16 : ELLE à gauche, LUI à droite sur le canapé, téléphone entre eux ; haut du cadre libre pour l’accroche puis la carte rose ; bande de sous-titres sur les jambes.',
    'Accroche, la carte sort du téléphone, lecture, doigts pointés en même temps, éclair rouge, répliques 2 et 3.', {'intent': 'Lent rapprochement puis recadrage motivé au moment où ils se pointent du doigt ; léger recul avant la rupture.'},
    'Coupe sur l’action : le canapé craque.', base_assets+['art/card1.png', 'art/bolt.png', 'art/title_hook.png']),
 sh('escalade', T['split'], T['cut_wall'], 'Même axe, le canapé s’ouvre : un vide central se crée, les bulles rouges occupent le haut de chaque côté.',
    'Le canapé se fend et les moitiés s’écartent, le téléphone tombe sur le tapis ; répliques 4 et 5 avec bulles de preuves.', {'intent': 'Secousse brève méritée au craquement, puis cadre posé pour lire les bulles.'},
    'Coupe franche (scratch) vers le mur.', base_assets+['art/bubble_gift.png', 'art/bubble_blank.png', 'art/clock.png']),
 sh('mur', T['cut_wall'], T['cut_close'], 'Dos à dos de part et d’autre du mur rouge qui monte au centre ; la nouvelle carte s’élève devant le mur.',
    'Le mur monte, bras croisés ; le téléphone vibre ; la carte « Question suivante » apparaît ; ils se figent.', {'intent': 'Légère secousse pendant la montée du mur, puis rapprochement lent vers la carte.'},
    'Coupe vers LUI et le mur.', base_assets+['art/wall.png', 'art/card2.png']),
 sh('fissure', T['cut_close'], T['cut_wide'], 'Plan rapproché sur LUI tourné vers le mur ; main et fissure au-dessus de la bande de sous-titres.',
    'Il pose la main sur le mur, la fissure dorée se propage ; « …Ton rire. »', {'intent': 'Plan rapproché presque fixe, très léger rapprochement pour laisser lire le geste.'},
    'Coupe sur l’explosion du mur.', base_assets+['art/wall.png', 'art/card2.png']),
 sh('chute', T['cut_wide'], T['duration'], 'Retour au plan large : confettis dorés, canapé recollé, les deux rapprochés ; cœur doré et carton de fin en haut.',
    'Le mur éclate, le canapé se recolle, elle pose la tête contre lui, cœur doré, carton « Bae – jeu de couple ».', {'intent': 'Secousse à l’explosion puis rapprochement lent sur le couple réconcilié.'},
    'Fin.', base_assets+['art/heart_gold.png', 'art/title_end.png'])]
ids = [s['id'] for s in plan['shots']]
plan['cast_inventory'] = [{'id': 'elle', 'role': 'ELLE, toujours à gauche (sweat rose)', 'shot_ids': ids}, {'id': 'lui', 'role': 'LUI, toujours à droite (t-shirt bleu canard)', 'shot_ids': ids}]
json.dump(plan, open(B/'formats/portrait.json', 'w'), ensure_ascii=False, indent=1)
p = json.load(open(B/'project.json')); mix = B/'audio/mix.wav'
p.update(stage='authored', duration=T['duration'], language='fr',
         voice={'name': 'ElevenLabs — Mylene (ELLE) et Maxime (LUI), eleven_v3, vitesse d’origine ; mix local voix + musique + effets', 'path': 'audio/mix.wav',
                'sha256': hashlib.sha256(mix.read_bytes()).hexdigest(), 'speed': 1, 'source': 'tools/tts.py puis tools/mix_audio.py'})
extra = ['timing.json']+sorted('art/'+f.name for f in (B/'art').glob('*.png'))
p['inputs'] = [x for x in p['inputs'] if x not in extra]+extra
json.dump(p, open(B/'project.json', 'w'), ensure_ascii=False, indent=2)
for c in cues: print(f"{c['start']:6.2f} {c['end']:6.2f}  {c['text']}")
