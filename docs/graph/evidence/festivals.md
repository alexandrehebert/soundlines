# Worldwide music festival coverage

Initial source-check date: 2026-11-07.

| Festival ID | Country | Continent | First edition / chronology anchor |
| --- | --- | --- | --- |
| `festival:glastonbury` | United Kingdom | Europe | 1970 |
| `festival:montreux-jazz` | Switzerland | Europe | 1967 |
| `festival:newport-jazz` | United States | North America | 1954 |
| `festival:roskilde` | Denmark | Europe | 1971 |
| `festival:rock-in-rio` | Brazil (original edition) | South America | 1985 |
| `festival:womadelaide` | Australia | Oceania | 1992 |
| `festival:fuji-rock` | Japan | Asia | 1997 |
| `festival:gnaoua-world-music` | Morocco | Africa | 1998 |
| `festival:cape-town-jazz` | South Africa | Africa | 2000 |
| `festival:petronio-alvarez` | Colombia | South America | 1997 |
| `festival:woodstock` | United States | North America | 1969 |
| `festival:monterey-pop` | United States | North America | 1967 |
| `festival:newport-folk` | United States | North America | 1959 |
| `festival:bayreuth` | Germany | Europe | 1876 |
| `festival:salzburg` | Austria | Europe | 1920 |
| `festival:donaueschingen` | Germany | Europe | 1921 |
| `festival:isle-of-wight` | United Kingdom | Europe | 1968 |
| `festival:reading` | United Kingdom | Europe | 1961 |
| `festival:sonar` | Spain | Europe | 1994 |
| `festival:tomorrowland` | Belgium | Europe | 2005 |
| `festival:movement-detroit` | United States | North America | 2000 |
| `festival:womad` | United Kingdom (origin) | Europe | 1982 |
| `festival:reggae-sunsplash` | Jamaica | North America | 1978 |
| `festival:fespam` | Republic of the Congo | Africa | 1996 |
| `festival:festival-au-desert` | Mali | Africa | 2001 |
| `festival:sauti-za-busara` | Tanzania | Africa | 2004 |
| `festival:cosquin` | Argentina | South America | 1961 |
| `festival:vina-del-mar` | Chile | South America | 1960 |
| `festival:rock-al-parque` | Colombia | South America | 1995 |
| `festival:sawai-gandharva` | India | Asia | 1953 |
| `festival:java-jazz` | Indonesia | Asia | 2005 |
| `festival:coachella` | United States | North America | 1999 |
| `festival:lollapalooza` | United States (origin) | North America | 1991 |
| `festival:sanremo` | Italy | Europe | 1951 |
| `festival:new-orleans-jazz-heritage` | United States | North America | 1970 |
| `festival:wacken` | Germany | Europe | 1990 |
| `festival:baalbeck` | Lebanon | Asia | 1956 |
| `festival:pythian-games` | Greece | Europe | -582 |
| `festival:three-choirs` | United Kingdom | Europe | 1715 |

Each festival and relationship has an individual evidence file in `nodes/festival`
or `edges`, linking the checked sources. Programme entries are evidence for a
particular appearance, not uninterrupted attendance, an exclusive affiliation,
or a genre classification inferred from an artist’s presence.

The expanded collection contains **39 festivals across 25 countries and six
continents**, with **123 sourced associations**. The initial historical expansion
added 27 festivals to the first ten. The source review then added Pythian Games
and Three Choirs, four places, and five associations.
Country counts refer to origins or the historical edition represented; travelling
brands and international offshoots are not counted as extra countries.

Selection combines documented musical importance and public recognition rather
than attendance rankings. The collection covers:

- Counterculture and breakthrough performances: Monterey Pop, Woodstock,
  Newport Folk, Isle of Wight, Reading and Lollapalooza.
- Opera, contemporary composition and broadcast song culture: Bayreuth,
  Salzburg, Donaueschingen and Sanremo.
- Dance-music platforms and presentation: Movement in Detroit, Sónar,
  Tomorrowland and Coachella, alongside the original Fuji Rock collection.
- Caribbean and African circulation: Reggae Sunsplash, FESPAM,
  Festival au Désert and Sauti za Busara, alongside Gnaoua and Cape Town.
- Regional traditions and international exchange: Cosquín, Viña del Mar,
  Rock al Parque, Sawai Gandharva, Java Jazz, Baalbeck, WOMAD and WOMADelaide.
