# Soundlines

A chronological map of music genres, artists, labels, scenes, and the lineages that connect them — the clean rebuild of the `music-tree` project.

Vite, React 19, TypeScript, Tailwind CSS 4, Motion. Tested with Vitest, linted with oxlint, deployable to Vercel as a static site.

## The timeline

The main view is a horizontal chronology: genres render as bars spanning their active years, stacked into family lanes (roots, electronic pioneers, house, techno, UK continuum). Influence and derivation edges are drawn as curves between bars. Hovering or selecting a node highlights its full lineage — everything that fed it and everything it fed — and dims the rest.

- Drag to move both axes, scroll to move vertically, horizontal scroll to pan time, pinch or Cmd/Ctrl+scroll to zoom
- Click a bar or artist marker for details; every relation in the panel is navigable
- Search covers all node types; the Artists toggle shows key-artist markers on the bars
- Selection is shareable via the `?focus=<node-id>` URL parameter

### Historical prominence

Lifespan is not a golden age. Genres can have explicit `phases`, each with a
`start` year and `prominence`: `emerging` (medium), `golden-age` (full-width
solid bar), `established` (thinner continuing bar), or `niche` (thin dashed
tail). Each phase lasts until the next starts, or until the lifespan ends.
Phases may repeat to describe revivals; there is no automatic age-based decline.
Genres without phases retain the original rendering rather than inventing a peak.

The initial nine examples are approximate, illustrative editorial choices, not
researched popularity measurements. Their `phaseNote` explains the scope and is
visible in the detail panel and tooltips. Soul continues after its classic peak;
disco and jungle no longer incorrectly stop when their original boom ends.
`period.end` is reserved for a genuinely ended lifespan, whose bar still fades out.
These judgments need sourced, geographically contextual research before publication
as historical claims. The JSON supports adding or revising phases without changing the UI.

## Data model

All data lives in [src/data/graph.json](./src/data/graph.json) as a single property graph:

- **Nodes** (`genre`, `artist`, `label`, `place`, `track`, `scene`) with stable `type:slug` ids, optional `period` (`start`/`end`/`precision`), `family` lane for genres, and descriptions.
- **Edges** with a type, optional `period`, `confidence` (`low`/`medium`/`high`), and `note`. Lineage edge types (`influences`, `derived_from`, `subgenre_of`, `fusion_of`, `cross_pollination`, `revival_of`) carry an orientation so the JSON reads naturally in both directions (see `LINEAGE_ORIENTATION` in [src/graph/types.ts](./src/graph/types.ts)).

The UI never touches the JSON directly: all queries (neighbors, lineage traversal, period filtering, search) go through [src/graph/graph.ts](./src/graph/graph.ts). Migrating to a graph database later (e.g. Neo4j: nodes → labeled vertices, edges → typed relationships, other fields → properties) only requires reimplementing that one module.

[src/data/graph.test.ts](./src/data/graph.test.ts) enforces dataset integrity: unique ids, no dangling edge endpoints, known types only, sane periods, and no orphan nodes.

## Commands

```bash
npm run dev
npm test
npm run lint
npm run build
```
