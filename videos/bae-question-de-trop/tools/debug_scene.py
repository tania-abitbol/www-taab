"""Outil de mise au point : rejoue la scène hors runner, liste les images refusées, exporte des images fixes."""
import sys, importlib.util
from pathlib import Path
sys.dont_write_bytecode = True
B = Path(__file__).resolve().parents[1]/'b6'; sys.path.insert(0, str(B))
import b6_puppet as rt, b6_actions as A
class C: pass
c = C(); c.base = B; c.puppet_runtime = rt; c.actions = A; c.fingerprint = 'debug'
c.character_packages = {k: rt.load_character(B/'characters'/k) for k in ('elle', 'lui')}
spec = importlib.util.spec_from_file_location('scene', B/'scene.py'); scene = importlib.util.module_from_spec(spec); spec.loader.exec_module(scene)
t0, t1 = float(sys.argv[1]), min(float(sys.argv[2]), __import__('json').load(open(B/'board.json'))['duration']); out = Path(sys.argv[3]) if len(sys.argv) > 3 else None; stills = [float(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else []
k = .5; size = (360, 640); errs = {}
for i in range(round(t0*30), round(t1*30)):
    t = i/30
    try:
        r = scene.draw(t, c, size, k)
        if r.qa['errors']: errs.setdefault(str(r.qa['errors'][0])[:110], []).append(i)
    except Exception as e:
        errs.setdefault(str(e)[:110], []).append(i)
        for p in ('elle', 'lui'): scene._C[(str(B), 'debug')][p]._previous = None
for m, fr in errs.items(): print(len(fr), 'x', m, '| images', fr[:12], '…' if len(fr) > 12 else '')
if not errs: print('aucune erreur', t0, t1)
if out:
    rt._need = lambda cond, msg: None  # images fixes de diagnostic uniquement : jamais utilisé pour un rendu
    out.mkdir(parents=True, exist_ok=True)
    for t in stills:
        st = scene._C.get((str(B), 'debug'))
        if st:
            for p in ('elle', 'lui'): st[p]._previous = None
            st['last'] = None
        try: scene.draw(t, c, (720, 1280), 1.).beauty.convert('RGB').save(out/f'f_{t:05.2f}.jpg', quality=88)
        except Exception as e: print('still', t, 'ERR', str(e)[:100])
