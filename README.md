# Soundlines

A chronological map of music genres, artists, instruments, labels, scenes, historical events, and the lineages that connect them — the clean rebuild of the `music-tree` project.

Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Motion. Tested with Vitest, linted with oxlint, and deployable to Vercel.

The header and browser favicon share the same violet vinyl-disc icon.
On first load, the landing page's grooved vinyl spins in the center before React
starts. Once the landing page is ready, the cover fades away and the vinyl moves
into its hero position over 700ms of animation time, tracking the hero position and
scroll-driven rotation even when scrolling during loading. The handoff waits for
the movement to finish, including when startup rendering delays its first frame.
Other entry pages simply fade out the cover.
The hero copy stays in its final position throughout; catalogue widgets fade in
as they enter the viewport without shifting their alignment.
The compact, beveled turntable button is inset into the hero card without adding
height on desktop or mobile. Its raised face depresses during playback, with a
lit status LED. It plays or pauses an original four-bar instrumental hip-hop loop.
Audio loads only on Play. Dragging the record
scratches that same stereo recording forward or backward; holding it stops the
groove, and releasing it resumes normal playback. Navigation stops the audio.
Reduced-motion preferences disable automatic record rotation, not playback.
After a short pause, a decorative hand grips the record and scratches along a
short circular arc, rotating the vinyl in sync, then points at and taps Play.
Both hand poses share the same wrist position for a stationary crossfade.
It runs once per landing-page visit without playing audio or
blocking controls, and disappears on scratch, Play, or keyboard focus on Play.
Reduced-motion preferences also disable this hint.
The English and French controls show a retry message when audio cannot load.

The [hip-hop loop](./public/loops/hip-hop.wav) played by the landing turntable was generated locally
with ACE-Step 1.5's highest-quality pairing: the `acestep-v15-xl-sft` (4B) DiT at
80 diffusion steps, guidance 7 with ADG, and the largest `acestep-5Hz-lm-4B`
planner. Because both models do not fit in 25 GB of unified memory together, the
planner's audio codes were generated first, then rendered by the XL DiT.
Five original 36-second instrumental boom-bap takes in D minor at 92 BPM used
seeds 73192, 18409, 60217, 41126, and 52880. Four-bar excerpts on a
regression-fitted beat grid were compared for seam similarity, bar-to-bar
consistency, and level stability. The selected seed is 41126, from 11.668 s:
exactly 16 beats at 92.0 BPM (10.435 s), stereo 48 kHz PCM16, normalized to
-1 dBFS peak with an 8 ms wrap crossfade. WAV avoids lossy encoder padding at
the loop boundary.
The deployed app serves this static asset; it does not require a running ACE-Step API.
Its brief and selection report are in [scripts/loops/briefs](./scripts/loops/briefs). Loops for other
genres follow the same pipeline through the `loop-briefer`, `loop-producer`, `loop-validator` and
`loop-reviewer` agents; the bundled scripts and the verified ACE-Step configuration are in
[.github/skills/loop-produce](./.github/skills/loop-produce).

Clicking the header brand while already on the landing page does not reload it
or replay the opening animation; modified clicks retain normal link behavior.
On narrow screens, where the vinyl overflows its clipped hero card, landing-page
navigation fades it with the card. Wider screens retain the separate vinyl spin.
The same overlay appears when changing modes, genre layout, or sort order
(including cross-mode search, related-node navigation, and browser history).
It appears instantly before the next view renders, stays visible for at least
550ms, and fades out over 520ms after the new view
has rendered and the document has loaded. Ordinary selections, panning, and zoom
do not trigger it. Reduced-motion preferences disable the spin, fade, and movement.

## The timeline

Select a genre in the timeline, bubble map, or search to play its 10-second
ACE-Step preview in the detail panel. Previews load on play.

