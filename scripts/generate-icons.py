"""Genera el ícono de la app, el ícono de avisos y la pantalla de carga de
Android a partir del sprite de Pío. Uso: python3 scripts/generate-icons.py"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "android/app/src/main/res"

CHICK = [
    "................",
    "........y.......",
    "......YYYY......",
    ".....YYYYYY.....",
    "....YYYYYYYY....",
    "....YYKYYKYY....",
    "....YPYOOYPY....",
    "....YYYooYYY....",
    "...YYYYYYYYYY...",
    "..yYYYYYYYYYYy..",
    "..yyYYYYYYYYyy..",
    "...yYYYYYYYYy...",
    "....YYYYYYYY....",
    ".....yyyyyy.....",
    "......L..L......",
    ".....LL..LL.....",
]
PALETTE = {
    "X": (0x5A, 0x3A, 0x12), "Y": (0xFF, 0xD2, 0x3F), "y": (0xF0, 0xA5, 0x00), "O": (0xFF, 0x8A, 0x1F),
    "o": (0xD9, 0x66, 0x0B), "K": (0x2B, 0x1D, 0x0E), "L": (0xFF, 0x8A, 0x1F), "P": (0xFF, 0x9F, 0xB4),
}
SKY = (0x9E, 0xE0, 0xFF)
INK = (0x2B, 0x1D, 0x0E)


def outlined(rows):
    grid = [list(r) for r in rows]
    out = [r[:] for r in grid]
    for r, row in enumerate(grid):
        for c, ch in enumerate(row):
            if ch != ".":
                continue
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                rr, cc = r + dr, c + dc
                if 0 <= rr < 16 and 0 <= cc < 16 and grid[rr][cc] not in ".L":
                    out[r][c] = "X"
                    break
    return out


def chick(scale, color=None):
    img = Image.new("RGBA", (16 * scale, 16 * scale), (0, 0, 0, 0))
    px = img.load()
    for r, row in enumerate(outlined(CHICK)):
        for c, ch in enumerate(row):
            if ch == ".":
                continue
            rgba = (*color, 255) if color else (*PALETTE[ch], 255)
            for y in range(r * scale, (r + 1) * scale):
                for x in range(c * scale, (c + 1) * scale):
                    px[x, y] = rgba
    return img


def on_square(size, bg, chick_px, round_mask=False):
    img = Image.new("RGBA", (size, size), (*bg, 255))
    scale = max(1, chick_px // 16)
    sprite = chick(scale)
    img.alpha_composite(sprite, ((size - sprite.width) // 2, (size - sprite.height) // 2))
    if round_mask:
        mask = Image.new("L", (size, size), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
        img.putalpha(mask)
    return img


DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

for name, d in DENSITIES.items():
    folder = ROOT / f"mipmap-{name}"
    size = round(48 * d)
    on_square(size, SKY, round(size * 0.8)).save(folder / "ic_launcher.png")
    on_square(size, SKY, round(size * 0.7), round_mask=True).save(folder / "ic_launcher_round.png")
    # Ícono adaptable: 108 dp con Pío dentro de la zona segura central.
    fg_size = round(108 * d)
    fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    sprite = chick(max(1, round(64 * d) // 16))
    fg.alpha_composite(sprite, ((fg_size - sprite.width) // 2, (fg_size - sprite.height) // 2))
    fg.save(folder / "ic_launcher_foreground.png")

    # Ícono de avisos: silueta blanca de 24 dp.
    drawable = ROOT / f"drawable-{name}"
    drawable.mkdir(exist_ok=True)
    stat = round(24 * d)
    icon = Image.new("RGBA", (stat, stat), (0, 0, 0, 0))
    sil = chick(max(1, stat // 16), color=(255, 255, 255))
    icon.alpha_composite(sil, ((stat - sil.width) // 2, (stat - sil.height) // 2))
    icon.save(drawable / "ic_stat_pio.png")

# Pantallas de carga: fondo oscuro con Pío al centro.
for path in ROOT.glob("drawable*/splash.png"):
    w, h = Image.open(path).size
    splash = Image.new("RGBA", (w, h), (*INK, 255))
    sprite = chick(max(1, min(w, h) // 3 // 16))
    splash.alpha_composite(sprite, ((w - sprite.width) // 2, (h - sprite.height) // 2))
    splash.save(path)

print("Íconos generados")
