# Edge removals and relation corrections

- Removed `recorded:children-robert-miles-unqualified-track` as a duplicate of `recorded:children-robert-miles`. Official Charts and Insomniac identify the same Robert Miles recording.
- Replaced `recorded:eine-kleine-nachtmusik-mozart` with `composed:eine-kleine-nachtmusik-mozart`; the Mozarteum catalogue supports Mozart’s authorship, not a recording by Mozart.
- Replaced `recorded:einstein-on-the-beach-philip-glass` with `composed:einstein-on-the-beach-philip-glass`; Glass’s official catalogue supports authorship, while the old edge named no particular recording or performing ensemble.
- Corrected `signed:art-blakey-blue-note` to `signed:art-blakey-prestige-records`: Concord directly documents a 1972 Prestige contract; Blue Note was only shown as a release/catalog association.
- Corrected `signed:dr-dre-death-row-records` to `founded:dr-dre-death-row-records`: LOC identifies Dre as a co-founder with three others, not as a separate signer.
- Removed `signed:frankie-knuckles-trax`: release association did not establish signing, and Knuckles explicitly disavowed affiliation with Trax. Added the supported 1991 Virgin signing as `signed:frankie-knuckles-virgin-records`.
- Removed `signed:mogwai-rock-action-records`: Rock Action says it is owned and run by Mogwai, and began as an outlet for the band’s own music; this is an ownership/founding relationship, already represented by `founded:mogwai-rock-action`, not a demonstrated signing.
- Removed `signed:muddy-waters-chess-records`: Chess’s own sources place Waters’s first Chicago-label sessions on Aristocrat in 1947 and document later Chess releases, but do not establish a signing contract. The graph’s broad signing claim is unsupported.
- Removed `signed:otis-redding-stax-records`: Stax verifies Redding’s sessions and releases; the Smithsonian contract catalogue entry concerns “Mr. Pitiful” and does not clearly establish an artist recording contract. Remove the overbroad signing claim.
- Removed `signed:phuture-trax`: Sources confirm the Trax release and a reported one-time payment, not a label signing or ongoing contract. Remove the signing claim.
- Removed `signed:underground-resistance-tresor`: Sources describe licensing of Underground Resistance related projects to Tresor, not the collective signing to the label. Remove the signing claim.
- Removed `featured:auto-tune-afrobeats` from instrument/genre edges: Le Monde calls Auto-Tune a vocal correction tool added to computer-based Afrobeats production; Antares calls it pitch-correction software. The usage is supported, but it is a production tool rather than a musical instrument here. Remove or re-model under production technology.
- Removed `featured:auto-tune-contemporary-r-and-b` from instrument/genre edges: The product is pitch-correction software. The scholarly article frames Auto-Tune-as-instrument specifically around trap practice; it does not justify treating the plugin as a conventional instrument in contemporary R&B. Keep only if the graph adds a production-tool relation.
- Removed `featured:auto-tune-pop` from instrument/genre edges: Antares identifies Auto-Tune as vocal pitch-correction software. Berklee describes its use in pop as a digital vocal effect, not an instrument. Re-model as production technology/effect or remove from instrument taxonomy.
- Removed `anthem:bolero-impressionism-maurice-ravel` because available sources support Ravel’s general classification, not an Impressionist identity for this specific composition.
- Removed `plays:future-auto-tune`: the source confirms Auto-Tune use, but `plays` misclassifies vocal pitch-processing software as an instrument.
- Removed `key:air-chillwave`: chillwave sources did not establish an Air association; available evidence was not direct and the chronology was mismatched.
- Removed `anthem:chase-italo-disco-giorgio-moroder` because the opened official discography verified the score track but did not support the Italo-disco genre or anthem claims.

