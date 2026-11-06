# graph.json — data guide for editors and LLMs

This document describes [graph.json](./graph.json), the single dataset behind
**Soundlines**, a chronological, interactive map of music genres, artists, labels,
places, scenes, tracks, and historical events. Give it to an editor or to a language model (for
example ChatGPT) along with `graph.json` when asking for the dataset to be
**enriched, corrected, or expanded** (new genres, artists, lineage links, phases,
events, and so on).

> **Current priority:** deepen the chronology through the ages. The graph now has 82
> sourced events with significance labels; continue filling the pre-1600 and post-2010
> gaps, then add more composition, artist, and track coverage in underrepresented
> musical traditions. See §6, "Chronology coverage gaps".

The app reads the JSON as-is. The rules below are enforced by an automated
test suite ([graph.test.ts](./graph.test.ts)). **Output that breaks them will be
rejected.**

---

## 1. Top-level shape

```json
{
  "version": 1,
  "nodes": [ /* GraphNode */ ],
  "edges": [ /* GraphEdge */ ]
}
```

It is a property graph: `nodes` are entities and `edges` are typed, directed
relationships between two node ids.

Current size: 1265 nodes (177 genres, 538 artists, 72 instruments, 41 labels, 89 places, 210 tracks, 56 scenes, 82 events) and 1907 edges (as of 2026-11-05).

---

## 2. Nodes

```ts
interface GraphNode {
  id: string            // "<type>:<slug>", e.g. "genre:deep-house", "artist:kraftwerk"
  type: 'genre' | 'artist' | 'instrument' | 'label' | 'place' | 'track' | 'scene' | 'event'
  name: string          // Display name, e.g. "Deep house"
  addedOn?: string      // Catalogue addition date (YYYY-MM-DD) shown on the home page
  period?: { start: number; end?: number | null; precision?: 'year' | 'decade' | 'century' | 'circa'; estimated?: boolean; estimateNote?: string } | null // Negative years are BCE
  description?: string  // 1–3 sentences, editorial and evocative but factual
  family?: GenreFamily | InstrumentFamily  // Timeline lane (required for genres and instruments)
  kind?: 'person' | 'group' | 'collective'   // Artists only
  category?: EventCategory                   // Events only (required). See "Events"
  significance?: 'landmark' | 'notable'      // Events only (optional). See "Events"
  confidence?: 'low' | 'medium' | 'high'     // Editorial confidence in the overall entry
  sources?: string[]    // HTTPS URLs to relevant, credible sources
  phases?: ProminencePhase[]  // Genres, artists, and instruments only. See §5
  phaseNote?: string    // Required when `phases` is nonempty
}
```

### Node types

| type     | Meaning                                       | `period` means                         |
|----------|-----------------------------------------------|----------------------------------------|
| `genre`  | A genre, style, or historical era             | Emergence → end (absent `end` = still alive) |
| `artist` | A person, group, or collective                | **Active creative career**, not birth/death |
| `instrument` | A musical instrument or studio device     | First documented appearance in its recognizable form → disuse (usually no `end`) |
| `label`  | Record label                                  | Founding → closure                     |
| `place`  | City or region                                | Usually omitted                        |
| `track`  | A specific recording                          | Release year (`start` = `end`)         |
| `scene`  | Club, venue, party, radio show, or movement   | Active years                           |
| `event`  | A turning point in music history (invention, format, broadcast, premiere, festival, law, migration) | When it happened (`start` = `end` for a single date, or a range for a process) |

Supply a period when a defensible date or broad historical placement is available.
If boundaries are inferred rather than verified, set `period.estimated: true`
and supply `period.estimateNote` explaining the source-based rationale and limits.
Estimates remain normal chronological bars but have broad transparent fades on
both ends, with explicit estimated labels in tooltips and details. This flag is
independent of precision, entry confidence and prominence phases: do not invent
a prominence curve just to place an entry. For regional or oral traditions,
state when the start is a contextual anchor rather than a common origin.
All current genre, artist and instrument entries have periods.
Omit the period or use `null` only if no defensible placement is possible.
Such entries remain searchable and appear separately from dated timelines.
Use `year` for a known year, `decade` or `century` for broader precision, and
`circa` for an approximate date.

Optional node-level `confidence` describes the evidence for the overall entry,
not every individual claim, date, phase, or relationship. It appears in the
detail panel and should be supported by the entry's source review.

### Id conventions

- Format: `<type>:<slug>`. The prefix **must** equal `type`.
- Slugs are lowercase kebab-case ASCII: `artist:daft-punk`, `genre:uk-garage`,
  `place:new-york`. Strip accents (`artist:dvorak`).
- Ids are permanent. **Never rename or remove an existing id**; other edges and
  shared URLs (`?focus=<id>`) depend on them.

### Families (timeline lanes)

Every genre **must** have a `family`. Lanes are rendered in this order:

