"""« La question de trop » — scène B6 native 9:16 (720x1280), 30 s.

Monde en pixels du cadre natif ; la caméra est une similitude uniforme appliquée
au décor ET aux placements des marionnettes. Tout le décor/les accessoires sont
derrière les personnages (aucun calque de premier plan ne masque un membre).
"""
import json, math, random
from pathlib import Path
import numpy as np, cv2
from PIL import Image

_C = {}
OX, OY = 90, 148            # marge du monde autour du cadre 720x1280
S = 1.45                    # échelle des personnages
FEET = 995.0

def sm(v):
    v = min(1., max(0., v)); return v*v*(3-2*v)
def ramp(t, a, b): return sm((t-a)/(b-a)) if b > a else float(t >= b)
def lerp(a, b, u): return a+(b-a)*u
def pop(t, t0, d=.32):
    """0 → dépassement → 1 (apparition élastique)."""
    u = (t-t0)/d
    if u <= 0: return 0.
    if u >= 1: return 1.
    return 1+ -math.cos(u*math.pi*1.5)*(1-u)**1.2 if False else (1-(1-u)**3)*(1+.35*math.sin(u*math.pi))

def load(base, name):
    return cv2.cvtColor(np.asarray(Image.open(base/'art'/name).convert('RGBA')), cv2.COLOR_RGBA2BGRA)[..., [2, 1, 0, 3]].copy()