- Corrected `track:hardcore-vibes-dj-paul-elstak` and `recorded:hardcore-vibes-dj-paul-elstak` to Dune (`track:hardcore-vibes-dune`, `recorded:hardcore-vibes-dune`); the single-release credits name Dune, not DJ Paul Elstak. Replaced the gabber edge with a medium-confidence techno association based on the track-specific specialist archive.
- Replaced `anthem:good-vibrations-surf-rock-the-beach-boys` with `anthem:good-vibrations-psychedelic-pop-the-beach-boys`; track-specific sources identify psychedelic pop and characterize the recording as a departure from the Beach Boys’ surf sound. Added the missing psychedelic-pop genre node with a concise evidence note.

- Removed `key:celia-cruz-son-cubano`: FIU Libraries supports son within her broad Cuban-dance repertoire, not the stronger `key_artist_of` claim; Cruz’s documented defining associations are salsa and broader Afro-Cuban/Latin music.

- Removed `origin:artist-bob-sinclar-paris`: sources document early club work in Paris, not a birthplace or group-formation origin; the graph has no career-location edge type for this claim.

- Removed `anthem:good-vibrations-surf-rock-the-beach-boys`: track-specific sources characterize the 1966 recording as experimental psychedelic pop and distinguish it from the band’s earlier surf-oriented hits. The graph has no psychedelic-pop genre node, so the unsupported surf-rock edge was removed; the track-level evidence note records the better-supported classification.

- Replaced `recorded:gymnopedie-no-1-erik-satie` with `composed:gymnopedie-no-1-erik-satie`: the graph node was the 1888 work, and BnF supports Satie as composer; the evidence did not identify a recording performed by him.

- Removed `key:deadmau5-electro-house`: source review found only genre influence, an isolated collaboration, or scene/career association rather than evidence that the artist is a key artist of the claimed genre. See batch 016 key-artist ledger for source-specific findings.

- Removed `key:cybotron-hip-hop`: source review found only genre influence, an isolated collaboration, or scene/career association rather than evidence that the artist is a key artist of the claimed genre. See batch 016 key-artist ledger for source-specific findings.

- Removed `key:david-morales-garage-house`: source review found only genre influence, an isolated collaboration, or scene/career association rather than evidence that the artist is a key artist of the claimed genre. See batch 016 key-artist ledger for source-specific findings.

## Origin audit batch 017 (2026-11-05)
- Removed `origin:genre-carnatic-chennai`: The Music Academy Madras says it was founded in 1928 to set standards for Carnatic music; scholarship documents its role in shaping/reinventing the modern tradition:,.
- Removed `origin:genre-country-nashville`: Tennessee history says country’s roots include Appalachian ballads and fiddle tunes and that Nashville became the industry center; BMI likewise distinguishes early music from Nashville’s later mass-market role:,.
- Removed `origin:genre-french-touch-versailles`: Current source is a Versailles-area festival document, which establishes local association but not that French Touch originated there. The scholarly account instead describes the movement as Parisian:,.
- Removed `origin:genre-gamelan-bali`: UNESCO describes gamelan as Indonesian and widespread; Smithsonian materials document Balinese gamelan styles specifically:,.
- Removed `origin:genre-minimal-techno-cologne`: Resident Advisor documents Cologne’s Kompakt and its minimalist techno circle, but this proves a consequential scene rather than the genre’s exclusive origin:,.

## Key artist audit batch 017 (2026-11-05)
- Removed `key:dj-shadow-vaporwave`: No credible source found connecting DJ Shadow as a key vaporwave artist. Sources locate vaporwave’s formation in the 2010s online scene and name Macintosh Plus/Vektroid, James Ferraro and Daniel Lopatin/Oneohtrix Point Never; Shadow’s 1990s work belongs to an earlier adjacent sampling lineage. Likely conflation of influence with genre membership.

## Origin audit continued (2026-11-05)
- Removed `origin:genre-salsa-cali`: Cali became a major salsa consumption, performance, and local-style center, but academic history explicitly says salsa roots do not originate in Colombia. This is a scene/cultural-hub relationship, not a strict genre-origin edge; Cali salsa-scene coverage belongs in the separate scene relation.

