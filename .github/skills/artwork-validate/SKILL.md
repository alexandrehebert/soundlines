---
name: artwork-validate
description: 'Run the deterministic quality gate on Soundlines instrument artwork: coverage of all four SVG variants per instrument node, orphans, well-formed XML, canvases and viewBoxes, forbidden elements and external references, duplicate or dangling ids, file size, family palette, opaque backdrops, header legibility (transparent title area), mask-safe monochrome icons, icon coverage and extent at 24 px, and generator drift, with PNG review sheets. Use after drawing or regenerating artwork, before committing artwork, when an instrument icon test fails, or when an icon or header looks wrong in the app.'
argument-hint: 'Instrument slugs (default: all) and optionally a PNG folder'
---

# Validate instrument artwork

Validation answers one question: **are the artwork files mechanically correct?** It is deterministic,
never judges accuracy or beauty (`artwork-review`) and never edits files.

## Run

```sh
C=.github/skills/artwork-validate/scripts/check-artwork.mjs
STAGE=${ARTWORK_STAGE_ROOT:-~/.cache/soundlines-artwork}/<slug>
node $C                                  # whole set: coverage, orphans, generator drift
node $C <slug> [<slug> ...] --png-dir $STAGE   # selected instruments + review sheets
node $C --json                           # machine-readable findings
node .github/skills/artwork-brief/scripts/check-brief.mjs   # brief lint
```

Exit code 1 means at least one FAIL. Rendered checks and sheets use `sharp` (installed with Next); if it
is missing the run says so in one WARN. Sheets: `<slug>.png` (banner @2×, header under a mock
detail-panel title, avatar, icon mask at 96/48/24/16 px in the family colour and slate-200) and
`icons.png` (the whole icon set at 48 and 24 px, for consistency). Mention the paths for the reviewer.

## Checks

| Check | Level | Meaning / usual cause → owner |
|---|---|---|
| `missing` | FAIL | a variant is missing for an instrument node → `artwork-draw` |
| `orphan` | FAIL | an SVG without an instrument node (typo or removed node) → delete, or `graph-edit` |
| `xml`, `root`, `viewBox` | FAIL | malformed file or wrong canvas → `artwork-draw` |
| `forbidden` | FAIL | script, style, image, foreignObject, event handler, external or `data:` ref |
| `ids`, `refs` | FAIL | duplicate id, or `url(#id)` with no definition in the same file |
| `size` | FAIL | icon > 2 KB, others > 20 KB (set max 16.6 KB) → simplify paths, round coordinates |
| `palette` | FAIL | family accent from `src/theme.ts` absent (strings also accepts generator `#d9a067`) |
| `backdrop`, `opaque` | FAIL | banner/avatar must paint `#0b1020` over the whole canvas; header must not |
| `reveal`, `legibility` | FAIL | header without mask, or mean alpha of x < 150 px > 0.02 (title area) |
| `presence` | WARN | header art mean alpha x ≥ 220 px < 0.05 (set min 0.066) → reviewer judges |
| `monochrome`, `stroke` | FAIL/WARN | icon with colours, gradients, text, not `currentColor`; opacity or stroke outside 1.5–2 warns |
| `coverage` | FAIL < 0.05 or > 0.6, WARN < 0.10 or > 0.45 | icon ink at 24 px (set 0.11–0.42, median 0.23) |
| `extent` | FAIL < 12, WARN < 16 px | longest side of the inked icon box at 24 px (set 16–24, median 20) |
| `text` | WARN | text outside the electronic family (only hardware panel labels are expected) |
| `generator` | FAIL | a generated file differs from `generate-instrument-artwork.py --check` → edit the master, regenerate |
| `family` | FAIL | the node's family has no colour in `src/theme.ts` → `graph-edit` |

Reference: the shipped set (72 instruments, 23 generated) passes with 0 FAIL, 0 WARN.

## Rules

- Never loosen a threshold to pass one asset. Change limits only with new calibration across the set, in
  `check-artwork.mjs`, with this table and the reference line updated.
- The gate complements, not replaces, `src/components/InstrumentIcon.test.tsx` (icon per instrument).

## Report

`PASS` / `WARN (n)` / `FAIL (n)` per instrument, then per finding: variant | check | detail | owner.
List the PNG paths.
