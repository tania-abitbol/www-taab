#!/bin/bash
# Rend les vidéos storyboardées l'une après l'autre et copie le résultat dans livrable/.
set -u
P="$(cd "$(dirname "$0")/.." && pwd)"; PY="${B6_PYTHON:-python3}"
for v in "$@"; do
  cd "$P" && python3 tools/make_video.py "$v" > "/tmp/mk_$v.log" 2>&1 || { echo "$v: préparation échouée"; tail -3 "/tmp/mk_$v.log" | cut -c1-300; continue; }
  cd "$P/b6" && rm -rf __pycache__ "outputs/$v"
  D=$(python3 -c "import json;print(json.load(open('board.json'))['duration'])")
  "$PY" run.py preview . --ratio 9:16 --trusted-code --start 0 --seconds "$D" --output "outputs/$v" > "/tmp/rd_$v.log" 2>&1
  if [ -f "outputs/$v/preview.mp4" ] && [ -f "outputs/$v/report.json" ]; then
    cp "outputs/$v/preview.mp4" "$P/livrable/bae-$v.mp4"; cp "outputs/$v/captions.srt" "$P/livrable/bae-$v.srt"; echo "$v: OK ${D}s"
  else echo "$v: rendu échoué"; tail -2 "/tmp/rd_$v.log" | cut -c1-300; fi
done
