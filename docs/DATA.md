# Data and contribution workflow

[Back to README](../README.md)

Paths in prose and commands are relative to the repository root.

## Data model

All data lives in [src/data/graph.json](../src/data/graph.json) as a single property graph:

- **Nodes** (`genre`, `artist`, `instrument`, `label`, `place`, `track`, `scene`, `event`, `festival`) with stable `type:slug` ids, optional `period` (`start`/`end`/`precision`/`estimated`/`estimateNote`), `family` lanes, descriptions, and editorial confidence in the overall entry.
- **Edges** with a type, optional `period`, `confidence` (`low`/`medium`/`high`), `note`, and source URLs. Lineage edge types (`influences`, `derived_from`, `subgenre_of`, `fusion_of`, `cross_pollination`, `revival_of`) carry an orientation so the JSON reads naturally in both directions (see `LINEAGE_ORIENTATION` in [src/graph/types.ts](../src/graph/types.ts)).
- Nodes can include `sources` URLs; the detail panel links the selected node's sources, with each source's website shown beside the link. Festival relationships also show their own citations beside the connection. Festival confidence is reassessed against evidence, not inferred from citation counts.

### Music festivals

The collection includes ancient Pythian Games and the approximately 1715 Three
Choirs Festival alongside modern institutions: 39 festivals across 25 countries and six continents,
selected for documented historical contributions and public recognition. It spans
Woodstock, Monterey Pop and Newport Folk; Bayreuth, Salzburg and Donaueschingen;
Movement, Sónar and Tomorrowland; Reggae Sunsplash, FESPAM and Sauti za Busara;
Cosquín, Viña del Mar and Rock al Parque; Sawai Gandharva, Java Jazz and Baalbeck;
and further jazz, metal and cross-cultural institutions. All festivals have at
least three references; the [source audit](./graph/evidence/audits/festival-sources-001.md)
explains source scope, conflicts and High/Medium confidence decisions. Descriptions explain
breakthrough performances, new-music platforms, regional traditions and musical
exchange rather than assigning a popularity or influence score. The
[coverage register](./graph/evidence/festivals.md) lists every festival, country,
first edition or chronology anchor and editorial caveat. This is a curated collection, not a
comprehensive worldwide directory.
Festivals are searchable and open in the detail panel within the current view.
Any entity can link to a festival through `festival_related`; the relationship note
states the connection and, when known, its edition year. Detail panels display
festival connections only when the edge has an HTTPS source, with citations visible
in both directions. These links do not affect musical lineage or timeline lanes.
Specific festival turning points also appear as separately sourced History
events, including Dylan at Newport, the complete Ring at Bayreuth, and Daft
Punk’s Coachella pyramid. All 39 festivals have a supplementary Wikipedia
[cross-check](./graph/evidence/audits/festival-wikipedia-events-002.md); conflicts
are recorded alongside the stronger primary and institutional evidence.

Festival periods normally start at the first edition; conventional chronology
anchors are marked estimated and explained. They do not claim uninterrupted annual
operation. Historically significant standalone gatherings, including the original
Woodstock and Monterey Pop festivals, have bounded periods. Existing historical festival events retain their stable IDs: an event
can describe the founding or one edition, while a festival node describes the
institution. English text, localized overlays, per-entry evidence notes, and the
review coverage register accompany this batch.

## Graph contribution workflow

See [docs/GRAPH.md](./GRAPH.md) for the full schema, validation rules, and an editing guide (also suitable as a prompt for LLM-assisted enrichment).

Graph changes follow one pipeline, with one owner per step:

| Step | Question | Skill | Agent |
|---|---|---|---|
| Research | What is missing? | — | `graph-researcher` (proposes a merge patch, edits nothing) |
| Edit | Apply the change and its coupled files | `graph-edit` | `graph-editor` (orchestrates the steps below) |
| Translate | Is every text in every locale overlay? | `graph-translate` | `graph-translator` |
| Validate | Is the data mechanically correct? | `graph-validate` | `graph-validator` (read-only) |
| Fact-check | Is each claim true and sourced? | `graph-fact-check` | `graph-fact-checker` (writes evidence) |
| Review | Is this change set ready to merge? | `graph-review` | `graph-reviewer` (read-only gate) |

Validation is deterministic: `npm run validate:graph` runs the data and graph test suites (schema,
ids, edge directions, canonical JSON formatting, overlay coverage for every locale, evidence and
coverage-tracker bookkeeping, documented counts). The [Graph quality](../.github/workflows/graph-quality.yml)
workflow runs it, plus a `review-status.json` freshness check, on every pull request touching graph data
or docs. The skills in [.github/skills](../.github/skills) bundle `lookup.mjs` (query `graph.json` by id,
name, or pending evidence) and `diff.mjs` (semantic diff of graph changes and overlays against a git ref).

## Dataset scope and editorial caveats

The expanded starter dataset connects at least three key artists to every genre
and adds seven cited tracks. Artist pages document the people and groups;
genre pages are cited on artist-to-genre relationships. These are curated
representative examples, not exhaustive discographies or a popularity ranking.

The historical expansion adds **27 genre/era nodes**: seven Western classical
traditions (Medieval through minimalism), blues, eight jazz styles (early jazz,
swing, bebop, cool jazz, hard bop, modal jazz, free jazz, and fusion), and eleven
rock branches (rock and roll through grunge). Each has at least three cited
representative artists. Classical-era succession uses influence and qualified
continuity/derivation links, not subgenre claims; jazz fusion has
multiple parents. Blues, jazz harmony, and krautrock connect the new branches to
the original catalogue. Origins and era boundaries are approximate and overlapping,
not exact invention dates or popularity measurements. New nodes deliberately have
neutral bars rather than invented prominence histories.

The [connectivity register](./graph/evidence/disconnected-entries.md) explicitly
records sourced standalone events and unresolved track attributions. Stable IDs
are retained without inventing relationships; tests enforce this exact exception
set as well as the live-edge evidence tracker and generated review-status index.

Composer dates describe approximate creative/professional activity, not birth
years. Some new band periods span documented breaks and reunion appearances;
their descriptions identify this career-envelope limitation. They are not
claims of uninterrupted activity.

The UI never touches the JSON directly: all queries (neighbors, lineage traversal, period filtering, search) go through [src/graph/graph.ts](../src/graph/graph.ts). Migrating to a graph database later (e.g. Neo4j: nodes → labeled vertices, edges → typed relationships, other fields → properties) only requires reimplementing that one module.

[src/data/graph.test.ts](../src/data/graph.test.ts) enforces dataset integrity: unique ids, no dangling edge endpoints, known types only, sane periods, and no orphan nodes.

## Instrument artwork

Every instrument has four SVGs (icon, banner, avatar, and detail-panel header
background) in `public/instrument-*`. New or redrawn artwork follows one pipeline:
a sourced visual brief (`artwork-briefer`), the drawing (`artwork-illustrator`,
preferably as a master in [the generator](../scripts/artwork/generate-instrument-artwork.py)),
a deterministic gate (`artwork-validator`), and a ship review (`artwork-reviewer`)
with a final human check in Storybook. The style guide and scripts are in
[.github/skills/artwork-draw](../.github/skills/artwork-draw) and
[.github/skills/artwork-validate](../.github/skills/artwork-validate).
