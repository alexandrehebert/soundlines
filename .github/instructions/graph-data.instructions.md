---
description: 'Rules for editing Soundlines graph data, its locale overlays and evidence notes.'
applyTo: 'src/data/graph*.json,docs/graph/evidence/**'
---
# Graph data

- `docs/GRAPH.md` is the source of truth for the schema, edge directions, hard rules and sourcing standards.
- `src/data/graph.json` is ~2 MB: query it with `node .github/skills/graph-edit/scripts/lookup.mjs` instead of reading it.
- Pipeline, one owner per step: research (`graph-researcher`) → edit (`graph-edit`) → translate every
  `graph.<locale>.json` overlay (`graph-translate`) → validate (`graph-validate`) → fact-check
  (`graph-fact-check`) → review (`graph-review`) → CI (`.github/workflows/graph-quality.yml`).
- Every data change also updates each locale overlay, a reviewed note in `docs/graph/evidence/`,
  `docs/graph/evidence/audits/graph-edge-coverage.csv` (edges) and `src/data/review-status.json` (`npm run review-status`).
- Set `addedOn` to the catalogue addition date (`YYYY-MM-DD`) on every new node. Preserve it when editing existing nodes.
- Validate with `npm run validate:graph`; fix data, never loosen tests.
