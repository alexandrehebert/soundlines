# Soundlines

A chronological map of music genres, artists, labels, scenes, and the lineages that connect them — the clean rebuild of the `music-tree` project.

Vite, React 19, TypeScript, Tailwind CSS 4, Motion. Tested with Vitest, linted with oxlint, deployable to Vercel as a static site.

## The timeline

The main view is a horizontal chronology: genres render as bars spanning their active years, stacked into family lanes (roots, electronic pioneers, house, techno, UK continuum). Influence and derivation edges are drawn as curves between bars. Hovering or selecting a node highlights its full lineage — everything that fed it and everything it fed — and dims the rest.

- Scroll to zoom, drag to pan
- Click a bar or artist marker for details; every relation in the panel is navigable
- Search covers all node types; the Artists toggle shows key-artist markers on the bars
- Selection is shareable via the `?focus=<node-id>` URL parameter

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