ACE-Step previews live in `public/genre-previews`. The renderer takes the
middle ten seconds of a 32-second performance and uses the genre briefs in
`scripts/previews/briefs/*.json`. With the local ACE-Step API on port 8020 and its
planner enabled, set `ACESTEP_PYTHON` to the ACE-Step environment's Python
executable and `ACESTEP_PREVIEW_STATE` to a writable progress file, then run
`node scripts/previews/render-ace-previews.mjs`. Reuse the progress file to skip
completed clips, or pass genre slugs to render a subset.

The main view is a horizontal chronology with three bar modes: **Genres** (the default),
**Artists**, and **Instruments**. A fourth **History** view follows dated events through
the ages. Each bar mode renders its own nodes as bars, grouped into family
lanes: Classical; Blues, R&B & Soul; Jazz; Country & Folk; Rock; Alternative & Punk;
Metal; Pop; Hip-hop; Reggae & Ska; Latin; African; Electronica & Ambient;
Disco & House; Techno & Trance; and Breakbeat & Bass. Genres are
spread across these 16 families rather than catch-all
"Roots" or "UK continuum" lanes. Curved links and highlighting stay within the active mode.

At tablet widths (640–767px), bottom navigation labels match the Options button's
14px semibold text. Narrower phones retain compact labels; desktop navigation
keeps its existing sizing.

On desktop, **Options** sits beside the page selector and opens a dropdown
containing display and ordering controls; the timeline legend stays visible
below the header, and the header counts open dataset statistics. History has no
desktop Options button because it has no controls in that dropdown. On mobile,
the bottom navigation's **Options** button opens the controls, legend, and
dataset statistics in a bottom sheet. The desktop dropdown leaves the rest of the
UI interactive and closes on outside interaction or when focus moves away.
The mobile sheet keeps keyboard focus inside. Click outside or press Escape to
close; closing from within the panel returns focus to its trigger.
The mobile detail sheet has its close button in the top-right corner,
alongside the expand/collapse handle.

### Music history

The **History** view presents the graph's curated events in chronological order,
grouped into eras by their starting year. On desktop it fills the available width
with a horizontally scrolling timeline. Events alternate above and below a
central rail, filling the available window height. Connected-node chips stay at
the bottom of each card; overflowing descriptions fade out with a **Show more**
button that opens the full event in the detail panel. Very short windows can
also scroll vertically. Mobile keeps a vertical list with full descriptions.
Neighboring cards in each era share horizontal space on opposite sides of the rail,
with a small gap between cards on the same side. Spacing is not proportional to
elapsed time. The era buttons jump through the timeline, and selecting an event
scrolls it into view on either layout.
Dates marked `c.` or `approx.` are not exact, and events spanning years are
listed under their start. The current event collection runs from approximately
582 BCE to 2022 and is not an exhaustive or geographically balanced account.
Events without a period appear separately as **Undated** rather than being
assigned an invented year; they remain selectable and follow the same filters.

Show all events or just **Landmarks**, and filter by topic. Landmark status is an
editorial selection, not a measured ranking. Select an event to see its sources
and all relationships in the detail panel, or use its connected-node chips to
explore the graph. Selecting an event through search or a relationship opens
History and reveals it even if the current filters would hide it.

`/history` opens the view; `?focus=event:mtv-launch` shares a specific
event. Filters are remembered while switching views during the session but are
not part of the shared URL.

### Bar timelines

All current genres, artists, and instruments have timeline periods. Where exact
boundaries are not established, sourced editorial estimates use
`period.estimated: true` and an `estimateNote` explaining the evidence and its
limits. Estimated bars fade from transparent to full strength across their first
quarter and back to transparent across their last quarter, including open-ended
periods. The timeline legend includes a faded-bar sample and explains this
convention. Labels stay crisp, selection and keyboard access are preserved, and
tooltips and the detail panel explicitly identify estimated dates. Historical
context anchors for broad traditions are not claims of a single origin year.