## Recording-credit audit batch 018 (2026-11-05)
- Removed `recorded:nocturne-in-e-flat-major-op-9-no-2-chopin`: The sources cited for the graph describe Chopin as composer, not performer. The Library of Congress recording catalog identifies a 1910s performance of the work but lists it as an audio recording of Chopin’s composition, not Chopin performing it (,). Chopin died in 1849, before sound recording existed.

## Key artist audit batch 018 (2026-11-05)
- Removed `key:eric-prydz-electro-house`: The stronger artist and specialist sources identify Prydz’s core output with house/progressive house, with techno through Cirez D; they do not establish electro house as a key career association. The graph likely overreads isolated electronic/dance tracks or alias work.
- Removed `key:frankie-knuckles-garage-house`: These sources establish Knuckles as a Chicago house pioneer and separately document his early New York club/DJ connection. A Paradise Garage association does not establish garage-house as a key genre identity; remove rather than infer style from venue or scene proximity.

## Origins audit batch 018 (2026-11-05)
- Removed `origin:label-ruthless-records-compton`: Ruthless’s own history identifies Eazy-E as a Compton native, but a contemporaneous Los Angeles Times account says he founded the label in the San Fernando Valley, away from his Compton neighborhood (,).

## Recording-credit audit batch 019 (2026-11-05)
- Removed `recorded:pierrot-lunaire-schoenberg`: source record documents a 1912 composition; authorship is represented by the new `composed:pierrot-lunaire-schoenberg` edge.
- Consolidated `track:re-rewind-artful-dodger` into `track:re-rewind`; removed duplicate edge `recorded:re-rewind-artful-dodger-unqualified-track`, redirected the surviving recording credit, and transferred the duplicate anthem relationship sources to the canonical track, consolidating `anthem:re-rewind-uk-garage-artful-dodger` into `anthem:re-rewind-uk-garage`.

## Subgenre hierarchy batch 017 (2026-11-05)
- Re-parented and renamed `lineage:acid-house-chicago-house` to `lineage:acid-house-house`: broad `House` is the taxonomy parent; Chicago remains origin/scene context.
- Re-parented and renamed `lineage:deep-house-chicago-house` to `lineage:deep-house-house`: broad `House` is the taxonomy parent; Chicago remains origin/scene context.
- Removed `lineage:french-house-french-touch`: A peer-reviewed Musurgia article says “French house” is called “French Touch” in France and analyzes French Touch as a Parisian electronic movement with distinct musical features. This is an overlapping style/movement label or near-synonym, not a clear parent-child relation; consider retyping or removing this subgenre edge.;

- Removed `anthem:kalinka-russian-folk-dmitri-pokrovsky-ensemble`; checked ensemble catalogs did not verify this specific performance, so the song node is retained generically as `track:kalinka` and no artist-specific anthem edge remains. Disposition: `removed__kalinka-dmitri-pokrovsky-ensemble.md`.


## key:lil-keke-chopped-and-screwed — 2026-11-05

Removed unsupported `key_artist_of` claim. The sources establish Lil’ Keke as a Screwed Up Click member who appeared on DJ Screw tapes, but do not establish him as a key artist of DJ Screw’s production technique. Finding: Lil’ Keke was an original, prominent Screwed Up Click member and freestyled on iconic Screw tapes. Chopped-and-screwed names DJ Screw’s production technique, which he originated; the checked sources do not establish Keke as a key artist of that production style. Do not retain as a direct genre claim without defining genre membership more broadly.

- https://exhibits.lib.uh.edu/s/brothers-in-rhyme/page/suc-1
- https://www.houstoniamag.com/2021/12/southern-slab-culture-houston-texas
- https://uh.edu/magazine/2020-spring/_pdfs/uhmag_s2020_dj-screw.pdf

## anthem:sekar-djepun-gamelan-gamelan-sekar-tunjung — 2026-11-05

Removed unsupported or mis-targeted `anthem_of` edge. Smithsonian catalogs `Sekar djepun` (also rendered `Sekar Jepun`) performed by Gong Kebyar of Peliatan. This supports the exact track and gamelan tradition, but no checked source calls it an anthem or establishes canonical status. Keep only as a low, interpretive edge or remove.

