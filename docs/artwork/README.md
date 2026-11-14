# Instrument artwork

Every instrument has four SVGs (icon, banner, avatar, and detail-panel header
background) in `public/instrument-*`. New or redrawn artwork follows one pipeline:
a sourced visual brief (`artwork-briefer`), the drawing (`artwork-illustrator`,
preferably as a master in [the generator](../../scripts/artwork/generate-instrument-artwork.py)),
a deterministic gate (`artwork-validator`), and a ship review (`artwork-reviewer`)
with a final human check in Storybook. The style guide and scripts are in
[.github/skills/artwork-draw](../../.github/skills/artwork-draw) and
[.github/skills/artwork-validate](../../.github/skills/artwork-validate).

Find briefs by instrument slug in [briefs/](./briefs/). Each brief gives a
drawing view, relative proportions, and a layout explaining where the parts
meet. Read these alongside the appearance checklist and icon priorities.
Some briefs include dimensions for a named specimen or model. Use those as
an anatomical check, allowing for foreshortening in the chosen view. Direct
reference photos, where linked, point back to their source pages. Run the artwork checks from
the repository root. See [artwork tooling setup](../INSTALLATION.md#5-install-artwork-tooling).

```sh
node .github/skills/artwork-brief/scripts/check-brief.mjs
node .github/skills/artwork-validate/scripts/check-artwork.mjs --require-render
```