Genres, artists, and instruments without a period appear in an **Undated**
fallback strip above their timeline if future entries lack even a defensible
estimate. They remain
searchable, selectable, and connected to related entries; undated genres also
remain in the bubble map.
Undated entries use compact, family-colored bars with the timeline's label size,
hover treatment, bright selected fill, and selection/focus outline. Selecting one
opens the same detail panel and dims unrelated entries without inventing dates.

Families are recognizable browsing groups, not claims that every member is a
subgenre of the lane name or shares a single origin. For example, Disco & House
groups related dance styles without calling disco a house subgenre; Grime sits
with Hip-hop for browsing while retaining its garage-derived lineage links.
Latin and African are broad regional umbrellas for the current catalogue, not
single musical traditions. Actual ancestry and cross-influences remain in the
graph relationships. The African lane includes raï, Algerian chaâbi, Gnawa,
mbalax, makossa, and taarab, with sourced artists, places, recordings, and
historical events. Artist lanes and detail badges use the same families.

- Each timeline's order toggle, marked by a sort icon (under Options on mobile),
  switches between **Family groups** (the default) and **Oldest first**.
  The latter uses one row per genre, artist, or instrument across all families,
  ordered by `period.start`, then name and id for ties. This is first appearance
  for genres and instruments, and career start for artists. Family colors,
  selection, and horizontal zoom are preserved; changing order resets vertical
  scrolling and brings the selection back into view.
- Each timeline remembers its own order when switching modes. Share links use
  `?sort=oldest-first` for genres, `?artist-sort=oldest-first` for artists,
  and `?instrument-sort=oldest-first` for instruments; an omitted parameter
  uses family groups for that timeline.
- Genres also offers a **Bars / Bubbles** switch (under Options on mobile).
  Bubbles keep family colors; their area and color brightness increase with the
  number of distinct genres reachable downstream through direct and indirect
  lineage links. This is influence within the catalogue, not a popularity or
  historical prominence score. Genres with no descendants keep a minimum size.
  Names appear without influence counts. A deterministic spring-and-collision
  layout pulls genres connected by lineage links toward each other, creating
  an organic, non-overlapping map rather than ordered rows. Family membership
  seeds the layout, but cross-family influences also pull neighbors together.
  The map uses the same compact layout as the timeline, without an extra title
  or subtitle. Zoom controls float over the map and stay accessible while panning.
  Drag the background, scroll, or swipe to explore. Pinch on touch screens or
  trackpads, or use Cmd/Ctrl+scroll, to zoom around the gesture's focal point;
  the floating buttons zoom around the viewport center. Zoom stays between
  25% and 150%. Spatial proximity is approximate, not a claim
  that every neighboring pair has a documented influence relationship.
  Click a bubble or press Enter/Space to open the same detail drawer.
  Selection shows the ancestor/descendant lineage: related bubbles stay bright,
  unrelated bubbles fade to 20%, and lineage links appear between bubbles.
  Hovering does not change the lineage; clearing the selection restores the full
  map. Selection uses a bright fill, thin white border, and an outer focus-style
  ring without scaling the bubble. Selecting a bubble does not rearrange the map.
  Search and related-genre navigation reveal the selected bubble. The layout is
  remembered when visiting Artists and shared with `?layout=bubbles`.
- Off-screen genres and instruments, and artists in Oldest first, have a
  labeled, family-colored ghost bar at the left or right edge, pointing toward
  their nearest visible period. Click or press
  Enter/Space to reveal it. Indicators widen for their labels when space permits;
  in family groups, they do not overlap an on-screen bar, its label, or another
  indicator. Nearer genres take priority on shared rows. Ghosts are navigation
  hints, not historical activity.
- Bar labels favor complete names, moving to another visible period, beside or
  across a bar, or above it on crowded rows when needed. If a name still cannot
  fit, it is shortened with an ellipsis; the full name remains available on hover
  and to assistive technology. Activity and tail fades, bar lengths, and dates are
  unchanged.