- https://folkways.si.edu/gong-kebyar-of-peliatan/sekar-jepun/music/track/smithsonian
- https://folkways.si.edu/bali-court-music-and-banjar-music/world/music/album/smithsonian

## anthem:sekarinotan-gamelan-gamelan-madu-sari — 2026-11-05

Removed unsupported or mis-targeted `anthem_of` edge. Smithsonian identifies this 1994 recording by a gamelan orchestra in Teges, Ubud. Gamelan association is sound; no evidence found for anthem/canonical status. The track-level record supports identity but does not substantiate a genre-anthem claim.

- https://folkways.si.edu/sekarinotan/world/music/track/smithsonian
- https://folkways.si.edu/music-for-the-gods-the-fahnestock-south-sea-expedition-indonesia/world/album/smithsonian

## anthem:soy-peor-reggaeton-bad-bunny — 2026-11-05

Removed unsupported or mis-targeted `anthem_of` edge. Apple verifies the Bad Bunny single; Pitchfork describes it as a Latin-trap/emo-trap anthem and an important early statement. The current `reggaeton` target does not match the strongest classification found. Repair to a Latin-trap node if available; otherwise a broader trap-rap target needs explicit justification. Do not retain high confidence on the current edge.

- https://pitchfork.com/features/lists-and-guides/guide-to-urbano-music/
- https://pitchfork.com/features/interview/bad-bunny-yhlqmdlg-interview/
- https://music.apple.com/us/album/soy-peor-single/1470492098

## anthem:taboehgan-gamelan-gamelan-madu-sari — 2026-11-05

Removed unsupported or mis-targeted `anthem_of` edge. Smithsonian and Western Front records establish `Taboehgan` in the Gamelan Madu Sari repertoire/recording context. No checked source supports it as a recognized gamelan anthem or canonical work. Reduce to low or remove the anthem edge.

- https://folkways.si.edu/taboehgan/world/music/track/smithsonian
- https://westernfront.ca/archives/get/ca_entities/4532

## lineage:big-beat-breakbeat-hardcore — 2026-11-05

Removed unsupported `derived_from` claim; checked sources did not establish this direct predecessor link. Big beat uses sampled breakbeats and draws from rave/electronic styles, but the available sources do not establish that it specifically descends from breakbeat hardcore. Current high confidence overstates a single-source lineage.

- https://www.allmusic.com/genre/big-beat-ma0000004997
- https://www.cambridge.org/core/books/abs/cambridge-companion-to-electronic-dance-music/genre-classification-in-electronic-dance-music-culture/03A42C982EE299F9C666D757DDB24AD1

## anthem:the-sindhi-bhairavi-mode-hindustani-classical-ali-akbar-khan — 2026-11-05

Removed: exact recording identity or the full recording-plus-anthem relation was not established. Smithsonian catalogs Ali Akbar Khan’s recording and classifies it within classical Indian music. A raga performance is not automatically a Hindustani-classical “anthem”; no checked source calls this recording canonical or an anthem. Keep low or remove the anthem relation while retaining track/tradition metadata.

- https://folkways.si.edu/ali-akbar-khan/the-sindhi-bhairavi-mode/classical-india-world/music/track/smithsonian
- https://folkways.si.edu/ali-akbar-khan/india-classical-sarod/world/music/album/smithsonian

## anthem:the-drunken-beauty-peking-opera-mei-lanfang — 2026-11-05

Removed: exact recording identity or the full recording-plus-anthem relation was not established. The Drunken Beauty is a representative Mei Lanfang Peking-opera role/work. These sources do not identify the graph’s purported recording or establish it as an anthem. Track node itself says the earlier 1950 date is unverified; avoid treating role/work as a recording.

- https://en.chinaculture.org/2014-12/02/content_579408.htm
- https://english.visitbeijing.com.cn/article/47OLMnZb5sr
- https://research-information.bris.ac.uk/files/380681842/The_influence_of_male_dan_on_female_performers_in_jingju_Xiaohang_Zhao.pdf

