"""アイコンを描く（荒野の満月と、遠吠えする犬の影）。使い方: python3 tools/make_icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parent.parent

def draw(size, pad=0.0):
    S = 1024
    im = Image.new('RGB', (S, S), '#14100f')
    d = ImageDraw.Draw(im)
    for y in range(S):   # 夜空のグラデーション
        t = y / S
        d.line([(0, y), (S, y)], fill=(int(20 + 30 * t), int(24 + 22 * t), int(40 + 10 * t)))
    k = 1 - pad * 2
    def P(x, y): return (S / 2 + (x - 512) * k, S / 2 + (y - 512) * k)
    # 月と光の輪
    glow = Image.new('L', (S, S), 0)
    ImageDraw.Draw(glow).ellipse([*P(300, 150), *P(780, 630)], fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    im.paste(Image.new('RGB', (S, S), '#c9b98a'), (0, 0), glow)
    d = ImageDraw.Draw(im)
    d.ellipse([*P(360, 210), *P(720, 570)], fill='#efe6c4')
    d.ellipse([*P(430, 300), *P(490, 350)], fill='#ddd2ae')
    d.ellipse([*P(560, 420), *P(640, 480)], fill='#ddd2ae')
    # 荒野の丘
    d.polygon([P(0, 760), P(220, 690), P(470, 730), P(760, 660), P(1024, 720), P(1024, 1024), P(0, 1024)], fill='#0d0b0c')
    # 岩山の上で遠吠えする犬（横向きの影）
    dog = [(300, 700), (330, 610), (380, 580), (520, 570), (600, 560), (640, 500), (650, 430), (690, 410), (710, 440),
           (760, 400), (770, 430), (720, 480), (700, 540), (690, 600), (700, 700), (670, 700), (660, 620), (600, 620),
           (560, 700), (530, 700), (540, 630), (420, 640), (400, 700), (370, 700), (370, 640), (330, 650), (320, 700)]
    d.polygon([P(x, y) for x, y in dog], fill='#0d0b0c')
    d.polygon([P(310, 600), P(250, 520), P(270, 515), P(340, 590)], fill='#0d0b0c')   # しっぽ
    return im.resize((size, size), Image.LANCZOS)

(root / 'icons').mkdir(exist_ok=True)
draw(192).save(root / 'icons/icon-192.png')
draw(180).save(root / 'icons/icon-180.png')
draw(512).save(root / 'icons/icon-512.png')
draw(512, pad=0.1).save(root / 'icons/icon-512-maskable.png')
print('ok')