- With a mouse, drag to move both axes; vertical scroll moves the timeline, horizontal scroll pans time, and Cmd/Ctrl+scroll zooms.
- On touch screens, one-finger horizontal drags pan time, vertical swipes scroll the timeline, and two-finger pinches zoom. Tap a bar to open its draggable detail sheet.
- Swipe up anywhere on the collapsed mobile detail sheet to expand it. Once
  expanded, swipe through its content to scroll; use the top handle row to
  collapse it, or swipe down again while collapsed to dismiss it.
- Mobile search opens as a full-screen overlay and keeps keyboard focus inside
  until closed; selected artists and genres bring their bars into view.
- The year axis and compressed-era annotations stay visible while scrolling
  through either timeline, follow horizontal panning and zoom, and reduce
  label density on narrow screens, with extra spacing for BCE labels.
  Its opaque cover overlaps the upper edge by 1px to prevent scrolling bars
  showing through fractional-pixel seams below the legend.
  Reduced-motion preferences shorten interface transitions.
- Horizontal trackpad momentum is handled by the timeline without native
  horizontal overscroll; rapid wheel updates accumulate in input order and render
  once per animation frame. Detailed bars and links render near the vertical
  viewport, while every bar remains keyboard-accessible; focusing a row reveals it.
- Both timeline modes pad the time range by 24px on each side within a full-width
  drawing surface; panning and background bands extend all the way to the edges.
- Click a bar or focus it and press Enter/Space for details; every relation in the panel is navigable
- Mouse hover gives only the hovered, unselected bar or bubble a brightness lift
  and thin highlight border, easing in and out without scaling, changing lineage
  links, or dimming other items. Selected items do not change on hover. Lineage
  highlighting follows selection only.
- Selected bars use the bubble's rounded HTML focus-style ring, border, and
  spacing at the bubble map's default 75% zoom. Selection replaces the bar's
  native keyboard-focus outline rather than stacking a second outline. Keyboard
  focus uses that same rounded ring before selection, without a native-outline
  flash on pointer down.
- Artists switches to artist bars, not an overlay on the genre timeline; artist bubbles are currently removed
- Search ignores case, Latin accents, and apostrophe style (so `rai` finds `Raï`
  and `N'Dour` finds `N’Dour`). Use Up/Down to navigate results, wrapping at
  either end; Enter opens the highlighted result (or the first result), and
  Escape clears and closes search. Search and related-node navigation switch
  modes automatically when selecting an artist, genre, instrument, or event and
  bring the selection into view.
- Selection is shareable via `?focus=<node-id>`; `/genres`, `/artists`, `/instruments`, or `/history` opens a view without a selection
- Shared view and entity URLs return Open Graph and Twitter card metadata in the
  initial HTML, including a Soundlines preview image. Entity previews use their
  name and description (or a type-specific fallback). Genre bubbles have their
  own view preview. The document metadata also follows navigation in the app.
- Each mode remembers its horizontal time range; switching modes resets vertical scrolling and hover
- The default Genres and Artists range remains 1948–present; Instruments opens on c. 500–present. Pan or zoom out to reach earlier history (back to c. 500), or search for an era or composer to jump there

Artists appear once, in their most-represented genre family. Ties follow family
order; an explicit artist `family` overrides inference. Artist links include
sourced influences, group memberships, and collaborations. Collaboration dates
anchor both ends near the documented event; undated influences and memberships
anchor near the target's career start. Sharing a genre alone never creates an
artist-to-artist influence claim.

### Instruments

