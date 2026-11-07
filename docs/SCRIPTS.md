# Scripts

Run every script from the repository root. Executable code stays in `scripts/` or its owning skill; briefs, reports and workflow documentation live under `docs/`.

| Folder | Contents | Entry point |
| --- | --- | --- |
| [scripts/graph/](../scripts/graph) | Graph data tooling. `reviewStatus.ts` rebuilds `src/data/review-status.json` from `docs/graph/evidence`. | `npm run review-status` |
| [loops/briefs/](./loops/briefs) | Genre loop briefs (`<slug>.json`) and selection reports (`<slug>.selection.json`) for the genre loops shipped as `public/loops/<slug>.wav`. | See the loop skills below |
| [previews/briefs/](./previews/briefs) | Genre briefs for the 10-second ACE-Step previews in `public/genre-previews`. | `node .github/skills/preview-produce/scripts/render-ace-previews.mjs [genre ...]` |
| [scripts/artwork/](../scripts/artwork) | Generates the instrument SVG artwork in `public/instrument-*` for the instruments drawn as code (`ART`), with visual briefs in `docs/artwork/briefs/<slug>.json`. | `python3 scripts/artwork/generate-instrument-artwork.py [slug ...] [--check]` |

Tools used by the agent skills stay bundled with their skill in `.github/skills/<skill>/scripts`:

- Graph: `graph-edit/scripts/lookup.mjs` (query `graph.json`) and `graph-review/scripts/diff.mjs` (diff graph changes).
- Loops: `loop-brief/scripts/check-brief.mjs` (brief lint), `loop-produce/scripts/*` (ACE-Step server, planning, rendering, loop extraction) and `loop-validate/scripts/check-loop.py` (quality gate).
- Artwork: `artwork-brief/scripts/check-brief.mjs` (brief lint) and `artwork-validate/scripts/check-artwork.mjs` (quality gate and PNG review sheets).

- Previews: `preview-produce/scripts/render-ace-previews.mjs` (catalogue rendering) and `extract-ace-preview.py` (ten-second excerpt extraction). Genre briefs remain in `docs/previews/briefs/`.

The [complete genre loop brief catalogue](./loops/CATALOGUE.md) maps every graph genre to a runnable brief or a documented special case. New grid briefs use shorter source takes for faster iteration; special cases require workflow support before generation.
