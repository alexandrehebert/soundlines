# Instrument artwork style guide

Every instrument node (`instrument:<slug>` in `src/data/graph.json`) ships four SVGs with the same
file name `<slug>.svg` (URL-encoded slug). All values below are measured from the shipped set and
enforced by `check-artwork.mjs` where they are mechanical.

## Canvases

| Folder | viewBox | Used by | Background | Placement |
|---|---|---|---|---|
| `public/instrument-icons` | `0 0 24 24` + `width="24" height="24"` | `InstrumentIcon.tsx`: a CSS **mask** tinted with the family colour (`chartTextColor`), timeline bars, detail panel, undated list | none | fills 16–24 px of the 24 px box, diagonal reading via rotation |
| `public/instrument-banners` | `0 0 360 160` | Storybook catalogue (no app consumer yet) | opaque `#0b1020` + family halo + 20 px grid | centre ≈ (180, 77), tilt −9° |
| `public/instrument-avatars` | `0 0 160 160` | Storybook catalogue (no app consumer yet) | same as banner | centre ≈ (80, 80), master scale × 0.48 |
| `public/instrument-header-backgrounds` | `0 0 360 120` | `DetailPanel.tsx` header `background-image` (`bg-contain bg-right-bottom`) under the title | **transparent** (panel is `slate-950`) | right side only, x ≈ 262–276, master scale × 0.61, inside a left→right reveal mask |

The banner is the **master** drawing; avatar and header are the same geometry re-framed, so a fix to the
instrument is always made once and re-rendered three times. The icon is a separate simplified path.

## Palette

Accent = the family colour in `FAMILY_COLORS` (`src/theme.ts`); the shade is its dark partner.

| Family | Accent | Shade |
|---|---|---|
| strings | `#e2a76f` (hand set) / `#d9a067` (generator `wood`) | `#614830` / `#674437` |
| keyboards | `#818cf8` | `#373c6b` |
| winds | `#34d399` | `#165b42` |
| brass | `#fbbf24` | `#6c520f` |
| percussion | `#ef4444` | `#671d1d` |
| electronic | `#38bdf8` | `#18516b` |

Body fill is a linear gradient accent → shade (`x2≈.34–.38`, `y2=1`). Detail inks from the generator:
edge `#f3d5a5`, dark `#362535`, gold hardware `#edbc76`, string wire `#fff0d2`, steel `#b8c4d0`.
Halo: radial gradient fading out from the accent (generator, `.18`–`.23` opacity) or the shade (hand set, `.49`). Grid: accent stroke 1 px at `.12`–`.19`.
No other saturated hues except for a defining physical feature (e.g. TB-303 silver panel, conga skin).

## Header reveal (legibility)

The title and type badge sit on the left of the header. The art must be invisible for x < 150 px: wrap
it in `<mask id="reveal" maskUnits="userSpaceOnUse">` filled by a horizontal gradient with stops
`0` → `.33: 0`, `.61: .27`, `.88: .61`, `1: .42` (hand set: `.32/.58/.88/1` → `0/.18/.54/.22`).
Never paint a backdrop rect in a header. Measured gate: mean alpha of x < 150 px ≤ 0.02; mean alpha of
x ≥ 220 px ≥ 0.05.

## Icon rules

- One or a few `<path>`s, `fill="none" stroke="currentColor"`, `stroke-linecap/linejoin="round"`,
  stroke width 1.6 (generator) or 2 (hand set). No colours, gradients, masks, text or opacity: the icon is
  a mask, so colour is meaningless and partial opacity turns faint.
- Keep the 1–3 `iconFeatures` from the brief and drop strings, knobs and small controls.
- Coverage at 24 px 0.10–0.45 (set median 0.23); inked bounding box ≥ 16 px (median 20).
- Rotate with `transform="rotate(<deg> 12 12)"` so long instruments read diagonally (`ICON_ANGLES`).
- Check 16 px: the timeline and undated list render it that small.

## Drawing rules

- Front view, recognisable anatomy from the brief's references; correct counts where visible
  (strings, courses, pegs, keys, pads, drums). Proportions from the reference, not from memory.
- Same tilt (`ARTWORK_TILT = -9`) and lighting as the set; flat vector shapes, no photo textures, no
  filters, no drop shadows beyond the halo.
- Text only for electronic hardware panels, and only model labels that are the graph name (TB-303);
  never a manufacturer logo or wordmark.
- No `<script>`, `<style>`, `<image>`, `<foreignObject>`, event handlers, external or `data:` refs.
  Unique ids per file (the generator reuses `wood`, `halo`, `grid`, `fade`, `reveal`).
- Size: icon ≤ 2 KB, others ≤ 20 KB; round coordinates to ≤ 2 decimals.

## Generator API (`scripts/artwork/generate-instrument-artwork.py`)

The generator owns 23 instruments (the `ART` dict) and writes all four files for each. Hand-drawn files
cover the rest; they follow the same canvases.

```python
'charango': (plucked, 1.26, '<24px icon path d>'),
#  slug      draw(slug) -> banner-space geometry centred on (0, 0), ~ -150..150 × -50..50
#            scale: banner scale of the master (avatar ×0.48, header ×0.61 are applied for you)
#            icon: path data in the 24×24 box (ICON_ANGLES[slug] rotates it)
```

- Helpers: `path`, `rect`, `ellipse`, `strings(start, end, count, spread)`, `frets`, `pegs`, `rosette`,
  `knobs`, `keyboard`, `panel_text`; family builders `plucked`, `bowed`, `indian`, `synthesizer`.
- Accent/shade per slug: the `illustration()` colour map (default = strings wood). Add the slug there
  with its family pair when it is not strings.
- Per-slug offsets for long instruments live in `illustration()` (`x += …` blocks).
- `python3 scripts/artwork/generate-instrument-artwork.py <slug>` writes one instrument;
  `--check [slug]` exits 1 when a generated file differs (hand edit or stale run).

## Known failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Edit to a generated SVG disappears | the next generator run overwrites it | edit the master in `ART`, regenerate |
| Header art covers the title | art placed left of x≈200 or reveal mask missing | keep header centre ≥ 262, keep the mask |
| Icon is a blob at 16 px | strings/frets/knobs kept in the icon | keep only `iconFeatures` |
| Icon vanishes in the timeline | colours or opacity in the icon | `currentColor` stroke only |
| Instrument reads as its neighbour (ukulele vs charango, viola vs violin) | proportions guessed | use brief references and its `avoid` list |
| `url(#id)` renders black/none | id typo or id defined in another file | ids are per file; check `refs` in the gate |
| Instrument looks squashed in the avatar | long instrument with default framing | add a per-slug offset in `illustration()` |
