"""公開するファイルの一覧（files.json）を作る。オフライン用のダウンロードと sw.js が使う。
   使い方: python3 tools/make_manifest.py   （tools/bump_version.py からも呼ばれる）
   p：パス、s：大きさ（バイト）、h：中身の短いハッシュ（変わったファイルだけ取り直すため）
"""
import hashlib, json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
ver = json.loads((root / 'version.json').read_text())['version']
INCLUDE = ['index.html', 'manifest.webmanifest', 'css/*.css', 'js/*.js', 'vendor/*.js', 'icons/*.png',
           'assets/vrm/lite/*.vrm', 'assets/faces/*.webp']
files = []
for pat in INCLUDE:
    for f in sorted(root.glob(pat)):
        b = f.read_bytes()
        files.append({'p': f.relative_to(root).as_posix(), 's': len(b), 'h': hashlib.sha1(b).hexdigest()[:10]})
(root / 'files.json').write_text(json.dumps({'version': ver, 'files': files}, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'files.json: {len(files)} files, {sum(x["s"] for x in files) / 1e6:.1f} MB')
