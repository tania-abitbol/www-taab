"""Génère les répliques avec ElevenLabs (clé lue dans ELEVENLABS_API_KEY, jamais en dur)."""
import json, os, sys, base64, urllib.request
KEY = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
VOICES = {"ELLE": "WQKwBV2Uzw1gSGr69N8I", "LUI": "5Qfm4RqcAer0xoyWtoHC"}  # Mylene, Maxime
MODEL = os.environ.get("TTS_MODEL", "eleven_v3")
LINES = [
    ("01_elle_vo", "ELLE", "[serious, dramatic] Ce jeu de couple… a failli nous séparer."),
    ("02_elle", "ELLE", "[shouting, outraged] Attends, pourquoi tu me montres du doigt ?!"),
    ("03_lui", "LUI", "[shouting] Parce que c'est évident !"),
    ("04_elle", "ELLE", "[angry, sarcastic] Et le cadeau « perdu par la poste » ?!"),
    ("05_lui", "LUI", "[shouting, indignant] Et toi ! « J'arrive dans cinq minutes » ?!"),
    ("06_lui", "LUI", "[whispering softly] … Ton rire."),
    ("07_elle", "ELLE", "[laughs softly] Ok… Question suivante."),
    ("08_elle_vo", "ELLE", "Et vous, quelle question a lancé la guerre ?"),
]
out = sys.argv[1]
only = set(sys.argv[2:])
for lid, who, text in LINES:
    if only and lid not in only: continue
    body = {"text": text, "model_id": MODEL, "language_code": "fr"}
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICES[who]}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": KEY})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e:
        print(lid, "HTTP", e.code, e.read().decode()[:300]); continue
    open(f"{out}/{lid}.mp3", "wb").write(base64.b64decode(r["audio_base64"]))
    json.dump({"text": text, "speaker": who, "model": MODEL, "alignment": r.get("alignment")}, open(f"{out}/{lid}.json", "w"), ensure_ascii=False)
    print(lid, "ok")
