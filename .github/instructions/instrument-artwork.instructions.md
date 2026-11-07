---
description: 'Rules for Soundlines instrument artwork SVGs, their generator and visual briefs.'
applyTo: 'public/instrument-*/**,scripts/artwork/**,docs/artwork/**,src/stories/fixtures/instrument-artwork-v1/**'
---
# Instrument artwork

- Pipeline, one owner per step: brief (`artwork-briefer`, `artwork-brief` skill) → draw
  (`artwork-illustrator`, `artwork-draw`) → deterministic gate (`artwork-validator`, `artwork-validate`)
  → ship decision (`artwork-reviewer`, `artwork-review`) → human sign-off in Storybook.
- Every `instrument:<slug>` node has exactly four files named `<slug>.svg` in `public/instrument-icons`,
  `-banners`, `-avatars` and `-header-backgrounds`; canvases, palette and icon rules are in
  `.github/skills/artwork-draw/references/style-guide.md`.
- Instruments in the `ART` dict of `scripts/artwork/generate-instrument-artwork.py` are generated: change
  the master and run the generator, never hand-edit those SVGs (`--check` fails on drift).
- Icons are CSS masks: `currentColor` stroke only. Header backgrounds stay transparent with the art on
  the right behind a reveal mask. No logos, brand wordmarks, raster images, `<style>` or external refs.
- Gate: `node .github/skills/artwork-validate/scripts/check-artwork.mjs`; PNG sheets go to
  `${ARTWORK_STAGE_ROOT:-~/.cache/soundlines-artwork}`, not the repo.
