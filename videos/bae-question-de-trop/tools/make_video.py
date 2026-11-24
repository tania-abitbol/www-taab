"""Chaîne complète pour une vidéo storyboardée : narration → minutage → art → mix → projet B6."""
import sys, json, hashlib, subprocess, base64, os, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, str(Path(__file__).parent)); from boards import BOARDS
P = Path(__file__).resolve().parents[1]; B = P/'b6'; vid = sys.argv[1]; bd = BOARDS[vid]; FONT = str(B/'fonts/ArchivoBlack.ttf'); r30 = lambda x: round(x*30)/30

# 1. narration : un seul enregistrement (ton homogène), minutage par caractère
says = [b['say'] for b in bd['beats']]; model = bd.get('model', 'eleven_v3'); tag = bd['tag'] if model == 'eleven_v3' else ''; text = (tag+' ' if tag else '')+' '.join(says); nd = P/'audio/narr'; nd.mkdir(parents=True, exist_ok=True)
sp = bd.get('speed', 1.0); h = hashlib.sha256((bd['voice']+text+str(sp)+model).encode()).hexdigest()[:12]; mp3 = nd/f'{vid}-{h}.mp3'; meta = nd/f'{vid}-{h}.json'
if not mp3.exists():
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{bd['voice']}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps({'text': text, 'model_id': model, **({'language_code': 'fr'} if model == 'eleven_v3' else {}), **({'voice_settings': {'speed': sp, 'stability': 0.35, 'similarity_boost': 0.8, 'style': 0.55}} if sp != 1.0 else {})}).encode(), headers={'Content-Type': 'application/json', 'xi-api-key': os.environ.get('ELEVENLABS_API_KEY', 'proxy-injected')})
    r = json.load(urllib.request.urlopen(req, timeout=180)); mp3.write_bytes(base64.b64decode(r['audio_base64'])); json.dump(r['alignment'], open(meta, 'w'), ensure_ascii=False)
al = json.load(open(meta)); chars = al['characters']; st = al['character_start_times_seconds']; en = al['character_end_times_seconds']
assert ''.join(chars) == text, 'alignement inattendu'
alen = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(mp3)], capture_output=True, text=True).stdout)
D = r30(min(alen, en[-1]+.15)+.45); pos = len(tag)+1 if tag else 0; offs = []
for s in says: offs.append(pos); pos += len(s)+1
t0s = [0.]+[max(0., r30(st[o]-.05)) for o in offs[1:]]
beats = []
for i, b in enumerate(bd['beats']):
    nb = {k: v for k, v in b.items() if k not in ('say', 'label', 'sfx')}; nb['t0'] = t0s[i]; nb['t1'] = t0s[i+1] if i+1 < len(says) else D; nb['say'] = b['say']; beats.append(nb)

# 2. gros textes et cartes
def text_img(lines, size=60, fill='white'):
    f = ImageFont.truetype(FONT, size); tmp = ImageDraw.Draw(Image.new('RGBA', (8, 8))); sw = 7; pad = 16
    while max(tmp.textbbox((0, 0), l, font=f, stroke_width=sw)[2] for l in lines) > 640: size -= 2; f = ImageFont.truetype(FONT, size)
    w = max(tmp.textbbox((0, 0), l, font=f, stroke_width=sw)[2] for l in lines)+2*pad; lh = size+10; im = Image.new('RGBA', (w, lh*len(lines)+2*pad)); d = ImageDraw.Draw(im)
    for i, l in enumerate(lines): d.text((w/2, pad+i*lh), l, font=f, fill=fill if i == 0 or len(lines) < 2 else (255, 214, 92, 255), anchor='ma', stroke_width=sw, stroke_fill=(23, 19, 25, 255))
    return im
