#!/usr/bin/env python3
"""Regenerate the published brand assets from media/logo.svg.

    python3 media/build.py            # everything
    python3 media/build.py preview    # public/preview.png only
    python3 media/build.py icon       # public/icon.png only

Deterministic: fonts are loaded by PATH from media/fonts/, so nothing has to be
installed on the machine running this and the output does not depend on system
font configuration. The only external tool is Inkscape, used solely to raster
the logo from SVG.

The card is composited as raster (Pillow), not authored as SVG. That is a
deliberate choice, not an oversight: the glows are Gaussian blurs and the output
is only ever consumed as a PNG, so a vector source would buy nothing and would
need its text outlined to stay reproducible.

Layout notes worth keeping:
  - The wordmark is scaled by binary search to a fixed INK height (WORD_INK_H),
    not to a nominal point size. Nominal size is not comparable across faces, so
    swapping the font would silently change the wordmark's real size.
  - The lockup (logo + text) is centred as a GROUP, so changing the tagline
    length re-centres everything rather than shifting the text off-balance.
  - Speed lines are drawn on a rotated scratch layer at LOGO_ANGLE so they share
    the mark's pose by construction rather than by eye.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "media"
FONTS = MEDIA / "fonts"
LOGO_SVG = MEDIA / "logo.svg"
ICON_SVG = MEDIA / "icon.svg"    # simplified glyph, NOT logo.svg - see README
OUT_PNG = ROOT / "public" / "preview.png"
OUT_ICON = ROOT / "public" / "icon.png"

W, H = 1280, 640                  # matches the previous card's aspect
BG = "#12141a"
FG = "#eef1f6"
MUTED = "#8e97a8"
ACCENT = "#ff6a24"

WORD = "rocketh"
TAG = "A deployment system for EVM Smart Contracts"

WORD_FONT = FONTS / "ChakraPetch-BoldItalic.ttf"
TAG_FONT = FONTS / "SpaceGrotesk-Variable.ttf"
TAG_WGHT = 400

LOGO_PX = 340
LOGO_ANGLE = 30                   # keep in sync with the pose baked into logo.svg

ICON_PX = 512                     # favicon, referenced from .vitepress/config.mts
ICON_MARGIN = 24                  # same proportion as logo.svg's 12/256
ICON_SUPERSAMPLE = 4
# Fraction of the measured centroid drift to correct when optically centring.
# See media/README.md: full correction crowds the flame tip against the edge.
OPTICAL_FACTOR = 0.35
WORD_INK_H = 100
GAP = 44                          # logo -> text
RULE_GAP, RULE_H, RULE_W, TAG_GAP = 26, 5, 88, 26
TAG_SIZE = 30


def load(path, size, wght=None):
    font = ImageFont.truetype(str(path), size)
    if wght is not None:
        try:
            font.set_variation_by_axes([wght])
        except Exception:
            pass                  # static build of a variable font
    return font


def ink(font, text):
    """Bounding box of the drawn glyphs, which is what we lay out against."""
    img = Image.new("L", (3000, 600), 0)
    ImageDraw.Draw(img).text((80, 80), text, font=font, fill=255)
    return img.getbbox()


def fit_ink_height(path, wght, target):
    lo, hi = 10, 500
    for _ in range(32):
        mid = (lo + hi) / 2
        bb = ink(load(path, int(mid), wght), WORD)
        lo, hi = (mid, hi) if (bb[3] - bb[1]) < target else (lo, mid)
    return load(path, int((lo + hi) / 2), wght)


def render_svg(src, px):
    tmp = MEDIA / "_raster_tmp.png"
    r = subprocess.run(["inkscape", str(src), "-o", str(tmp), "-w", str(px)],
                       capture_output=True)
    if not tmp.exists():
        sys.exit(f"inkscape failed to raster {src}\n{r.stderr.decode()[:400]}")
    img = Image.open(tmp).convert("RGBA")
    img.load()
    tmp.unlink()
    return img


def speed_lines(card):
    import math
    big = int(math.hypot(W, H)) + 200
    layer = Image.new("L", (big, big), 0)
    d = ImageDraw.Draw(layer)
    for frac, thick, alpha in [(0.10, 3, 44), (0.26, 2, 28), (0.38, 4, 34),
                               (0.55, 2, 22), (0.68, 3, 30), (0.82, 2, 20),
                               (0.92, 3, 26)]:
        y = int(big * frac)
        x0 = int(big * (0.05 + 0.4 * ((frac * 7919) % 1)))
        d.line([x0, y, x0 + int(big * 0.42), y], fill=alpha, width=thick)
    layer = layer.rotate(LOGO_ANGLE, resample=Image.BICUBIC)
    ox, oy = (big - W) // 2, (big - H) // 2
    layer = layer.crop((ox, oy, ox + W, oy + H)).filter(ImageFilter.GaussianBlur(1.2))
    card.paste(Image.new("RGB", (W, H), "#9fb3d9"), (0, 0), layer)
    return card


def centroid_drift(alpha):
    """Offset of the ink's centre of mass from the centre of its canvas, in px.

    Bounding-box centring is not enough for this mark: the flame is a thin taper
    that stretches the box while carrying little visual weight, so a box-centred
    placement reads right-heavy. Measuring mass is what catches that.
    """
    import numpy as np
    a = np.asarray(alpha, dtype=float) / 255.0
    h, w = a.shape
    ys, xs = np.mgrid[0:h, 0:w]
    m = a.sum()
    return (xs * a).sum() / m - w / 2.0, (ys * a).sum() / m - h / 2.0


def build_icon():
    """Square app/favicon, built from the SIMPLIFIED glyph, not the full mark.

    icon.svg exists because logo.svg is illegible at 16px. Beyond the source
    swap this still crops to ink, rescales to the icon margin, and re-applies
    the SAME optical correction as the logo rather than inventing a second rule.
    The glyph is symmetric, so that correction should come out near zero
    horizontally - if it does not, the glyph has drifted off-axis.
    """
    big = ICON_PX * ICON_SUPERSAMPLE
    src = render_svg(ICON_SVG, big)
    src = src.crop(src.getchannel("A").getbbox())

    target = ICON_PX - 2 * ICON_MARGIN
    scale = target / max(src.size)
    sw, sh = max(1, round(src.width * scale)), max(1, round(src.height * scale))
    ink = src.resize((sw, sh), Image.LANCZOS)

    canvas = Image.new("RGBA", (ICON_PX, ICON_PX), (0, 0, 0, 0))
    px, py = (ICON_PX - sw) // 2, (ICON_PX - sh) // 2

    probe = canvas.copy()
    probe.paste(ink, (px, py), ink)
    dx, dy = centroid_drift(probe.getchannel("A"))
    px -= round(dx * OPTICAL_FACTOR)
    py -= round(dy * OPTICAL_FACTOR)

    canvas.paste(ink, (px, py), ink)
    OUT_ICON.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT_ICON)

    a = canvas.getchannel("A")
    bb = a.getbbox()
    print(f"wrote {OUT_ICON.relative_to(ROOT)}  ({ICON_PX}x{ICON_PX}, "
          f"{OUT_ICON.stat().st_size} bytes)  "
          f"margins L={bb[0]} T={bb[1]} R={ICON_PX-bb[2]} B={ICON_PX-bb[3]}  "
          f"optical shift ({-round(dx*OPTICAL_FACTOR):+d},{-round(dy*OPTICAL_FACTOR):+d})")


def build_preview():
    card = Image.new("RGB", (W, H), BG)

    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([90, 300, 620, 720], fill="#3d1d10")   # warm, under the exhaust
    gd.ellipse([240, 10, 820, 430], fill="#1a2032")   # cool, behind the nose
    card = Image.blend(card, glow.filter(ImageFilter.GaussianBlur(95)), 0.9)
    card = speed_lines(card)

    logo = render_svg(LOGO_SVG, LOGO_PX)
    wf = fit_ink_height(WORD_FONT, None, WORD_INK_H)
    wbb = ink(wf, WORD)
    tf = load(TAG_FONT, TAG_SIZE, TAG_WGHT)
    tbb = ink(tf, TAG)

    text_w = max(wbb[2] - wbb[0], tbb[2] - tbb[0])
    x0 = (W - (LOGO_PX + GAP + text_w)) // 2
    card.paste(logo, (x0, (H - LOGO_PX) // 2), logo)

    tx = x0 + LOGO_PX + GAP
    block_h = WORD_INK_H + RULE_GAP + RULE_H + TAG_GAP + (tbb[3] - tbb[1])
    y = (H - block_h) // 2

    d = ImageDraw.Draw(card)
    d.text((tx - wbb[0] + 80, y - wbb[1] + 80), WORD, font=wf, fill=FG)
    ry = y + WORD_INK_H + RULE_GAP
    d.rectangle([tx, ry, tx + RULE_W, ry + RULE_H], fill=ACCENT)
    d.text((tx - tbb[0] + 80, ry + RULE_H + TAG_GAP - tbb[1] + 80), TAG, font=tf, fill=MUTED)

    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    card.save(OUT_PNG)
    print(f"wrote {OUT_PNG.relative_to(ROOT)}  ({W}x{H}, {OUT_PNG.stat().st_size} bytes)")


TARGETS = {"preview": build_preview, "icon": build_icon}

if __name__ == "__main__":
    want = sys.argv[1:] or list(TARGETS)
    unknown = [t for t in want if t not in TARGETS]
    if unknown:
        sys.exit(f"unknown target(s): {', '.join(unknown)}\n"
                 f"usage: python3 media/build.py [{'|'.join(TARGETS)}]")
    for t in want:
        TARGETS[t]()
