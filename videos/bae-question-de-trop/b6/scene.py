"""Moteur de montage B6 piloté par un storyboard (board.json) — natif 9:16, 720x1280.

Chaque phrase de la narration est un plan : cadrage, expressions, poses de bras, accessoires
et gros texte. Coupes franches entre les plans ; à l'intérieur d'un plan : poussée de caméra,
secousse, bouche qui bouge, corps qui se penche. Tout le décor est derrière les personnages.
"""
import json, math, random
from pathlib import Path
import numpy as np, cv2
from PIL import Image

_C = {}
OX, OY = 90, 148; S = 1.45; FEET = 995.0
ARM = {'elle': {'rest': {}, 'point': {'right': ('reach', 1)}, 'jab': {'right': ('offer', 1)}, 'fold': {'right': ('receive', 1)}, 'up': {'left': ('offer', 1)}, 'shrug': {'left': ('reach', 1)},
                'both': {'right': ('offer', 1), 'left': ('offer', 1)}},
       'lui': {'rest': {}, 'point': {'left': ('reach', 1)}, 'jab': {'left': ('offer', 1)}, 'fold': {'left': ('receive', 1)}, 'up': {'right': ('offer', 1)}, 'shrug': {'right': ('reach', 1)},
               'both': {'left': ('offer', 1), 'right': ('offer', 1)}}}

def sm(v):
    v = min(1., max(0., v)); return v*v*(3-2*v)
def lerp(a, b, u): return a+(b-a)*u
def pop(u):
    if u <= 0: return 0.
    if u >= 1: return 1.
    return (1-(1-u)**3)*(1+.35*math.sin(u*math.pi))