## anthem:the-hut-khoomei-huun-huur-tu — 2026-11-05

Removed: exact recording identity or the full recording-plus-anthem relation was not established. Checked album track lists do not show a Huun-Huur-Tu track titled “The Hut”; the group’s 1993 album includes different named Tuvan songs. Existing sources only establish the group and khoomei generally. Do not retain this exact track edge without identifying its release and recording; no anthem evidence found.

- https://www.qobuz.com/us-en/album/sixty-horses-in-my-herd-huun-huur-tu/xfxn2gv71r3ba
- https://www.amoeba.com/sixty-horses-in-my-herd-cd-huun-huur-tu/albums/779229/

## key:miles-davis-spiritual-jazz — 2026-11-05

Removed unsupported `key_artist_of` centrality claim. Reference genre highlights identify Coltrane and Pharoah Sanders, not Davis; the biographical classification centers Davis on bebop, modal jazz, funk, and fusion. Spiritual dimensions in some work do not establish him as a key artist of this specific genre. Remove rather than confuse spirituality with genre membership.

- https://www.allmusic.com/style/spiritual-jazz-ma0000013403/artists
- https://www.allmusic.com/artist/miles-davis-mn0000423829
- https://www.jazzprofiles.com/subgenre/spiritual-jazz/

## key:miss-kittin-tech-house — 2026-11-05

Removed unsupported `key_artist_of` centrality claim. The reviewed sources support her core electroclash/electro/techno practice, but do not establish her as a key tech-house artist. A tech-house compilation credit or broad style tag would be insufficient for this centrality claim.

- https://www.allmusic.com/artist/miss-kittin-mn0000497290
- https://www.allmusic.com/style/tech-house-ma0000005003
- https://misskittin.com/about/

## origin:label-source-records-paris — 2026-11-05

Removed unsupported founding-location claim; reviewed sources do not verify Paris as the label’s origin. The sources establish Source as a Virgin France imprint created in 1995, but none establishes the imprint’s founding office or legal address in Paris. Virgin France’s Paris operation and French Touch roster are insufficient to prove the specific location. Preserve only as a low-confidence unresolved claim pending corporate/address evidence.

- https://www.lemonde.fr/archives/article/1998/01/20/emmanuel-de-buretel-president-directeur-general-de-virgin-france_3623302_1819218.html
- https://www.worldradiohistory.com/UK/Music-and-Media/90s/1995/MM-1995-04-08.pdf
- https://www.musicbusinessworldwide.com/source-records-relaunches-with-new-management-team-and-ambitious-growth-plans/

## anthem:moner-manush-baul-songs-purna-das-baul — 2026-11-05

Removed unsupported/mismatched `anthem_of` claim after checking recording identity and cultural status. The Saregama-linked album “Moner Manush (Bengali Folk)” includes Purna Das Baul recordings, including “Dekhechhi Rup-Sagare Moner Manush”; this verifies a Purna Das recording containing the phrase, but not a standalone 1997 recording titled “Moner Manush” as the graph describes. Scholarship discusses “Moner Manush” as a core Baul concept and Lalon song-text tradition; neither establishes this exact master as an anthem. The existing evidence note already flags the mismatch. Resolve by matching the graph node to a specific release/track or remove the edge.

- https://open.spotify.com/track/7p0vekjIxTaz1mGkUA4oRY
- https://folkways.si.edu/artist/purna-chandra-das
- https://qspace.library.queensu.ca/server/api/core/bitstreams/7a9a4eec-849a-4f8e-8fd4-5203c79eb191/content
- https://indianexpress.com/article/lifestyle/books/muchkund-dubey-foreign-secretary-lalon-shah-fakir-ke-geet-baul-ed-over-5252561/lite/

## anthem:orphan-s-lament-khoomei-huun-huur-tu — 2026-11-05

