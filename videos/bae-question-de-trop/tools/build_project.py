"""Écrit captions.json, story.json, le plan natif 9:16 et project.json à partir du minutage réel des voix."""
import json, hashlib, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
P = Path(__file__).resolve().parents[1]; B = P/'b6'; T = json.load(open(B/'timing.json'))
PHRASES = {'01_elle_vo': ['Ce jeu de couple…', 'a failli nous séparer.'], '02_elle': ['Attends,', 'pourquoi tu me', 'montres du doigt ?!'], '03_lui': ['Parce que', "c'est évident !"],
           '04_elle': ['Et le cadeau', '« perdu par', 'la poste » ?!'], '05_lui': ['Et toi !', "« J'arrive dans", 'cinq minutes » ?!'], '06_lui': ['…Ton rire.'],
           '07_elle': ['Ok…', 'Question suivante.'], '08_elle_vo': ['Et vous,', 'quelle question', 'a lancé la guerre ?']}
font = ImageFont.truetype(str(B/'fonts/ArchivoBlack.ttf'), 47); dr = ImageDraw.Draw(Image.new('RGB', (8, 8)))
cues = []
for lid, at in T['lines'].items():
    meta = json.load(open(P/f'audio/lines/{lid}.json')); al = meta['alignment']; chars = ''.join(al['characters']); st = al['character_start_times_seconds']
    dur = T['dur'][lid]
    pos = 0; starts = []
    for ph in PHRASES[lid]:
        core = ph.lstrip('…« ').split(' ')[0].rstrip('…'); j = chars.find(core, pos); assert j >= 0, (lid, ph, chars)
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
L = T['lines']; A = base_assets
plan['shots'] = [
 sh('accroche', 0, T['cut_card'], 'Plan large natif 9:16 : déjà en pleine dispute, doigts pointés, éclair rouge entre eux ; accroche en gros en haut du cadre.',
    'Ouverture dans le conflit : ils crient en se pointant du doigt pendant la voix off d’accroche.', {'intent': 'Secousse à l’éclair puis rapprochement lent.'}, 'Coupe sur la carte qui sort du téléphone.', A+['art/bolt.png', 'art/title_hook.png', 'art/card1.png']),
 sh('carte', T['cut_card'], T['cut_dispute'], 'Gros plan sur la carte rose, les deux têtes en bas du cadre.', 'La carte « Qui de vous deux ment le mieux ? » est lue.', {'intent': 'Gros plan fixe avec très léger rapprochement, temps de lecture.'}, 'Coupe sur la dispute.', A+['art/card1.png', 'art/bolt.png']),
 sh('dispute', T['cut_dispute'], T['cut_elle1'], 'Plan moyen serré sur le couple, carte au-dessus.', 'Répliques 2 et 3 avec gestes, puis le canapé se fend et les moitiés s’écartent, le téléphone tombe.',
    {'intent': 'Recadrage sec vers celui qui parle, secousse à chaque attaque, recul brusque quand le canapé craque.'}, 'Coupe gros plan ELLE.', A+['art/card1.png', 'art/bolt.png']),
 sh('preuve-elle', T['cut_elle1'], T['cut_lui1'], 'Gros plan ELLE avec sa bulle rouge (cadeau barré) au-dessus.', 'Réplique 4, geste d’accusation.', {'intent': 'Gros plan avec légère poussée.'}, 'Coupe gros plan LUI.', A+['art/bubble_gift.png']),
 sh('preuve-lui', T['cut_lui1'], T['cut_wall'], 'Gros plan LUI avec sa bulle rouge (horloge affolée) au-dessus.', 'Réplique 5, geste d’accusation.', {'intent': 'Gros plan avec légère poussée.'}, 'Coupe franche (scratch) vers le mur.', A+['art/bubble_blank.png', 'art/clock.png']),
 sh('mur', T['cut_wall'], T['cut_card2'], 'Plan large : dos à dos, bras croisés, le mur rouge jaillit au centre.', 'Le mur monte, le téléphone vibre, la nouvelle carte sort.', {'intent': 'Secousse pendant la montée du mur, puis cadre posé.'}, 'Coupe sur la carte.', A+['art/wall.png', 'art/card2.png']),
 sh('carte2', T['cut_card2'], T['cut_close'], 'Gros plan sur la carte « Question suivante » devant le mur, têtes en bas du cadre.', 'Lecture de la carte ; ils se figent.', {'intent': 'Gros plan fixe, temps de lecture.'}, 'Coupe vers LUI et le mur.', A+['art/wall.png', 'art/card2.png']),
 sh('fissure', T['cut_close'], T['cut_elle2'], 'Plan rapproché sur LUI tourné vers le mur ; main et fissure au-dessus de la bande de sous-titres.', 'Il pose la main sur le mur, la fissure dorée se propage ; « …Ton rire. »', {'intent': 'Plan presque fixe, très léger rapprochement, silence.'}, 'Coupe sur la réaction d’ELLE.', A+['art/wall.png', 'art/card2.png']),
 sh('reaction', T['cut_elle2'], T['cut_wide'], 'Gros plan ELLE qui se retourne vers le mur, visage adouci.', 'Réaction silencieuse.', {'intent': 'Gros plan fixe.'}, 'Coupe sur l’explosion du mur.', A+['art/wall.png']),
 sh('chute', T['cut_wide'], T['duration'], 'Plan large : confettis dorés, canapé recollé, les deux rapprochés ; cœur doré et carton de fin en haut.', 'Le mur éclate, le canapé se recolle, elle pose la tête contre lui, cœur doré, carton « Bae – jeu de couple ».',
    {'intent': 'Secousse à l’explosion puis rapprochement lent sur le couple réconcilié.'}, 'Fin.', A+['art/heart_gold.png', 'art/title_end.png'])]
for s_ in plan['shots']:
    if s_['end']-s_['start'] < .95: s_['short_cut_reason'] = 'Plan de réaction bref et motivé (regard, puis explosion du mur) ; ' + f"{s_['end']-s_['start']:.2f} s"
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
