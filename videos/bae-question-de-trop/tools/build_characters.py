"""Assemble les paquets de personnages B6 (b6-puppet/1, binding v2) à partir des découpes."""
import json, hashlib, math
from pathlib import Path
import numpy as np, cv2
from PIL import Image
P = Path(__file__).resolve().parents[1]; CUT = P/'art/cut'; B6 = P/'b6'

def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def M(s, tx, ty): return [[s, 0, tx], [0, s, ty], [0, 0, 1]]
def n(deg): return [round(math.cos(math.radians(deg)), 6), round(math.sin(math.radians(deg)), 6)]

SPEC = {
 'elle': dict(body='elle_body', body_scale=.42, body_bottom=-70, head_scale=.82, head_bottom=-185, head_dx=-14, default='smug',
   heads=['smug', 'shock', 'angry', 'shout', 'sulk', 'soft', 'wink', 'laugh'], facing='right',
   sockets={'left': (48, 190), 'right': (338, 172)}, outlets={'left': [(15, 170), (85, 212)], 'right': [(322, 186), (358, 150)]},
   arms={'right': dict(normal=5, pole=-1, upper=[-85, 110], poses=dict(rest=[85, 8], reach=[-80, 45], offer=[-70, 25], receive=[90, 95], retract=[10, 30])),
         'left': dict(normal=155, pole=-1, upper=[85, 225], poses=dict(rest=[95, 8], reach=[150, 30], offer=[215, 50], receive=[100, 40], retract=[150, 30]))},
   hips=(-20, 22), foot_forward=1, ink='#3a2622'),
 'lui': dict(body='lui_body', body_scale=.56, body_bottom=-70, head_scale=.72, head_bottom=-168, head_dx=-4, default='smug',
   heads=['smug', 'shout', 'shout2', 'sulk', 'soft', 'tender'], facing='left',
   sockets={'left': (26, 88), 'right': (228, 90)}, outlets={'left': [(8, 70), (44, 106)], 'right': [(206, 106), (248, 72)]},
   arms={'left': dict(normal=175, pole=1, upper=[70, 265], poses=dict(rest=[95, 8], reach=[250, 65], offer=[240, 45], receive=[90, 95], retract=[170, 30])),
         'right': dict(normal=25, pole=1, upper=[-45, 95], poses=dict(rest=[85, 8], reach=[30, 30], offer=[-35, 50], receive=[80, 40], retract=[30, 30]))},
   hips=(-22, 20), foot_forward=-1, ink='#2e2420'),
}
for cid, s in SPEC.items():
    d = B6/'characters'/cid; (d/'tq').mkdir(parents=True, exist_ok=True)
    body = Image.open(CUT/f"{s['body']}.png").convert('RGBA'); body.save(d/'tq/body.png')
    bs = s['body_scale']; bm = M(bs, -body.width*bs/2, s['body_bottom']-body.height*bs)
    L = lambda px: [round(bm[0][0]*px[0]+bm[0][2], 3), round(bm[1][1]*px[1]+bm[1][2], 3)]
    balpha = np.asarray(body)[..., 3]
    heads = {}
    for h in s['heads']:
        im = Image.open(CUT/f"{cid}_head_{h}.png").convert('RGBA'); a = np.asarray(im)[..., 3]
        ys, xs = np.nonzero(a > 40); im = im.crop((xs.min()-2, ys.min()-2, xs.max()+3, ys.max()+3))
        im.save(d/f'tq/head_{h}.png'); hs = s['head_scale']
        heads[h] = dict(path=f'tq/head_{h}.png', sha256=sha(d/f'tq/head_{h}.png'), image_to_local=M(hs, s['head_dx']-im.width*hs/2, s['head_bottom']-im.height*hs))
    arms = {}
    for side, a in s['arms'].items():
        sx, sy = s['sockets'][side]; yy, xx = np.mgrid[:body.height, :body.width]
        cuff = ((balpha > 200) & ((xx-sx)**2+(yy-sy)**2 <= (38/bs)**2)).astype(np.uint8)*255
        Image.fromarray(cuff, 'L').save(d/f'tq/cuff-{side}.png')
        o = [L(p) for p in s['outlets'][side]]
        arms[side] = dict(socket=L((sx, sy)), exit_normal=n(a['normal']), exit_center=[(o[0][0]+o[1][0])/2, (o[0][1]+o[1][1])/2], outlet_segment=o,
            lengths=[50, 48], pole=a['pole'], upper_angle_range_deg=a['upper'], elbow_bend_range_deg=[4, 120], max_ik_offset=90, ink_width=6.2, hand_radius=8.5,
            layer='front', cuff=dict(path=f'tq/cuff-{side}.png', sha256=sha(d/f'tq/cuff-{side}.png'), image_to_local=bm), poses=a['poses'])
    legs = {side: dict(hip=[x, -76], ankle=[x+(2 if x > 0 else -2), -8], ink_width=6.2, foot_size=[18, 7], foot_forward=s['foot_forward'], plant_y=0)
            for side, x in zip(('left', 'right'), s['hips'])}
    pkg = dict(schema='b6-puppet/1', binding_version=2, character_id=cid, display_name=cid.upper(),
        views={'tq': dict(facing=s['facing'], sprites=dict(body=dict(path='tq/body.png', sha256=sha(d/'tq/body.png'), image_to_local=bm), head=heads[s['default']], heads=heads),
            arms=arms, legs=legs, ink_color=s['ink'], neck_attachment=None)},
        provenance='Planches Gemini 2.5 Flash Image générées pour ce projet (art/src), détourées par tools/prep_assets.py')
    json.dump(pkg, open(d/'draft.json', 'w'), indent=1)
    print(cid, 'body local', bm, 'sockets', {k: v['socket'] for k, v in arms.items()})