Removed unsupported/mismatched `anthem_of` claim after checking recording identity and cultural status. Label and retailer catalogs confirm “The Orphan’s Lament” as a Huun-Huur-Tu title track. Smithsonian explains xöömei/khoomei as both a particular technique and sometimes a general term, and the ensemble is a throat-singing group; the record’s track-specific technique is not demonstrated by the label metadata. Friends of Tuva calls the album contemporary art in traditional Tuvan styles. Nothing checked supports this recording as an anthem of khoomei. Track identity is good; the full anthem relation is not.

- https://www.shanachie.com/album/the-orphans-lament-huunhuurtu
- https://www.amoeba.com/the-orphan-s-lament-huun-huur-tu/albums/779858/
- https://asia-archive.si.edu/podcast/throat-singers-from-tuva-huun-huur-tu/
- https://www.fotuva.org/newsletters/fot11.html

## anthem:raga-hamsadhwani-carnatic-ramnad-krishnan — 2026-11-05

Removed unsupported/mismatched `anthem_of` claim after checking recording identity and cultural status. The Music Academy Madras program lists Ramnad Krishnan performing “Vatapi Ganapatim” in Hamsadhwani, supporting a concert-level association with the raga. This is not evidence for a released recording titled “Raga Hamsadhwani,” as the graph node implies; the Illinois archive separately catalogs a Hamsadhwani LP by a different performer, illustrating why namesake confusion is material. The verified work would be “Vatapi Ganapatim,” a composition set in the raga. No source calls this performance or raga an anthem. Retag/reidentify only if an actual release is found; otherwise remove the anthem edge.

- https://musicacademymadras.in/catalogue/files/souv/1957_31st%20conference%20souvenir.pdf
- https://findingaids.lib.uh.edu/repositories/2/archival_objects/409833
- https://archon.library.illinois.edu/archives/index.php?disabletheme=1&id=5711&p=collections%2Ffindingaid

## anthem:khachar-bhitor-ochin-pakhi-baul-songs-parvathy-baul — 2026-11-05

Removed unsupported/mismatched `anthem_of` claim after checking recording identity and cultural status. Scholarship supports the song’s association with Lalon and Baul practice; Indian Express names Parvathy among artists who keep Lalon songs alive generally. The identifiable SN Films recording is sung by Debasmita Chattopadhyay, and a separate 2026 field-recording episode identifies singer Selina Fakirini. Neither verifies this graph’s Parvathy version. Sources call the work a well-known Lalon song but do not establish it as a genre anthem. Exact performer/version is the decisive gap.

- https://eprints.soas.ac.uk/28763/1/10672931.pdf
- https://www.snfilms.in/music-videos/khachar-bhitor-ochin-pakhi-bengali-folk-song-lalon-fakir/
- https://indianexpress.com/article/lifestyle/books/muchkund-dubey-foreign-secretary-lalon-shah-fakir-ke-geet-baul-ed-over-5252561/lite/
- https://banyanroots1.podbean.com/e/songs-of-the-unknown-bird/

## anthem:katyusha-russian-folk-zhanna-bichevskaya — 2026-11-05

Removed unsupported/mismatched `anthem_of` claim after checking recording identity and cultural status. Institutional catalogs identify “Katyusha” as a composed 1938 Soviet song (Matvey Blanter / Mikhail Isakovsky), not an anonymous folk composition. The Bichevskaya catalog record is for a folk-song album and does not document this title. The existing track note also says her specific recording date is unverified. The song’s later folk-style circulation does not verify this recording or establish a “Russian folk anthem” claim. Do not retain as source-checked; either remove this edge or rebuild around a cataloged recording and distinguish composition origin from performance style.

- https://www.prlib.ru/item/417603
- https://search.rsl.ru/ru/record/01003134223

## anthem:raga-bhimpalasi-hindustani-classical-bhimsen-joshi — 2026-11-05

Removed unsupported/mismatched `anthem_of` claim after checking recording identity and cultural status. The Indian Classical Network entry identifies Joshi’s Bhimpalasi khayal performance on *Begun Gun Gave* (1993); Apple Music independently catalogs a one-track *Raag Bhimpalasi* release under Joshi. This substantially resolves the performance/artist match and supports Hindustani classical context. The University of Chicago archive notes Bhimpalasi among ragas Joshi was known for. These sources do not designate the performance or raga an “anthem”; that label imposes a popular-song frame on a classical raga performance. Keep low only if the graph explicitly defines “anthem” as a metaphor for a canonical performance.

