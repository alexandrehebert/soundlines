---
name: artwork-review
description: 'Gate Soundlines instrument artwork before it ships: on top of the artwork-validate result, checks the drawing against its brief and references (anatomy, counts, proportions, look-alike confusion), icon recognisability at 16-24 px, header legibility under the title, consistency with the family and the whole set, provenance, and asks for a human visual sign-off in Storybook. Use when new or redrawn instrument artwork is ready for approval, when comparing before and after, or when deciding whether to redraw, revise the brief or ship.'
argument-hint: 'Instrument slugs and the PNG stage folder'
---

# Review instrument artwork

The review answers: **should this artwork represent the instrument in the app?** It composes the
deterministic gate (`artwork-validate`) with judgement. It never edits briefs or SVGs; it routes each
finding to its owner.

## Inputs

`docs/artwork/briefs/<slug>.json`, the four SVGs, `$STAGE/<slug>.png`, `$STAGE/icons.png`, the
previous version in `src/stories/fixtures/instrument-artwork-v1/` when redrawn, and the diff.

## Procedure

1. **Gate.** Run `artwork-validate` on the slugs with `--png-dir`, then on the whole set. Any FAIL is
   blocking; stop judging. Lint the brief; a failing or missing brief is blocking.
2. **Provenance.** `method: generator` ⇒ the slug is in `ART` and `--check` is clean (no hand edits);
   `method: hand` ⇒ the slug is not in `ART`. The redraw keeps a v1 fixture and is listed in
   `revisedInstruments`.
3. **Accuracy against the brief.** Open the sheet. Compare the drawing with the `geometry` view, proportions, and layout. For every `features` item, say where it is visible
   and whether counts and placement match; open at least one brief reference to compare proportions.
   Any `avoid` item present, or a wrong count of strings, courses, pegs, keys or drums, is blocking.
4. **Icon.** At 24 and 16 px in `$STAGE/<slug>.png` and among its neighbours in `icons.png`: the
   `iconFeatures` survive, it is not confusable with another icon in the set, weight and size match the
   family. Check the brief's natural playing pose and symmetry about the neck axis for symmetrical
   string instruments. Rotation must preserve the complete shape and keep all strokes in the canvas.
5. **Header.** Title area clear, art readable on the right, nothing important cut by the reveal.
6. **Set consistency.** Tilt, palette, line weight, level of detail and framing match the family on the
   sheets; banner, avatar and header show the same drawing.
7. **Human eye.** End with a sign-off request: `npm run storybook`, *Foundations/Instrument artwork* →
   *Catalog* (and *Before & after* for redraws), plus the detail panel of the instrument in the app
   (`/instruments?focus=instrument:<slug>`) in dark and light themes and on a phone width. Artwork ships
   after a human confirms.

## Verdict

`SHIP`, `REDRAW` (→ `artwork-draw`, one concrete drawing change per finding), `REVISE BRIEF`
(→ `artwork-brief`: wrong or missing feature, weak references, wrong variant) or `BLOCK` (gate,
brief lint or provenance failure). Findings: blocking | should-fix, each with evidence (sheet region,
brief item, reference URL) and owner. No style nits; do not restate passing checks.
