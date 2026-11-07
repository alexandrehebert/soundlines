# Scripts

Run every script from the repository root.

| Folder | Contents | Entry point |
| --- | --- | --- |
| [graph/](./graph) | Graph data tooling. `reviewStatus.ts` rebuilds `src/data/review-status.json` from `docs/evidence`. | `npm run review-status` |
| [loops/briefs/](./loops/briefs) | Genre loop briefs (`<slug>.json`) and selection reports (`<slug>.selection.json`) for the genre loops shipped as `public/loops/<slug>.wav`. | See the loop skills below |
| [previews/](./previews) | Renders the 10-second ACE-Step genre previews in `public/genre-previews` from the genre briefs in `previews/briefs/`. | `node scripts/previews/render-ace-previews.mjs [genre ...]` |
| [artwork/](./artwork) | Generates the instrument SVG artwork in `public/instrument-*` for the instruments drawn as code (`ART`), and holds their visual briefs in `artwork/briefs/<slug>.json`. | `python3 scripts/artwork/generate-instrument-artwork.py [slug ...] [--check]` |

Tools used by the agent skills stay bundled with their skill in `.github/skills/<skill>/scripts`:

- Graph: `graph-edit/scripts/lookup.mjs` (query `graph.json`) and `graph-review/scripts/diff.mjs` (diff graph changes).
- Loops: `loop-brief/scripts/check-brief.mjs` (brief lint), `loop-produce/scripts/*` (ACE-Step server, planning, rendering, loop extraction) and `loop-validate/scripts/check-loop.py` (quality gate).
- Artwork: `artwork-brief/scripts/check-brief.mjs` (brief lint) and `artwork-validate/scripts/check-artwork.mjs` (quality gate and PNG review sheets).