- https://indianclassical.net/music/track/raga-bhimpalasi-bhimsen-joshi
- https://music.apple.com/us/album/raag-bhimpalasi/1606500857
- https://dsal.uchicago.edu/books/trn/pdfs/trn_2008.pdf

## influence:synth-pop-electro — 2026-11-05

Removed unsupported directional genre-influence claim. Sources support electronic synthesis in synth-pop and electro, but do not establish synth-pop as a specific source for electro; the canonical electro pathway is hip-hop/funk plus Kraftwerk/YMO and drum-machine technology. Current high confidence and direction are not substantiated.

- https://www.cambridge.org/core/books/abs/electronic-music/synth-pop/D121624A71DA46E80162B06844B56CB9
- https://www.loc.gov/collections/songs-of-america/articles-and-essays/musical-styles/popular-songs-of-the-day/hip-hop-rap/
- https://www.arts.gov/stories/other/afrika-bambaataa-renegade-funk

## lineage:idm-techno — 2026-11-05

Removed unsupported fusion claim. AllMusic describes IDM as emerging from a fusion of hard-edged rave-floor dance music and downtempo chill-out music; it does not identify techno as a direct co-parent. Techno influence is plausible for parts of IDM, but a categorical fusion edge overstates the checked evidence.

- https://www.allmusic.com/subgenre/idm-ma0000004477
- https://spectrum.library.concordia.ca/id/eprint/977861/

## lineage:serialism-modern-classical — 2026-11-05

Removed non-taxonomic technique-as-subgenre edge. Serialism is a compositional method central to twentieth-century art music, not a genre that is a subtype of modern classical. It coexists and interacts with other techniques and styles. `subgenre_of` misstates the node kind; use a technique/associated-with relation if available, otherwise remove.

- https://www.cambridge.org/core/books/cambridge-companion-to-serialism/00C22B2B0DF6483F7C146512775574C1
- https://assets.cambridge.org/97805218/63414/excerpt/9780521863414_excerpt.htm

## key:osibisa-highlife — 2026-11-05

Removed unsupported key-artist claim; highlife roots do not establish centrality in highlife itself. Scholarship describes Osibisa as Afro-rock formed by Ghanaian musicians with highlife backgrounds; BFI links the group name to highlife’s Fante term. Evidence supports highlife roots and hybridization, but the band is not primarily a highlife act. Keep only with this caveat, or remap to highlife influence on Afro-rock if available.

- https://researchonline.lse.ac.uk/id/eprint/137041/1/Katachie_202145261.pdf
- https://replay.bfi.org.uk/video/8a250d6a-4b2e-5e86-923c-4259bdc49d38
- https://www.cambridge.org/core/journals/history-in-africa/article/abs/ghanaian-christianity-and-popular-entertainment-full-circle/B4B90705492CCFF7087172B87920093F

## key:pixies-emo — 2026-11-05

Removed unsupported key-artist claim. The checked references do not establish Pixies as central emo artists. Their influence on later alternative and independent rock does not make them a key act in the distinct emo lineage; remove rather than preserve an unsupported tag.

- https://www.allmusic.com/style/emo-ma0000004447
- https://www.cambridge.org/core/books/popular-music-genres/8954EDBDDE6550E845DB5B3500B92D41/listing
- https://academic.oup.com/book/6294

## lineage:guitar-lute — 2026-11-05

Removed unsupported direct instrument influence edge. The guitar’s ancestry is complex and includes related plucked-string instruments such as gittern and vihuela; the sources do not establish lute as a direct influence on guitar. Current note wrongly implies a simple lute → guitar link via intermediaries.

- https://academic.oup.com/reference/62400/reference-article-abstract/555390839
- https://www.metmuseum.org/ko/essays/the-guitar