"""Prépare les calques du décor et des accessoires (b6/art) à partir des peintures Gemini détourées."""
import math, random
from pathlib import Path
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
P = Path(__file__).resolve().parents[1]; CUT = P/'art/cut'; SRC = P/'art/src'; OUT = P/'b6/art'; OUT.mkdir(exist_ok=True)
FONT = str(P/'b6/fonts/ArchivoBlack.ttf'); INK = (58, 34, 40, 255)
def fit(im, w=None, h=None):
    s = (w/im.width) if w else (h/im.height); return im.resize((round(im.width*s), round(im.height*s)), Image.Resampling.LANCZOS)
def cut(name): return Image.open(CUT/f'{name}.png').convert('RGBA')

# pièce : couvre le monde 900x1575 (cadre 720x1280 + marge caméra)
room = Image.open(SRC/'room-v1.png').convert('RGB'); s = max(900/room.width, 1575/room.height)
room = room.resize((round(room.width*s), round(room.height*s)), Image.Resampling.LANCZOS)
x0 = (room.width-900)//2; y0 = (room.height-1575)//2; room.crop((x0, y0, x0+900, y0+1575)).convert('RGBA').save(OUT/'room.png')

# canapé : deux moitiés séparées par une déchirure en zigzag
sofa = fit(cut('sofa'), w=640); W, H = sofa.size; random.seed(7)
pts = [(W//2+random.randint(-9, 9), y) for y in range(-10, H+20, 22)]
ml = Image.new('L', (W, H), 0); ImageDraw.Draw(ml).polygon([(0, -10)]+pts+[(0, H+20)], fill=255)
a = sofa.getchannel('A')
for name, mask in (('sofa_left', ml), ('sofa_right', Image.eval(ml, lambda v: 255-v))):
    half = sofa.copy(); half.putalpha(Image.composite(a, Image.new('L', (W, H), 0), mask))
    edge = Image.new('RGBA', (W, H)); ImageDraw.Draw(edge).line(pts, fill=INK, width=5)
    edge.putalpha(Image.composite(edge.getchannel('A'), Image.new('L', (W, H), 0), a)); half.alpha_composite(edge); half.save(OUT/f'{name}.png')

# mur de briques (100 x 700) avec contour à l'encre
wall = Image.open(SRC/'wall-v1.png').convert('RGB').resize((520, 520), Image.Resampling.LANCZOS)
strip = Image.new('RGB', (100, 700)); strip.paste(wall.crop((60, 0, 160, 520)), (0, 0)); strip.paste(wall.crop((60, 0, 160, 520)), (0, 520))
strip = strip.convert('RGBA'); d = ImageDraw.Draw(strip); d.rectangle((0, 0, 99, 699), outline=INK, width=5); d.rectangle((0, 0, 99, 16), fill=(120, 28, 34, 255), outline=INK, width=4)
strip.save(OUT/'wall.png')

for name, h in (('phone', 104), ('bolt', 190), ('heart_gold', 150)): fit(cut(name), h=h).save(OUT/f'{name}.png')

def text_block(lines, size, fill, stroke=None, sw=0, spacing=8, pad=14):
    f = ImageFont.truetype(FONT, size); tmp = ImageDraw.Draw(Image.new('RGBA', (8, 8)))
    boxes = [tmp.textbbox((0, 0), l, font=f, stroke_width=sw) for l in lines]; w = max(b[2]-b[0] for b in boxes)+2*pad
    lh = size+spacing; im = Image.new('RGBA', (w, lh*len(lines)+2*pad)); d = ImageDraw.Draw(im)
    for i, l in enumerate(lines): d.text((w/2, pad+i*lh), l, font=f, fill=fill, anchor='ma', stroke_width=sw, stroke_fill=stroke)
    return im

def card(lines, name):
    base = fit(cut('card'), h=400); c = base.copy(); px = np.asarray(c).copy(); H, W = px.shape[:2]
    # efface les petits symboles de carte à jouer : repeint l'intérieur avec le rose échantillonné
    inner = Image.new('L', (W, H), 0); ImageDraw.Draw(inner).rounded_rectangle((16, 16, W-17, H-17), radius=22, fill=255)
    pink = tuple(int(v) for v in px[H//2, W//2, :3]); c.paste(Image.new('RGBA', (W, H), pink+(255,)), (0, 0), inner)
    d = ImageDraw.Draw(c); f = ImageFont.truetype(FONT, 26)
    d.rounded_rectangle((W/2-52, 30, W/2+52, 72), radius=21, fill=(214, 77, 124, 255)); d.text((W/2, 51), 'Bae', font=f, fill='white', anchor='mm')
    t = text_block(lines, 33, (92, 28, 62, 255), spacing=10); c.alpha_composite(t, ((W-t.width)//2, 78+(H-110-t.height)//2)); c.save(OUT/f'{name}.png')
card(['Qui de vous', 'deux ment', 'le mieux ?'], 'card1')
card(['Question', 'suivante :', 'ce que tu', 'préfères chez', "l'autre ?"], 'card2')

# bulles rouges « preuves »
bub = fit(cut('bubble'), w=250)
g = fit(cut('gift'), h=120); b1 = bub.copy(); b1.alpha_composite(g, ((250-g.width)//2, 34)); d = ImageDraw.Draw(b1)
for seg in (((60, 30), (190, 160)), ((190, 30), (60, 160))): d.line(seg, fill=INK, width=17); d.line(seg, fill=(255, 244, 232, 255), width=9)
b1.save(OUT/'bubble_gift.png')
bub.transpose(Image.Transpose.FLIP_LEFT_RIGHT).save(OUT/'bubble_blank.png'); fit(cut('clock'), h=132).save(OUT/'clock.png')

text_block(['Ce jeu de couple', 'a failli', 'nous séparer'], 54, 'white', stroke=(23, 19, 25, 255), sw=6).save(OUT/'title_hook.png')
t1 = text_block(['Bae'], 120, (236, 88, 140, 255), stroke=(23, 19, 25, 255), sw=8); t2 = text_block(['jeu de couple'], 50, 'white', stroke=(23, 19, 25, 255), sw=6)
end = Image.new('RGBA', (max(t1.width, t2.width), t1.height+t2.height-18)); end.alpha_composite(t1, ((end.width-t1.width)//2, 0)); end.alpha_composite(t2, ((end.width-t2.width)//2, t1.height-18)); end.save(OUT/'title_end.png')
print(sorted(p.name for p in OUT.glob('*.png')))
