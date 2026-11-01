# Soundlines

A chronological map of music genres, artists, labels, scenes, and the lineages that connect them — the clean rebuild of the `music-tree` project.

Vite, React 19, TypeScript, Tailwind CSS 4, Motion. Tested with Vitest, linted with oxlint, deployable to Vercel as a static site.

## The timeline

The main view is a horizontal chronology with two modes: **Genres** (the default)
and **Artists**. Each mode renders its own nodes as bars, grouped into family
lanes (roots, classical traditions, jazz, rock, electronic pioneers, house, techno,
UK continuum). Curved links and
highlighting stay within the active mode.

- In Genres, the Order selector switches between the default family groups and
  **First appearance (oldest first)**: one row per genre across all families,
  ordered by `period.start`, then name and id for ties. Family colors, selection,
  and horizontal zoom are preserved; changing order resets vertical scrolling
  and brings the selection back into view. Artists keep their family layout.
- Genre order is remembered when switching modes and shared with
  `?sort=oldest-first`; omitting `sort` uses the default family groups.
- Off-screen genres have a labeled, family-colored ghost bar at the left or
  right edge, pointing toward their nearest visible period. Click or press
  Enter/Space to reveal it. In family groups, indicators only appear where they
  do not overlap an on-screen bar or another indicator; nearer genres take
  priority on shared rows. Ghosts are navigation hints, not historical activity.
- With a mouse, drag to move both axes; vertical scroll moves the timeline, horizontal scroll pans time, and Cmd/Ctrl+scroll zooms.
- On touch screens, one-finger horizontal drags pan time, vertical swipes scroll the timeline, and two-finger pinches zoom. Tap a bar to open its draggable detail sheet.
- Mobile search opens as a full-screen overlay; selected artists and genres bring their bars into view.
- The year axis reduces label density on narrow screens; reduced-motion preferences shorten interface transitions.
- Horizontal trackpad momentum is handled by the timeline without native
  horizontal overscroll; rapid wheel updates accumulate rather than overwrite one another.
- Both timeline modes pad the time range by 24px on each side within a full-width
  drawing surface; panning and background bands extend all the way to the edges.
- Click a bar or focus it and press Enter/Space for details; every relation in the panel is navigable
- Artists switches to artist bars, not an overlay on the genre timeline; artist bubbles are currently removed
- Search and related-node navigation switch modes automatically when selecting an artist or genre and bring the selected bar into view
- Selection is shareable via `?focus=<node-id>`; `?view=artists` opens the artist timeline without a selection
- Each mode remembers its horizontal time range; switching modes resets vertical scrolling and hover
- The default range remains 1948–present; pan or zoom out to reach earlier history (back to c. 500), or search for an era or composer to jump there

Artists appear once, in their most-represented genre family. Ties follow family
order; an explicit artist `family` overrides inference. Artist links include
sourced influences, group memberships, and collaborations. Collaboration dates
anchor both ends near the documented event; undated influences and memberships
anchor near the target's career start. Sharing a genre alone never creates an
artist-to-artist influence claim.

### Historical prominence

Lifespan is not a golden age. Genres and artists can have explicit `phases`, each with a
`start` year and `prominence`: `emerging`, `golden-age`, `established`, or `niche`.
All phases keep the same bar height: golden ages are strongest, continuing scenes
are softer, and niche periods are hidden entirely (the bar fades out into them,
and back in for a revival). Relationship endpoints stay on the visible
part of the bar. A continuous gradient
smoothly blends intensity around each boundary (up to two years either side,
shortened for brief phases), without steps in height or dotted tails.
Each phase lasts until the next starts, or until the lifespan ends.
Phases may repeat to describe revivals: a bar can disappear and reappear as many
times as needed. There is no automatic age-based decline.
An optional `intensity` (0–1) overrides the label's default shade
(emerging 0.35, golden age 1, continuing 0.45, niche 0), so a genre can be
described on a finer scale than the four legend labels. Peaks are also brightened.
Genres without phases retain the original rendering rather than inventing a peak.

The artist timeline has a first set of **14 editorial career-phase examples**,
anchored to cited biography milestones. Artist labels are Emerging, Peak years,
Continuing, and Low profile / hiatus. Unresearched artists have neutral bars;
their shading is never inferred from their genres or age. These shades are not
chart, streaming, or sales measurements and are not comparable popularity
rankings between artists. Artist periods describe active careers, not ongoing
posthumous listening. Researched career endings and selected group breaks are
explicit data.
Ended bars fade only over their final two years, so the tail effect does not
artificially dim the latter half of a career.