# --- attache du cou : bande réellement peinte, couverte par le corps et par toutes les têtes
for cid in SPEC:
    d = B6/'characters'/cid; pkg = json.load(open(d/'draft.json')); v = pkg['views']['tq']; k = 4; box = (-70, -240, 70, -140)
    def raster(spr):
        im = np.asarray(Image.open(d/spr['path']))[..., 3]; m = np.array(spr['image_to_local'])
        T = np.array([[k, 0, -box[0]*k], [0, k, -box[1]*k], [0, 0, 1]]) @ m
        return cv2.warpAffine(im, T[:2], ((box[2]-box[0])*k, (box[3]-box[1])*k)) > 200
    b = raster(v['sprites']['body']); both = b.copy()
    for h in v['sprites']['heads'].values(): both &= raster(h)
    best = None
    for y in range(0, both.shape[0]-6*k):
        band = both[y:y+6*k].all(axis=0); xs = np.nonzero(band)[0]
        if len(xs) == 0: continue
        runs = np.split(xs, np.nonzero(np.diff(xs) > 1)[0]+1); r = max(runs, key=len)
        if best is None or len(r) > best[0]: best = (len(r), y, r[0], r[-1])
    w, y, x0, x1 = best; lx0 = x0/k+box[0]+1; lx1 = x1/k+box[0]-1; ly0 = y/k+box[1]+.5; ly1 = ly0+5
    v['neck_attachment'] = dict(mount_polygon=[[lx0, ly0], [lx1, ly0], [lx1, ly1], [lx0, ly1]], min_overlap_fraction=.7, min_overlap_thickness=2.0)
    json.dump(pkg, open(d/'package.json', 'w'), indent=1, ensure_ascii=False); (d/'draft.json').unlink()
    print(cid, 'neck band', v['neck_attachment']['mount_polygon'])
json.dump({'schema': 'b6-character-registry/1', 'actors': [{'id': c, 'package': f'characters/{c}', 'views': ['tq']} for c in SPEC], 'rigid_cast': []},
          open(B6/'characters.json', 'w'), indent=1)