for f in (B/'art').glob('txt_*.png'): f.unlink()
if not (B/'art/card3.png').exists():
    c = Image.open(B/'art/card1.png').convert('RGBA'); W, H = c.size; inner = Image.new('L', (W, H), 0); ImageDraw.Draw(inner).rounded_rectangle((24, 86, W-25, H-25), radius=18, fill=255)
    c.paste(Image.new('RGBA', (W, H), c.getpixel((W//2, H-40))), (0, 0), inner); ImageDraw.Draw(c).text((W/2, H/2+20), '?', font=ImageFont.truetype(FONT, 190), fill=(92, 28, 62, 255), anchor='mm'); c.save(B/'art/card3.png')
labels = {}
for i, b in enumerate(bd['beats']):
    if b.get('label'):
        key = '|'.join(b['label'])
        if key not in labels: labels[key] = f'txt_{vid}_{len(labels)}'; text_img(b['label'], 46 if b.get('label_y') else 60).save(B/f'art/{labels[key]}.png')
        beats[i]['label'] = labels[key]
art = sorted({'room', 'sofa_left', 'sofa_right', 'phone', 'bolt', 'heart_gold', 'bubble_gift', 'bubble_blank', 'clock'} | {b['card'] for b in beats if b.get('card')} | set(labels.values()))
json.dump({'id': vid, 'duration': D, 'art': art, 'beats': beats}, open(B/'board.json', 'w'), ensure_ascii=False, indent=1)

# 3. mixage : narration + musique + effets calés sur les coupes
def lib(name): return str(next(P.glob(f'audio/library*/audio/**/{name}')))
ins = []; fl = []; lab = []
def add(path, at, g, extra='', lavfi=False):
    i = len(ins); ins.append((path, lavfi)); fl.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo{(','+extra) if extra else ''},volume={g}dB,adelay={int(max(0, at)*1000)}:all=1[a{i}]"); lab.append(f'[a{i}]')
vol = subprocess.run(['ffmpeg', '-v', 'info', '-i', str(mp3), '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
mean = float(vol.split('mean_volume:')[1].split('dB')[0]); add(str(mp3), 0, round(-16.5-mean, 1), 'acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2')
stop = next((b['t0'] for b, s in zip(beats, bd['beats']) if s.get('music_stop')), None); m2 = next((b['t0'] for b, s in zip(beats, bd['beats']) if s.get('music2')), None); mf = bd['music_from']
end1 = stop if stop is not None else D
add(lib(bd['music']+'*'), 0, -15, f"atrim={mf}:{round(mf+end1, 3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.08,afade=t=out:st={round(end1-(0.1 if stop is not None else 0.7), 3)}:d={0.1 if stop is not None else 0.7}")
if m2 is not None: add(lib('bgm-morning*'), m2, -13, f"atrim=6:{round(6+D-m2, 3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st={round(D-m2-0.7, 3)}:d=0.7")
SFX = {'pop': ('bubble_02*', -6, ''), 'swish': ('swish-1.*', -5, ''), 'hit': ('*wood_hit_03*', -5, ''), 'zap': ('zap1.*', -13, 'atrim=0:0.6,afade=t=out:st=0.4:d=0.2'), 'stones': ('*stones_01*', -6, ''),
       'scratch': ('*scratch-speed*', -5, ''), 'glass': ('*glass_004*', -6, ''), 'glass2': ('*glass_004*', -4, 'asetrate=48000*1.25,aresample=48000'), 'coins': ('handleCoins2*', -6, '')}
for b, s in zip(beats, bd['beats']):
    for n, name in enumerate(s.get('sfx', [])):
        if name == 'buzz': add('sine=frequency=165:duration=0.5', b['t0'], -12, "tremolo=f=28:d=0.9,volume='if(lt(mod(t,0.27),0.19),1,0)':eval=frame,lowpass=f=900", lavfi=True)
        else: f, g, x = SFX[name]; add(lib(f), b['t0']+.05*n, g, x)
cmd = ['ffmpeg', '-v', 'error', '-y']
for path, lavfi in ins: cmd += (['-f', 'lavfi', '-i', path] if lavfi else ['-i', path])
out = B/'audio/mix.wav'
subprocess.run(cmd+['-filter_complex', ';'.join(fl)+';'+''.join(lab)+f'amix=inputs={len(lab)}:normalize=0:duration=longest,atrim=0:{D},apad=whole_dur={D},alimiter=limit=0.84[m]', '-map', '[m]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', str(out)], check=True)

# 4. sous-titres (une ligne, coupés par sens/largeur, calés sur la voix réelle)
font = ImageFont.truetype(FONT, 47); dr = ImageDraw.Draw(Image.new('RGB', (8, 8))); cues = []
for i, s in enumerate(says):
    words = []; j = offs[i]
    for w in s.split(' '): words.append((w, st[j])); j += len(w)+1
    glued = []
    for w, ts in words:   # « et » restent collés au mot qu'ils encadrent
        if glued and (glued[-1][0] == '«' or w in ('»', '»…', '».', '?', '!', ':', '?!')): glued[-1] = (glued[-1][0]+' '+w, glued[-1][1])
        else: glued.append((w, ts))
    words = glued
    # segments de sens (ponctuation), puis découpe équilibrée si trop large
    segs = []; cur = []
    for w, ts in words:
        cur.append((w, ts))
        if w[-1] in '.?!:…»' and not (len(cur) == 1 and segs): segs.append(cur); cur = []
        elif w[-1] in '.?!:…»' and segs: segs[-1] += cur; cur = []
    if cur: segs.append(cur)
    merged = []
    for g in segs:
        width = dr.textlength(' '.join(x for x, _ in g), font=font); n = max(1, -(-int(width)//590))
        if n == 1: merged.append(g); continue
        target = width/n; part = []
        for k_, item in enumerate(g):
            part.append(item); rest = len(g)-k_-1
            if dr.textlength(' '.join(x for x, _ in part), font=font) >= target*.85 and rest >= 1 and len(merged) < 99 and n > 1:
                merged.append(part); part = []; n -= 1
        if part: merged.append(part)
    for g in merged: cues.append(dict(start=round(max(0., g[0][1]-.04), 3), text=' '.join(x for x, _ in g)))
for a, b_ in zip(cues, cues[1:]): a['end'] = b_['start']
cues[-1]['end'] = round(min(D, en[-1]+.2), 3); cues[0]['start'] = max(cues[0]['start'], 0.05)
for c in cues: assert dr.textlength(c['text'], font=font)+8 <= 632 and c['end'] > c['start'], c
json.dump(cues, open(B/'captions.json', 'w'), ensure_ascii=False, indent=1)
json.dump({'narration': ' '.join(c['text'] for c in cues), 'language': 'fr', 'status': 'authored', 'beats': [{'start': b['t0'], 'end': b['t1'], 'action': b['say']} for b in beats]}, open(B/'story.json', 'w'), ensure_ascii=False, indent=1)

# 5. plan natif et projet
CAMS = {'wide': 'Plan large natif 9:16, le couple sur le canapé, haut du cadre pour le gros texte ou la carte.', 'two': 'Plan moyen serré sur les deux, visages au-dessus de la bande de sous-titres.',
        'card': 'Gros plan sur la carte rose, les deux têtes en bas du cadre.', 'elle': 'Gros plan ELLE, visage au-dessus de la bande de sous-titres.', 'lui': 'Gros plan LUI, visage au-dessus de la bande de sous-titres.'}
plan = json.load(open(B/'formats/portrait.json')); plan['shots'] = []
for i, b in enumerate(beats):
    s = dict(id=f'p{i+1:02d}', start=b['t0'], end=b['t1'], composition=CAMS[b.get('cam', 'wide')], action='Illustre la phrase : « '+b['say']+' »',
             camera={'intent': 'Coupe franche sur la phrase, légère poussée, secousse brève sur les impacts.'}, transition='Coupe franche sur la phrase suivante.' if i+1 < len(beats) else 'Fin (boucle sur la question).')
    if b['t1']-b['t0'] < .95: s['short_cut_reason'] = 'Coupe d’action motivée : une phrase courte de la narration = un plan.'
    plan['shots'].append(s)
ids = [s['id'] for s in plan['shots']]
plan['cast_inventory'] = [{'id': 'elle', 'role': 'ELLE, toujours à gauche (sweat rose)', 'shot_ids': ids}, {'id': 'lui', 'role': 'LUI, toujours à droite (t-shirt bleu canard)', 'shot_ids': ids}]
json.dump(plan, open(B/'formats/portrait.json', 'w'), ensure_ascii=False, indent=1)
p = json.load(open(B/'project.json'))
p.update(stage='authored', duration=D, language='fr', voice={'name': 'ElevenLabs eleven_v3, narration en une prise, vitesse d’origine ; mix local voix + musique + effets', 'path': 'audio/mix.wav',
         'sha256': hashlib.sha256(out.read_bytes()).hexdigest(), 'speed': 1, 'source': 'tools/make_video.py'})
core = ['motion_review.py', 'b6_space.py', 'caption_renderer.py', 'b6_puppet.py', 'b6_asset_roles.py', 'b6_actions.py', 'b6_iteration.py', 'b6_character_preflight.py', 'fonts/ArchivoBlack.ttf', 'fonts/OFL-ArchivoBlack.txt']
p['inputs'] = core+['board.json']+[f'art/{a}.png' for a in art]
json.dump(p, open(B/'project.json', 'w'), ensure_ascii=False, indent=2)
print(vid, 'durée', D, '| plans', len(beats)); [print(f"  {b['t0']:5.2f}-{b['t1']:5.2f} {b.get('cam','wide'):5s} {b['say']}") for b in beats]
print('sous-titres :', ' / '.join(c['text'] for c in cues))