| family              | Label                  | Genres | Current examples |
|---------------------|------------------------|--------|------------------|
| `classical`         | Classical              | 17     | Western eras, impressionism, serialism, Hindustani, Carnatic, gagaku, pansori |
| `blues-soul`        | Blues, R&B & Soul      | 8      | blues, R&B, soul, funk, neo-soul, new jack swing, contemporary R&B |
| `jazz`              | Jazz                   | 12     | swing, bebop, modal, free, fusion, acid, vocal, Latin, spiritual jazz |
| `country-folk`      | Country & Folk         | 9      | country, honky-tonk, alt-country, Americana, folk, Baul songs, khoomei |
| `rock`              | Rock                   | 11     | rock and roll, blues-rock, hard-rock, krautrock, surf-rock |
| `alternative-punk`  | Alternative & Punk     | 16     | punk, post-punk, indie-rock, grunge, shoegaze, new-wave |
| `metal`             | Metal                  | 8      | heavy, thrash, death, black, doom, nu, industrial metal, metalcore |
| `pop`               | Pop                    | 5      | pop, girl groups, synth-pop, K-pop, J-pop |
| `hip-hop`           | Hip-hop                | 18     | regional rap, boom bap, jazz rap, crunk, G-funk, hyphy, trap, drill, grime |
| `reggae`            | Reggae & Ska           | 6      | calypso, ska, rocksteady, reggae, dub, dancehall |
| `latin`             | Latin                  | 11     | son cubano, salsa, bossa nova, cumbia, samba, tango, reggaeton |
| `african`           | African                | 15     | highlife, Afrobeat, Congolese rumba, raï, Gnawa, Algerian chaâbi, mbalax, makossa, taarab |
| `electronica`       | Electronica & Ambient  | 11     | electro, trip-hop, ambient, IDM, synthwave, downtempo, EDM |
| `house`             | Disco & House          | 13     | disco, Italo disco, hi-NRG, house styles, French Touch, footwork |
| `techno`            | Techno & Trance        | 9      | techno styles, trance, psytrance, gabber, hardstyle |
| `breakbeat-bass`    | Breakbeat & Bass       | 8      | breakbeat hardcore, jungle, drum and bass, garage, dubstep, breakcore |

These are navigational families, not strict genre ancestry. The 177 genres
currently have 5–18 members per family: enough granularity to avoid an oversized
Electronic lane without creating one-genre lanes. Keep related styles together
as the catalogue grows, and revisit the grouping if it becomes unbalanced rather
than putting unrelated traditions into a catch-all.

Disco is not a house subgenre, and French Touch remains broader than French
house; the shared lane is a browsing choice. Grime is grouped with Hip-hop
without changing its garage-derived relationships. Latin and African are
regional umbrellas, not assertions of a single origin; Afrobeat and Afrobeats
remain distinct nodes. Cross-family ancestry stays in the graph edges.

**Adding a new family** (for example `gospel` when catalogue coverage warrants
its own lane) requires updates in `src/graph/types.ts` (`GenreFamily`,
`FAMILY_LABELS`, `FAMILY_ORDER`), `src/theme.ts` (`FAMILY_COLORS`), and the
family-assignment tests in `src/data/graph.test.ts`. It is allowed, but
**list every new family explicitly** in your response with a suggested label
and position in the order, so the code can be updated.

Artists usually **omit** `family`; their lane is inferred from the genres they
are a `key_artist_of` (the most-represented family wins). Set it only to override
the inference (for example `artist:mozart` → `classical`), or when no
`key_artist_of` relationship provides a family. Every artist needs a resolvable
family; a missing family prevents the artist timeline from loading. For example,
`artist:women-on-wax` explicitly uses `techno`
without claiming a key-artist relationship. `artist:dune`, added as a recording
artist, also explicitly uses `techno` so it can appear in the Techno & Trance
browsing lane without inventing a `key_artist_of` claim.

### Instrument families (Instruments timeline lanes)

Every instrument **must** have one of these instrument families. Genre families
are not valid for instruments, and instrument families are not valid for other nodes.

| family       | Label               | Current examples |
|--------------|---------------------|------------------|
| `strings`    | Strings             | harp, cello, viola, koto, lute, guitar, violin, double bass, banjo, sitar, sarod, charango, balalaika, Algerian mandole, dobro, pedal steel guitar |
| `keyboards`  | Keyboards & Organs  | harpsichord, piano, pipe organ, Hammond organ, electric piano, harmonium |
| `winds`      | Woodwinds & Reeds   | transverse flute, recorder, oboe, bassoon, clarinet, harmonica, accordion, saxophone, bandoneon, quena, bansuri, shō, hichiriki, ryūteki |
| `brass`      | Brass               | French horn, trombone, valved trumpet, tuba |
| `percussion` | Percussion          | tabla, bongos, claves, maracas, güiro, conga, drum kit, vibraphone, steelpan, timbales |
| `electronic` | Electronic & Studio | theremin, modular synthesizer, Minimoog, turntables, sampler, TR-808, TB-303, TR-909, Auto-Tune |