def paste(canvas, sprite, cx, cy, scale=1., rot=0., alpha=1., flip=False):
    """Colle un sprite RGBA centré en (cx,cy) monde sur le canevas monde (alpha-over)."""
    if alpha <= 0 or scale <= 0: return
    h, w = sprite.shape[:2]; c, s = math.cos(math.radians(rot))*scale, math.sin(math.radians(rot))*scale
    fx = -1. if flip else 1.
    M = np.array([[c*fx, -s, cx+OX-(c*fx*w/2-s*h/2)], [s*fx, c, cy+OY-(s*fx*w/2+c*h/2)]])
    r = math.hypot(w, h)*scale/2+3
    x0, y0 = max(0, int(cx+OX-r)), max(0, int(cy+OY-r)); x1, y1 = min(canvas.shape[1], int(cx+OX+r)+1), min(canvas.shape[0], int(cy+OY+r)+1)
    if x1 <= x0 or y1 <= y0: return
    M[:, 2] -= (x0, y0)
    warped = cv2.warpAffine(sprite, M, (x1-x0, y1-y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    a = warped[..., 3:4].astype(np.float32)*(alpha/255.)
    roi = canvas[y0:y1, x0:x1]; roi[..., :3] = (warped[..., :3]*a+roi[..., :3]*(1-a)).astype(np.uint8)

def setup(c):
    base = c.base; rt = c.puppet_runtime; T = json.loads((base/'timing.json').read_text())
    art = {p: load(base, p+'.png') for p in ('room', 'sofa_left', 'sofa_right', 'wall', 'phone', 'bolt', 'heart_gold', 'card1', 'card2',
                                             'bubble_gift', 'bubble_blank', 'clock', 'title_hook', 'title_end')}
    ch = c.character_packages; A = c.actions
    def track(arm, keys):
        """keys : (t0, t1, action, p0, p1) ordonnés ; les tenues sont insérées automatiquement."""
        segs = []; cur = ('rest', 1.); t = -1.
        for t0, t1, act, p0, p1 in keys:
            if t0 > t+1e-9: segs.append(A.ArmSegment(cur[0], t, t0, cur[1], cur[1]))
            segs.append(A.ArmSegment(act, t0, t1, p0, p1)); cur = (act, p1); t = t1
        segs.append(A.ArmSegment(cur[0], t, 99., cur[1], cur[1]))
        return A.ArmTrack(rt, arm, segs)
    ea = ch['elle'].views['tq'].arms; la = ch['lui'].views['tq'].arms
    cw, cc, cz = T['cut_wall'], T['cut_close'], T['cut_wide']; L = T['lines']
    tracks = {
     'a': {'elle': {'right': track(ea['right'], [(T['point'], T['point']+.55, 'reach', 0, 1), (6.7, 7.3, 'reach', 1, 0),
                                                 (L['04_elle']-.15, L['04_elle']+.45, 'reach', 0, 1), (L['04_elle']+.45, L['04_elle']+.7, 'offer', 0, 1),
                                                 (11.3, 11.55, 'offer', 1, 0), (12.3, 12.9, 'reach', 1, 0)]),
                    'left': track(ea['left'], [(L['02_elle'], L['02_elle']+.25, 'reach', 0, 1), (6.9, 7.2, 'reach', 1, 0),
                                               (L['04_elle']+.1, L['04_elle']+.35, 'reach', 0, 1), (L['04_elle']+.35, L['04_elle']+.65, 'offer', 0, 1), (12.3, 12.9, 'retract', 0, 1)])},
           'lui': {'left': track(la['left'], [(T['point']+.25, T['point']+.85, 'reach', 0, 1), (L['03_lui'], L['03_lui']+.2, 'offer', 0, 1), (8.1, 8.3, 'offer', 1, 0), (8.3, 8.92, 'reach', 1, 0),
                                              (L['05_lui']-.1, L['05_lui']+.5, 'reach', 0, 1), (L['05_lui']+.5, L['05_lui']+.7, 'offer', 0, 1), (14.2, 14.4, 'offer', 1, 0), (14.4, 15.02, 'reach', 1, 0)]),
                   'right': track(la['right'], [(L['03_lui']+.05, L['03_lui']+.3, 'reach', 0, 1), (L['03_lui']+.3, L['03_lui']+.6, 'offer', 0, 1), (8.3, 8.9, 'retract', 0, 1),
                                                (L['05_lui']+.1, L['05_lui']+.35, 'reach', 0, 1), (14.2, 14.6, 'reach', 1, 0)])}},
     'b': {'elle': {'right': track(ea['right'], [(cw-2, cw-1.4, 'reach', 0, 1), (cw-1.4, cw-.7, 'receive', 0, 1)]), 'left': track(ea['left'], [])},
           'lui': {'left': track(la['left'], [(cw-2, cw-1.4, 'reach', 0, 1), (cw-1.4, cw-.7, 'receive', 0, 1)]), 'right': track(la['right'], [])}},
     'c': {'elle': {'right': track(ea['right'], [(cc-2, cc-1.5, 'reach', 0, 1), (cc-1.5, cc-.8, 'receive', 0, 1)]), 'left': track(ea['left'], [])},
           'lui': {'left': track(la['left'], [(cc-2, cc-1.4, 'reach', 0, 1)]), 'right': track(la['right'], [])}},
     'd': {'elle': {'right': track(ea['right'], []), 'left': track(ea['left'], [])}, 'lui': {'left': track(la['left'], []), 'right': track(la['right'], [])}},
    }
    rnd = random.Random(11)
    conf = [dict(x=360+rnd.uniform(-45, 45), y=rnd.uniform(380, 980), vx=rnd.uniform(-520, 520), vy=rnd.uniform(-900, -150), w=rnd.uniform(9, 20), h=rnd.uniform(6, 12),
                 r=rnd.uniform(0, 360), vr=rnd.uniform(-500, 500), col=rnd.choice([(244, 196, 48), (255, 221, 110), (226, 164, 30), (255, 240, 180), (236, 88, 140)])) for _ in range(150)]
    crack = [(410, 792)]; rc = random.Random(5)
    for i in range(9): crack.append((crack[-1][0]-rc.uniform(8, 13), crack[-1][1]+rc.uniform(-17, 15)))
    branches = [[crack[3], (crack[3][0]-16, crack[3][1]-52), (crack[3][0]-30, crack[3][1]-88)], [crack[5], (crack[5][0]-12, crack[5][1]+58), (crack[5][0]-26, crack[5][1]+104)],
                [crack[2], (crack[2][0]-6, crack[2][1]+44)], [crack[7], (crack[7][0]-9, crack[7][1]-60)]]
    return dict(T=T, art=art, rt=rt, tracks=tracks, conf=conf, crack=crack, branches=branches,
                elle=rt.Puppet(ch['elle'], 'tq', 'elle'), lui=rt.Puppet(ch['lui'], 'tq', 'lui'), last=None)

def shot(T, t):
    return 'a' if t < T['cut_wall'] else ('b' if t < T['cut_close'] else ('c' if t < T['cut_wide'] else 'd'))

def camera(T, t):
    """Similitude monde → cadre natif : zoom z autour du point (fx,fy) ramené au centre (360,640)."""
    cw, cc, cz = T['cut_wall'], T['cut_close'], T['cut_wide']; shx = shy = 0.
    if t < T['split']:
        z = 1.0+.025*ramp(t, 0, 4.2)+.035*ramp(t, T['point']-.05, T['point']+.3)-.03*ramp(t, 7.9, 8.8); fx, fy = 360, 640
    elif t < cw:
        z, fx, fy = 1.0+.03*ramp(t, 10.2, 15.5), 360, 640
        k = max(0., 1-(t-T['split'])/.45)
        shx, shy = 9*k*math.sin(t*90), 7*k*math.cos(t*77)
    elif t < cc:
        z, fx, fy = 1.02+.05*ramp(t, cw, cc), 360, lerp(650, 620, ramp(t, cw+1.5, cc))
        k = max(0., 1-(t-cw)/1.3)*.6
        shx, shy = 5*k*math.sin(t*80), 4*k*math.cos(t*71)
    elif t < cz:
        z, fx, fy = 1.30+.06*ramp(t, cc, cz), 455, 690
    else:
        z = 1.0+.04*ramp(t, T['lean']-.2, 27.0); fx, fy = 362, lerp(640, 630, ramp(t, T['lean']-.2, 27.0))
        k = max(0., 1-(t-cz)/.35)
        shx, shy = 8*k*math.sin(t*95), 6*k*math.cos(t*83)
    return np.array([[z, 0, 360-z*fx+shx], [0, z, 640-z*fy+shy], [0, 0, 1.]])

def xs(T, t):
    """Positions monde des deux personnages et écart du canapé."""
    d = 62*ramp(t, T['split'], T['split_end']) if t < T['cut_wide'] else 62*(1-ramp(t, T['rejoin'], T['rejoin_end']))
    close = ramp(t, T['rejoin']+.2, T['rejoin_end']+.15) if t >= T['cut_wide'] else 0.
    return 190-d+close*72, 530+d-close*32, d

def heads(T, t):
    L = T['lines']; cw, cz = T['cut_wall'], T['cut_wide']
    e = [(0, 'smug'), (T['card1_pop']+.25, 'soft'), (T['point']-.05, 'smug'), (L['02_elle'], 'shock'), (7.3, 'angry'), (T['split'], 'shock'), (L['04_elle'], 'shout'),
         (12.65, 'angry'), (15.1, 'sulk'), (T['freeze'], 'soft'), (cz, 'wink'), (L['07_elle'], 'laugh'), (27.2, 'wink')]
    l = [(0, 'smug'), (T['card1_pop']+.35, 'soft'), (T['point']-.05, 'smug'), (L['03_lui'], 'shout'), (T['split'], 'soft'), (L['04_elle']+.2, 'shout2'), (L['05_lui'], 'shout'),
         (14.75, 'sulk'), (T['freeze']+.15, 'soft'), (L['06_lui']-.1, 'tender')]
    pick = lambda seq: [v for a, v in seq if t >= a][-1]
    return pick(e), pick(l)

def talk(T, t, ids, amp=3.2):
    """Petit accent de tête pendant la réplique (sans dépasser 7°/image)."""
    D = {'01_elle_vo': 2.3, '02_elle': 1.9, '03_lui': 1.4, '04_elle': 2.2, '05_lui': 1.8, '06_lui': .9, '07_elle': 2.4, '08_elle_vo': 2.4}
    for i in ids:
        a = T['lines'][i]
        if a <= t <= a+D[i]:
            env = min(1., (t-a)/.15, (a+D[i]-t)/.15); return amp*env*math.sin((t-a)*2*math.pi*3.3)
    return 0.

def world(st, t):
    T = st['T']; art = st['art']; cv = art['room'].copy(); ex, lx, d = xs(T, t); cw, cc, cz = T['cut_wall'], T['cut_close'], T['cut_wide']
    # ombres douces au sol
    sh = np.zeros(cv.shape[:2], np.float32)
    for x in (ex, lx): cv2.ellipse(sh, (int(x+OX), int(FEET+8+OY)), (95, 15), 0, 0, 360, .30, -1)
    sh = cv2.GaussianBlur(sh, (0, 0), 9)[..., None]; cv[..., :3] = (cv[..., :3]*(1-sh)+np.array([70, 44, 60])*sh).astype(np.uint8)
    # canapé (deux moitiés), léger rebond quand il se recolle
    jolt = 5*max(0., 1-(t-T['split'])/.25)*math.sin(t*120) if T['split'] <= t < T['split']+.25 else 0.
    b = 6*max(0., 1-abs(t-T['rejoin_end'])/.14) if t >= cz else 0.
    paste(cv, art['sofa_left'], 360-d+jolt, 868+b*.4); paste(cv, art['sofa_right'], 360+d-jolt, 868+b*.4)
    # mur rouge + fissure dorée
    if cw <= t < cz+.06:
        u = ramp(t, cw, T['wall_up_end']); top = lerp(1300, 345, 1-(1-u)**2.2)
        wy = top+350; paste(cv, art['wall'], 360, wy)
        g = ramp(t, T['crack'], T['crack']+1.05)
        if g > 0:
            def poly(pts, frac, w):
                n = max(2, int(1+frac*(len(pts)-1)+.999)); p = np.array(pts[:n], np.float32)+np.array([OX, OY+(wy-695)])
                for col, ww in (((250, 176, 30, 255), w+4), ((255, 240, 170, 255), w)): cv2.polylines(cv, [p.astype(np.int32)], False, col, ww, cv2.LINE_AA)
            poly(st['crack'], g, 4)
            for i, br in enumerate(st['branches']): poly(br, max(0., min(1., g*1.6-.25-.12*i)), 2) if g*1.6-.25-.12*i > 0 else None
    # téléphone : posé entre eux, tombe sur le tapis quand le canapé se fend, vibre avant la 2e carte
    if t < T['split']: px, py, pr = 360, 815, -6.
    else:
        u = min(1., (t-T['split'])/.55); py = lerp(815, 1088, u*u)-34*abs(math.sin(max(0., (t-T['split']-.55))*9))*max(0., 1-(t-T['split']-.55)/.5); px = 360; pr = lerp(-6, 4, u)
    if T['buzz'] <= t < T['buzz']+.75: px += 4*math.sin(t*170); pr += 5*math.sin(t*140)
    paste(cv, art['phone'], px, py, 1., pr)
    # carte 1
    if T['card1_pop'] <= t < T['card1_out']+.3:
        u = pop(t, T['card1_pop'], .45); o = ramp(t, T['card1_out'], T['card1_out']+.3)
        paste(cv, art['card1'], 360, lerp(800, 252, min(1., u))+5*math.sin(t*2.1)-560*o*o, (.15+.85*u)*.92, 3*math.sin(t*1.3)+18*o)
    # carte 2 (sort du téléphone au sol, monte devant le mur)
    if T['card2_pop'] <= t < cz:
        u = pop(t, T['card2_pop'], .5); paste(cv, art['card2'], 360, lerp(1060, 222, min(1., u))+5*math.sin(t*2.3), (.15+.85*u)*.95, 3*math.sin(t*1.5))
    # éclair rouge entre eux
    if T['bolt'] <= t < T['bolt_end']:
        u = pop(t, T['bolt'], .22); f = .82+.18*math.sin(t*38); o = 1-ramp(t, T['bolt_end']-.25, T['bolt_end'])
        paste(cv, art['bolt'], 362, 566, u*(.92+.08*math.sin(t*23)), 6*math.sin(t*17), f*o, flip=int(t*7) % 2 == 0)
    # bulles de « preuves »
    o = 1-ramp(t, T['bubbles_out'], T['bubbles_out']+.22)
    if T['bubble1'] <= t and o > 0:
        u = pop(t, T['bubble1'], .35); paste(cv, art['bubble_gift'], ex+62, 262+5*math.sin(t*3), u*o, -4+2*math.sin(t*2.2))
    if T['bubble2'] <= t and o > 0:
        u = pop(t, T['bubble2'], .35); bx, by = lx-66, 262+5*math.sin(t*3+1); paste(cv, art['bubble_blank'], bx, by, u*o, 4+2*math.sin(t*2.4))
        paste(cv, art['clock'], bx+6*math.sin(t*41), by-22+3*math.cos(t*37), u*o*.92, 14*math.sin(t*26))
        if u*o > .6:  # aiguille qui s'affole
            a = t*19; c0 = (int(bx+OX+6*math.sin(t*41)), int(by-10+OY)); cv2.line(cv, c0, (int(c0[0]+34*math.cos(a)), int(c0[1]+34*math.sin(a))), (150, 30, 40, 255), 5, cv2.LINE_AA)
    # éclat rouge à l'étincelle
    if T['bolt'] <= t < T['bolt']+.14: cv[..., :3] = (cv[..., :3]*.78+np.array([225, 40, 50])*.22).astype(np.uint8)
    # confettis dorés
    if t >= T['burst']:
        dt = t-T['burst']
        if dt < .12: cv[..., :3] = (cv[..., :3]*(.7+2.5*dt)+np.array([255, 226, 140])*(.3-2.5*dt)).astype(np.uint8)
        for p in st['conf']:
            x = p['x']+p['vx']*dt*math.exp(-.9*dt); y = p['y']+p['vy']*dt+760*dt*dt
            if y > 1420 or dt > 4.2: continue
            box = cv2.boxPoints(((x+OX, y+OY), (p['w'], p['h']*abs(math.cos(dt*6+p['r']))+2), p['r']+p['vr']*dt))
            cv2.fillConvexPoly(cv, box.astype(np.int32), p['col']+(255,), cv2.LINE_AA)
    # cœur doré qui sort du téléphone
    if t >= T['heart']:
        u = pop(t, T['heart'], .7); paste(cv, art['heart_gold'], 372, lerp(1060, 352, min(1., u))+6*math.sin(t*2.4), (.2+.8*u)*(1+.07*math.sin(t*7)), 5*math.sin(t*1.7))
    # accroche et carton de fin
    if .2 <= t < T['card1_pop']+.1:
        u = pop(t, .2, .35); o = 1-ramp(t, T['card1_pop']-.15, T['card1_pop']+.1); paste(cv, art['title_hook'], 360, 205, u*(1-.4*(1-o)), -2, o)
    if t >= T['endcard']:
        u = pop(t, T['endcard'], .45); paste(cv, art['title_end'], 360, 196, u*.8, -2)
    return cv

def draw(t, c, size, k):
    key = (str(c.base), c.fingerprint)
    if key not in _C: _C[key] = setup(c)
    st = _C[key]; T = st['T']; rt = st['rt']; i = round(t*30); sh = shot(T, t); cut = st['last'] != sh; st['last'] = sh
    cw, cc, cz = T['cut_wall'], T['cut_close'], T['cut_wide']
    CAM = camera(T, t); K = np.diag([k, k, 1.])
    bgw = world(st, t); Mb = (K@CAM@np.array([[1, 0, -OX], [0, 1, -OY], [0, 0, 1.]]))[:2]
    bg = Image.fromarray(cv2.warpAffine(bgw, Mb, size, flags=cv2.INTER_AREA if k < 1 else cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), 'RGBA')
    ex, lx, d = xs(T, t); he, hl = heads(T, t)
    hop = lambda t0: -14*math.sin(min(1., max(0., (t-t0)/.3))*math.pi)
    ey = FEET+hop(T['split'])*(T['split'] <= t < T['split']+.3)+hop(T['point'])*.5*(T['point'] <= t < T['point']+.3); ly = FEET+hop(T['split']+.04)*(T['split']+.04 <= t < T['split']+.34)+hop(T['point'])*.5*(T['point'] <= t < T['point']+.3)
    em = cw <= t < cz; lm = cw <= t < cc    # dos tournés (miroir) pendant le mur
    lean = math.radians(9.5*ramp(t, T['lean'], T['lean_end'])) if t >= cz else 0.
    def place(x, y, mirror, rot=0.):
        m = np.array([[-S if mirror else S, 0, x], [0, S, y], [0, 0, 1.]])
        if rot:
            pv = m@np.array([0, -76, 1.]); R = np.array([[math.cos(rot), -math.sin(rot), 0], [math.sin(rot), math.cos(rot), 0], [0, 0, 1.]])
            m = np.array([[1, 0, pv[0]], [0, 1, pv[1]], [0, 0, 1.]])@R@np.array([[1, 0, -pv[0]], [0, 1, -pv[1]], [0, 0, 1.]])@m
        return K@CAM@m
    pe, pl = place(ex, ey, em, lean), place(lx, ly, lm)
    tr = st['tracks'][sh]
    ea = talk(T, t, ('02_elle', '04_elle', '07_elle'))+(-6*ramp(t, T['freeze'], T['freeze']+.3) if cw <= t < cz else 0)+(9*ramp(t, T['lean'], T['lean_end']) if t >= cz else 0)
    la = talk(T, t, ('03_lui', '05_lui', '06_lui'), 2.6)+(5*ramp(t, T['freeze']+.1, T['freeze']+.4) if cw <= t < cc else 0)+(-5*ramp(t, T['lean']+.2, T['lean_end']+.2) if t >= cz else 0)
    ank = None
    if lean:
        base_m = place(ex, ey, em); legs = st['elle'].character.views['tq'].legs
        ank = {sd: (base_m@np.r_[np.asarray(legs[sd]['ankle'], float), 1.])[:2].tolist() for sd in ('left', 'right')}
    targets = {}
    if sh == 'c' and t >= T['hand_wall']-.25:
        arm = st['lui'].character.views['tq'].arms['left']; fk = rt.forward_kinematics(arm, rt.PoseLibrary.sample(arm, 'reach', 1.))[2]
        a0 = (pl@np.r_[fk, 1.])[:2]; a1 = (K@CAM@np.array([412., 792., 1.]))[:2]
        targets['left'] = lerp(a0, a1, ramp(t, T['hand_wall']-.25, T['hand_wall']+.12)).tolist()
    fe = st['elle'].pose(placement=pe, frame_index=i, allow_cut=cut, head_variant=he, head_angle_deg=float(ea), ankle_targets=ank,
                         arm_actions={sd: tr['elle'][sd].sample(t) for sd in ('left', 'right')})
    fl = st['lui'].pose(placement=pl, frame_index=i, allow_cut=cut, head_variant=hl, head_angle_deg=float(la), wrist_targets=targets,
                        arm_actions={sd: tr['lui'][sd].sample(t) for sd in ('left', 'right')})
    order = [fl, fe] if t >= cz else [fe, fl]
    return rt.render_scene(size, order, background=bg, frame_index=i)

def frame(t, c):
    return draw(t, c, (720, 1280), 1.)

def draft_frame(t, c):
    v = c.viewport
    return draw(t, c, tuple(v.size), v.width/720.)
