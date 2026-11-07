---
name: graph-edit
description: 'Add, correct, retype, or remove nodes and edges in the Soundlines music graph (src/data/graph.json) with every coupled file kept in sync: locale overlays (graph.<locale>.json), evidence notes, edge coverage CSV, festival audits, review-status and tests. Use when enriching the graph, adding a genre/artist/track/event/festival/instrument, fixing a relationship, changing confidence or periods, applying a merge patch, or filling chronology coverage gaps.'
argument-hint: 'What to add or change, e.g. "add genre:gospel with key artists"'
---

# Edit the Soundlines graph

[docs/GRAPH.md](../../../docs/GRAPH.md) is the source of truth for the schema, edge directions, hard
rules and editorial standards. Read the sections relevant to the change before editing; this skill
covers the procedure and the files that must move together.

## Tools

`graph.json` is ~2 MB; never read it whole. Query it with the bundled script:

```sh
node .github/skills/graph-edit/scripts/lookup.mjs <id>             # entry, touching edges, evidence path/status, FR overlay keys
node .github/skills/graph-edit/scripts/lookup.mjs --search <text>  # find existing nodes before creating one
node .github/skills/graph-edit/scripts/lookup.mjs --pending [type] # evidence missing, pending or unstamped
node .github/skills/graph-edit/scripts/lookup.mjs --stats          # counts by node/edge type
```

## Procedure

1. **Check for duplicates.** `--search` every entity you plan to add (names, alternate spellings,
   accent-stripped slugs). Prefer linking to existing nodes. Ids are permanent: never rename or delete
   an existing id; record removals as dispositions instead (step 6).
2. **Research before writing.** Each claim (period, description fact, relationship, confidence) needs an
   HTTPS source that states it. Follow GRAPH.md §6: authoritative, claim-specific pages; Wikipedia only as
   a supplement; no invented URLs, blogs, fan wikis or search-result URLs. For fact-checking depth use
   the `graph-fact-check` skill. If a claim cannot be sourced, leave it out.
3. **Edit `src/data/graph.json`.** Insert new nodes next to related entries (the file is not sorted).
   Keep the format byte-identical to `JSON.stringify(graph, null, 2) + '\n'`. Check against GRAPH.md:
   - id `<type>:<kebab-ascii-slug>`; edge id prefixes (§3 "Edge id conventions")
   - edge direction and the most precise lineage type (§3 table)
   - required fields per type (§2 node types, families, events, festivals; §4 hard rules)
   - `period` semantics (artist = active career; track = release year; estimated placements need
     `estimated: true` + `estimateNote`)
   - `phases` only with a defensible prominence history, plus `phaseNote` (§5)
4. **Update coupled code and fixtures** when the change touches them:
   - New genre: add its slug to the family list in `src/data/graph.test.ts`
     ("groups every genre into recognizable families…"); a family holds 3–20 genres. If it is a
     deliberately unlinked tradition, add it to the `roots` set in "connects genres through lineage…".
   - New family: `src/graph/types.ts` (`GenreFamily`, `FAMILY_LABELS`, `FAMILY_ORDER`), `src/theme.ts`
     (`FAMILY_COLORS`), the test map above, and the family tables in GRAPH.md §2.
   - New instrument: it needs its four artwork SVGs (`src/components/InstrumentIcon.test.tsx` fails
     without an icon). Hand off to the artwork pipeline (`artwork-brief` → `artwork-draw` →
     `artwork-validate` → `artwork-review`); removing an instrument removes its four SVGs.
   - Standalone event or unresolved track with no edges: add it to
     `docs/evidence/disconnected-entries.md` with the reason. Never invent edges to avoid this.
   - Festival node or `festival_related` edge: update `docs/evidence/festivals.md` (register row),
     `docs/evidence/audits/festival-sources-001.json` (+ `.md`) so confidence/sources match exactly, and
     `festival-wikipedia-events-002.json` when a Wikipedia cross-check applies.
5. **Update every locale overlay `src/data/graph.<locale>.json`** (currently `graph.fr.json`) for each
   new or changed English text field, following the `graph-translate` skill. Text only, keyed by the
   same ids. For a large batch, delegate a slice to the `graph-translator` agent.
6. **Write evidence** in `docs/evidence/` using the
   [evidence templates](./references/evidence-templates.md):
   - one reviewed note per new or changed node and edge (not `Pending source review`)
   - one row per live edge in `docs/evidence/audits/graph-edge-coverage.csv`, matching type/confidence
   - removal or retype: a `removed__…` disposition note, a bullet in `docs/evidence/graph-edge-removals.md`
     (or `event-edge-removals.md`), and delete or update the coverage row
7. **Update GRAPH.md counts** when totals change: "Current size" in §1 (tested), family counts in §2,
   the chronology table and event-edge counts in §6. Use `--stats` for the numbers.
8. **Validate** with the `graph-validate` skill:
   ```sh
   npm run review-status
   npm run validate:graph
   ```
   Fix failures by correcting data, not by loosening tests. Only edit a test's expected list when the
   change intentionally alters it (step 4).

## Merge patches

When given or asked for a merge patch (GRAPH.md §7: `newFamilies`, `addNodes`, `addEdges`,
`updateNodes`, `updateEdges` with `set`), apply each operation through the procedure above; a patch is
not complete until its evidence, overlay and tests are done. Patches never delete; flag suspected errors
instead.

## Done when

- `npm run validate:graph` passes and `npm run review-status` leaves no diff after rerunning
- every new/changed id has a reviewed evidence note and, for edges, a coverage row
- every new or changed English text field is translated in every overlay
- the summary lists added/changed/removed ids, sources used, and anything left uncertain or skipped
