---
name: graph-validate
description: 'Run the deterministic Soundlines graph validation gate and turn failures into fixes. Use after any edit to src/data/graph.json, a graph.<locale>.json overlay or docs/evidence; before committing or reviewing graph changes; when "npm run validate:graph", the Graph quality CI workflow or a src/data test fails; or to check schema, ids, edge directions, formatting, overlay coverage, evidence bookkeeping and documented counts.'
argument-hint: 'Optional: a failing test name or CI log to diagnose'
---

# Validate the graph

Validation answers one question: **is the data mechanically correct?** It is deterministic: the same
command runs locally, in agents and in CI (`.github/workflows/graph-quality.yml`). It does not judge
whether claims are true (`graph-fact-check`) or whether a change is editorially sound (`graph-review`).

## Run

```sh
npm run review-status        # regenerate src/data/review-status.json from docs/evidence (writes a file)
npm run validate:graph       # vitest run src/data src/graph
```

CI runs both and fails if `review-status.json` changed, so commit the regenerated file. A pass means
zero failures; never skip, `.only`, or loosen a test to get there. Edit a test's expected list only
when the change intentionally alters it (a new genre in the family map, a new standalone root).

## What is checked, and how to fix a failure

| Test file / test name contains | Checks | Usual fix |
|---|---|---|
| `graphFiles` "canonical JSON formatting" | graph, overlays, review-status and audit JSON are `JSON.stringify(data, null, 2) + '\n'` | rewrite the file with that serializer |
| `graphFiles` "documents the current graph size" | GRAPH.md §1 "Current size" matches node/edge counts | update the line from `lookup.mjs --stats` |
| `graph` "unique … ids", "prefixes every node id", "only references existing nodes" | id integrity | fix the id or the dangling edge endpoint; never rename existing ids |
| `graph` "known node types, edge types, and families", "family" tests | enums and family registry | use a documented value, or register a new family (types.ts, theme.ts, GRAPH.md §2) |
| `graph` "documented directions", "lineage" | edge direction and allowed endpoints | flip or retype the edge per GRAPH.md §3 |
| `graph` "sane periods", "estimated placements", "phases" | period/phase semantics | fix years, add `estimated` + `estimateNote`, order phases from `period.start` |
| `graph` "groups every genre into recognizable families" | per-family genre lists in the test | add the new genre slug to the family list |
| `graph` "at least three sourced key artists", "HTTPS sources" | sourcing minimums | add sourced `key_artist_of` edges / fix the URL; never invent sources |
| `graph` "standalone or unresolved nodes disconnected", "roots" | orphans | link with a sourced edge, or document it in `docs/evidence/disconnected-entries.md` |
| `festivals` * | festival register and audit JSON/MD alignment | update `docs/evidence/festivals.md` and `audits/festival-*.json` (+ `.md`) |
| `reviewStatus` "matches the evidence files" | `review-status.json` is fresh | `npm run review-status` |
| `reviewStatus` "evidence note for every live node", "tracks every live edge" | evidence notes and `graph-edge-coverage.csv` rows match live entries | write the note / add or correct the CSV row (`graph-edit` evidence templates) |
| `graphLocale` "registers exactly one graph.<locale>.json overlay" | overlay files ↔ `LOCALES` ↔ `GRAPH_OVERLAYS` | see `graph-translate` "Add a language" |
| `graphLocale` "covers every … in the <locale> overlay", "keeps the graph structure and artist/track names unchanged" | overlay coverage and text-only rule | translate the listed `<id>.<field>` with `graph-translate`; remove `name` from artists/tracks |
| `src/graph/*` | app projections (timeline, history, bubbles, stats) still work on the data | usually caused by a data error above; fix data first, code only if the projection is wrong |

## Not covered by validation (needs judgement)

Truth of claims, source quality, choice of the most precise edge type, description wording, translation
quality and family assignment. Those belong to `graph-fact-check` and `graph-review`. If you find a
mechanical rule in GRAPH.md §4 that no test enforces, add a test rather than a checklist item.

## Report

Pass/fail, then per failure: test name, the offending ids/fields from the assertion output, cause, and
the fix (or the file and skill that owns it).
