# Explorer behavior

[Back to README](../README.md)

Paths in prose and commands are relative to the repository root.

## Landing page and loading transitions

Below the hero, the landing page introduces the Chronologies, optional Soundtrails, and
Explore the catalogue sections in that order, each with a short description. The catalogue
leads with a featured genre connection and a playable genre sample, followed by artist,
instrument and history discoveries and recent additions. Visitors can cycle the featured
picks or open their entries directly. The artist and instrument spotlights each cycle
through five catalogue entries selected for the UTC day. Their selections are consistent
across languages, change at midnight UTC even while the page remains open, and share no
entries with the previous day when at least ten candidates are available. Smaller
catalogues show up to five available entries.

Chronology preview cards are experimental and off by default. Set
`NEXT_PUBLIC_FEATURE_CHRONOLOGY_PREVIEWS=true` before starting or building the app to
enable them. Otherwise, the Chronologies section shows the original links to the genre,
artist, instrument and history views.

When enabled, the Chronologies section groups the genre, artist and instrument timelines
in one card, with controls to switch the single visible preview and a link to open the full
selected timeline. The history chronology has a separate card. Each preview is a read-only
window onto the actual timeline or history component using the localized graph, not a
separate sample list. Soundtrails has its own independent flag and, when enabled, appears
after the chronology links or previews; Explore the catalogue follows last.

An alternative landing page (v3) groups content by topic instead and is off by default.
Set `NEXT_PUBLIC_FEATURE_LANDING_V3=true` to enable it. Its sections are Genres (genre
timeline link, featured connection, listening booth and, when enabled, Soundtrails),
Artists (artist timeline link, artist spotlight and the latest artists added), Instruments
(instrument timeline link, instrument spotlight and the latest instruments added) and History
(events timeline link, turning points and the latest events added). Each section has a
title, a short description and its timeline link in the header; a spotlight is omitted
when the graph has no entries of its type, and a recent-additions list is omitted when no
entry of that type carries an `addedOn` date. Chronology previews only
apply to the default (v2) layout.

The header logo and browser favicon share the Soundlines mark. Dark theme uses
cyan and pink waveforms with violet endpoints on a dark circle; light theme uses
muted blue, rose and violet on a warm cream circle. The favicon follows the app's
theme. While the brand link is hovered or keyboard-focused, or while the page or
explorer view scrolls, endless randomly generated waves (varying peak spacing
and height) travel from left to right between their fixed endpoints. Afterwards
the favicon's still frame flows back in from the left and the motion eases to a
stop on it. Reduced motion keeps the mark still.
On first load, the landing page's grooved vinyl spins in the center before React
starts. Once the landing page is ready, the cover fades away and the vinyl moves
into its hero position over 700ms of animation time, tracking the hero position and
scroll-driven rotation even when scrolling during loading. The handoff waits for
the movement to finish, including when startup rendering delays its first frame.
Destination tracking begins only after the movement starts, so slow startup
cannot keep the vinyl stuck in the center until the user scrolls.
Other entry pages simply fade out the cover.
The hero copy stays in its final position throughout; catalogue widgets fade in
as they enter the viewport without shifting their alignment.
The compact, beveled turntable button is inset into the hero card without adding
height on desktop or mobile. Its raised face depresses during playback, with a
lit status LED; the labeled side/theme toggle sits beside it. The vinyl label has
a centered icon without side lettering, while SOUNDLINES curves outside the
record's lower-left edge. Dark theme plays the original four-bar instrumental
hip-hop loop; light theme selects its more aggressive trap arrangement with the
same melody and tempo. Changing theme keeps the musical position and scratch
speed, with an 80 ms crossfade.
It never starts paused audio. The first loop loads only on Play; after that,
the other side loads on theme change and both sides stay cached for the visit.
Dragging the record
scratches that same stereo recording forward or backward; holding it stops the
groove, and releasing it resumes normal playback. Navigation stops the audio.
Reduced-motion preferences disable automatic record rotation, not playback.
After a two-second pause with the record in view, a decorative hand demonstrates
one of four silent scenarios. Each combines a tap on Play with a scratch, in
either order, with different scratching styles and a soft button pulse.
Scratch gestures follow a circular arc, rotating the vinyl in sync.
Both hand poses share the same wrist position for a stationary crossfade.
Each demonstration lasts seven seconds, followed by a random 10–16-second pause;
consecutive scenarios never repeat. Hints pause when the record leaves the
viewport or the tab is hidden. Scrolling, typing, and unrelated pointer presses
do not cancel the current hint. Hints never play audio or block controls,
and fade out over 250 ms and stop for the visit only on scratch or Play.
Reduced-motion preferences also disable this hint.
The controls show a localized retry message when audio cannot load.

See the [audio guide](./AUDIO.md) for loop provenance and preview generation.

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

## Open Data

The landing-page footer and dataset statistics dialog link to a separate Open Data
space inside the app. It reuses the landing page's header (brand, search, GitHub link)
and footer; footer language links keep the current data page. It has four
localized pages with shared navigation:

- `/{locale}/data/dataset`: visual totals, entity and relationship charts, source
  coverage and confidence, licensing, and links to the graph files on GitHub.
- `/{locale}/data/query`: the public MCP endpoint, client configuration, an example
  question and tool schemas.
- `/{locale}/data/changelog`: searchable, filterable graph, preview, loop and artwork
  changes, with links back into the explorer and to the changelog files on GitHub.
- `/{locale}/data/contribute`: ways to suggest sourced corrections or additions
  and a link to the graph contribution workflow.

`/{locale}/data` redirects to the dataset page. These are not explorer views:
navigating between them must not reset or redirect into a chronology. The dataset
dashboard and statistics dialog share chart components and derive their figures
from the same graph index. Changelog data loads only on its own page, from the
compact generated `public/open-data-changelog.json` artifact. The companion site's
former query and changelog pages hand off to their corresponding app pages.

## The timeline

Select a genre in the timeline, bubble map, or search to play its 10-second
ACE-Step preview in the detail panel. Previews load on play.

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
containing display and ordering controls. The timeline legend stays visible
below the header. At widths of 1280px and above, labeled header counts open
dataset statistics, and History omits its Options button. At 768–1279px,
the Options dropdown includes **Dataset Statistics** in every view. On mobile,
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
the TR-909 derives from the TR-808, and the bass clarinet influenced the
mouthpiece of the early saxophone.
Each instrument bar has a family-colored icon at its leading edge; off-screen
indicators and undated instrument entries show the same icon.
See the [instrument artwork workflow](./DATA.md#instrument-artwork) for assets,
generation, and review.
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
