# Instrument artwork

Every instrument has four SVGs (icon, banner, avatar, and detail-panel header
background) in `packages/media/public/instrument-*`. New or redrawn artwork follows one pipeline:
a sourced visual brief (`artwork-briefer`), the drawing (`artwork-illustrator`,
preferably as a master in [the generator](../../scripts/artwork/generate-instrument-artwork.py)),
a deterministic gate (`artwork-validator`), and a ship review (`artwork-reviewer`)
with a final human check in Storybook. The style guide and scripts are in
[.agents/skills/artwork-draw](../../.agents/skills/artwork-draw) and
[.agents/skills/artwork-validate](../../.agents/skills/artwork-validate).

Find briefs by instrument slug in [briefs/](./briefs/). Each brief gives a
drawing view, relative proportions, and a layout explaining where the parts
meet. Read these alongside the appearance checklist and icon priorities.
Some briefs include dimensions for a named specimen or model. Use those as
an anatomical check, allowing for foreshortening in the chosen view. Direct
reference photos, where linked, point back to their source pages. Run the artwork checks from
the repository root. See [artwork tooling setup](../INSTALLATION.md#5-install-artwork-tooling).

```sh
node .agents/skills/artwork-brief/scripts/check-brief.mjs
node .agents/skills/artwork-validate/scripts/check-artwork.mjs --require-render
```

## Genre covers

Run `pnpm artwork:genres disco` to read a genre brief. Use any catalogue genre
slug, or pass `--all` to read the entire collection. The brief pulls in the
genre's description, period, family and references from the catalogue. Each
genre starts with a draft direction. Save the final prompt and generator in
[genre-briefs/](./genre-briefs/) when making a cover.

Create a square editorial image around one subject supported by the brief.
Add the result as a 640–1200 px WebP at
`packages/media/public/genre-artwork/<slug>.webp` and run
`pnpm artwork:genres --check`. The check verifies catalogue coverage, the
saved prompt for each image, and the format and dimensions. The media build
indexes the covers under `genreArtwork` in the shared manifest.
