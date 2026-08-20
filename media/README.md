# media

Brand sources for the rocketh site. Everything published under `public/` is either copied or generated from here, so edit these files rather than the ones in `public/`.

| Source                                 | Published as                        | How                                 |
| -------------------------------------- | ----------------------------------- | ----------------------------------- |
| `logo.svg`                             | `public/logo.svg`                   | straight copy                       |
| `logo.svg` + `build.py`                | `public/preview.png`                | `python3 media/build.py preview`    |
| `logo.svg` + `build.py`                | `public/icon.png`                   | `python3 media/build.py icon`       |
| `logo.svg` + `hardhat-pilot.svg`       | `public/hardhat-deploy-logo.svg`    | `python3 media/build.py hd-logo`    |
| `hardhat-deploy-logo.svg` + `build.py` | `public/hardhat-deploy-preview.png` | `python3 media/build.py hd-preview` |

## Regenerating

```bash
python3 media/build.py              # everything
python3 media/build.py preview      # rocketh social card
python3 media/build.py icon         # favicon
python3 media/build.py hd-logo      # hardhat-deploy mark
python3 media/build.py hd-preview   # hardhat-deploy social card
```

Requires Python with [Pillow](https://python-pillow.org/), and Inkscape on `PATH` (used only to raster `logo.svg`). Fonts are loaded by path from `media/fonts/`, so nothing needs to be installed system-wide and the output does not depend on the machine's font configuration. The script is deterministic: repeated runs produce a byte-identical PNG.

## logo.svg

An Ethereum mark as a rocket nose, with faceted fins and a three-layer exhaust plume. Notes on the things that are easy to "fix" by mistake:

- **The single `matrix(...)` is not arbitrary.** It folds three steps: `rotate(30, 128, 128)` for the pose, a scale-and-translate that centres the bounding box in the 256 viewBox with a 12px margin, and a deliberate leftward nudge. The nudge exists because bounding-box centring reads right-heavy: the flame is a thin taper that stretches the bounding box leftward while carrying almost no visual weight, leaving roughly 67% of the ink mass right of centre. The shift is 35% of the measured centroid drift. Correcting the full drift crowds the flame tip against the left edge and trades one imbalance for another.
- **The darkest ETH facet is `#2c313a`, not the canonical `#141414`.** It was lightened so the mark survives on the VitePress dark background (`#1b1b1f`), where the original facets were effectively invisible.
- **The ETH mark keeps its own nested transform** so the six upstream Ethereum paths stay byte-identical to the canonical artwork and remain easy to re-sync. Flattening it would obscure that provenance.

If the geometry changes, the fit and the optical nudge need re-deriving rather than eyeballing.

## hardhat-deploy

`hardhat-deploy` is no longer built as a separate site; its docs live in `hardhat-deploy/` in this repo and are served by this VitePress site. Its assets are therefore generated here too.

`public/hardhat-deploy-logo.svg` is **generated, not authored**. It is the rocketh mark plus a porthole holding the Hardhat mascot. The rocket geometry is _read from_ `logo.svg` at build time rather than copied, so the two marks cannot drift apart; only the porthole is additive. Edit `logo.svg` and both marks change together.

`hardhat-pilot.svg` holds the porthole. Read the warning inside it before touching it: the character is clipped by a `clipPath`, and that clip is the whole reason she reads as being _inside_ the rocket. A dangling `clip-path` url is not an error in SVG, it is silently ignored, so dropping the definition renders her whole body with no warning. `build.py` fails loudly if the clip goes missing, and checks the generated file for dangling `url(#)` references.

The previous mark also had a second, male mascot standing on the ground outside the rocket. He was dropped: he sat outside the composition and unbalanced it.

## Fonts

Vendored so the build is reproducible without a network fetch or a system install. Both are SIL Open Font License 1.1; the license texts sit alongside them and must be kept with the files.

| File                               | Used for | License                      |
| ---------------------------------- | -------- | ---------------------------- |
| `fonts/ChakraPetch-BoldItalic.ttf` | wordmark | `fonts/OFL-ChakraPetch.txt`  |
| `fonts/SpaceGrotesk-Variable.ttf`  | tagline  | `fonts/OFL-SpaceGrotesk.txt` |

The wordmark is rasterised into the card, so there is no webfont dependency at runtime. If the wordmark ever moves into the page itself, convert it to paths rather than loading the font.

## icon.png

The favicon is the **full mark**, so it stays visually identical to the logo. `logo.svg` is not used verbatim though: it carries margins tuned for sitting on a page next to the wordmark, plus its own baked-in optical nudge, and neither suits a 512px square. `build.py icon` therefore crops to the ink, rescales to `ICON_MARGIN`, then re-applies the _same_ `OPTICAL_FACTOR` as the logo rather than introducing a second, separately-tuned centring rule.

Rendered at 4x and downsampled with Lanczos; the mark is all hard diagonal edges and rasterising straight to 512 visibly stairsteps them.

## Known gaps

- **The mark does not resolve at 16px.** At browser-tab size the fins, nose and plume merge into an indistinct blob. This is inherent to a faceted multi-element mark and cannot be fixed by scaling or antialiasing; it would need a purpose-drawn simplified glyph. That trade was considered and **deliberately declined**: a simplified glyph reads better small but stops looking like the logo, and brand consistency was judged worth more than tab-icon legibility. Revisit only if the favicon becomes a real recognition surface.
- The icon fills only ~26% of its frame, because the artwork is taller than it is wide and is fitted by its longest side.
- There is no dark/light split. The current palette was chosen to work on both, so `index.md` points its `dark:` and `light:` hero slots at the same file.
- The tagline is illegible at feed thumbnail size. That is normal for an Open Graph card, where the wordmark carries the recognition, but it means the tagline is decorative rather than functional.