- Genre institutions and community heritage: Wacken and New Orleans Jazz Fest,
  alongside Newport Jazz and Montreux.

The entry descriptions explain the supported historical reason for inclusion.
Associations can mean a performance, repertoire, organisation, location, recorded
song, instrument or scene; the note states which. A composer’s repertoire link
is not a personal appearance. Festival connections do not assert genre ancestry.

Woodstock and Monterey represent the bounded original 1969 and 1967 gatherings.
Existing history-event IDs are preserved and linked rather than replaced.
Reading’s 1961 start refers to the National Jazz Festival precursor, not a claim
that it was held in Reading then. The Movement entry documents DEMF’s 2000 origin
and subsequent name/producer changes. Isle of Wight and Baalbeck descriptions
explicitly acknowledge long interruptions. Festival au Désert includes exile
projects rather than implying a continuing annual concert at one Malian site.

This remains a curated collection rather than an exhaustive directory or a claim
of equal coverage. Central Asia, more of South and East Asia, Central America,
the Pacific islands, and further African traditions remain underrepresented.
The Rainforest World Music Festival was considered but left for a later pass:
source material encountered gives conflicting 1997/1998 beginnings, which should
be reconciled before assigning a precise first-edition year. Festival histories
are recorded rather than upcoming dates, ticket prices, or guarantees about
future editions.

The existing `event:essaouira-gnawa-festival` remains the 1998 founding event;
its cited association with the recurring festival avoids changing existing IDs.
No new relationship is inferred for an instrument, label, track, or scene without
specific evidence. The graph and details support those entity types when such
evidence becomes available.


## Source and confidence review

The [source audit](./audits/festival-sources-001.md) and its
[machine-readable ledger](./audits/festival-sources-001.json) cover every festival
and festival relationship. Festival-level references increased from 52 to 86 in the first review and to 126
after the Wikipedia cross-check and follow-up scholarship;
each of the 39 festival nodes has at least three distinct URLs. URL counts do not
establish publisher independence or guarantee that every claim is corroborated.
The ledger records the scope of additional references and retired citations.

Confidence is calibrated rather than maximised: 33 festival nodes are High and
six are Medium after this pass. The six are Cape Town, Festival au Désert,
Rock al Parque, Sawai Gandharva, Pythian Games and Three Choirs. Interpretive
associations to dancehall, the broad EDM umbrella and modern classical also
carry Medium confidence; direct programme/location facts remain High when the
cited claim is directly documented. These labels are editorial evidence grades,
not probabilities or popularity scores.

Pythian Games is an ancient precedent with musical contests before athletic
additions. Its -582 start is a conventional reorganisation/numbering anchor within
the 586–582 BCE chronology, not the first musical festival ever. The approximate
424 CE upper display anchor follows scholarly discussion suggesting that games
were probably still ongoing then. It is not a securely established last edition
and supersedes the museum’s traditional 393/394 cessation account. The entire displayed period is marked
estimated and explained in both languages. No modern guitar/genre lineage is
inferred from translated descriptions of ancient instruments.

Three Choirs is conventionally counted from about 1715. Its precise first meeting
is uncertain, its present name dates from 1838, and wars and the pandemic caused
interruptions. An oldest-surviving-classical tradition claim is narrower than
first recorded music festival worldwide; neither node asserts that absolute claim.


## Dated events and Wikipedia cross-check

The [Wikipedia/event review](./audits/festival-wikipedia-events-002.md) records an
article check for all 39 festivals, in English or the relevant Spanish/French
article, with discrepancies and scope differences stated. Wikipedia was added as
a supplementary reference and a route to bibliography, not as an independent
confidence multiplier. No festival grade was raised solely by adding it.

Twenty-one dated History events were added where sources support a specific
performance, premiere, institutional format or musical circulation mechanism.
The existing Monterey Pop, Woodstock and Gnaoua events were reused. Every new
event links to its festival and carries its own sources, confidence and editorial
significance. Famous festivals without a separately selected event remain
searchable; absence of a new event is not a claim of historical unimportance.
The full History collection now contains 103 events, beginning with the estimated
Pythian reorganisation around 586–582 BCE and extending through 2022. BCE dates are
labelled in English and French rather than displayed as bare negative numbers.