The initial nine examples are approximate, illustrative editorial choices, not
researched popularity measurements. Their `phaseNote` explains the scope and is
visible in the detail panel and tooltips. Soul continues after its classic peak;
disco and jungle no longer incorrectly stop when their original boom ends.
`period.end` is reserved for a genuinely ended lifespan or a bounded historical
era, whose bar still fades out. For Medieval, Renaissance, Baroque, Classical,
and Romantic music, the approximate boundaries describe historical stylistic
eras, not the disappearance of their repertoire or performance traditions.
These judgments need sourced, geographically contextual research before publication
as historical claims. The JSON supports adding or revising phases without changing the UI.

## Data model

All data lives in [src/data/graph.json](./src/data/graph.json) as a single property graph:

- **Nodes** (`genre`, `artist`, `label`, `place`, `track`, `scene`) with stable `type:slug` ids, optional `period` (`start`/`end`/`precision`), `family` lanes, and descriptions.
- **Edges** with a type, optional `period`, `confidence` (`low`/`medium`/`high`), `note`, and source URLs. Lineage edge types (`influences`, `derived_from`, `subgenre_of`, `fusion_of`, `cross_pollination`, `revival_of`) carry an orientation so the JSON reads naturally in both directions (see `LINEAGE_ORIENTATION` in [src/graph/types.ts](./src/graph/types.ts)).
- Nodes can include `sources` URLs; the detail panel exposes node and relationship citations as links.

See [src/data/GRAPH.md](./src/data/GRAPH.md) for the full schema, validation rules, and an editing guide (also suitable as a prompt for LLM-assisted enrichment).

The expanded starter dataset connects at least three key artists to every genre
and adds seven cited tracks. Artist pages document the people and groups;
genre pages are cited on artist-to-genre relationships. These are curated
representative examples, not exhaustive discographies or a popularity ranking.

The historical expansion adds **27 genre/era nodes**: seven Western classical
traditions (Medieval through minimalism), blues, eight jazz styles (early jazz,
swing, bebop, cool jazz, hard bop, modal jazz, free jazz, and fusion), and eleven
rock branches (rock and roll through grunge). Each has at least three cited
representative artists. Classical-era succession uses influence links rather
than treating historical periods as subgenres of each other; jazz fusion has
multiple parents. Blues, jazz harmony, and krautrock connect the new branches to
the original catalogue. Origins and era boundaries are approximate and overlapping,
not exact invention dates or popularity measurements. New nodes deliberately have
neutral bars rather than invented prominence histories.

Composer dates describe approximate creative/professional activity, not birth
years. Some new band periods span documented breaks and reunion appearances;
their descriptions identify this career-envelope limitation. They are not
claims of uninterrupted activity.

The UI never touches the JSON directly: all queries (neighbors, lineage traversal, period filtering, search) go through [src/graph/graph.ts](./src/graph/graph.ts). Migrating to a graph database later (e.g. Neo4j: nodes → labeled vertices, edges → typed relationships, other fields → properties) only requires reimplementing that one module.

### Shared explorer architecture

- [ExplorerContext](./src/ExplorerContext.ts) owns the graph index, active mode, selection, per-mode ranges, and URL synchronization; the provider wires the UI without graph/selection prop drilling.
- [Timeline model](./src/graph/timeline.ts) projects the graph for each mode, infers artist families, and restricts layout and traversal to same-view relationships.
- [Timeline](./src/components/Timeline.tsx) composes shared [geometry](./src/components/timeline/geometry.ts), [bar rendering](./src/components/timeline/TimelineBar.tsx), [relationship rendering](./src/components/timeline/TimelineLinks.tsx), and [viewport interaction](./src/components/timeline/useTimelineViewport.ts).
- [Prominence helpers](./src/graph/phases.ts) provide the same intensity, fade, and revival logic for both node types.

[src/data/graph.test.ts](./src/data/graph.test.ts) enforces dataset integrity: unique ids, no dangling edge endpoints, known types only, sane periods, and no orphan nodes.

## Commands

```bash
npm run dev
npm test
npm run lint
npm run build
```
