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
node .github/skills/graph-edit/scripts/lookup.mjs <id>             # entry, touching edges, evidence path/status, locale overlay keys
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
   - Set `addedOn` on every new node to the date it joins the catalogue (`YYYY-MM-DD`).
     Preserve existing addition dates during edits. This date powers the landing page’s Recently added list.
   - `period` semantics (artist = active career; track = release year; estimated placements need
     `estimated: true` + `estimateNote`)
   - `phases` only with a defensible prominence history, plus `phaseNote` (§5)
4. **Update coupled code and fixtures** when the change touches them:
   - New genre: add its slug to the family list in `src/data/graph.test.ts`
     ("groups every genre into recognizable families…"); a family holds 3–20 genres. If it is a
     deliberately unlinked tradition, add it to the `roots` set in "connects genres through lineage…".
     Add its id to `PENDING_GENRE_PREVIEWS` in `src/data/genrePreviews.ts`; do not write preview
     briefs or run ACE-Step, loop or preview pipelines from a graph edit. Audio is a separate
     local follow-up, and the app hides the player while the preview is pending. Do not add a
     pending genre to a Soundtrail in `src/graph/soundtrails.ts`: every Soundtrail stop must ship a preview.
   - New family: `src/graph/types.ts` (`GenreFamily`, `FAMILY_LABELS`, `FAMILY_ORDER`), `src/theme.ts`
     (`FAMILY_COLORS`), the test map above, and the family tables in GRAPH.md §2.
   - New instrument: it needs its four artwork SVGs (`src/components/InstrumentIcon.test.tsx` fails
     without an icon). Hand off to the artwork pipeline (`artwork-brief` → `artwork-draw` →
     `artwork-validate` → `artwork-review`); removing an instrument removes its four SVGs.
   - Standalone event or unresolved track with no edges: add it to
     `docs/graph/evidence/disconnected-entries.md` with the reason. Never invent edges to avoid this.
   - Festival node or `festival_related` edge: update `docs/graph/evidence/festivals.md` (register row),
     `docs/graph/evidence/audits/festival-sources-001.json` (+ `.md`) so confidence/sources match exactly, and
     `festival-wikipedia-events-002.json` when a Wikipedia cross-check applies.
5. **Update every locale overlay `src/data/graph.<locale>.json`** (French, German, Italian and Spanish) for each
   new or changed English text field, following the `graph-translate` skill. Text only, keyed by the
   same ids. For a large batch, delegate a slice to the `graph-translator` agent.
6. **Write evidence** in `docs/graph/evidence/` using the
   [evidence templates](./references/evidence-templates.md):
   - one reviewed note per new or changed node and edge (not `Pending source review`)
   - one row per live edge in `docs/graph/evidence/audits/graph-edge-coverage.csv`, matching type/confidence
   - removal or retype: a `removed__…` disposition note, a bullet in `docs/graph/evidence/graph-edge-removals.md`
     (or `event-edge-removals.md`), and delete or update the coverage row
7. **Update family counts** in GRAPH.md §2 when affected. Use `--stats` for live counts.
8. **Validate** with the `graph-validate` skill:
   ```sh
   npm run review-status
   npm run validate:graph
   ```
   Fix failures by correcting data, not by loosening tests. Only edit a test's expected list when the
   change intentionally alters it (step 4).

## Cost and time budget

Aim for the smallest complete, well-sourced change, not exhaustive research. Tokens and wall-clock
time matter, especially in Copilot cloud.

- **Scope:** implement what was asked plus what the rules require. For a new genre, that means the node,
  its sourced lineage edges, three key artists (prefer existing artist nodes), overlays and evidence.
  Do not add optional tracks, phases, extra artists or neighbouring entries unless requested.
- **Sources:** start with the supplied links and hosts already cited in the graph. One authoritative,
  claim-specific source per claim is enough, and one page may support several claims. Do not search for
  more after a claim is sourced. If a host is blocked or unreachable, do not retry it or try search
  engines; use another supplied source or leave the claim out and report it.
- **Finding URLs:** never guess page URLs. Discover real ones cheaply: the external links of the
  relevant Wikipedia article
  (`https://en.wikipedia.org/w/api.php?action=parse&prop=externallinks&format=json&page=<Title>`) and
  MusicBrainz URL relationships
  (`https://musicbrainz.org/ws/2/artist/?query=<name>&fmt=json`, then `/ws/2/artist/<mbid>?inc=url-rels&fmt=json`).
  Prefer links whose host is already cited in the graph, fetch them and confirm that the claim is on the page.
- **Fetch results:** check the HTTP status and the page title. A 403 "Just a moment…" or CAPTCHA page
  is bot protection rather than the firewall, so treat the host as unreachable for that session. A firewall
  block shows up as a DNS or connection failure; report the host so a maintainer can allowlist it.
- **Reading:** never read `graph.json`, overlays or the coverage CSV whole; use `lookup.mjs`, `grep`
  and narrow ranges. Read only the GRAPH.md sections the change touches.
- **Delegation:** for small changes (roughly ten entities or fewer), translate, fact-check and review
  inline. Subagents reload context and multiply cost; use them only for large batches.
- **Validation:** while iterating, run only the failing file (for example
  `npx vitest run src/data/graph.test.ts`); run `npm run review-status` and the full
  `npm run validate:graph` once at the end, and again only after fixing a failure.
- **Stop early:** if the required minimum (for a genre, three sourced key artists) cannot be verified
  after a couple of attempts per claim, stop and open the PR with what is verified and a clear list of
  gaps instead of continuing to search.
- **Out of scope:** audio (ACE-Step loops and previews) and instrument artwork need local tools.
  Record the pending follow-up as described in step 4 and never attempt to render them.

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