Instrument ids use the generic name unless a specific model defines the sound
(`instrument:tr-808`, `instrument:minimoog`). When supported, pick `period.start` as the
approximate first documented appearance of the recognizable form, usually with
`precision: 'circa'` (the valved trumpet starts in 1818, not with ancient trumpets).
Each instrument needs a `description`, `sources`, and at least one sourced
`featured_in` edge.

The instrument timeline supports years from -3000 (3000 BCE). Negative years
display as BCE; positive years display as written. When no reasonable prominence
curve is supported, omit `phases` so the instrument appears as a neutral bar.

### Events (chronology)

Events are the turning points that are **not** a genre, artist,
instrument, label, place, track, or scene, but that changed how music was made,
heard, distributed, or remembered. They power the chronological "music history
through the ages" view.

```json
{
  "id": "event:mtv-launch",
  "type": "event",
  "name": "MTV launches",
  "category": "media",
  "significance": "landmark",
  "period": { "start": 1981, "end": 1981, "precision": "year" },
  "description": "The US cable channel MTV goes on air on 1 August 1981 with round-the-clock music videos, making image and video central to pop careers and accelerating the British synth-pop and new wave invasion of American charts.",
  "sources": ["https://www.britannica.com/topic/MTV"]
}
```

**Category** (required, one value):

| category      | Label                       | Typical events |
|---------------|-----------------------------|----------------|
| `technology`  | Technology & formats        | phonograph, electrical recording, magnetic tape, LP and 45 rpm records, multitrack recording, compact cassette, CD, MIDI, MP3 |
| `media`       | Broadcast & media           | first music broadcasts, pirate radio, MTV, YouTube, streaming platforms, TikTok |
| `industry`    | Industry & law              | copyright laws, recording bans, chart creation, landmark sampling lawsuits, Napster shutdown, laws regulating raves |
| `performance` | Performances & festivals    | opera premieres, first public concerts, historic recording sessions, festivals, benefit concerts |
| `publication` | Theory, notation & print    | staff notation, treatises, music printing, landmark anthologies and field recordings |
| `society`     | Society & migration         | migrations, wars, bans, civil-rights or political moments that reshaped music |

**Significance** (optional): `landmark` for turning points every general music
history would mention (about 1 in 3 events), `notable` for the rest. It is an
editorial weight used to filter the chronology, not a ranking.

**What is an event and what is not:**

- A playable device (piano, TR-808, sampler) is an `instrument`, **not** an
  event. A recording or playback **format or medium** (phonograph, LP, CD,
  radio, streaming) **is** an event.
