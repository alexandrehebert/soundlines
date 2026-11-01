# graph.json — data guide for editors and LLMs

This document describes [graph.json](./graph.json), the single dataset behind
**Soundlines**, a chronological, interactive map of music genres, artists, labels,
places, scenes, and tracks. Give it to an editor or to a language model (for
example ChatGPT) along with `graph.json` when asking for the dataset to be
**enriched, corrected, or expanded** (new genres, artists, lineage links, phases,
and so on).

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

Current size: 582 nodes (146 genres, 405 artists, 7 labels, 6 places,
14 tracks, 4 scenes) and 773 edges.

---

## 2. Nodes

```ts
interface GraphNode {
  id: string            // "<type>:<slug>", e.g. "genre:deep-house", "artist:kraftwerk"
  type: 'genre' | 'artist' | 'label' | 'place' | 'track' | 'scene'
  name: string          // Display name, e.g. "Deep house"
  period?: { start: number; end?: number | null; precision?: 'year' | 'decade' | 'circa' }
  description?: string  // 1–3 sentences, editorial and evocative but factual
  family?: GenreFamily  // Timeline lane (required for genres)
  kind?: 'person' | 'group' | 'collective'   // Artists only
  sources?: string[]    // HTTPS URLs to relevant, credible sources
  phases?: ProminencePhase[]  // Genres and artists only. See §5
  phaseNote?: string    // Required whenever `phases` is present
}
```

### Node types

| type     | Meaning                                       | `period` means                         |
|----------|-----------------------------------------------|----------------------------------------|
| `genre`  | A genre, style, or historical era             | Emergence → end (absent `end` = still alive) |
| `artist` | A person, group, or collective                | **Active creative career**, not birth/death |
| `label`  | Record label                                  | Founding → closure                     |
| `place`  | City or region                                | Usually omitted                        |
| `track`  | A specific recording                          | Release year (`start` = `end`)         |
| `scene`  | Club, venue, party, radio show, or movement   | Active years                           |

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
| `classical`         | Classical              | 14     | Western eras, Hindustani and Carnatic traditions, gagaku, pansori |
| `blues-soul`        | Blues, R&B & Soul       | 6      | blues, rhythm and blues, doo-wop, soul, funk, neo-soul |
| `jazz`              | Jazz                   | 8      | jazz, swing, bebop, cool/hard bop, modal, free, fusion |
| `country-folk`      | Country & Folk         | 6      | country, folk revival, bluegrass, Baul songs, khoomei |
| `rock`              | Rock                   | 11     | rock and roll, blues-rock, hard-rock, krautrock, surf-rock |
| `alternative-punk`  | Alternative & Punk     | 16     | punk, post-punk, indie-rock, grunge, shoegaze, new-wave |
| `metal`             | Metal                  | 5      | heavy, thrash, death, black, and doom metal |
| `pop`               | Pop                    | 4      | pop, synth-pop, K-pop, J-pop |
| `hip-hop`           | Hip-hop                | 18     | regional rap, boom bap, jazz rap, crunk, G-funk, hyphy, horrorcore |
| `reggae`            | Reggae & Ska           | 5      | ska, rocksteady, reggae, dub, dancehall |
| `latin`             | Latin                  | 10     | son cubano, salsa, bossa nova, cumbia, samba, tango, bachata |
| `african`           | African                | 5      | highlife, Afrobeat, Afrobeats, jùjú, soukous |
| `electronica`       | Electronica & Ambient  | 10     | electro, trip-hop, ambient, IDM, synthwave, downtempo |
| `house`             | Disco & House          | 12     | disco, Italo disco, hi-NRG, house styles, French Touch |
| `techno`            | Techno & Trance        | 9      | techno styles, trance, psytrance, gabber, hardstyle |
| `breakbeat-bass`    | Breakbeat & Bass       | 7      | breakbeat hardcore, jungle, drum and bass, garage, dubstep |

These are navigational families, not strict genre ancestry. The 146 genres
currently have 4–18 members per family. The expanded Hip-hop lane includes
regional rap scenes and production- and subject-based branches. Keep related
styles together, and revisit the grouping if a lane becomes unbalanced rather
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
`key_artist_of` relationship provides a family. Every artist needs a `period`
and a resolvable family to render; a missing value prevents the entire artist
timeline from loading. For example, `artist:women-on-wax` explicitly uses `techno`
without claiming a key-artist relationship.

### Existing genre ids (do not duplicate)