def paste(canvas, sprite, cx, cy, scale=1., rot=0., alpha=1., flip=False):
    if alpha <= 0 or scale <= 0: return
    h, w = sprite.shape[:2]; c, s = math.cos(math.radians(rot))*scale, math.sin(math.radians(rot))*scale; fx = -1. if flip else 1.
    M = np.array([[c*fx, -s, cx+OX-(c*fx*w/2-s*h/2)], [s*fx, c, cy+OY-(s*fx*w/2+c*h/2)]]); r = math.hypot(w, h)*scale/2+3
    x0, y0 = max(0, int(cx+OX-r)), max(0, int(cy+OY-r)); x1, y1 = min(canvas.shape[1], int(cx+OX+r)+1), min(canvas.shape[0], int(cy+OY+r)+1)
    if x1 <= x0 or y1 <= y0: return
    M[:, 2] -= (x0, y0)
    warped = cv2.warpAffine(sprite, M, (x1-x0, y1-y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    a = warped[..., 3:4].astype(np.float32)*(alpha/255.); roi = canvas[y0:y1, x0:x1]; roi[..., :3] = (warped[..., :3]*a+roi[..., :3]*(1-a)).astype(np.uint8)

def setup(c):
    base = c.base; B = json.loads((base/'board.json').read_text()); names = set(B['art'])
    art = {n: np.asarray(Image.open(base/'art'/(n+'.png')).convert('RGBA')).copy() for n in names}
    rnd = random.Random(11)
    conf = [dict(x=360+rnd.uniform(-60, 60), y=rnd.uniform(420, 900), vx=rnd.uniform(-560, 560), vy=rnd.uniform(-950, -150), w=rnd.uniform(9, 20), h=rnd.uniform(6, 12),
                 r=rnd.uniform(0, 360), vr=rnd.uniform(-500, 500), col=rnd.choice([(244, 196, 48), (255, 221, 110), (226, 164, 30), (255, 240, 180), (236, 88, 140)])) for _ in range(150)]
    rt = c.puppet_runtime; ch = c.character_packages
    return dict(B=B, art=art, rt=rt, conf=conf, elle=rt.Puppet(ch['elle'], 'tq', 'elle'), lui=rt.Puppet(ch['lui'], 'tq', 'lui'), last=None)

def beat_at(B, t):
    bs = B['beats']
    for i, b in enumerate(bs):
        if t < b['t1']-1e-9: return i, b
    return len(bs)-1, bs[-1]

def layout(b, u):
    """Positions monde (ELLE, LUI, demi-écart du canapé) ; u = temps écoulé dans le plan."""
    g0, g1 = b.get('gap_from', b.get('gap', 0)), b.get('gap', 0); g = lerp(g0, g1, sm(u/.35)) if g0 != g1 else g1; d = 62*g
    if b.get('cuddle'): return 262, 498, 0.
    return 190-d, 530+d, d

def camera(b, u, dur, ex, lx):
    cam = b.get('cam', 'wide')
    z, fx, fy = {'wide': (1.0, 360, 640), 'two': (1.16, 360, 630), 'card': (1.42, 360, 330), 'elle': (1.42, ex+32, 603), 'lui': (1.42, lx-30, 603)}[cam]
    if cam in ('elle', 'lui'): fx = min(max(fx, -90+360/z+4), 810-360/z-4)
    z *= 1+(.05 if cam != 'wide' else .035)*min(1., u/max(dur, .1))
    k = max(0., 1-u/.3); a = b.get('shake', 0)
    return np.array([[z, 0, 360-z*fx+a*k*math.sin(u*93)], [0, z, 640-z*fy+a*.8*k*math.cos(u*81)], [0, 0, 1.]])

def world(st, b, prev, t, u):
    art = st['art']; cv = art['room'].copy(); ex, lx, d = layout(b, u)
    sh = np.zeros(cv.shape[:2], np.float32)
    for x in (ex, lx): cv2.ellipse(sh, (int(x+OX), int(FEET+8+OY)), (95, 15), 0, 0, 360, .30, -1)
    sh = cv2.GaussianBlur(sh, (0, 0), 9)[..., None]; cv[..., :3] = (cv[..., :3]*(1-sh)+np.array([70, 44, 60])*sh).astype(np.uint8)
    paste(cv, art['sofa_left'], 360-d, 868); paste(cv, art['sofa_right'], 360+d, 868)
    new = lambda k: b.get(k) and (prev is None or prev.get(k) != b.get(k))
    on_floor = b.get('gap', 0) > 0 or b.get('gap_from', 0) > 0 or b.get('phone') == 'floor'
    if on_floor and b.get('gap_from', b.get('gap', 0)) != b.get('gap', 0): py = lerp(815, 1088, min(1., u/.4)**2)
    else: py = 1088 if on_floor else 815
    px = 360+(4*math.sin(t*170) if b.get('buzz') and u < .5 else 0); paste(cv, art['phone'], px, py, 1., -6 if py < 900 else 4)
    if b.get('card') and not (b.get('label') and b.get('label_y', 205) < 600):
        p = pop(u/.3) if (new('card') or (prev is not None and prev.get('label') and prev.get('label_y', 205) < 600)) else 1.; paste(cv, art[b['card']], 360, lerp(py-20, 252, min(1., p))+5*math.sin(t*2.1), (.15+.85*p)*.92, 3*math.sin(t*1.3))
    if b.get('bolt'):
        paste(cv, art['bolt'], 362, 566, .92+.08*math.sin(t*23), 6*math.sin(t*17), .82+.18*math.sin(t*38), flip=int(t*7) % 2 == 0)
    if b.get('bubble_e'):
        p = pop(u/.3) if new('bubble_e') else 1.; paste(cv, art['bubble_gift'], ex+62, 262+5*math.sin(t*3), p, -4+2*math.sin(t*2.2))
    if b.get('bubble_l'):
        p = pop(u/.3) if new('bubble_l') else 1.; bx, by = lx-66, 262+5*math.sin(t*3+1); paste(cv, art['bubble_blank'], bx, by, p, 4+2*math.sin(t*2.4))
        paste(cv, art['clock'], bx+6*math.sin(t*41), by-22+3*math.cos(t*37), p*.92, 14*math.sin(t*26))
        if p > .6:
            a = t*19; c0 = (int(bx+OX+6*math.sin(t*41)), int(by-10+OY)); cv2.line(cv, c0, (int(c0[0]+34*math.cos(a)), int(c0[1]+34*math.sin(a))), (150, 30, 40, 255), 5, cv2.LINE_AA)
    if b.get('flash') and u < .14: cv[..., :3] = (cv[..., :3]*.78+np.array(b['flash'])*.22).astype(np.uint8)
    if b.get('confetti'):
        for p in st['conf']:
            x = p['x']+p['vx']*u*math.exp(-.9*u); y = p['y']+p['vy']*u+760*u*u
            if y > 1420: continue
            box = cv2.boxPoints(((x+OX, y+OY), (p['w'], p['h']*abs(math.cos(u*6+p['r']))+2), p['r']+p['vr']*u)); cv2.fillConvexPoly(cv, box.astype(np.int32), p['col']+(255,), cv2.LINE_AA)
    if b.get('heart'):
        p = pop(u/.6) if new('heart') else 1.; paste(cv, art['heart_gold'], 372, lerp(py, 352, min(1., p))+6*math.sin(t*2.4), (.2+.8*p)*(1+.07*math.sin(t*7)), 5*math.sin(t*1.7))
    if b.get('label'):
        p = (.9+.1*pop(u/.22)) if new('label') else 1.; paste(cv, art[b['label']], 360, b.get('label_y', 205), p*(1+.015*math.sin(t*9)), -3)
    return cv

def draw(t, c, size, k):
    key = (str(c.base), c.fingerprint)
    if key not in _C: _C[key] = setup(c)
    st = _C[key]; B = st['B']; rt = st['rt']; fi = round(t*30); i, b = beat_at(B, t); prev = B['beats'][i-1] if i else None
    u = t-b['t0']; dur = b['t1']-b['t0']; cut = st['last'] != i; st['last'] = i
    ex, lx, d = layout(b, u); CAM = camera(b, u, dur, ex, lx); K = np.diag([k, k, 1.])
    bgw = world(st, b, prev, t, u); Mb = (K@CAM@np.array([[1, 0, -OX], [0, 1, -OY], [0, 0, 1.]]))[:2]
    bg = Image.fromarray(cv2.warpAffine(bgw, Mb, size, flags=cv2.INTER_AREA if k < 1 else cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), 'RGBA')
    flap = int(t*7.5) % 2 == 0; frames = {}
    for who, x, sgn in (('elle', ex, 1.), ('lui', lx, -1.)):
        s_ = b[who]; hd = s_['h']; head = (hd[0] if flap else hd[1]) if isinstance(hd, list) else hd; talk = isinstance(hd, list)
        hop = -14*math.sin(min(1., u/.26)*math.pi) if s_.get('hop') and u < .26 else 0.
        rot = math.radians(sgn*((4.2+1.6*math.sin(t*20)) if s_.get('yell') else 0.)+(9.5 if (b.get('cuddle') and who == 'elle') else 0.))
        mirror = bool(s_.get('away'))
        def place(r):
            m = np.array([[-S if mirror else S, 0, x], [0, S, FEET+hop], [0, 0, 1.]])
            if r:
                pv = m@np.array([0, -76, 1.]); R = np.array([[math.cos(r), -math.sin(r), 0], [math.sin(r), math.cos(r), 0], [0, 0, 1.]])
                m = np.array([[1, 0, pv[0]], [0, 1, pv[1]], [0, 0, 1.]])@R@np.array([[1, 0, -pv[0]], [0, 1, -pv[1]], [0, 0, 1.]])@m
            return K@CAM@m
        pup = st[who]; ank = None
        if rot:
            legs = pup.character.views['tq'].legs; bm = place(0.); ank = {sd: (bm@np.r_[np.asarray(legs[sd]['ankle'], float), 1.])[:2].tolist() for sd in ('left', 'right')}
        ha = (4.5*math.sin(t*2*math.pi*3.3) if talk else 0.)+s_.get('tilt', 0.)+(9. if (b.get('cuddle') and who == 'elle') else (-5. if b.get('cuddle') else 0.))
        arms = {sd: {'action': 'rest', 'phase': 1.} for sd in ('left', 'right')}
        for sd, (act, ph) in ARM[who][s_.get('arms', 'rest')].items(): arms[sd] = {'action': act, 'phase': float(ph)}
        frames[who] = pup.pose(placement=place(rot), frame_index=fi, allow_cut=cut, head_variant=head, head_angle_deg=float(ha), ankle_targets=ank, arm_actions=arms)
    order = [frames['lui'], frames['elle']] if b.get('cuddle') else [frames['elle'], frames['lui']]
    return rt.render_scene(size, order, background=bg, frame_index=fi)

def frame(t, c): return draw(t, c, (720, 1280), 1.)
def draft_frame(t, c):
    v = c.viewport; return draw(t, c, tuple(v.size), v.width/720.)
