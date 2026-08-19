#!/usr/bin/env python3
"""Regenerate the published brand assets from media/logo.svg.

    python3 media/build.py            # everything
    python3 media/build.py preview    # public/preview.png
    python3 media/build.py icon       # public/icon.png
    python3 media/build.py hd-logo    # public/hardhat-deploy-logo.svg
    python3 media/build.py hd-preview # public/hardhat-deploy-preview.png

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
import re
import subprocess
import xml.etree.ElementTree as ET
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "media"
FONTS = MEDIA / "fonts"
LOGO_SVG = MEDIA / "logo.svg"
PILOT_SVG = MEDIA / "hardhat-pilot.svg"
OUT_PNG = ROOT / "public" / "preview.png"
OUT_ICON = ROOT / "public" / "icon.png"
OUT_HD_LOGO = ROOT / "public" / "hardhat-deploy-logo.svg"
OUT_HD_PNG = ROOT / "public" / "hardhat-deploy-preview.png"

W, H = 1280, 640                  # matches the previous card's aspect
BG = "#12141a"
FG = "#eef1f6"
MUTED = "#8e97a8"
ACCENT = "#ff6a24"

WORD = "rocketh"
TAG = "A deployment system for EVM Smart Contracts"
HD_WORD = "hardhat-deploy"
HD_TAG = "A Hardhat Plugin For Replicable Deployments And Easy Testing"

# Porthole placement, in the logo's AUTHORING coords (inside the outer matrix).
# The Ethereum mark sits at translate(79,14) scale(0.3597) over 256x417 artwork,
# so its upper diamond spans y 14..117.6, waist at y 90.4, x 79..171. (125,78)
# is that diamond's centroid; r=20 keeps the disc clear of all four edges.
PILOT_CX, PILOT_CY, PILOT_R = 125.0, 78.0, 20.0

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
TEXT_MAX_W = 700                  # see fit_word()
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


def fit_word(path, wght, text, max_h, max_w):
    """Largest size whose ink fits BOTH budgets.

    Height alone is not enough once there are two products: 'hardhat-deploy' is
    795px wide at the ink height where 'rocketh' is 507px, which overflows the
    canvas. Whichever budget binds first wins, so a longer name shrinks rather
    than overrunning.
    """
    lo, hi = 10, 500
    for _ in range(32):
        mid = (lo + hi) / 2
        bb = ink(load(path, int(mid), wght), text)
        fits = (bb[3] - bb[1]) < max_h and (bb[2] - bb[0]) < max_w
        lo, hi = (mid, hi) if fits else (lo, mid)
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
    if img.getchannel("A").getbbox() is None:
        sys.exit(f"{src} rendered to a fully transparent image - malformed SVG?")
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
    """Square app/favicon: the full mark, refitted to fill the frame.

    logo.svg carries margins tuned for sitting on a page next to the wordmark,
    plus its own baked-in optical nudge, and neither suits a 512px square. So
    this crops to ink, rescales to the icon margin, and re-applies the SAME
    optical correction rather than inventing a second, separately-tuned rule.

    Known limitation, accepted deliberately: the full mark does not resolve at
    16px. See README.
    """
    big = ICON_PX * ICON_SUPERSAMPLE
    src = render_svg(LOGO_SVG, big)
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


def build_card(logo_svg, word, tag, out):
    card = Image.new("RGB", (W, H), BG)

    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([90, 300, 620, 720], fill="#3d1d10")   # warm, under the exhaust
    gd.ellipse([240, 10, 820, 430], fill="#1a2032")   # cool, behind the nose
    card = Image.blend(card, glow.filter(ImageFilter.GaussianBlur(95)), 0.9)
    card = speed_lines(card)

    logo = render_svg(logo_svg, LOGO_PX)
    wf = fit_word(WORD_FONT, None, word, WORD_INK_H, TEXT_MAX_W)
    wbb = ink(wf, word)
    # TAG_SIZE is a FONT size, not an ink height - do not feed it to fit_word(),
    # which measures ink. The tagline only shrinks if it would overrun the column.
    tf = load(TAG_FONT, TAG_SIZE, TAG_WGHT)
    tbb = ink(tf, tag)
    if tbb[2] - tbb[0] > TEXT_MAX_W:
        tf = load(TAG_FONT, int(TAG_SIZE * TEXT_MAX_W / (tbb[2] - tbb[0])), TAG_WGHT)
        tbb = ink(tf, tag)

    text_w = max(wbb[2] - wbb[0], tbb[2] - tbb[0])
    x0 = (W - (LOGO_PX + GAP + text_w)) // 2
    card.paste(logo, (x0, (H - LOGO_PX) // 2), logo)

    tx = x0 + LOGO_PX + GAP
    word_h = wbb[3] - wbb[1]
    block_h = word_h + RULE_GAP + RULE_H + TAG_GAP + (tbb[3] - tbb[1])
    y = (H - block_h) // 2

    d = ImageDraw.Draw(card)
    d.text((tx - wbb[0] + 80, y - wbb[1] + 80), word, font=wf, fill=FG)
    ry = y + word_h + RULE_GAP
    d.rectangle([tx, ry, tx + RULE_W, ry + RULE_H], fill=ACCENT)
    d.text((tx - tbb[0] + 80, ry + RULE_H + TAG_GAP - tbb[1] + 80), tag, font=tf, fill=MUTED)

    out.parent.mkdir(parents=True, exist_ok=True)
    card.save(out)
    print(f"wrote {out.relative_to(ROOT)}  ({W}x{H}, {out.stat().st_size} bytes)  "
          f"word {wbb[2]-wbb[0]}x{word_h}px")


def build_preview():
    build_card(LOGO_SVG, WORD, TAG, OUT_PNG)


def build_hd_preview():
    if not OUT_HD_LOGO.exists():
        build_hd_logo()
    build_card(OUT_HD_LOGO, HD_WORD, HD_TAG, OUT_HD_PNG)


def build_hd_logo():
    """Compose the hardhat-deploy mark: the rocketh mark + the pilot porthole.

    The rocket geometry is READ from logo.svg rather than duplicated, so the two
    marks cannot drift apart; only the porthole is additive. The pilot's <defs>
    are carried over verbatim - see the warning in hardhat-pilot.svg.
    """
    logo = LOGO_SVG.read_text()
    m = re.search(r'<g transform="(matrix[^"]*)">(.*)</g>', logo, re.S)
    if not m:
        sys.exit(f"could not find the outer matrix group in {LOGO_SVG}")
    matrix, inner = m.group(1), m.group(2)

    praw = PILOT_SVG.read_text()
    vb = re.search(r'viewBox="([\d.\-\s]+)"', praw).group(1).split()
    pw, ph = float(vb[2]), float(vb[3])
    pbody = re.search(r"<svg[^>]*>(.*)</svg>", praw, re.S).group(1)
    # Strip comments FIRST. hardhat-pilot.svg's own warning text contains the
    # literal "<defs>", and matching that instead of the real element splits the
    # file mid-comment and produces invalid XML.
    pbody = re.sub(r"<!--.*?-->", "", pbody, flags=re.S)
    pdefs = "".join(re.findall(r"<defs\b.*?</defs>", pbody, re.S))
    pbody = re.sub(r"<defs\b.*?</defs>", "", pbody, flags=re.S)
    if "clipPath" not in pdefs:
        sys.exit("pilot clipPath definition missing; she would render unclipped")

    scale = (2 * PILOT_R) / max(pw, ph)
    tx, ty = PILOT_CX - PILOT_R, PILOT_CY - PILOT_R
    out = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" '
        f'width="256" height="256" role="img" aria-label="hardhat-deploy">\n'
        f"  <title>hardhat-deploy</title>\n"
        f"  <!-- GENERATED by media/build.py from logo.svg + hardhat-pilot.svg. Do not edit. -->\n"
        f"{pdefs}\n"
        f'  <g transform="{matrix}">\n{inner}\n'
        f'    <g transform="translate({tx:.3f},{ty:.3f}) scale({scale:.6f})">\n'
        f"{pbody}\n    </g>\n  </g>\n</svg>\n"
    )
    try:
        ET.fromstring(out)
    except ET.ParseError as exc:
        sys.exit(f"generated {OUT_HD_LOGO.name} is not well-formed XML: {exc}")
    OUT_HD_LOGO.write_text(out)
    refs = set(re.findall(r"url\(#([^)]+)\)", out))
    defined = set(re.findall(r'<\w+[^>]*\bid="([^"]+)"', out))
    dangling = sorted(refs - defined)
    if dangling:
        sys.exit(f"dangling url(#) references in {OUT_HD_LOGO.name}: {dangling}")
    print(f"wrote {OUT_HD_LOGO.relative_to(ROOT)}  ({OUT_HD_LOGO.stat().st_size} bytes)  "
          f"refs ok: {sorted(refs)}")


TARGETS = {
    "preview": build_preview,
    "icon": build_icon,
    "hd-logo": build_hd_logo,
    "hd-preview": build_hd_preview,
}

if __name__ == "__main__":
    want = sys.argv[1:] or list(TARGETS)
    unknown = [t for t in want if t not in TARGETS]
    if unknown:
        sys.exit(f"unknown target(s): {', '.join(unknown)}\n"
                 f"usage: python3 media/build.py [{'|'.join(TARGETS)}]")
    for t in want:
        TARGETS[t]()
