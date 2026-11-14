# Instrument lineage audit

**Reviewed** · 2026-11-13

Scope: all eight direct instrument relationships in the starting graph, plus targeted candidate research across strings, winds, brass, keyboards, percussion and electronic instruments. The catalog had 127 instruments at the start and still has 127. This audit tests specific historical claims; it does not infer links for the remaining unconnected instruments or propose a target density.

For `derived_from`, store the descendant first. For `influences`, store the ancestor first. A documented design input can support influence even when the two instruments have different sound mechanisms. Similarity, family membership, a common ancestor and successive dates do not establish either relation. Timeline start dates can mark surviving evidence or a particular form, rather than an invention date.

## Eight baseline edges

| Baseline relationship (historical direction) | Verdict and change | Evidence |
| --- | --- | --- |
| Double bass → electric bass | Supported with narrower scope; retyped as influence, medium. | [Fender’s history](https://www.fender.com/articles/behind-the-scenes/legendary-lows-the-precision-bass-story) establishes the Precision’s role as an amplified, portable alternative with the upright’s tuning. Its fretted guitar construction is a different matter. The [Wright book landing page](https://press.umich.edu/Books/T/The-Bastard-Instrument) is only a contextual summary. |
| Guitar → electric guitar | Supported; retained derivation, medium. | [Musical Instrument Museum](https://mim.org/guitars-that-changed-music-history/) traces guitar forms through electrification. [New Worlds of Sound](https://publications.gc.ca/collections/collection_2018/mstc-cstm/NM33-1-19-eng.pdf), pp. 54–57, documents both acoustic-bodied experiments and designs that dispensed with an acoustic resonator. |
| Piano → electric piano | Partially supported as derivation; retyped as influence, medium. | [New Worlds of Sound](https://publications.gc.ca/collections/collection_2018/mstc-cstm/NM33-1-19-eng.pdf), pp. 41–42, documents the string-based Neo-Bechstein, Miessner’s reed design that led to the Wurlitzer, and Rhodes’s piano teaching instruments. [Powerhouse](https://collection.powerhouse.com.au/object/611665) documents the Wurlitzer’s mechanism. [MIM’s piano history](https://mim.org/news/exploring-the-history-of-the-piano/) is general background. |
| Modular synthesizer → Minimoog | Supported; retained derivation, high, explicitly scoped to Moog’s modular system. | [Surviving prototypes](https://artsandculture.google.com/story/minimoog-prototypes-emeapp/TgWhRtaYLMR3Zg?hl=en) document modular circuit boards in Model B. The [Bob Moog Foundation](https://moogfoundation.org/timeline/) distinguishes the patchable and compact instruments. |
| Theremin → modular synthesizer | Unsupported at the catalog’s scope; removed. | The [Met’s theremin](https://www.metmuseum.org/art/collection/search/739621) establishes its historical influence on electronic music generally. The [Foundation’s Moog chronology](https://moogfoundation.org/bob-moog-timeline/) documents his transistor experience and meeting Deutsch at a theremin demonstration. These are links in Moog’s career; neither source establishes that a theremin design shaped the generic modular synthesizer entry, which includes Buchla. |
| Harpsichord → piano | Supported with scope care; retained derivation, medium. | The [surviving Cristofori piano](https://www.metmuseum.org/art/collection/search/501788) and [Met essay](https://www.metmuseum.org/es/essays/the-piano-the-pianofortes-of-bartolomeo-cristofori-1655-1731) document adaptation of the harpsichord form with a newly invented action. |
| Clarinet → saxophone | Partially supported; replaced with bass clarinet → saxophone, influence, medium. | The [Met’s Sax record](https://www.metmuseum.org/art/collection/search/504684) and [Stewart Carter’s reading of 1842 testimony](https://historicbrass.org/images/hbj/hbj-2018/HBSJ_2018_JL01_004_Carter.pdf) support a bass clarinet mouthpiece link. Berlioz’s shorthand and Kastner’s account differ about the relationship of the body to the ophicleide. |
| TR-808 → TR-909 | Supported; retained derivation, high. | [Roland’s development account](https://www.roland.com/uk/promos/roland_tr-909/?lang=en-GB) describes work on an explicit successor, including sampled hi-hats and cymbals, and MIDI. Wikipedia is unnecessary as a live citation. |

## Confirmed omissions between cataloged instruments

| Historical direction | Added relationship | Basis |
| --- | --- | --- |
| Pipa → biwa | [Derivation](../edges/lineage__biwa-pipa.md) | The Met identifies an early Chinese pipa as the ancestor of the Japanese biwa. |
| Sheng → shō | [Derivation](../edges/lineage__sho-sheng.md) | The Met’s shō record states the descent directly. |
| Oud → European lute | [Derivation](../edges/lineage__lute-oud.md) | The Met documents the medieval transmission; Cleveland identifies the European lute as a descendant. |
| Spanish guitar → charango | [Influence](../edges/lineage__charango-guitar.md) | The Met curator describes Spanish guitar features alongside Indigenous adaptations. The exact prototype is unresolved. |
| Natural trumpet → valved trumpet | [Derivation](../edges/lineage__trumpet-natural-trumpet.md) | The Met documents a surviving natural trumpet design fitted with early valves; the edge refers to the valved form used for the trumpet timeline anchor. |
| Bass drum → drum kit | [Influence](../edges/lineage__drum-kit-bass-drum.md) | Smithsonian Folkways traces how the foot-operated bass drum enabled one player to take on multiple percussion parts. |

These are six additions plus the bass clarinet replacement, for 13 direct edges after the audit. The two retypes retain their stable IDs.

## Deferred candidates

| Candidate | Why it remains unlinked |
| --- | --- |
| Ukulele ↔ guitar or Portuguese guitar | **Catalog gap.** The [Brussels Musical Instruments Museum](https://www.mim.be/en/collection-piece/braguinha) and [Met](https://www.metmuseum.org/art/collection/search/501343) identify the Madeiran machete or braguinha. It is absent and distinct from the fado instrument cataloged as Portuguese guitar. |
| Juno-106 ↔ Jupiter-8 | **Catalog gap.** [Roland identifies the Juno-60](https://www.rolandus.com/blog/2014/02/19/roland-synth-chronicle-1973-through-2013/) as the Juno-106’s predecessor. The Juno-60 is absent; the shared maker and polyphony do not substitute for it. |
| Steelpan ↔ other cataloged hand drums | **Catalog gap.** The [National Archives of Trinidad and Tobago](https://www.natt.gov.tt/node/184) and [Musical Instruments of Trinidad & Tobago Company](https://mittcott.com/history-of-pan/) document the transition from tamboo bamboo ensembles through metal bands to steelbands. Tamboo bamboo is absent; other drums are not proxies for that tradition. |
| Sousaphone ↔ tuba | **Distinguish design goals from construction ancestry.** The [Museum of Making Music](https://museumofmakingmusic.org/momm_artifact/bb-sousaphone/) documents Sousa's request for the range of a tuba in a portable format. That establishes a range requirement; the relationship between the specific concert-tuba design and the sousaphone requires further evidence. Research the helicon as a potential missing catalog precursor. |
| Oboe ↔ cor anglais; clarinet ↔ bass clarinet | **Variant and precursor ambiguity.** The [Met’s English horn](https://www.metmuseum.org/art/collection/search/501500) documents early tenor forms, and [Vienna Symphonic Library](https://www.vsl.co.at/academy/woodwinds/english-horn) identifies the oboe da caccia as a forerunner. [Rice’s bass clarinet research](https://www.circb.info/?q=node%2F12567) documents multiple large single-reed designs. Neither family label establishes a direct arrow from the standard soprano instrument. |
| Piccolo ↔ transverse flute | **Common ancestor and endpoint mismatch.** [Yamaha](https://hub.yamaha.com/music-educators/instruments/winds-instruments/five-facts-about-the-piccolo/) describes a separate early piccolo history; [Vienna Symphonic Library](https://www.vsl.co.at/academy/woodwinds/piccolo) traces both to the earlier military transverse flute. The Soundlines flute node specifically represents the European Baroque traverso. |
| Erhu ↔ jinghu | **Shared family and repertoire.** The [Met’s erhu record](https://www.metmuseum.org/art/collection/search/500616) describes huqin kinship and octave doubling in opera. It does not assign ancestry between the two cataloged fiddles. |
| Oud ↔ pipa | **Conflicting scope.** [Cleveland](https://www.clevelandart.org/print/art/1918.350) describes descent from the oud, while the [Met’s pipa essay](https://www.metmuseum.org/es/essays/the-pipa) describes multiple West and Central Asian prototypes and treats the Arab oud as a relative. A general route of transmission cannot establish this particular edge. |
| Harmonium ↔ celesta; piano ↔ celesta | **Maker continuity and mechanism comparison.** [Schiedmayer’s history and patent excerpt](https://www.celesta-schiedmayer.de/en/celesta/all-about-the-celesta/) identify Mustel’s prior work as a harmonium maker and compare the celesta's action to the piano’s. Neither establishes that the harmonium or piano was the direct design source. |
| Cajón ↔ conga | **Shared performance context.** [Peru’s culture ministry](https://centroderecursos.cultura.pe/sites/default/files/rb/pdf/PATRIMONIO%20CULTURAL%20INMATERIAL%20AFROPERUANO%20MINCU.pdf) distinguishes the Afro-Peruvian cajón tradition and similar instruments elsewhere. A box drum in Cuban rumba is not evidence that the cataloged cajón gave rise to the conga. |

See the [fetch log](../fetch-status.jsonl) for original citations that were inaccessible during re-review. No inaccessible citation was used to establish a live relationship.

## Catalog follow-up

The four documented precursors are now cataloged, with a genre association and
a distinct illustration for each. The graph now contains 131 instruments and
17 direct instrument links.

| Historical direction | Applied relationship | Scope |
| --- | --- | --- |
| Madeiran machete → ukulele | [Derivation](../edges/lineage__ukulele-madeiran-machete.md) | Museum accounts trace transmission to Hawaiʻi and local instrument making. Madeiran traditional music has its own genre entry. |
| JUNO-60 → JUNO-106 | [Derivation](../edges/lineage__juno-106-juno-60.md) | Roland identifies the immediate predecessor. |
| Tamboo bamboo → steelpan | [Influence](../edges/lineage__steelpan-tamboo-bamboo.md) | Carnival ensembles moved through an intermediate stage of metal percussion. |
| Helicon → sousaphone | [Derivation](../edges/lineage__sousaphone-helicon.md) | Museum documentation and historical scholarship identify the helicon body that Pepper adapted. |
