# media

Brand sources for the rocketh site. Everything published under `public/` is either copied or generated from here, so edit these files rather than the ones in `public/`.

| Source | Published as | How |
| --- | --- | --- |
| `logo.svg` | `public/logo.svg` | straight copy |
| `logo.svg` + `build.py` | `public/preview.png` | `python3 media/build.py preview` |
| `icon.svg` + `build.py` | `public/icon.png` | `python3 media/build.py icon` |

## Regenerating

```bash
python3 media/build.py            # everything
python3 media/build.py preview    # social card only
python3 media/build.py icon       # favicon only
```

Requires Python with [Pillow](https://python-pillow.org/), and Inkscape on `PATH` (used only to raster `logo.svg`). Fonts are loaded by path from `media/fonts/`, so nothing needs to be installed system-wide and the output does not depend on the machine's font configuration. The script is deterministic: repeated runs produce a byte-identical PNG.

## logo.svg

An Ethereum mark as a rocket nose, with faceted fins and a three-layer exhaust plume. Notes on the things that are easy to "fix" by mistake:

- **The single `matrix(...)` is not arbitrary.** It folds three steps: `rotate(30, 128, 128)` for the pose, a scale-and-translate that centres the bounding box in the 256 viewBox with a 12px margin, and a deliberate leftward nudge. The nudge exists because bounding-box centring reads right-heavy: the flame is a thin taper that stretches the bounding box leftward while carrying almost no visual weight, leaving roughly 67% of the ink mass right of centre. The shift is 35% of the measured centroid drift. Correcting the full drift crowds the flame tip against the left edge and trades one imbalance for another.
- **The darkest ETH facet is `#2c313a`, not the canonical `#141414`.** It was lightened so the mark survives on the VitePress dark background (`#1b1b1f`), where the original facets were effectively invisible.
- **The ETH mark keeps its own nested transform** so the six upstream Ethereum paths stay byte-identical to the canonical artwork and remain easy to re-sync. Flattening it would obscure that provenance.

If the geometry changes, the fit and the optical nudge need re-deriving rather than eyeballing.

## Fonts

Vendored so the build is reproducible without a network fetch or a system install. Both are SIL Open Font License 1.1; the license texts sit alongside them and must be kept with the files.

| File | Used for | License |
| --- | --- | --- |
| `fonts/ChakraPetch-BoldItalic.ttf` | wordmark | `fonts/OFL-ChakraPetch.txt` |
| `fonts/SpaceGrotesk-Variable.ttf` | tagline | `fonts/OFL-SpaceGrotesk.txt` |

The wordmark is rasterised into the card, so there is no webfont dependency at runtime. If the wordmark ever moves into the page itself, convert it to paths rather than loading the font.

## icon.svg

**The favicon is a different drawing from the logo, on purpose.** `logo.svg` is illegible at 16px, which is the size a browser tab actually renders: its fins, nose and plume merge into an indistinct blob. No amount of scaling or antialiasing fixes that, because the problem is element count, not resolution.

`icon.svg` therefore drops the fins entirely, reduces the Ethereum mark to its upper diamond with a single crease, and keeps one chunky plume. Three large shapes instead of eleven small ones.

It is also **upright rather than tilted 30 degrees**. Losing the tilt is a real cost, since the diagonal is part of the identity, but a symmetric shape survives having only a handful of pixels far better than a diagonal one. An illegible favicon communicates nothing, so legibility won.

Beyond the source swap, `build.py icon` treats it like the logo: crop to ink, rescale to `ICON_MARGIN`, then apply the *same* `OPTICAL_FACTOR` rather than a second, differently-tuned rule. Because the glyph is symmetric that correction comes out at exactly `+0` horizontally with a 50.0/50.0 mass split. **If it ever reports a non-zero horizontal shift, the glyph has drifted off-axis** - that number is a free regression check, so it is printed on every run.

Rendered at 4x and downsampled with Lanczos; the mark is all hard diagonal edges and rasterising straight to 512 visibly stairsteps them.

## Known gaps

- The icon fills only ~27% of its frame, because the glyph is taller than it is wide and is fitted by its longest side. Widening it would buy real pixels at 16px.
- The favicon and the logo are now two drawings that must be kept in visual sync by hand. A palette change to one will not propagate to the other.
- There is no dark/light split. The current palette was chosen to work on both, so `index.md` points its `dark:` and `light:` hero slots at the same file.
- The tagline is illegible at feed thumbnail size. That is normal for an Open Graph card, where the wordmark carries the recognition, but it means the tagline is decorative rather than functional.