- A recurring club, party, or venue is a `scene`. A one-off or annual gathering
  (Woodstock, Live Aid, Festac '77) is an event. A long-running festival can be an
  event whose `period` covers its first edition, unless its run matters more than
  its founding.
- A record is a `track`. A recording **session** or premiere that matters
  beyond the record itself (the 1927 Bristol Sessions, the premiere of *The Rite of
  Spring*) is an event.
- Founding a label is the label's `period.start`. Do not duplicate it as an event.

**Rules:**

- When a `period` is supportable, use `start` = `end` for a dated moment, or a
  range for a process (for example the Great Migration). Use `precision: "circa"`
  for early or contested dates and say so in the description. Otherwise omit the
  period; the event will appear in the undated section.
- `name` is short and reads like a timeline caption ("MTV launches", "Napster is
  shut down", "Guido of Arezzo's staff notation").
- `description`, `category`, and at least one `sources` URL are required.
  `family`, `kind`, and `phases` are not allowed on events.
- Add a sourced event edge only when an existing node has a meaningful relationship;
  a standalone event is valid when no such relationship is documented. Use `shaped` only
  when the event directly affected a genre, instrument, label, or scene; use
  `context_for` for a historical or period connection without a direct influence
  claim, and `recognized` for heritage inscriptions. Add `involved` edges for key
  participants and `occurred_in` for the place. Do not invent a `shaped` edge just
  to satisfy the link requirement.
- Every edge touching an event has `sources`.
- Prefer existing nodes as edge targets. Add new artist, place, or genre nodes only
  when they are worth having in their own right, and follow all their rules.
- The timeline starts at year **500**. For older developments (for example
  ancient Greek theory), anchor the event to the medieval form that the
  timeline represents, and explain the earlier history in the description.

### Existing genre ids (do not duplicate)

```
genre:acid-house genre:acid-jazz genre:afrobeat genre:afrobeats genre:algerian-chaabi genre:alt-country genre:alternative-rap
genre:alternative-rock genre:amapiano genre:ambient genre:ambient-techno genre:americana genre:andean-folk genre:arabic-maqam
genre:bachata genre:baroque genre:baul-songs genre:bebop genre:big-beat genre:black-metal
genre:bluegrass genre:blues genre:blues-rock genre:boom-bap genre:bossa-nova genre:breakbeat
genre:breakbeat-hardcore genre:breakcore genre:britpop genre:calypso genre:carnatic genre:chicago-house
genre:chillwave genre:chopped-and-screwed genre:classical-period genre:congolese-rumba genre:conscious-hip-hop genre:contemporary-r-and-b genre:cool-jazz
genre:country genre:crunk genre:cumbia genre:dancehall genre:darksynth genre:death-metal
genre:deep-house genre:detroit-techno genre:disco genre:doo-wop genre:doom-metal genre:downtempo
genre:dream-pop genre:drill genre:drum-and-bass genre:dub genre:dub-techno genre:dubstep
genre:east-coast-rap genre:edm genre:electro genre:electro-house genre:electroclash genre:emo
genre:folk genre:footwork genre:free-jazz genre:french-house genre:french-touch genre:funk
genre:g-funk genre:gabber genre:gagaku genre:gamelan genre:gangsta-rap genre:garage-house
genre:garage-rock genre:girl-groups genre:glam-rock genre:gnawa genre:gothic-rock genre:gqom genre:grime
genre:grunge genre:hard-bop genre:hard-rock genre:hardstyle genre:heavy-metal genre:hi-nrg
genre:highlife genre:hindustani-classical genre:hip-hop genre:honky-tonk genre:horrorcore genre:house
genre:hyphy genre:idm genre:impressionism genre:indie-rock genre:industrial-metal genre:italo-disco
genre:j-pop genre:jazz genre:jazz-fusion genre:jazz-rap genre:juju genre:jungle
genre:k-pop genre:khoomei genre:krautrock genre:kwaito genre:latin genre:latin-jazz
genre:makossa genre:math-rock genre:mbalax genre:medieval genre:merengue genre:metalcore genre:minimal-techno genre:minimalism
genre:modal-jazz genre:modern-classical genre:neo-soul genre:new-jack-swing genre:new-wave genre:noise-rock
genre:nu-metal genre:old-school-rap genre:pansori genre:peking-opera genre:pop genre:pop-punk
genre:post-hardcore genre:post-punk genre:post-rock genre:progressive-rock genre:psychedelic-rock genre:psytrance
genre:punk-rock genre:qawwali genre:r-and-b genre:rai genre:reggae genre:reggaeton genre:renaissance
genre:rock genre:rock-and-roll genre:rocksteady genre:romantic genre:russian-folk genre:salsa
genre:samba genre:serialism genre:shoegaze genre:ska genre:son-cubano genre:soukous
genre:soul genre:southern-rap genre:spiritual-jazz genre:stoner-rock genre:surf-rock genre:swing
genre:synth-pop genre:synthwave genre:taarab genre:tango genre:tech-house genre:techno genre:thrash-metal
genre:trance genre:trap-rap genre:trip-hop genre:uk-garage genre:vaporwave genre:vocal-jazz
genre:west-coast-rap
```

Always check `graph.json` for an existing artist, label, place, track, or scene
before creating one.

---

## 3. Edges

```ts
interface GraphEdge {
  id: string                 // Unique, e.g. "lineage:dubstep-uk-garage", "key:skream-dubstep"
  type: EdgeType
  from: string               // Existing node id
  to: string                 // Existing node id
  period?: { start: number; end?: number | null; precision?: ... }
  confidence?: 'low' | 'medium' | 'high'
  note?: string              // Short qualifying context
  sources?: string[]         // HTTPS URLs to relevant, credible sources
}
```

### Edge types and direction

Read every edge as **`from` → label → `to`**:

| type                | from → to               | Reads as | Lineage orientation |
|---------------------|-------------------------|----------|---------------------|
| `influences`        | genre → genre, artist → artist, instrument → instrument | A influences B | `from` is the ancestor |
| `cross_pollination` | genre ↔ genre           | A cross-pollinates with B (contemporaries) | `from` is the ancestor |
| `derived_from`      | genre → genre, instrument → instrument | A is derived from B | `to` is the ancestor |
| `subgenre_of`       | genre → genre           | A is a subgenre of B | `to` is the ancestor |
| `fusion_of`         | genre → genre (×N)      | A is a fusion of B (add one edge per parent) | `to` is the ancestor |
| `revival_of`        | genre → genre           | A is a revival of B | `to` is the ancestor |
| `key_artist_of`     | artist → genre          | A is a key artist of genre B | — |
| `member_of`         | artist(person) → artist(group) | A is a member of B | — |
| `collaborated_with` | artist → artist         | A collaborated with B | — |
| `signed_to`         | artist → label          | A is signed to B | — |
| `founded`           | artist → label/scene    | A founded B | — |
| `originated_in`     | genre/artist/label/scene → place | A originated in B | — |
| `anthem_of`         | track → genre           | A is an anthem of B | — |
| `recorded_by`       | track → artist          | A was recorded by B | — |
| `composed_by`       | track → artist          | A was composed by B | — |
| `featured_in`       | instrument → genre      | A is a defining instrument in genre B | — |
| `plays`             | artist → instrument     | A is a notable player of B | — |
| `shaped`            | event → genre/instrument/label/scene | Event A directly shaped B | — |
| `context_for`       | event → genre/scene | Event A provides historical context for B; no direct influence is claimed | — |
| `recognized`        | event → genre | Event A formally recognizes or inscribes B | — |
| `involved`          | event → artist/track/instrument/label/scene | Event A involved B (key participant, record, or device) | — |
| `occurred_in`       | event → place           | Event A took place in B | — |

**Direction matters.** For example, `deep-house derived_from chicago-house` is correct;
`chicago-house derived_from deep-house` is wrong. Do not create the same
relationship twice in opposite directions.

Choose the most precise lineage type:

- `subgenre_of`: a recognised branch inside a parent (minimalism ⊂ modern classical).
- `derived_from`: a new genre grown out of an older one (hard bop ← bebop).
- `fusion_of`: a deliberate blend with two or more parents (jazz fusion ← jazz + rock).
- `influences`: a notable but looser influence, or succession between historical eras.
- `revival_of`: a later movement that consciously revives an earlier style.
- `cross_pollination`: two contemporary scenes that exchanged ideas.

### Edge id conventions

Use descriptive prefixes for edge IDs:

- `lineage:<child>-<parent>` for genre lineage edges
- `key:<artist-slug>-<genre-slug>` for `key_artist_of`
- `member:<person>-<group>`, `collab:<a>-<b>`, `origin:<node>-<place>`,
  `signed:<artist>-<label>`, `founded:<artist>-<label>`,
  `anthem:<track>-<genre>`, `recorded:<track>-<artist>`
- `featured:<instrument>-<genre>`, `plays:<artist>-<instrument>`, and
  `lineage:<child>-<parent>` between instruments
- `shaped:<event>-<target>`, `context_for:<event>-<target>`,
  `recognized:<event>-<target>`, `involved:<event>-<target>`,
  `occurred_in:<event>-<place>` (legacy `occurred:` IDs may remain)
  (slugs without the type prefix, for example `shaped:mtv-launch-synth-pop`)

Ids must be unique across all edges.

### Edge `period`

- `member_of`: membership years.
- `collaborated_with`: the documented collaboration year(s). Use these anchors on the timeline.
- `influences` between artists: omit `period` unless it is documented; the UI
  anchors it near the target's career start.

---

## 4. Hard rules (enforced by tests)

1. Node ids are unique, and edge ids are unique.
2. Every node id starts with `<type>:`.
3. Every edge's `from` and `to` reference an existing node.
4. Only the node types, edge types, and families listed above are used, unless a new family is
   explicitly proposed (§2).
5. When supplied, `period.start` is an integer ≥ **-3000** and < 2100.
   Negative years are BCE. `period.end`, when set, is an integer ≥ `start`.
   Use `null` or omit `end` for "still active".
6. **Every genre** has a `family`. **Every artist** has either an explicit
   `family` or a `key_artist_of` relationship to a genre with a family.
   Preserve explicit artist families when replacing or enriching existing nodes.
7. **Every genre** has **at least 3** `key_artist_of` edges pointing to it, and
   **each of those edges has `sources`**.
8. **Every artist** node has at least one `sources` URL.
9. Every `key_artist_of` edge and every artist ↔ artist edge (`influences`,
   `member_of`, `collaborated_with`) has `sources`.
10. **Every source URL must be a valid HTTPS URL.** Prefer authoritative, relevant
    sources; source credibility and relevance are editorial requirements, not
    something the automated tests can determine.
11. Every node has at least one edge, except the explicitly documented sourced
    standalone events and unresolved tracks in the
    [connectivity register](./evidence/disconnected-entries.md). Tests enforce
    that exact exception set; never invent relationships to eliminate orphans.
12. Preserve supported lineage relationships and these ancestor chains:
    romantic → medieval, grunge → blues, deep-house → jazz, synth-pop → rock.
    Keep genuinely independent traditions as roots instead of inventing an ancestry link
    just to connect them.
13. Do not remove these v1 entities: Detroit techno, Chicago house, Kraftwerk, Juan
    Atkins, Derrick May, Kevin Saunderson, Cybotron, Metroplex, and Detroit.
14. Classical, jazz, and rock genres listed in §2 must keep their family and sources.
15. **Every instrument** has an instrument family, a `description`,
    `sources`, and at least one `featured_in` edge to a genre. Each instrument
    family has at least 3 instruments.
16. `featured_in` always goes instrument → genre, and `plays` always goes artist →
    instrument. Instruments connect to other instruments only through
    `influences` or `derived_from`. Every edge touching an instrument has `sources`.
    Event edges (`shaped`, `involved`) may also point to instruments.
17. **Every event** has a `category` from the Events table, a
    `description`, and `sources`; add relevant sourced event edges where documented. `category` and
    `significance` appear only on events. Events have no `family` or `phases`.
18. `shaped`, `context_for`, `recognized`, `involved`, and `occurred_in` always
    start from an event and point to the node types in §3. Events connect only
    through these edge types, and every edge touching an event has `sources`.

## 5. Prominence phases (optional, genres, artists & instruments)

`phases` describes editorial prominence over time. It does not measure sales or streams.
When available, phase-level confidence and notes appear in visible timeline-bar
tooltips and the detail panel; phase-level sources are linked in the detail panel.

```ts
interface ProminencePhase {
  start: number            // Integer year
  prominence: 'emerging' | 'golden-age' | 'established' | 'niche'
  confidence?: 'low' | 'medium' | 'high' // Evidence strength for this phase interpretation
  note?: string            // Why this phase begins or what distinguishes it
  sources?: string[]       // Sources supporting this phase-specific note or boundary
  intensity?: number       // 0–1. It overrides the default shade
}
```

Rules:

- Nonempty phases require a period; the first phase's `start` **must equal** `period.start`.
- Phases are strictly ascending by `start`; each lasts until the next starts.
- If `period.end` is set, every phase `start` must be `< period.end`.
- `niche` hides the bar. If `intensity` is given with `niche`, it **must be 0**.
- `confidence` is optional and uses the graph-wide `low` / `medium` / `high`
  vocabulary. It describes evidence for phase boundaries and prominence
  interpretation, not the precision of `period`, a measured popularity value,
  or confidence that the genre or instrument exists. Use `high` only when strong,
  independent sources directly support the transition; `medium` when the broad
  transition is supported but boundaries remain approximate; and `low` for a
  provisional editorial estimate or thin evidence. Keep `phaseNote` to explain
  the basis.
- Default intensities: emerging 0.35, golden-age 1, established 0.45, niche 0.
- Revivals: return from `niche` to `emerging`/`established` later.
- `phaseNote` is **required** when `phases` is nonempty. It gives the node-level summary of
  the full sequence and states that the shading is editorial, not a measured ranking.
- Omit `phases` or use an empty array when no defensible prominence history exists;
  dated nodes render as neutral bars and do not require a `phaseNote`. A
  `phaseNote`, when provided, remains visible in the detail panel and can
  describe supported milestones without implying a continuous curve.
- A phase-level `note` is optional. Use it only when a phase has its own useful rationale
  or a specific transition to explain; keep it concise and do not repeat the node-level
  `phaseNote`. When a note makes a specific historical claim, add phase-level `sources`
  that support that claim or boundary. If present, `sources` must contain at least one
  valid HTTPS URL and follow the same rules as node sources. Do not copy all node
  sources into every phase. An absent note or source does not imply that a phase boundary
  has been independently verified.
- For artists, phases describe the **active career** (labels: Emerging / Peak
  years / Continuing / Low profile or hiatus), anchored to documented milestones
  (key albums, breakups, reunions). Do not include posthumous popularity.
- For instruments, phases describe **usage in recorded and performed music**
  (labels: Emerging / Peak use / Continuing / Rare / eclipsed). They are anchored
  to documented shifts, for example the harpsichord eclipsed by the piano and
  revived in the 20th century, or the TB-303 flopping commercially before
  acid house made it central from 1987.
- Leave `phases` out when there is no reasonable basis. Neutral bars are preferred
  over invented histories.

Example:

```json
{
  "id": "genre:soul", "type": "genre", "name": "Soul", "family": "blues-soul",
  "period": { "start": 1955 },
  "phases": [
    { "start": 1955, "prominence": "emerging", "intensity": 0.3, "confidence": "medium" },
    { "start": 1960, "prominence": "established", "confidence": "medium",
      "note": "Soul became prominent in the 1960s; this is an approximate period, not a measured score.",
      "sources": ["https://timeline.carnegiehall.org/genres/soul"] },
    { "start": 1965, "prominence": "golden-age", "intensity": 1, "confidence": "medium" },
    { "start": 1978, "prominence": "established", "intensity": 0.55 },
    { "start": 1996, "prominence": "established", "intensity": 0.6 }
  ],
  "phaseNote": "Illustrative editorial shading: classic soul peaks in the mid-1960s, with a lift during the late-1990s neo-soul wave. Not a measured popularity ranking."
}
```

---

## 6. Editorial guidelines

- **Accuracy first.** Prefer well-documented facts. Use `confidence: "medium"`
  or `"low"` and a `note` for contested origins or influences.
- **Cite serious, relevant sources.** Sources may include academic books and
  journals, established music reference works, museums and archives, libraries,
  reputable broadcasters and journalism, official artist/label/venue archives,
  and well-maintained music databases where appropriate to the claim. Use the
  source best suited to each claim (for example, an archive or discography for
  release details, and scholarship or a specialist reference work for historical
  context). Wikipedia is allowed as a starting point or supplementary reference,
  but is not required and should not be the sole support when stronger sources
  are available. Avoid unsourced blogs, forums, fan wikis, social posts, and
  search-result URLs.
- **Citations must support the specific claim.** Prefer direct article, book,
  archive, or record pages over homepages. Add more than one independent source
  for disputed or consequential claims. Do not invent URLs or imply that a
  source verifies something it does not.
- **Dates are approximate.** Use `precision: "circa"` or `"decade"` for fuzzy origins.
  For eras such as Baroque, `end` marks the end of the stylistic era, not the
  disappearance of the music.
- **Artist periods** are active creative years, not birth and death dates. Groups
  with breaks can span the full envelope, and the description should mention the break.
- **Descriptions**: 1–3 sentences, concrete and vivid (key city, record,
  innovation, social context). Avoid empty superlatives. Write them in your own words and
  do not copy Wikipedia text.
- **Key artists**: 3–6 representative, influential artists per genre, not a
  popularity list. One artist can be key to several genres.
- **Sharing a genre is not influence.** Add artist → artist `influences` only when
  it is documented.
- **Global coverage.** The dataset is currently Western- and
  electronic-heavy. Additions from Africa, Latin America, the Caribbean, Asia,
  and the Middle East are welcome.
- Prefer linking new genres to **existing** nodes so the lineage tree stays one
  connected graph.

### Evidence files and review status

Every node and edge has an evidence note in `src/data/evidence/`
(`nodes/<type>/<slug>.md`, `edges/<id with ":" replaced by "__">.md`) recording
the sources checked and the assessment. A note marked `Pending source review`
has not been re-checked yet. Each live entry's reviewed note must include a
``Graph ID `<id>` `` header and a `**Reviewed** · YYYY-MM-DD` stamp (dates in
`**Review status**` lines are also recognized). Keep removal notes as historical
evidence; the review-status generator excludes IDs no longer in the graph and
explicitly removed dispositions, and counts duplicate reviewed notes only once.
The [edge coverage tracker](./evidence/audits/graph-edge-coverage.csv) must contain
exactly one row per live edge, with its current type and confidence and a link
to the reviewed note, not a pending placeholder. After editing evidence notes, run
`npm run review-status` to refresh `src/data/review-status.json`, which powers
the **Source review** tab of the dataset statistics. A test fails if the file
is out of date or the tracker and live-edge evidence disagree.

### Suggested expansion areas

The current graph has broad coverage, but these are high-value candidates for
future research. Treat named traditions as distinct where their histories differ;
do not force them into a single Western-style lineage.

- **Pop, soul & vocal**: Gospel; Motown sound (as a genre/style), with Motown
  Records represented separately as a label
- **Caribbean**: mento, soca
- **Latin**: mambo, bolero, tropicália, vallenato
- **African**: mbira traditions, Moroccan chaâbi, Kabyle song, and additional
  regional and diasporic styles
- **Hip-hop**: Memphis rap, UK drill, regional scenes not yet represented
- **Rock & metal**: noise pop, psychobilly, post-metal
- **Electronic**: UK funky, progressive house, additional techno sub-styles
- **Asia & South Asia**: bhangra, ghazal, Indian film music, Chinese regional styles
- **More labels**: Motown, Blue Note, Warp, Def Jam; **places**: Kingston, Lagos,
  Rio; **scenes**: Studio 54, CBGB; and representative **tracks** (anthems)

### Chronology coverage gaps (current priority)

The dataset is strongest from 1960 to 1999. It now includes early notation,
print, opera, several Asian and Bengali traditions, and additional North, West,
Central, and East African styles, but the pre-1600 record and the post-2010 era
remain thin. Persian, Ottoman, West African griot, Chinese regional, Japanese,
and Indian court traditions still need their own documented lineages.
Dated nodes by `period.start`:

| Era          | Genres | Artists | Tracks | Scenes | Instruments | Events |
|--------------|-------:|--------:|-------:|-------:|------------:|-------:|
| 500–1599     | 6      | 6       | 0      | 1      | 18          | 12     |
| 1600–1899    | 17     | 14      | 8      | 5      | 24          | 15     |
| 1900–1949    | 25     | 58      | 20     | 9      | 12          | 20     |
| 1950–1999    | 114    | 377     | 161    | 39     | 10          | 20     |
| 2000–present | 15     | 67      | 22     | 2      | 0           | 14     |

Priorities, in order:

1. **Improve event evidence and connections.** All 82 events have a
   `significance` value and more than one cited source. There are 18 `shaped`,
   51 `context_for`, 5 `recognized`, 19 `involved`, and 25 `occurred_in` edges.
   Seven events remain standalone rather than asserting unsupported relationships.
   Add participants, recordings, venues, and locations only when a source supports
   the connection; multiple citations alone do not establish source quality.
2. **Add pre-1600 depth.** Add representative compositions as `track` nodes
   using premiere or publication years; expand medieval and Renaissance
   composers, notation, and institutions. Continue documenting Arab, Persian,
   Ottoman, West African griot, Chinese, Japanese, and Indian court traditions
   without treating them as one origin or lineage.
3. **Add post-2010 depth.** Expand the streaming-era chronology and add
   representative genres, artists, and tracks from the 2010s and 2020s (for
   example hyperpop, afro-house, phonk, Latin trap, Brazilian funk, bedroom
   pop, and UK drill), with sources and regional context.
**Candidate events** to research. These are starting points: verify each date
and claim against sources, correct anything wrong, skip anything you cannot
source, and add important events that are missing.

- **500–1599**: Guido of Arezzo's staff notation and solmization (c. 1025);
  the *Ars nova* treatise (c. 1322); Petrucci's *Harmonice Musices
  Odhecaton*, the first polyphonic music printed with movable type (1501);
  the Council of Trent's reforms of church music (1545–1563)
- **1600–1899**: Peri's *Euridice*, the earliest surviving opera (1600);
  the first public opera house, Teatro San Cassiano in Venice (1637); the
  premiere of Beethoven's Ninth Symphony (1824); Edison's phonograph (1877);
  Berliner's gramophone disc (1887)
- **1900–1949**: the premiere of *The Rite of Spring* (1913); the first jazz
  record, by the Original Dixieland Jass Band (1917); Mamie Smith's "Crazy
  Blues" and the race-records market (1920); the start of commercial radio
  broadcasting (1920); electrical recording (1925); the Bristol Sessions
  (1927); *Alam Ara* and the rise of Indian film song (1931); Benny Goodman at Carnegie Hall (1938); the AFM recording
  ban (1942–1944); the 33⅓ rpm LP (1948) and the 45 rpm single (1949); the Great
  Migration (c. 1910–1970)
- **1950–1999**: Elvis Presley's first Sun session (1954); the Billboard Hot 100
  (1958); the compact cassette (1963); the Beatles on *The Ed Sullivan Show*
  (1964); the Monterey Pop Festival (1967); Woodstock (1969); DJ Kool Herc's
  Bronx back-to-school party (1973); Festac '77 in Lagos (1977); the Sony
  Walkman and Disco Demolition Night (1979); MTV (1981); the compact disc
  (1982); MIDI (1983); Live Aid (1985); the Second Summer of Love (1988);
  *Grand Upright v. Warner* and sample clearance (1991); the UK Criminal Justice
  and Public Order Act and raves (1994); Napster (1999)
- **2000–present**: Napster shutdown (2001); the iPod (2001) and the iTunes
  Store (2003); YouTube (2005); SoundCloud (2007); Spotify (2008); TikTok and
  short-form virality (2016–2018); the COVID-19 live-music shutdown and
  livestream concerts (2020)

For each event, add a sourced `shaped` edge to the genres, instruments, labels,
or scenes it changed (for example the LP → `genre:cool-jazz`, `genre:progressive-rock`;
Disco Demolition → `genre:disco`), `involved` edges to key artists or tracks
already in the graph, and an `occurred_in` edge to the place where relevant.

---

## 7. How to return changes

The dataset is large. Unless you are asked for the whole file, return a **merge
patch** in this exact shape:

```json
{
  "newFamilies": [
    { "id": "gospel", "label": "Gospel", "insertAfter": "blues-soul" }
  ],
  "addNodes": [ /* full GraphNode objects */ ],
  "addEdges": [ /* full GraphEdge objects */ ],
  "updateNodes": [ { "id": "genre:soul", "set": { "description": "..." } } ],
  "updateEdges": [ { "id": "lineage:chicago-house-detroit-techno", "set": { "sources": ["https://www.example.org/relevant-source"] } } ]
}
```

- `set` replaces only the listed fields. Do not include unchanged fields.
- Never delete nodes or edges. Flag suspected errors in `updateNodes`/`updateEdges`
  or in a separate plain-text list.

### Self-check before answering

- [ ] Every new id is unique, prefixed correctly, and kebab-case
- [ ] Every edge endpoint exists in `graph.json` or in `addNodes`
- [ ] Every new genre has `family`, a `description`, `sources`, and ≥ 3 sourced
      `key_artist_of` edges
- [ ] Every new genre with a well-supported parent or influence connects by lineage;
      preserve independent traditions as roots rather than inventing ancestry
- [ ] Every new artist has `sources`, `kind`, and at least one edge
- [ ] Supply a supported `period`; flag inferred placements with `estimated: true` and an evidence-based `estimateNote`. Leave undated only when no defensible estimate is possible.
- [ ] Every artist has an explicit `family` or a `key_artist_of` relationship
      to a genre with a family
- [ ] Every source is a valid HTTPS URL to a relevant, credible source, and the
      source supports the specific claim it is attached to
- [ ] Lineage directions follow the table in §3
- [ ] `phases` (if any) start at `period.start`, ascend, have a `phaseNote`, and
      `niche` intensity is 0
- [ ] Phase `confidence` values (if present) use `low`, `medium`, or `high` and are
      explained in `phaseNote`
- [ ] Phase `note` values (if present) add a specific rationale; claim-level
      `sources` support factual dates or transitions
- [ ] New families are listed in `newFamilies`
- [ ] Every new event has `category`, `description`, `sources`, and a
      timeline-caption `name`; add relevant, sourced event edges where documented. It duplicates no
      existing instrument, label, scene, or track
- [ ] Every edge touching an event is `shaped`, `context_for`, `recognized`, `involved`, or `occurred_in`, starts
      from the event, and has `sources`
