---
name: artwork-draw
description: 'Draw or redraw the four SVGs of a Soundlines instrument (public/instrument-icons, -banners, -avatars, -header-backgrounds) from an approved brief, preferably as a master in scripts/artwork/generate-instrument-artwork.py, following the house style (canvases, family palette, -9° tilt, header reveal mask, mask-safe icons). Use when adding artwork for a new instrument node, redrawing an inaccurate one, fixing artwork validation failures, or applying artwork review findings.'
argument-hint: 'Instrument slug, plus validation or review findings to address'
---

# Draw instrument artwork

Drawing owns **the SVG files**. It follows the brief (`artwork-brief`) and the
[style guide](./references/style-guide.md); it never changes the brief, the gate thresholds or the
ship decision.

## Inputs

`docs/artwork/briefs/<slug>.json` (must pass `check-brief.mjs`; without a brief, stop and hand to
`artwork-brief`), the style guide, and neighbouring instruments of the same family for consistency.

## Procedure

1. **Read the brief and look at the set.** Render the current state of the slug and the family:
   `node .github/skills/artwork-validate/scripts/check-artwork.mjs <slug> <neighbour> --png-dir $STAGE`
   with `STAGE=${ARTWORK_STAGE_ROOT:-~/.cache/soundlines-artwork}/<slug>` and open the PNGs.
2. **Keep the previous version for review** when redrawing: copy the four current files to
   `src/stories/fixtures/instrument-artwork-v1/instrument-<kind>/<slug>.svg` (only if not already there)
   and add the slug to `revisedInstruments` in `src/stories/InstrumentArtwork.stories.tsx`, so the
   Storybook *Before & after* story shows both.
3. **Draw the master.**
   - `method: generator`: add or edit the `ART['<slug>']` entry (draw function, banner scale, icon
     path), the colour pair in `illustration()` for non-strings families, an offset there if the
     instrument is long, and `ICON_ANGLES` if the icon reads better diagonally. Reuse the family
     builders and helpers. Then `python3 scripts/artwork/generate-instrument-artwork.py <slug>`.
   - `method: hand`: write the four files by hand on the canvases of the style guide, copying the
     structure of a hand-drawn neighbour (e.g. `accordion.svg`). Edit generated files only through the
     generator; the gate fails on drift.
4. **Check every brief item on the PNG**: each `features` count and placement on the banner, each
   `iconFeatures` at 24 and 16 px, nothing in `avoid`. Iterate until all hold.
5. **Gate.** `node .github/skills/artwork-validate/scripts/check-artwork.mjs <slug> --png-dir $STAGE`
   must PASS (WARNs explained), then the full set without arguments (orphans, generator drift).
6. **Tests.** `npx vitest run src/components/explorer/InstrumentIcon.test.tsx` (every instrument has an icon).

## Rules

- All four files every time; the banner is the master and the avatar/header reuse its geometry.
- Icons are masks: `currentColor` stroke only, no colours, gradients, text or opacity.
- Headers stay transparent on the left (title area); never add a backdrop rect.
- No logos or brand wordmarks, no raster images, no `<style>`, scripts or external references.
- New instrument nodes come from `graph-edit`; never create artwork for a slug that is not in the graph,
  and delete artwork only when its node is removed.
- Output for the reviewer: changed files, the brief items and where each is visible, the gate result and
  the PNG paths.