Instruments has six lanes of its own: Strings; Keyboards & Organs; Woodwinds &
Reeds; Brass; Percussion; and Electronic & Studio. Each bar starts at the
instrument's approximate first documented appearance in its recognizable form,
from the koto (c. 700) and lute to the Roland TR-808, the TB-303, and Auto-Tune.
All current instruments are still in use, so no bar ends. Curved links show sourced
lineage between instruments. For example, the electric guitar derives from the guitar,
the TR-909 derives from the TR-808, and the clarinet influenced the saxophone.
Each instrument bar has a family-colored icon at its leading edge; off-screen
indicators and undated instrument entries show the same icon.
Every instrument has four SVGs (icon, banner, avatar, and detail-panel header
background) in `public/instrument-*`. New or redrawn artwork follows one pipeline:
a sourced visual brief (`artwork-briefer`), the drawing (`artwork-illustrator`,
preferably as a master in [the generator](./scripts/artwork/generate-instrument-artwork.py)),
a deterministic gate (`artwork-validator`), and a ship review (`artwork-reviewer`)
with a final human check in Storybook. The style guide and scripts are in
[.github/skills/artwork-draw](./.github/skills/artwork-draw) and
[.github/skills/artwork-validate](./.github/skills/artwork-validate).
The detail panel lists the genres each instrument is featured in and its notable
players. Both open the corresponding genre or artist. A few instruments, including the
harpsichord, theremin, and TB-303, have editorial usage phases that show
eclipse and revival. The others stay neutral. Instruments have no bubble map.

### Historical prominence

Lifespan is not a golden age. Genres and artists can have explicit `phases`, each with a
`start` year and `prominence`: `emerging`, `golden-age`, `established`, or `niche`.
All phases keep the same bar height: golden ages are strongest, continuing scenes
are softer, and niche periods are hidden entirely (the bar fades out into them,
and back in for a revival). Relationship endpoints stay on the visible
part of the bar. A continuous gradient
smoothly blends intensity around each boundary (15% of the shorter neighbouring
phase either side, at least two years, so century-long instrument eras shift
over decades; shortened to a third of brief phases), without steps in height or dotted tails.
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
Ended bars fade over their final two years, with a minimum fade width of one bar
height (22px), capped at the bar's width. This keeps compressed historical tails
visible without dimming the latter half of a long career. Tails reach full
transparency; phase gradients follow the same era-weighted scale as the bars.

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

- **Nodes** (`genre`, `artist`, `instrument`, `label`, `place`, `track`, `scene`, `event`, `festival`) with stable `type:slug` ids, optional `period` (`start`/`end`/`precision`/`estimated`/`estimateNote`), `family` lanes, descriptions, and editorial confidence in the overall entry.
- **Edges** with a type, optional `period`, `confidence` (`low`/`medium`/`high`), `note`, and source URLs. Lineage edge types (`influences`, `derived_from`, `subgenre_of`, `fusion_of`, `cross_pollination`, `revival_of`) carry an orientation so the JSON reads naturally in both directions (see `LINEAGE_ORIENTATION` in [src/graph/types.ts](./src/graph/types.ts)).
- Nodes can include `sources` URLs; the detail panel links the selected node's sources, with each source's website shown beside the link. Festival relationships also show their own citations beside the connection. Festival confidence is reassessed against evidence, not inferred from citation counts.

### Music festivals

The collection includes ancient Pythian Games and the approximately 1715 Three
Choirs Festival alongside modern institutions: 39 festivals across 25 countries and six continents,
selected for documented historical contributions and public recognition. It spans
Woodstock, Monterey Pop and Newport Folk; Bayreuth, Salzburg and Donaueschingen;
Movement, Sónar and Tomorrowland; Reggae Sunsplash, FESPAM and Sauti za Busara;
Cosquín, Viña del Mar and Rock al Parque; Sawai Gandharva, Java Jazz and Baalbeck;
and further jazz, metal and cross-cultural institutions. All festivals have at
least three references; the [source audit](./docs/evidence/audits/festival-sources-001.md)
explains source scope, conflicts and High/Medium confidence decisions. Descriptions explain
breakthrough performances, new-music platforms, regional traditions and musical
exchange rather than assigning a popularity or influence score. The
[coverage register](./docs/evidence/festivals.md) lists every festival, country,
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
[cross-check](./docs/evidence/audits/festival-wikipedia-events-002.md); conflicts
are recorded alongside the stronger primary and institutional evidence.

