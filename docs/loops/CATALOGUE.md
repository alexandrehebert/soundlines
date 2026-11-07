# Genre loop brief catalogue

All 177 graph genres are covered: 152 new grid briefs, 2 preserved existing briefs, and 23 special-case briefs. No audio was generated.

Grid briefs adapt the existing genre-specific preview directions rather than introducing a second catalogue of musical descriptions. Their keys are creative choices. Source links are inherited graph references, not a claim of new independent source verification. All new briefs need listening review; non-4 meters, half-time mappings and instrumental adaptations explicitly need draft review.

For faster iteration, new grid briefs use four bars and source takes of at least 24 seconds with 14 seconds of extraction headroom. Five seeds are available; render the first two initially, extending the run when needed. Keep final XL SFT/80-step/4B planning quality. Never feed special-case Markdown files to the grid renderer. The existing turntable trap arrangement remains available separately.

Run `node .github/skills/loop-brief/scripts/check-brief.mjs` to lint every runnable brief. Special cases document the musical direction and the missing workflow support without fabricating tempo or keys.

| Genre | Preparation | Brief | Review note |
| --- | --- | --- | --- |
| acid-house | prepared | [acid-house.json](briefs/acid-house.json) | Genre-informed listening review before rendering. |
| acid-jazz | prepared | [acid-jazz.json](briefs/acid-jazz.json) | Genre-informed listening review before rendering. |
| afrobeat | prepared | [afrobeat.json](briefs/afrobeat.json) | Genre-informed listening review before rendering. |
| afrobeats | prepared | [afrobeats.json](briefs/afrobeats.json) | Genre-informed listening review before rendering. |
| algerian-chaabi | needs-draft-review | [algerian-chaabi.json](briefs/algerian-chaabi.json) | Major/minor metadata is only a production tonal-center choice; modal ornaments need specialist listening review and may exceed model tuning support. |
| alt-country | prepared | [alt-country.json](briefs/alt-country.json) | Genre-informed listening review before rendering. |
| alternative-rap | prepared | [alternative-rap.json](briefs/alternative-rap.json) | Genre-informed listening review before rendering. |
| alternative-rock | prepared | [alternative-rock.json](briefs/alternative-rock.json) | Genre-informed listening review before rendering. |
| amapiano | prepared | [amapiano.json](briefs/amapiano.json) | Genre-informed listening review before rendering. |
| ambient | special-case | [ambient.md](special-cases/ambient.md) | The reference has no beat or fixed pulse. Needs texture-cycle extraction and a beatless seam gate. |
| ambient-techno | prepared | [ambient-techno.json](briefs/ambient-techno.json) | Genre-informed listening review before rendering. |
| americana | prepared | [americana.json](briefs/americana.json) | Genre-informed listening review before rendering. |
| andean-folk | needs-draft-review | [andean-folk.json](briefs/andean-folk.json) | Meter 2 is not verified end-to-end by the current loop extractor: draft and verify full phrase/downbeat alignment before final rendering. |
| arabic-maqam | special-case | [arabic-maqam.md](special-cases/arabic-maqam.md) | Free-rhythm taqsim and Bayati neutral intervals need non-grid extraction and maqam-aware conditioning; a major/minor key would misdescribe the pitch system. |
| bachata | prepared | [bachata.json](briefs/bachata.json) | Genre-informed listening review before rendering. |
| baroque | prepared | [baroque.json](briefs/baroque.json) | Genre-informed listening review before rendering. |
| baul-songs | special-case | [baul-songs.md](special-cases/baul-songs.md) | Expressive Bengali singing is central to this reference. Needs a vocal-aware workflow and confirmation of its rhythmic cycle. |
| bebop | needs-draft-review | [bebop.json](briefs/bebop.json) | Catalogue pulse 212 BPM represented at 106 BPM half-time for tracker support; retain fast subdivisions, with snare and riff accents making the intended fast feel explicit. This grouping needs a draft and tempo review. |
| big-beat | prepared | [big-beat.json](briefs/big-beat.json) | Genre-informed listening review before rendering. |
| black-metal | prepared | [black-metal.json](briefs/black-metal.json) | Genre-informed listening review before rendering. |
| bluegrass | needs-draft-review | [bluegrass.json](briefs/bluegrass.json) | Meter 2 is not verified end-to-end by the current loop extractor: draft and verify full phrase/downbeat alignment before final rendering. |
| blues | needs-draft-review | [blues.json](briefs/blues.json) | Loop is a four-bar tonic blues vamp, not a truncated twelve-bar progression. |
| blues-rock | prepared | [blues-rock.json](briefs/blues-rock.json) | Genre-informed listening review before rendering. |
| boom-bap | prepared | [boom-bap.json](briefs/boom-bap.json) | Genre-informed listening review before rendering. |
| bossa-nova | needs-draft-review | [bossa-nova.json](briefs/bossa-nova.json) | Meter 2 is not verified end-to-end by the current loop extractor: draft and verify full phrase/downbeat alignment before final rendering. |
| breakbeat | prepared | [breakbeat.json](briefs/breakbeat.json) | Genre-informed listening review before rendering. |
| breakbeat-hardcore | prepared | [breakbeat-hardcore.json](briefs/breakbeat-hardcore.json) | Genre-informed listening review before rendering. |
| breakcore | needs-draft-review | [breakcore.json](briefs/breakcore.json) | Catalogue pulse 184 BPM represented at 92 BPM half-time for tracker support; retain fast subdivisions, with snare and riff accents making the intended fast feel explicit. This grouping needs a draft and tempo review. |
| britpop | prepared | [britpop.json](briefs/britpop.json) | Genre-informed listening review before rendering. |
| calypso | prepared | [calypso.json](briefs/calypso.json) | Genre-informed listening review before rendering. |
| carnatic | special-case | [carnatic.md](special-cases/carnatic.md) | Adi tala and raga Kalyani need tala-aware phrase boundaries and raga/gamaka conditioning; do not replace the raga with a major/minor key. |
| chicago-house | prepared | [chicago-house.json](briefs/chicago-house.json) | Genre-informed listening review before rendering. |
| chillwave | prepared | [chillwave.json](briefs/chillwave.json) | Genre-informed listening review before rendering. |
| chopped-and-screwed | prepared | [chopped-and-screwed.json](briefs/chopped-and-screwed.json) | Genre-informed listening review before rendering. |
| classical-period | prepared | [classical-period.json](briefs/classical-period.json) | Genre-informed listening review before rendering. |
| congolese-rumba | prepared | [congolese-rumba.json](briefs/congolese-rumba.json) | Genre-informed listening review before rendering. |
| conscious-hip-hop | prepared | [conscious-hip-hop.json](briefs/conscious-hip-hop.json) | Genre-informed listening review before rendering. |
| contemporary-r-and-b | prepared | [contemporary-r-and-b.json](briefs/contemporary-r-and-b.json) | Genre-informed listening review before rendering. |
| cool-jazz | prepared | [cool-jazz.json](briefs/cool-jazz.json) | Genre-informed listening review before rendering. |
| country | prepared | [country.json](briefs/country.json) | Genre-informed listening review before rendering. |
| crunk | prepared | [crunk.json](briefs/crunk.json) | Genre-informed listening review before rendering. |
| cumbia | needs-draft-review | [cumbia.json](briefs/cumbia.json) | Meter 2 is not verified end-to-end by the current loop extractor: draft and verify full phrase/downbeat alignment before final rendering. |
| dancehall | prepared | [dancehall.json](briefs/dancehall.json) | Genre-informed listening review before rendering. |
| darksynth | prepared | [darksynth.json](briefs/darksynth.json) | Genre-informed listening review before rendering. |
| death-metal | prepared | [death-metal.json](briefs/death-metal.json) | Genre-informed listening review before rendering. |
| deep-house | prepared | [deep-house.json](briefs/deep-house.json) | Genre-informed listening review before rendering. |
| detroit-techno | existing | [detroit-techno.json](briefs/detroit-techno.json) | Preserved existing brief; check its selection report before rerendering. |
| disco | prepared | [disco.json](briefs/disco.json) | Genre-informed listening review before rendering. |
| doo-wop | special-case | [doo-wop.md](special-cases/doo-wop.md) | Close vocal harmony defines the reference; replacing it with instruments would lose the genre cue. Needs a vocal-aware workflow. |
| doom-metal | prepared | [doom-metal.json](briefs/doom-metal.json) | Genre-informed listening review before rendering. |
| downtempo | prepared | [downtempo.json](briefs/downtempo.json) | Genre-informed listening review before rendering. |
| dream-pop | prepared | [dream-pop.json](briefs/dream-pop.json) | Genre-informed listening review before rendering. |
| drill | prepared | [drill.json](briefs/drill.json) | Genre-informed listening review before rendering. |
| drum-and-bass | prepared | [drum-and-bass.json](briefs/drum-and-bass.json) | Genre-informed listening review before rendering. |
| dub | prepared | [dub.json](briefs/dub.json) | Genre-informed listening review before rendering. |
| dub-techno | prepared | [dub-techno.json](briefs/dub-techno.json) | Genre-informed listening review before rendering. |
| dubstep | prepared | [dubstep.json](briefs/dubstep.json) | Genre-informed listening review before rendering. |
| east-coast-rap | prepared | [east-coast-rap.json](briefs/east-coast-rap.json) | Genre-informed listening review before rendering. |
| edm | prepared | [edm.json](briefs/edm.json) | Genre-informed listening review before rendering. |
| electro | prepared | [electro.json](briefs/electro.json) | Genre-informed listening review before rendering. |
| electro-house | prepared | [electro-house.json](briefs/electro-house.json) | Genre-informed listening review before rendering. |
| electroclash | prepared | [electroclash.json](briefs/electroclash.json) | Genre-informed listening review before rendering. |
| emo | prepared | [emo.json](briefs/emo.json) | Genre-informed listening review before rendering. |
| folk | prepared | [folk.json](briefs/folk.json) | Genre-informed listening review before rendering. |
| footwork | prepared | [footwork.json](briefs/footwork.json) | Genre-informed listening review before rendering. |
| free-jazz | special-case | [free-jazz.md](special-cases/free-jazz.md) | Elastic pulse and spontaneous interplay conflict with fixed bars and deterministic beat-grid validation. |
| french-house | prepared | [french-house.json](briefs/french-house.json) | Genre-informed listening review before rendering. |
| french-touch | prepared | [french-touch.json](briefs/french-touch.json) | Genre-informed listening review before rendering. |
| funk | prepared | [funk.json](briefs/funk.json) | Genre-informed listening review before rendering. |
| g-funk | prepared | [g-funk.json](briefs/g-funk.json) | Genre-informed listening review before rendering. |
| gabber | needs-draft-review | [gabber.json](briefs/gabber.json) | Catalogue pulse 185 BPM represented at 93 BPM half-time for tracker support; retain fast subdivisions, with snare and riff accents making the intended fast feel explicit. This grouping needs a draft and tempo review. |
| gagaku | special-case | [gagaku.md](special-cases/gagaku.md) | Broad breath-led phrases and court-ensemble timing need phrase-aware extraction rather than a Western club grid. |
| gamelan | special-case | [gamelan.md](special-cases/gamelan.md) | Slendro tuning and colotomic gong cycles need tuning-aware generation and cycle-aware extraction. |
| gangsta-rap | prepared | [gangsta-rap.json](briefs/gangsta-rap.json) | Genre-informed listening review before rendering. |
| garage-house | prepared | [garage-house.json](briefs/garage-house.json) | Genre-informed listening review before rendering. |
| garage-rock | prepared | [garage-rock.json](briefs/garage-rock.json) | Genre-informed listening review before rendering. |
| girl-groups | needs-draft-review | [girl-groups.json](briefs/girl-groups.json) | Instrumental backing-band adaptation: characteristic vocal harmonies are intentionally absent, so this is not a complete representation of the vocal genre. |
| glam-rock | prepared | [glam-rock.json](briefs/glam-rock.json) | Genre-informed listening review before rendering. |
| gnawa | needs-draft-review | [gnawa.json](briefs/gnawa.json) | Meter 6 is not verified end-to-end by the current loop extractor: draft and verify full phrase/downbeat alignment before final rendering. Preserve the six-beat cycle and guembri/qraqeb interplay; do not impose a four-on-the-floor rhythm. |
| gothic-rock | prepared | [gothic-rock.json](briefs/gothic-rock.json) | Genre-informed listening review before rendering. |
| gqom | prepared | [gqom.json](briefs/gqom.json) | Genre-informed listening review before rendering. |
| grime | prepared | [grime.json](briefs/grime.json) | Genre-informed listening review before rendering. |
| grunge | prepared | [grunge.json](briefs/grunge.json) | Genre-informed listening review before rendering. |
| hard-bop | prepared | [hard-bop.json](briefs/hard-bop.json) | Genre-informed listening review before rendering. |
| hard-rock | prepared | [hard-rock.json](briefs/hard-rock.json) | Genre-informed listening review before rendering. |
| hardstyle | prepared | [hardstyle.json](briefs/hardstyle.json) | Genre-informed listening review before rendering. |
| heavy-metal | prepared | [heavy-metal.json](briefs/heavy-metal.json) | Genre-informed listening review before rendering. |
| hi-nrg | prepared | [hi-nrg.json](briefs/hi-nrg.json) | Genre-informed listening review before rendering. |
| highlife | prepared | [highlife.json](briefs/highlife.json) | Genre-informed listening review before rendering. |
| hindustani-classical | special-case | [hindustani-classical.md](special-cases/hindustani-classical.md) | Teentaal is specified but the raga is not; choose a supported raga and preserve sam and the full tala cycle before planning codes. |
| hip-hop | existing | [turntable-hip-hop.json](briefs/turntable-hip-hop.json) | Preserved existing brief; check its selection report before rerendering. |
| honky-tonk | needs-draft-review | [honky-tonk.json](briefs/honky-tonk.json) | Meter 2 is not verified end-to-end by the current loop extractor: draft and verify full phrase/downbeat alignment before final rendering. |
| horrorcore | prepared | [horrorcore.json](briefs/horrorcore.json) | Genre-informed listening review before rendering. |
| house | prepared | [house.json](briefs/house.json) | Genre-informed listening review before rendering. |
| hyphy | prepared | [hyphy.json](briefs/hyphy.json) | Genre-informed listening review before rendering. |
| idm | prepared | [idm.json](briefs/idm.json) | Genre-informed listening review before rendering. |
| impressionism | special-case | [impressionism.md](special-cases/impressionism.md) | Flexible piano phrasing, whole-tone color and rubato need phrase-aware extraction and harmonic review. |
| indie-rock | prepared | [indie-rock.json](briefs/indie-rock.json) | Genre-informed listening review before rendering. |
| industrial-metal | prepared | [industrial-metal.json](briefs/industrial-metal.json) | Genre-informed listening review before rendering. |
| italo-disco | prepared | [italo-disco.json](briefs/italo-disco.json) | Genre-informed listening review before rendering. |
| j-pop | prepared | [j-pop.json](briefs/j-pop.json) | Genre-informed listening review before rendering. |
| jazz | prepared | [jazz.json](briefs/jazz.json) | Genre-informed listening review before rendering. |
| jazz-fusion | prepared | [jazz-fusion.json](briefs/jazz-fusion.json) | Genre-informed listening review before rendering. |
| jazz-rap | prepared | [jazz-rap.json](briefs/jazz-rap.json) | Genre-informed listening review before rendering. |
| juju | prepared | [juju.json](briefs/juju.json) | Genre-informed listening review before rendering. |
| jungle | prepared | [jungle.json](briefs/jungle.json) | Genre-informed listening review before rendering. |
| k-pop | prepared | [k-pop.json](briefs/k-pop.json) | Genre-informed listening review before rendering. |
| khoomei | special-case | [khoomei.md](special-cases/khoomei.md) | Overtone singing is the defining sound and has no steady pulse; the instrumental/no-vocals gate is incompatible. |
| krautrock | prepared | [krautrock.json](briefs/krautrock.json) | Genre-informed listening review before rendering. |
| kwaito | prepared | [kwaito.json](briefs/kwaito.json) | Genre-informed listening review before rendering. |
| latin | prepared | [latin.json](briefs/latin.json) | Genre-informed listening review before rendering. |
| latin-jazz | prepared | [latin-jazz.json](briefs/latin-jazz.json) | Genre-informed listening review before rendering. |
| makossa | prepared | [makossa.json](briefs/makossa.json) | Genre-informed listening review before rendering. |
| math-rock | special-case | [math-rock.md](special-cases/math-rock.md) | The reference alternates seven-beat and four-beat phrases, outside the current fixed-meter schema and extractor. |
| mbalax | prepared | [mbalax.json](briefs/mbalax.json) | Genre-informed listening review before rendering. |
| medieval | special-case | [medieval.md](special-cases/medieval.md) | Unaccompanied free-rhythm plainchant requires vocals and chant-aware phrase extraction. |
| merengue | needs-draft-review | [merengue.json](briefs/merengue.json) | Meter 2 is not verified end-to-end by the current loop extractor: draft and verify full phrase/downbeat alignment before final rendering. |
| metalcore | prepared | [metalcore.json](briefs/metalcore.json) | Genre-informed listening review before rendering. |
| minimal-techno | prepared | [minimal-techno.json](briefs/minimal-techno.json) | Genre-informed listening review before rendering. |
| minimalism | prepared | [minimalism.json](briefs/minimalism.json) | Genre-informed listening review before rendering. |
| modal-jazz | needs-draft-review | [modal-jazz.json](briefs/modal-jazz.json) | D minor is the API tonal-center label; retain D Dorian with its raised sixth as specified in the direction, not natural-minor-only harmony. |
| modern-classical | special-case | [modern-classical.md](special-cases/modern-classical.md) | Asymmetrical phrases, silence and changing density need phrase-aware rather than steady-groove validation. |
| neo-soul | prepared | [neo-soul.json](briefs/neo-soul.json) | Genre-informed listening review before rendering. |
| new-jack-swing | prepared | [new-jack-swing.json](briefs/new-jack-swing.json) | Genre-informed listening review before rendering. |
| new-wave | prepared | [new-wave.json](briefs/new-wave.json) | Genre-informed listening review before rendering. |
| noise-rock | prepared | [noise-rock.json](briefs/noise-rock.json) | Genre-informed listening review before rendering. |
| nu-metal | prepared | [nu-metal.json](briefs/nu-metal.json) | Genre-informed listening review before rendering. |
| old-school-rap | prepared | [old-school-rap.json](briefs/old-school-rap.json) | Genre-informed listening review before rendering. |
| pansori | special-case | [pansori.md](special-cases/pansori.md) | Narration and singing with changing drum cycles require a vocal-aware and cycle-aware workflow. |
| peking-opera | special-case | [peking-opera.md](special-cases/peking-opera.md) | Theatrical tempo changes and percussion cues need phrase-aware extraction; select a specific stable stage cycle before grid production. |
| pop | prepared | [pop.json](briefs/pop.json) | Genre-informed listening review before rendering. |
| pop-punk | prepared | [pop-punk.json](briefs/pop-punk.json) | Genre-informed listening review before rendering. |
| post-hardcore | prepared | [post-hardcore.json](briefs/post-hardcore.json) | Genre-informed listening review before rendering. |
| post-punk | prepared | [post-punk.json](briefs/post-punk.json) | Genre-informed listening review before rendering. |
| post-rock | prepared | [post-rock.json](briefs/post-rock.json) | Genre-informed listening review before rendering. |
| progressive-rock | special-case | [progressive-rock.md](special-cases/progressive-rock.md) | Changing meters in the reference require a meter map, or a separately approved common-time adaptation. |
| psychedelic-rock | prepared | [psychedelic-rock.json](briefs/psychedelic-rock.json) | Genre-informed listening review before rendering. |
| psytrance | prepared | [psytrance.json](briefs/psytrance.json) | Genre-informed listening review before rendering. |
| punk-rock | prepared | [punk-rock.json](briefs/punk-rock.json) | Genre-informed listening review before rendering. |
| qawwali | special-case | [qawwali.md](special-cases/qawwali.md) | Lead and response vocals and the devotional arc are central; select a tala and build a vocal-aware cycle workflow. |
| r-and-b | prepared | [r-and-b.json](briefs/r-and-b.json) | Genre-informed listening review before rendering. |
| rai | needs-draft-review | [rai.json](briefs/rai.json) | Major/minor metadata is only a production tonal-center choice; modal ornaments need specialist listening review and may exceed model tuning support. |
| reggae | prepared | [reggae.json](briefs/reggae.json) | Genre-informed listening review before rendering. |
| reggaeton | prepared | [reggaeton.json](briefs/reggaeton.json) | Genre-informed listening review before rendering. |
| renaissance | special-case | [renaissance.md](special-cases/renaissance.md) | The reference is a vocal motet with overlapping counterpoint and cadences; needs vocal-aware phrase boundaries. |
| rock | prepared | [rock.json](briefs/rock.json) | Genre-informed listening review before rendering. |
| rock-and-roll | prepared | [rock-and-roll.json](briefs/rock-and-roll.json) | Genre-informed listening review before rendering. |
| rocksteady | prepared | [rocksteady.json](briefs/rocksteady.json) | Genre-informed listening review before rendering. |
| romantic | special-case | [romantic.md](special-cases/romantic.md) | Expressive rubato and cadential motion require phrase-aware extraction, not a fixed-tempo four-bar crop. |
| russian-folk | needs-draft-review | [russian-folk.json](briefs/russian-folk.json) | Meter 2 is not verified end-to-end by the current loop extractor: draft and verify full phrase/downbeat alignment before final rendering. |
| salsa | prepared | [salsa.json](briefs/salsa.json) | Genre-informed listening review before rendering. |
| samba | needs-draft-review | [samba.json](briefs/samba.json) | Meter 2 is not verified end-to-end by the current loop extractor: draft and verify full phrase/downbeat alignment before final rendering. |
| serialism | special-case | [serialism.md](special-cases/serialism.md) | Twelve-tone ordering, rests and unstable pulse are incompatible with mandatory major/minor keys and a regular groove. |
| shoegaze | prepared | [shoegaze.json](briefs/shoegaze.json) | Genre-informed listening review before rendering. |
| ska | prepared | [ska.json](briefs/ska.json) | Genre-informed listening review before rendering. |
| son-cubano | prepared | [son-cubano.json](briefs/son-cubano.json) | Genre-informed listening review before rendering. |
| soukous | prepared | [soukous.json](briefs/soukous.json) | Genre-informed listening review before rendering. |
| soul | prepared | [soul.json](briefs/soul.json) | Genre-informed listening review before rendering. |
| southern-rap | prepared | [southern-rap.json](briefs/southern-rap.json) | Genre-informed listening review before rendering. |
| spiritual-jazz | special-case | [spiritual-jazz.md](special-cases/spiritual-jazz.md) | The reference has a flexible pulse and a developmental arc; a stable modal vamp needs a separately reviewed adaptation. |
| stoner-rock | prepared | [stoner-rock.json](briefs/stoner-rock.json) | Genre-informed listening review before rendering. |
| surf-rock | prepared | [surf-rock.json](briefs/surf-rock.json) | Genre-informed listening review before rendering. |
| swing | prepared | [swing.json](briefs/swing.json) | Genre-informed listening review before rendering. |
| synth-pop | prepared | [synth-pop.json](briefs/synth-pop.json) | Genre-informed listening review before rendering. |
| synthwave | prepared | [synthwave.json](briefs/synthwave.json) | Genre-informed listening review before rendering. |
| taarab | needs-draft-review | [taarab.json](briefs/taarab.json) | Major/minor metadata is only a production tonal-center choice; modal ornaments need specialist listening review and may exceed model tuning support. |
| tango | prepared | [tango.json](briefs/tango.json) | Genre-informed listening review before rendering. |
| tech-house | prepared | [tech-house.json](briefs/tech-house.json) | Genre-informed listening review before rendering. |
| techno | prepared | [techno.json](briefs/techno.json) | Genre-informed listening review before rendering. |
| thrash-metal | needs-draft-review | [thrash-metal.json](briefs/thrash-metal.json) | Catalogue pulse 184 BPM represented at 92 BPM half-time for tracker support; retain fast subdivisions, with snare and riff accents making the intended fast feel explicit. This grouping needs a draft and tempo review. |
| trance | prepared | [trance.json](briefs/trance.json) | Genre-informed listening review before rendering. |
| trap-rap | prepared | [trap-rap.json](briefs/trap-rap.json) | Genre-informed listening review before rendering. |
| trip-hop | prepared | [trip-hop.json](briefs/trip-hop.json) | Genre-informed listening review before rendering. |
| uk-garage | prepared | [uk-garage.json](briefs/uk-garage.json) | Genre-informed listening review before rendering. |
| vaporwave | prepared | [vaporwave.json](briefs/vaporwave.json) | Genre-informed listening review before rendering. |
| vocal-jazz | special-case | [vocal-jazz.md](special-cases/vocal-jazz.md) | The reference is explicitly vocal jazz; an instrumental loop would erase the defining lead. Needs vocal-aware validation. |
| west-coast-rap | prepared | [west-coast-rap.json](briefs/west-coast-rap.json) | Genre-informed listening review before rendering. |