```
genre:medieval genre:renaissance genre:baroque genre:classical-period genre:romantic
genre:modern-classical genre:minimalism genre:hindustani-classical genre:carnatic
genre:qawwali genre:gamelan genre:gagaku genre:peking-opera genre:pansori
genre:blues genre:jazz genre:swing genre:bebop
genre:cool-jazz genre:hard-bop genre:modal-jazz genre:free-jazz genre:jazz-fusion
genre:rock-and-roll genre:rock genre:blues-rock genre:psychedelic-rock
genre:progressive-rock genre:hard-rock genre:heavy-metal genre:punk-rock genre:post-punk
genre:alternative-rock genre:grunge genre:soul genre:funk genre:disco genre:hip-hop
genre:krautrock genre:synth-pop genre:italo-disco genre:hi-nrg genre:electro
genre:chicago-house genre:garage-house genre:deep-house genre:acid-house
genre:detroit-techno genre:minimal-techno genre:dub-techno genre:trance genre:gabber
genre:breakbeat-hardcore genre:jungle genre:drum-and-bass genre:uk-garage genre:dubstep
genre:techno genre:french-touch genre:french-house genre:trip-hop genre:big-beat genre:ambient
genre:ambient-techno genre:idm genre:synthwave genre:darksynth genre:vaporwave genre:chillwave
genre:downtempo genre:electroclash genre:breakbeat genre:tech-house genre:indie-rock
genre:garage-rock genre:glam-rock genre:shoegaze genre:dream-pop genre:britpop genre:emo
genre:post-hardcore genre:post-rock genre:math-rock genre:noise-rock genre:gothic-rock
genre:pop-punk genre:stoner-rock genre:house genre:pop genre:country genre:folk genre:bluegrass
genre:r-and-b genre:doo-wop genre:neo-soul genre:ska genre:rocksteady genre:reggae genre:dub
genre:dancehall genre:latin genre:son-cubano genre:salsa genre:bossa-nova genre:cumbia
genre:highlife genre:afrobeat genre:afrobeats genre:juju genre:soukous
genre:k-pop genre:j-pop genre:surf-rock genre:new-wave
genre:thrash-metal genre:death-metal genre:black-metal genre:doom-metal genre:grime genre:trap-rap
genre:drill genre:old-school-rap genre:east-coast-rap genre:west-coast-rap genre:gangsta-rap
genre:boom-bap genre:jazz-rap genre:alternative-rap genre:conscious-hip-hop genre:southern-rap
genre:crunk genre:g-funk genre:hyphy genre:chopped-and-screwed genre:horrorcore
genre:russian-folk genre:baul-songs genre:khoomei genre:samba genre:tango genre:andean-folk
genre:bachata genre:merengue genre:electro-house genre:hardstyle genre:psytrance
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
| `influences`        | genre → genre, artist → artist | A influences B | `from` is the ancestor |
| `cross_pollination` | genre ↔ genre           | A cross-pollinates with B (contemporaries) | `from` is the ancestor |
| `derived_from`      | genre → genre           | A is derived from B | `to` is the ancestor |
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

Existing ids include legacy `e001`–`e2xx`. For **new** edges, use descriptive
prefixes:

- `lineage:<child>-<parent>` for genre lineage edges
- `key:<artist-slug>-<genre-slug>` for `key_artist_of`
- `member:<person>-<group>`, `collab:<a>-<b>`, `origin:<node>-<place>`,
  `signed:<artist>-<label>`, `founded:<artist>-<label>`,
  `anthem:<track>-<genre>`, `recorded:<track>-<artist>`

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
5. `period.start` is an integer ≥ **500** and < 2100. `period.end`, when set, is an
   integer ≥ `start`. Use `null` or omit `end` for "still active".
6. **Every genre** has a `family` **and** a `period`. **Every artist** has a
   `period` and either an explicit `family` or a `key_artist_of` relationship
   to a genre with a family. Preserve explicit artist families when replacing
   or enriching existing nodes.
7. **Every genre** has **at least 3** `key_artist_of` edges pointing to it, and
   **each of those edges has `sources`**.
8. **Every artist** node has at least one `sources` URL.
9. Every `key_artist_of` edge and every artist ↔ artist edge (`influences`,
   `member_of`, `collaborated_with`) has `sources`.
10. **Every source URL must be a valid HTTPS URL.** Prefer authoritative, relevant
    sources; source credibility and relevance are editorial requirements, not
    something the automated tests can determine.
11. No orphan nodes. Every node has at least one edge.
12. Preserve supported lineage relationships and these ancestor chains:
    romantic → medieval, grunge → blues, deep-house → jazz, synth-pop → rock.
    Keep genuinely independent traditions as roots instead of inventing an ancestry link
    just to connect them.
13. Do not remove these v1 entities: Detroit techno, Chicago house, Kraftwerk, Juan
    Atkins, Derrick May, Kevin Saunderson, Cybotron, Metroplex, and Detroit.
14. Classical, jazz, and rock genres listed in §2 must keep their family and sources.

## 5. Prominence phases (optional, genres & artists only)

`phases` describes editorial prominence over time. It does not measure sales or streams.

```ts
interface ProminencePhase {
  start: number            // Integer year
  prominence: 'emerging' | 'golden-age' | 'established' | 'niche'
  intensity?: number       // 0–1. It overrides the default shade
}
```

Rules:

- The first phase's `start` **must equal** `period.start`.
- Phases are strictly ascending by `start`; each lasts until the next starts.
- If `period.end` is set, every phase `start` must be `< period.end`.
- `niche` hides the bar. If `intensity` is given with `niche`, it **must be 0**.
- Default intensities: emerging 0.35, golden-age 1, established 0.45, niche 0.
- Revivals: return from `niche` to `emerging`/`established` later.
- `phaseNote` is **required** when `phases` exists. It explains what the shading is based
  on and states that it is editorial, not a measured ranking.
- For artists, phases describe the **active career** (labels: Emerging / Peak
  years / Continuing / Low profile or hiatus), anchored to documented milestones
  (key albums, breakups, reunions). Do not include posthumous popularity.
- Leave `phases` out when there is no reasonable basis. Neutral bars are preferred
  over invented histories.

Example:

```json
{
  "id": "genre:soul", "type": "genre", "name": "Soul", "family": "blues-soul",
  "period": { "start": 1955 },
  "phases": [
    { "start": 1955, "prominence": "emerging", "intensity": 0.3 },
    { "start": 1965, "prominence": "golden-age", "intensity": 1 },
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

### Suggested expansion areas

- **Pop & vocal**: Motown, girl groups, vocal jazz
- **Country & folk**: Americana, alternative country, honky-tonk
- **Caribbean**: calypso, mento, reggaeton
- **Latin**: mambo, tropicália, merengue, tango
- **African**: amapiano, gqom, kwaito, soukous
- **Hip-hop branches**: Memphis rap, Miami bass, cloud rap, emo rap, Latin trap
- **R&B**: new jack swing, contemporary R&B
- **Metal branches**: nu metal, metalcore, industrial metal
- **Rock gaps**: noise pop, psychobilly, post-metal
- **Electronic gaps**: EDM, footwork, breakcore, UK funky, techno sub-styles
- **Classical/jazz gaps**: Impressionism, serialism, Latin jazz, acid jazz, spiritual jazz
- More **labels** (Motown, Blue Note, Warp, Def Jam), **places** (Kingston,
  Lagos, Rio), **scenes** (Paradise Garage, Studio 54, CBGB), and **tracks** (anthems)

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
  "updateEdges": [ { "id": "e022", "set": { "sources": ["https://www.example.org/relevant-source"] } } ]
}
```

- `set` replaces only the listed fields. Do not include unchanged fields.
- Never delete nodes or edges. Flag suspected errors in `updateNodes`/`updateEdges`
  or in a separate plain-text list.

### Self-check before answering

- [ ] Every new id is unique, prefixed correctly, and kebab-case
- [ ] Every edge endpoint exists in `graph.json` or in `addNodes`
- [ ] Every new genre has `family`, `period`, a `description`, `sources`, and ≥ 3 sourced
      `key_artist_of` edges
- [ ] Every new genre with a well-supported parent or influence connects by lineage;
      preserve independent traditions as roots rather than inventing ancestry
- [ ] Every new artist has `sources`, `kind`, `period`, and at least one edge
- [ ] Every artist has an explicit `family` or a `key_artist_of` relationship
      to a genre with a family
- [ ] Every source is a valid HTTPS URL to a relevant, credible source, and the
      source supports the specific claim it is attached to
- [ ] Lineage directions follow the table in §3
- [ ] `phases` (if any) start at `period.start`, ascend, have a `phaseNote`, and
      `niche` intensity is 0
- [ ] New families are listed in `newFamilies`
