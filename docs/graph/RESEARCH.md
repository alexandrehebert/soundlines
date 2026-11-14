# Graph research backlog

Use the [graph lookup tool](../../.github/skills/graph-edit/scripts/lookup.mjs) to check existing entries before proposing additions. Follow the [editorial guidelines](../GRAPH.md#6-editorial-guidelines) when evaluating sources and relationships.

## Suggested expansion areas

The current graph has broad coverage, but these are high-value candidates for
future research. Treat named traditions as distinct where their histories differ;
do not force them into a single Western-style lineage.

- **Pop, soul & vocal**: Gospel; Motown sound (as a genre/style), with Motown
  Records represented separately as a label
- **Caribbean**: mento
- **Latin**: bolero and tropicália
- **African**: mbira traditions, Moroccan chaâbi, Kabyle song, and additional
  regional and diasporic styles
- **Hip-hop**: Memphis rap, UK drill, regional scenes not yet represented
- **Rock & metal**: noise pop, psychobilly, post-metal
- **Electronic**: additional techno sub-styles
- **Asia & South Asia**: ghazal, Indian film music, Chinese regional styles
- **Tracks**: representative anthems

## Chronology coverage gaps

The dataset is strongest from 1960 to 1999. It now includes early notation,
print, opera, several Asian and Bengali traditions, and additional North, West,
Central, and East African styles, but the pre-1600 record and the post-2010 era
remain thin. Persian, Ottoman, West African griot, Chinese regional, Japanese,
and Indian court traditions still need their own documented lineages.
Coverage snapshot from November 13, 2026, grouped by `period.start`. Check the live graph before using these figures to plan new work.

| Era          | Genres | Artists | Tracks | Scenes | Instruments | Events |
|--------------|-------:|--------:|-------:|-------:|------------:|-------:|
| 500–1599     | 9      | 6       | 0      | 1      | 20          | 12     |
| 1600–1899    | 26     | 16      | 8      | 5      | 33          | 17     |
| 1900–1949    | 35     | 91      | 20     | 10     | 13          | 21     |
| 1950–1999    | 149    | 502     | 153    | 38     | 10          | 43     |
| 2000–present | 20     | 90      | 21     | 2      | 0           | 29     |

Priorities, in order:

1. **Improve event evidence and connections.** All 123 events have a
   `significance` value and at least one cited source. There are 18 `shaped`,
   78 `context_for`, 11 `recognized`, 29 `involved`, and 44 `occurred_in` edges.
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
   example phonk, bedroom
   pop, and UK drill), with sources and regional context.
## Candidate events

Check each candidate against the live graph and verify its date and claims against sources.

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

When a source documents direct influence, add a `shaped` edge to the genres, instruments, labels,
or scenes the event changed (for example the LP → `genre:cool-jazz`, `genre:progressive-rock`;
Disco Demolition → `genre:disco`), `involved` edges to key artists or tracks
already in the graph, and an `occurred_in` edge to the place where relevant. See [event rules](../GRAPH.md#events-chronology).