Festival periods normally start at the first edition; conventional chronology
anchors are marked estimated and explained. They do not claim uninterrupted annual
operation. Historically significant standalone gatherings, including the original
Woodstock and Monterey Pop festivals, have bounded periods. Existing historical festival events retain their stable IDs: an event
can describe the founding or one edition, while a festival node describes the
institution. English and French text, per-entry evidence notes, and the review
coverage register accompany this batch.

See [docs/GRAPH.md](./docs/GRAPH.md) for the full schema, validation rules, and an editing guide (also suitable as a prompt for LLM-assisted enrichment).

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
coverage-tracker bookkeeping, documented counts). The [Graph quality](./.github/workflows/graph-quality.yml)
workflow runs it, plus a `review-status.json` freshness check, on every pull request touching graph data
or docs. The skills in [.github/skills](./.github/skills) bundle `lookup.mjs` (query `graph.json` by id,
name, or pending evidence) and `diff.mjs` (semantic diff of graph changes and overlays against a git ref).

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

The [connectivity register](./docs/evidence/disconnected-entries.md) explicitly
records sourced standalone events and unresolved track attributions. Stable IDs
are retained without inventing relationships; tests enforce this exact exception
set as well as the live-edge evidence tracker and generated review-status index.

Composer dates describe approximate creative/professional activity, not birth
years. Some new band periods span documented breaks and reunion appearances;
their descriptions identify this career-envelope limitation. They are not
claims of uninterrupted activity.

The UI never touches the JSON directly: all queries (neighbors, lineage traversal, period filtering, search) go through [src/graph/graph.ts](./src/graph/graph.ts). Migrating to a graph database later (e.g. Neo4j: nodes → labeled vertices, edges → typed relationships, other fields → properties) only requires reimplementing that one module.

### Shared explorer architecture

- The landing-page theme button flips the vinyl from Side A (dark) to Side B
  (light). The app-wide palette is stored in `localStorage` as `soundlines-theme`;
  dark remains the default. The preference is applied before hydration and
  synchronized across tabs. Reduced-motion users see an instant side change.
  Light mode uses parchment surfaces, warm brown text, terracotta UI accents, and a muted categorical
  chart palette. Keep source hues in [theme.ts](./src/theme.ts) stable for dark
  mode; rendering code uses `chartColor` to resolve shared light-mode aliases
  from [colorTheme.css](./src/colorTheme.css). Bars blend over the theme's canvas,
  with dark labels in light mode; prominence, date fades, and category meanings
  remain unchanged. Colored text and instrument icons use `chartTextColor` for
  contrast without changing dark-mode hues.
- Dragging the landing-page vinyl scratches it: the record follows the pointer
  and [vinylScratch.ts](./src/components/vinylScratch.ts) plays a synthesized
  vocal sample through Web Audio. Its speed and direction follow the drag
  (33⅓ rpm is normal speed). On mobile, tap the visible record to enable sound
  if needed, then drag it; scrolling remains available outside the record. Audio
  starts only after the first drag.

- Explicit App Router pages cover home, genres, artists, instruments, and
  history. The locale layout shares [SoundlinesProviders](./src/SoundlinesProviders.tsx)
  across them; the pages currently render the shared [App](./src/App.tsx) UI.
- [ExplorerContext](./src/ExplorerContext.ts) owns the graph index, active mode,
  selection, per-mode ranges, history filters, and URL synchronization. Next's
  router pushes view changes and replaces query-only changes, preserving browser
  history and unrelated URL parameters. Legacy query links redirect to the
  corresponding explicit route. Pages render on demand so the initial server
  render reflects the request's query parameters.
- Locales are language-only (`en` and `fr`). next-intl's default prefix routing
  provides `/en` and `/fr`, without a custom prefix map or internal country-code
  rewrite. The root proxy uses next-intl's built-in locale negotiation and
  preference cookie; explicit locale URLs remain stable. A standard Next.js
  redirect preserves old `/en-US` links, including paths and query parameters.
