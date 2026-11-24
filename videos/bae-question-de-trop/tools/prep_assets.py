"""Détoure les planches Gemini (fond vert) en sprites RGBA séparés."""
import sys, json
from pathlib import Path
import numpy as np, cv2
from PIL import Image
P = Path(__file__).resolve().parents[1]; SRC = P/'art/src'; OUT = P/'art/cut'; OUT.mkdir(parents=True, exist_ok=True)

def key(path, rim=True, min_area=2500):
    rgb = np.asarray(Image.open(path).convert('RGB')); hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(int)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    green = (h > 35) & (h < 90) & (s > 30) & (v > 50)
    # fond = composantes vertes connectées au bord
    n, lab = cv2.connectedComponents(green.astype(np.uint8), connectivity=4)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(border)) | (green & (cv2.blur(green.astype(np.float32), (25, 25)) > .5))
    if rim:  # liseré blanc d'autocollant : pixels clairs reliés au fond, sur 14 px max
        light = (s < 80) & (v > 185)
        dist = cv2.distanceTransform((~bg).astype(np.uint8), cv2.DIST_L2, 5)
        cand = (light & (dist <= 14)) | bg
        n, lab = cv2.connectedComponents(cand.astype(np.uint8), connectivity=4)
        ids = set(np.unique(lab[bg])) - {0}
        bg = np.isin(lab, list(ids))
    alpha = (~bg).astype(np.uint8) * 255
    alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur(alpha, (0, 0), .8)
    # décontamination du vert sur le bord
    out = np.dstack([rgb, alpha]).copy()
    edge = (alpha > 0) & (alpha < 250) | (cv2.dilate(bg.astype(np.uint8), np.ones((5, 5))) > 0)
    g = out[..., 1].astype(int); mx = np.maximum(out[..., 0], out[..., 2]).astype(int)
    out[..., 1] = np.where(edge & (g > mx), mx, g).astype(np.uint8)
    n, lab, stats, cent = cv2.connectedComponentsWithStats((alpha > 40).astype(np.uint8), connectivity=8)
    parts = []
    for i in range(1, n):
        x, y, w, hh, a = stats[i]
        if a < min_area: continue
        m = cv2.dilate((lab == i).astype(np.uint8), np.ones((5, 5)))
        crop = out[y-3:y+hh+3, x-3:x+w+3].copy(); crop[..., 3] = (crop[..., 3] * m[y-3:y+hh+3, x-3:x+w+3]).astype(np.uint8)
        parts.append((int(y), int(x), crop))
    return parts

def rows(parts, tol=80):
    parts = sorted(parts, key=lambda p: p[0]); out = []; row = []
    for p in parts:
        if row and p[0] - row[0][0] > tol: out.append(sorted(row, key=lambda q: q[1])); row = []
        row.append(p)
    out.append(sorted(row, key=lambda q: q[1])); return [p for r in out for p in r]

SHEETS = {
 'elle-sheet-v1.png': ['elle_head_smug', 'elle_head_shock', 'elle_head_angry', 'elle_head_shout', 'elle_head_sulk', 'elle_head_soft', 'elle_head_wink', 'elle_head_laugh', 'elle_body'],
 'lui-sheet-v1.png': ['lui_head_smug', 'lui_head_shout', 'lui_head_shout2', 'lui_head_sulk', 'lui_head_soft', 'lui_head_tender', 'lui_body'],
 'props-v1.png': ['phone', 'card', 'bolt', 'bubble', 'gift', 'clock', 'heart_gold', 'heart_pink', 'star'],
 'sofa-v1.png': ['sofa'],
}
report = {}
for sheet, names in SHEETS.items():
    parts = rows(key(SRC/sheet, rim=(sheet != 'sofa-v1.png'), min_area=20000 if sheet == 'sofa-v1.png' else 2500))
    report[sheet] = [(p[1], p[0], p[2].shape[1], p[2].shape[0]) for p in parts]
    if len(parts) != len(names): print('MISMATCH', sheet, len(parts), len(names))
    for name, (_, _, crop) in zip(names, parts): Image.fromarray(crop, 'RGBA').save(OUT/f'{name}.png')
print(json.dumps(report))