- The landing-page footer links to each explorer page and lets visitors switch
  between English and French.
- App translations live in [English](./src/i18n/locales/en.json) and
  [French](./src/i18n/locales/fr.json) JSON catalogues: UI copy, accessibility
  labels, date wording, graph taxonomy labels, and page/social metadata.
  The UI uses `next-intl`: client components call `useTranslations`, server
  components use `getTranslations`, and ICU messages handle interpolation and
  plurals. TypeScript checks message keys against the English catalogue; keep
  catalogue keys and ICU parameters aligned across languages. Graph content
  translations remain separate.
- Graph text for each non-English locale lives in `src/data/graph.<locale>.json`
  (currently [French](./src/data/graph.fr.json)), registered in `GRAPH_OVERLAYS`. It is keyed by stable
  entity IDs and overlays only translated fields on the canonical graph. The overlay
  covers descriptions, phase summaries, individual phase notes, period-estimate
  notes, and all relationship notes. Instruments, places, scenes, and applicable
  genre names have localized labels; artist, label, and recording names retain
  their original form. Previously missing long-form text was machine-translated
  with Google Translate, with manual corrections to visible musical terminology.
  The remaining 860 relationship notes were translated directly, without an
  external translation service, preserving source references and caveats.
  This text remains a first pass for editorial review. Coverage tests require
  every source descriptive field to have a nonempty French entry and verify
  that translations preserve graph structure.
- [Social metadata](./src/socialMetadata.ts) derives previews from the same
  routes, URL parameters, and graph nodes. App Router metadata is rendered on
  the server, including canonical and alternate-language URLs.
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
npm run start
npm run storybook
npm run build-storybook
```

The [Vercel configuration](./vercel.json) selects the Next.js framework preset.
Do not configure a static `dist` output directory: App Router pages render on
the server.

### Docker Compose

To run the app and Storybook with Docker Compose:

```bash
docker compose up -d           # app and Storybook
docker compose up -d storybook # Storybook only
```

Compose serves the app at `http://localhost:5173` and Storybook at
`http://localhost:6008` on the local machine. Set `STORYBOOK_PORT` to change
the Storybook host port, for example
`STORYBOOK_PORT=6010 docker compose up -d storybook`. The app and Storybook use
separate dependency volumes so their installs do not interrupt one another. The
container image does not include Git, so Storybook's optional Git-based change
detection is unavailable; component hot reload still works.

Before starting another server for browser verification, check
`docker compose ps` and verify the relevant service responds, for example with
`curl -fsS -o /dev/null http://localhost:5173/fr`. Reuse the running Compose
app or Storybook when it is healthy and accessible: the services mount the
working tree and pick up source changes. A browser-tool failure alone does not
mean the service is down; check browser connectivity separately. Start another
server only when necessary, such as when no suitable service is accessible or a
test requires isolation, and stop only servers you started.

### Storybook

Run `npm run storybook` and open the local URL printed by the command (port
6006 by default). If that port is in use, run
`npm run storybook -- --port 6007` instead. `npm run build-storybook` creates a
static, shareable build in `storybook-static/`.

The catalog includes the project colors, view/layout/order toggles, bubble
zoom buttons, search states, legends, detail panels, timeline bars, the timeline,
the bubble map, and desktop/mobile explorer compositions. Use the Controls,
Actions, Accessibility, and viewport panels to inspect variants and interactions;
some stories also exercise keyboard and search behavior automatically.

Stories use the real music graph with an isolated, in-memory explorer provider.
Selections, search, related-node navigation, view changes, panning, and zoom
are interactive without changing the app's URL or starting its page-loading
transition. The source links in detail panels still open their actual websites.
Timeline labels wait for SVG layout before measuring text, including when an
initially hidden preview is revealed.
