import { describe, expect, it } from 'vitest'
import rawGraph from './graph.json'
import type { GenreFamily, GraphNode, MusicGraph, NodeType } from '../graph/types.ts'
import { MAX_YEAR, MIN_YEAR } from '../graph/layout.ts'
import { buildIndex, lineage, neighbors, searchNodes } from '../graph/graph.ts'
import { artistFamily, createTimelineModel, timelineFamily } from '../graph/timeline.ts'
import { FAMILY_COLORS } from '../theme.ts'
import {
  EDGE_TYPE_LABELS,
  EVENT_CATEGORY_LABELS,
  FAMILY_LABELS,
  FAMILY_ORDER,
  INSTRUMENT_FAMILY_ORDER,
  NODE_TYPE_LABELS,
  PROMINENCE_LABELS,
} from '../graph/types.ts'

const graph = rawGraph as MusicGraph

describe('graph.json integrity', () => {
  it('gives every instrument a phase with explicit confidence', () => {
    for (const node of graph.nodes.filter((candidate) => candidate.type === 'instrument')) {
      expect(node.phases?.length ?? 0, node.id).toBeGreaterThan(0)
      for (const phase of node.phases ?? []) {
        expect(['low', 'medium', 'high'], node.id).toContain(phase.confidence)
      }
    }
  })

  it('has ordered, known editorial phases within each genre, artist, or instrument lifespan', () => {
    for (const node of graph.nodes.filter((candidate) => candidate.phases !== undefined)) {
      expect(['genre', 'artist', 'instrument']).toContain(node.type)
      expect(node.phaseNote).toBeTruthy()
      expect(node.phases!.length).toBeGreaterThan(0)
      expect(node.phases![0].start).toBe(node.period?.start)
      for (const [i, phase] of node.phases!.entries()) {
        expect(Number.isInteger(phase.start)).toBe(true)
        expect(PROMINENCE_LABELS[phase.prominence]).toBeDefined()
        if (phase.intensity !== undefined) {
          expect(phase.intensity).toBeGreaterThanOrEqual(0)
          expect(phase.intensity).toBeLessThanOrEqual(1)
          if (phase.prominence === 'niche') expect(phase.intensity).toBe(0)
        }
        if (i > 0) expect(phase.start).toBeGreaterThan(node.phases![i - 1].start)
        if (node.period?.end != null) expect(phase.start).toBeLessThan(node.period.end)
      }
    }
  })

  it('uses valid optional phase-level evidence', () => {
    for (const node of graph.nodes) {
      for (const phase of node.phases ?? []) {
        const label = `${node.id}, phase ${phase.start}`
        if (phase.confidence !== undefined) {
          expect(['low', 'medium', 'high'], label).toContain(phase.confidence)
        }
        if (phase.note !== undefined) {
          expect(typeof phase.note, label).toBe('string')
          expect(phase.note.trim().length, label).toBeGreaterThan(0)
        }
        if (phase.sources !== undefined) {
          expect(Array.isArray(phase.sources), label).toBe(true)
          expect(phase.sources.length, label).toBeGreaterThan(0)
        }
      }
    }
  })

  it('includes additional genre and instrument phases and sourced phase notes', () => {
    const maqam = graph.nodes.find((node) => node.id === 'genre:arabic-maqam')
    const piano = graph.nodes.find((node) => node.id === 'instrument:piano')
    const tb303 = graph.nodes.find((node) => node.id === 'instrument:tb-303')
    expect(maqam?.phases?.length).toBeGreaterThan(0)
    expect(piano?.phases?.some((phase) => phase.confidence !== undefined)).toBe(true)
    const acidPhase = tb303?.phases?.find((phase) => phase.start === 1987)
    expect(acidPhase?.note).toBeTruthy()
    expect(acidPhase?.sources?.length).toBeGreaterThan(0)
  })

  it('has unique node ids', () => {
    const ids = graph.nodes.map((node) => node.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique edge ids', () => {
    const ids = graph.edges.map((edge) => edge.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('prefixes every node id with its type', () => {
    for (const node of graph.nodes) {
      expect(node.id.startsWith(`${node.type}:`)).toBe(true)
    }
  })

  it('only references existing nodes from edges', () => {
    const ids = new Set(graph.nodes.map((node) => node.id))
    for (const edge of graph.edges) {
      expect(ids.has(edge.from), `${edge.id} from ${edge.from}`).toBe(true)
      expect(ids.has(edge.to), `${edge.id} to ${edge.to}`).toBe(true)
    }
  })

  it('uses only known node types, edge types, and families', () => {
    for (const node of graph.nodes) {
      expect(NODE_TYPE_LABELS[node.type as NodeType]).toBeDefined()
      if (node.family) expect(FAMILY_LABELS[node.family]).toBeDefined()
    }
    for (const edge of graph.edges) {
      expect(EDGE_TYPE_LABELS[edge.type]).toBeDefined()
    }
  })

  it('gives every family a unique label, color, and position in the order', () => {
    const families = [...FAMILY_ORDER, ...INSTRUMENT_FAMILY_ORDER]
    expect(new Set(families).size).toBe(families.length)
    expect(Object.keys(FAMILY_LABELS).sort()).toEqual([...families].sort())
    expect(Object.keys(FAMILY_COLORS).sort()).toEqual([...families].sort())
    expect(new Set(Object.values(FAMILY_LABELS)).size).toBe(families.length)
    expect(new Set(Object.values(FAMILY_COLORS)).size).toBe(families.length)
    for (const family of families) {
      expect(FAMILY_LABELS[family].trim().length).toBeGreaterThan(0)
      expect(FAMILY_COLORS[family]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('has sane periods (start <= end, plausible years)', () => {
    const withPeriod = graph.nodes.filter(
      (node): node is GraphNode & { period: { start: number; end?: number | null } } =>
        node.period !== undefined,
    )
    expect(withPeriod.length).toBeGreaterThan(0)
    for (const node of withPeriod) {
      expect(Number.isInteger(node.period.start), node.id).toBe(true)
      expect(node.period.start, node.id).toBeGreaterThanOrEqual(MIN_YEAR)
      expect(node.period.start).toBeLessThan(2100)
      if (node.period.end != null) {
        expect(Number.isInteger(node.period.end), node.id).toBe(true)
        expect(node.period.end).toBeGreaterThanOrEqual(node.period.start)
      }
    }
  })

  it('gives every genre and artist a resolvable family and a period', () => {
    const index = buildIndex(graph)
    for (const node of graph.nodes.filter((candidate) =>
      candidate.type === 'genre' || candidate.type === 'artist',
    )) {
      const family = node.type === 'artist' ? artistFamily(index, node) : node.family
      expect(family, `${node.id} needs a family or a key_artist_of genre with a family`).toBeDefined()
      expect(node.period, node.id).toBeDefined()
    }
  })

  it('gives every instrument an instrument family, a period, sources, and sourced genre links', () => {
    const index = buildIndex(graph)
    const instruments = graph.nodes.filter((node) => node.type === 'instrument')
    expect(instruments.length).toBeGreaterThanOrEqual(30)
    for (const instrument of instruments) {
      expect(INSTRUMENT_FAMILY_ORDER, instrument.id).toContain(instrument.family)
      expect(timelineFamily(index, instrument), instrument.id).toBe(instrument.family)
      expect(instrument.period, instrument.id).toBeDefined()
      expect(instrument.description, instrument.id).toBeTruthy()
      expect(instrument.sources?.length, instrument.id).toBeGreaterThan(0)
      const featured = graph.edges.filter((edge) => edge.type === 'featured_in' && edge.from === instrument.id)
      expect(featured.length, instrument.id).toBeGreaterThan(0)
    }
    for (const node of graph.nodes.filter((candidate) => candidate.type !== 'instrument')) {
      expect(INSTRUMENT_FAMILY_ORDER as readonly string[], node.id).not.toContain(node.family)
    }
    for (const lane of INSTRUMENT_FAMILY_ORDER) {
      expect(instruments.filter((node) => node.family === lane).length, lane).toBeGreaterThanOrEqual(3)
    }
  })

  it('links instruments only in their documented directions, with sources', () => {
    const types = new Map(graph.nodes.map((node) => [node.id, node.type]))
    for (const edge of graph.edges) {
      const ends = [types.get(edge.from), types.get(edge.to)]
      if (edge.type === 'featured_in') expect(ends, edge.id).toEqual(['instrument', 'genre'])
      if (edge.type === 'plays') expect(ends, edge.id).toEqual(['artist', 'instrument'])
      if (ends.includes('instrument')) {
        expect(['featured_in', 'plays', 'influences', 'derived_from', 'shaped', 'involved'], edge.id)
          .toContain(edge.type)
        expect(edge.sources?.length, edge.id).toBeGreaterThan(0)
      }
    }
  })

  it('gives every event a category, a period, a description, sources, and sourced links', () => {
    for (const node of graph.nodes) {
      if (node.type === 'event') continue
      expect(node.category, node.id).toBeUndefined()
      expect(node.significance, node.id).toBeUndefined()
    }
    for (const event of graph.nodes.filter((node) => node.type === 'event')) {
      expect(EVENT_CATEGORY_LABELS[event.category!], event.id).toBeDefined()
      expect(event.family, event.id).toBeUndefined()
      expect(event.phases, event.id).toBeUndefined()
      if (event.significance !== undefined) {
        expect(['landmark', 'notable'], event.id).toContain(event.significance)
      }
      expect(event.period, event.id).toBeDefined()
      expect(event.description, event.id).toBeTruthy()
      expect(event.sources?.length, event.id).toBeGreaterThan(0)
      const shaped = graph.edges.filter((edge) => edge.type === 'shaped' && edge.from === event.id)
      expect(shaped.length, event.id).toBeGreaterThan(0)
    }
  })

  it('links events only in their documented directions, with sources', () => {
    const types = new Map(graph.nodes.map((node) => [node.id, node.type]))
    const targets: Record<string, readonly NodeType[]> = {
      shaped: ['genre', 'instrument', 'label', 'scene'],
      involved: ['artist', 'track', 'instrument', 'label', 'scene'],
      occurred_in: ['place'],
    }
    for (const edge of graph.edges) {
      const [from, to] = [types.get(edge.from)!, types.get(edge.to)!]
      if (edge.type in targets) {
        expect(from, edge.id).toBe('event')
        expect(targets[edge.type], edge.id).toContain(to)
      }
      if (from === 'event' || to === 'event') {
        expect(Object.keys(targets), edge.id).toContain(edge.type)
        expect(edge.sources?.length, edge.id).toBeGreaterThan(0)
      }
    }
  })

  it.each([
    ['instrument:algerian-mandole', 'strings', ['genre:algerian-chaabi'], ['artist:el-hadj-mhamed-el-anka', 'artist:abdelkader-chaou']],
    ['instrument:sarod', 'strings', ['genre:hindustani-classical'], ['artist:ali-akbar-khan']],
    ['instrument:harmonium', 'keyboards', ['genre:qawwali'], ['artist:farrukh-fateh-ali-khan']],
    ['instrument:timbales', 'percussion', ['genre:salsa', 'genre:latin-jazz'], ['artist:tito-puente']],
    ['instrument:charango', 'strings', ['genre:andean-folk'], ['artist:juan-flores']],
    ['instrument:quena', 'winds', ['genre:andean-folk'], ['artist:juan-flores']],
    ['instrument:balalaika', 'strings', ['genre:russian-folk'], ['artist:vasily-andreyev']],
    ['instrument:bansuri', 'winds', ['genre:hindustani-classical'], ['artist:hariprasad-chaurasia']],
    ['instrument:bassoon', 'winds', ['genre:baroque', 'genre:classical-period', 'genre:romantic'], []],
    ['instrument:bongos', 'percussion', ['genre:latin-jazz', 'genre:salsa', 'genre:son-cubano'], []],
    ['instrument:cello', 'strings', ['genre:baroque', 'genre:classical-period', 'genre:romantic'], ['artist:yo-yo-ma']],
    ['instrument:claves', 'percussion', ['genre:latin-jazz', 'genre:salsa', 'genre:son-cubano'], ['artist:mongo-santamaria']],
    ['instrument:dobro', 'strings', ['genre:bluegrass', 'genre:country'], []],
    ['instrument:french-horn', 'brass', ['genre:baroque', 'genre:classical-period', 'genre:romantic'], []],
    ['instrument:guiro', 'percussion', ['genre:cumbia', 'genre:salsa', 'genre:son-cubano'], []],
    ['instrument:harp', 'strings', ['genre:baroque', 'genre:jazz', 'genre:romantic'], ['artist:alice-coltrane', 'artist:dorothy-ashby']],
    ['instrument:hichiriki', 'winds', ['genre:gagaku'], []],
    ['instrument:jinghu', 'strings', ['genre:peking-opera'], []],
    ['instrument:maracas', 'percussion', ['genre:cumbia', 'genre:salsa', 'genre:son-cubano'], []],
    ['instrument:oboe', 'winds', ['genre:baroque', 'genre:classical-period', 'genre:romantic'], []],
    ['instrument:pedal-steel-guitar', 'strings', ['genre:alt-country', 'genre:country'], []],
    ['instrument:pipe-organ', 'keyboards', ['genre:baroque', 'genre:medieval', 'genre:renaissance'], ['artist:bach']],
    ['instrument:ryuteki', 'winds', ['genre:gagaku'], []],
    ['instrument:sho', 'winds', ['genre:gagaku'], []],
    ['instrument:tanpura', 'strings', ['genre:carnatic', 'genre:hindustani-classical', 'genre:qawwali'], []],
    ['instrument:transverse-flute', 'winds', ['genre:baroque', 'genre:classical-period', 'genre:romantic'], []],
    ['instrument:viola', 'strings', ['genre:baroque', 'genre:classical-period', 'genre:renaissance'], []],
  ] as const)('shows %s on the timeline and links its genres and players', (instrument, family, genres, artists) => {
    const index = buildIndex(graph)
    expect(index.nodeById.get(instrument)).toMatchObject({ type: 'instrument', family })
    const model = createTimelineModel(index, 'instrument')
    expect(model.lanes.find((lane) => lane.family === family)?.bars.some((bar) => bar.node.id === instrument))
      .toBe(true)
    for (const genre of genres) {
      expect(index.outEdges.get(instrument)).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'featured_in', to: genre }),
      ]))
    }
    for (const artist of artists) {
      expect(index.outEdges.get(artist)).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'plays', to: instrument }),
      ]))
    }
  })

  it.each([
    ['artist:mongo-santamaria', 1937, 'year'],
    ['artist:vasily-andreyev', 1884, 'year'],
    ['artist:yo-yo-ma', 1960, 'circa'],
    ['instrument:french-horn', 1660, 'circa'],
    ['instrument:pedal-steel-guitar', 1940, 'circa'],
    ['instrument:transverse-flute', 1680, 'circa'],
  ] as const)('anchors %s to a documented performance or instrument form', (id, start, precision) => {
    expect(graph.nodes.find((node) => node.id === id)?.period).toMatchObject({ start, precision })
  })

  it('traces instrument lineage on the instrument timeline only', () => {
    const index = createTimelineModel(buildIndex(graph), 'instrument').index
    expect(index.graph.nodes.every((node) => node.type === 'instrument')).toBe(true)
    expect(lineage(index, 'instrument:electric-guitar', createTimelineModel(buildIndex(graph), 'instrument').orientation)
      .ancestors).toEqual(new Set(['instrument:guitar', 'instrument:lute']))
    expect(lineage(index, 'instrument:tr-909', createTimelineModel(buildIndex(graph), 'instrument').orientation)
      .ancestors).toEqual(new Set(['instrument:tr-808']))
    expect(searchNodes(graph, 'Roland TR-808')[0].node.id).toBe('instrument:tr-808')
    const genreIndex = createTimelineModel(buildIndex(graph), 'genre').index
    expect(genreIndex.graph.nodes.some((node) => node.type === 'instrument')).toBe(false)
  })

  it('covers classical eras and jazz and rock branches with cited genre nodes', () => {
    const expected = {
      classical: ['medieval', 'renaissance', 'baroque', 'classical-period', 'romantic', 'modern-classical', 'minimalism'],
      jazz: ['jazz', 'swing', 'bebop', 'cool-jazz', 'hard-bop', 'modal-jazz', 'free-jazz', 'jazz-fusion'],
      rock: ['rock-and-roll', 'rock', 'blues-rock', 'psychedelic-rock', 'progressive-rock', 'hard-rock'],
      'alternative-punk': ['punk-rock', 'post-punk', 'alternative-rock', 'grunge'],
      metal: ['heavy-metal'],
    }
    for (const [family, slugs] of Object.entries(expected)) {
      for (const slug of slugs) {
        const node = graph.nodes.find((candidate) => candidate.id === `genre:${slug}`)
        expect(node?.family, slug).toBe(family)
        expect(node?.sources?.length, slug).toBeGreaterThan(0)
      }
    }
  })

  it('projects new genres and artists into their dedicated timeline lanes', () => {
    const index = buildIndex(graph)
    for (const view of ['genre', 'artist', 'instrument'] as const) {
      const model = createTimelineModel(index, view)
      const ids = model.lanes.flatMap((lane) => lane.bars.map((bar) => bar.node.id))
      expect(new Set(ids).size).toBe(graph.nodes.filter((node) => node.type === view).length)
      const families = view === 'instrument' ? INSTRUMENT_FAMILY_ORDER : ['classical', 'jazz', 'rock']
      for (const family of families) {
        expect(model.lanes.find((lane) => lane.family === family)?.bars.length).toBeGreaterThan(0)
      }
      for (const lane of model.lanes) {
        for (const bar of lane.bars) {
          expect(bar.start, bar.node.id).toBeGreaterThanOrEqual(MIN_YEAR)
          expect(bar.end, bar.node.id).toBeLessThanOrEqual(MAX_YEAR)
        }
      }
    }
    expect(createTimelineModel(index, 'artist').index.nodeById.get('artist:mozart')?.family)
      .toBe('classical')
  })

  it('groups every genre into recognizable families with 3 to 20 genres per lane', () => {
    const expected = {
      classical: [
        'medieval', 'renaissance', 'baroque', 'classical-period', 'romantic',
        'modern-classical', 'minimalism', 'hindustani-classical', 'carnatic',
        'qawwali', 'gamelan', 'gagaku', 'peking-opera', 'pansori', 'impressionism',
        'serialism', 'arabic-maqam',
      ],
      'blues-soul': ['blues', 'soul', 'funk', 'r-and-b', 'doo-wop', 'neo-soul',
        'new-jack-swing', 'contemporary-r-and-b',
      ],
      jazz: [
        'jazz', 'swing', 'bebop', 'cool-jazz', 'hard-bop', 'modal-jazz', 'free-jazz',
        'jazz-fusion', 'acid-jazz', 'vocal-jazz', 'latin-jazz', 'spiritual-jazz',
      ],
      'country-folk': [
        'country', 'folk', 'bluegrass', 'russian-folk', 'baul-songs', 'khoomei',
        'americana', 'alt-country', 'honky-tonk',
      ],
      rock: [
        'rock-and-roll', 'rock', 'blues-rock', 'psychedelic-rock', 'progressive-rock',
        'hard-rock', 'krautrock', 'garage-rock', 'glam-rock', 'stoner-rock', 'surf-rock',
      ],
      'alternative-punk': [
        'punk-rock', 'post-punk', 'alternative-rock', 'grunge', 'indie-rock', 'shoegaze',
        'dream-pop', 'britpop', 'emo', 'post-hardcore', 'post-rock', 'math-rock',
        'noise-rock', 'gothic-rock', 'pop-punk', 'new-wave',
      ],
      metal: [
        'heavy-metal', 'thrash-metal', 'death-metal', 'black-metal', 'doom-metal',
        'nu-metal', 'metalcore', 'industrial-metal',
      ],
      pop: ['pop', 'synth-pop', 'k-pop', 'j-pop', 'girl-groups'],
      'hip-hop': [
        'hip-hop', 'grime', 'trap-rap', 'drill', 'old-school-rap', 'east-coast-rap',
        'west-coast-rap', 'gangsta-rap', 'boom-bap', 'jazz-rap', 'alternative-rap',
        'conscious-hip-hop', 'southern-rap', 'crunk', 'g-funk', 'hyphy',
        'chopped-and-screwed', 'horrorcore',
      ],
      reggae: ['ska', 'rocksteady', 'reggae', 'dub', 'dancehall', 'calypso'],
      latin: [
        'latin', 'son-cubano', 'salsa', 'bossa-nova', 'cumbia', 'samba',
        'tango', 'andean-folk', 'bachata', 'merengue', 'reggaeton',
      ],
      african: [
        'highlife', 'afrobeat', 'afrobeats', 'juju', 'soukous', 'amapiano', 'gqom', 'kwaito',
        'congolese-rumba', 'rai', 'gnawa', 'algerian-chaabi', 'mbalax', 'makossa', 'taarab',
      ],
      electronica: [
        'electro', 'trip-hop', 'ambient', 'idm', 'synthwave', 'darksynth',
        'vaporwave', 'chillwave', 'downtempo', 'electroclash', 'edm',
      ],
      house: [
        'disco', 'italo-disco', 'hi-nrg', 'chicago-house', 'garage-house', 'deep-house',
        'acid-house', 'french-touch', 'french-house', 'tech-house', 'house', 'electro-house', 'footwork',
      ],
      techno: [
        'detroit-techno', 'minimal-techno', 'dub-techno', 'trance', 'gabber',
        'techno', 'ambient-techno', 'hardstyle', 'psytrance',
      ],
      'breakbeat-bass': [
        'breakbeat-hardcore', 'jungle', 'drum-and-bass', 'uk-garage', 'dubstep',
        'big-beat', 'breakbeat', 'breakcore',
      ],
    } satisfies Record<GenreFamily, string[]>
    const model = createTimelineModel(buildIndex(graph), 'genre')
    expect(model.lanes.map((lane) => lane.family)).toEqual(FAMILY_ORDER)
    expect(Object.values(expected).flat().map((slug) => `genre:${slug}`).sort())
      .toEqual(graph.nodes.filter((node) => node.type === 'genre').map((node) => node.id).sort())
    for (const [family, slugs] of Object.entries(expected)) {
      const lane = model.lanes.find((candidate) => candidate.family === family)
      expect(lane, family).toBeDefined()
      expect(lane!.bars.map((bar) => bar.node.id).sort())
        .toEqual(slugs.map((slug) => `genre:${slug}`).sort())
      expect(lane!.bars.length, family).toBeGreaterThanOrEqual(3)
      expect(lane!.bars.length, family).toBeLessThanOrEqual(20)
    }
  })

  it.each([
    ['artist:johnny-cash', 'country-folk'],
    ['artist:black-sabbath', 'metal'],
    ['artist:chief-keef', 'hip-hop'],
    ['artist:bob-marley', 'reggae'],
    ['artist:fela-kuti', 'african'],
    ['artist:brian-eno', 'electronica'],
    ['artist:the-human-league', 'pop'],
    ['artist:women-on-wax', 'techno'],
  ] as const)('places %s in the %s artist lane', (id, family) => {
    const model = createTimelineModel(buildIndex(graph), 'artist')
    expect(model.index.nodeById.get(id)?.family).toBe(family)
    expect(model.lanes.find((lane) => lane.family === family)?.bars.some((bar) => bar.node.id === id))
      .toBe(true)
  })

  it('makes historical eras searchable and connects the expanded lineage to existing genres', () => {
    expect(searchNodes(graph, 'Baroque')[0].node.id).toBe('genre:baroque')
    expect(searchNodes(graph, 'Mozart')[0].node.id).toBe('artist:mozart')
    const index = createTimelineModel(buildIndex(graph), 'genre').index
    expect(lineage(index, 'genre:romantic').ancestors).toContain('genre:medieval')
    expect(lineage(index, 'genre:grunge').ancestors).toContain('genre:blues')
    expect(lineage(index, 'genre:deep-house').ancestors).toContain('genre:jazz')
    expect(lineage(index, 'genre:synth-pop').ancestors).toContain('genre:rock')
  })

  it('makes the added genres and artists searchable with their relationships', () => {
    expect(searchNodes(graph, 'Reggae')[0]?.node.id).toBe('genre:reggae')
    expect(searchNodes(graph, 'Bob Marley')[0]?.node.id).toBe('artist:bob-marley')

    const index = buildIndex(graph)
    const genreIndex = createTimelineModel(index, 'genre').index
    const reggae = lineage(genreIndex, 'genre:reggae')
    expect(reggae.ancestors).toContain('genre:ska')
    expect(reggae.descendants).toContain('genre:dub')
    expect(reggae.descendants).toContain('genre:dancehall')
    expect(index.outEdges.get('artist:bob-marley')).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'key_artist_of', to: 'genre:reggae' }),
    ]))
    expect(index.outEdges.get('artist:the-human-league')).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'key_artist_of', to: 'genre:new-wave' }),
    ]))

    const artistIndex = createTimelineModel(index, 'artist').index
    expect(artistIndex.nodeById.get('artist:bob-marley')?.family).toBe('reggae')
    expect(artistIndex.nodeById.get('artist:the-human-league')?.family)
      .toBe('pop')

    expect(lineage(genreIndex, 'genre:chopped-and-screwed').ancestors)
      .toContain('genre:southern-rap')
    expect(lineage(genreIndex, 'genre:chopped-and-screwed').ancestors)
      .toContain('genre:hip-hop')
    expect(lineage(genreIndex, 'genre:crunk').ancestors)
      .toContain('genre:southern-rap')
    expect(lineage(genreIndex, 'genre:boom-bap').ancestors)
      .toContain('genre:east-coast-rap')
    expect(lineage(genreIndex, 'genre:g-funk').ancestors)
      .toContain('genre:west-coast-rap')
  })

  it('connects genres through lineage while preserving standalone traditions as roots', () => {
    const index = createTimelineModel(buildIndex(graph), 'genre').index
    const ids = index.graph.nodes.map((node) => node.id)
    const roots = new Set([
      'genre:carnatic',
      'genre:russian-folk',
      'genre:samba',
      'genre:peking-opera',
      'genre:pansori',
      'genre:baul-songs',
      'genre:juju',
      'genre:khoomei',
      'genre:arabic-maqam',
      'genre:congolese-rumba',
      'genre:rai',
      'genre:gnawa',
      'genre:algerian-chaabi',
      'genre:makossa',
      'genre:taarab',
    ])
    expect(ids.length).toBeGreaterThan(0)
    const visited = new Set([ids[0], ...roots])
    const queue = [...visited]
    for (const id of queue) {
      for (const { node } of neighbors(index, id)) {
        if (!visited.has(node.id)) {
          visited.add(node.id)
          queue.push(node.id)
        }
      }
    }
    expect(visited).toEqual(new Set(ids))
  })

  it.each([
    ['rai', 'rai', 'oran', ['cheikha-rimitti', 'khaled', 'cheb-mami', 'cheb-hasni', 'cheba-zahouania']],
    ['gnawa', 'gnawa', 'morocco', ['mahmoud-guinia', 'hamid-el-kasri', 'hassan-hakmoun']],
    ['algerian-chaabi', 'chaabi', 'algiers', ['el-hadj-mhamed-el-anka', 'dahmane-el-harrachi', 'abdelkader-chaou']],
    ['mbalax', 'mbalax', 'dakar', ['youssou-ndour', 'omar-pene', 'thione-seck']],
    ['makossa', 'makossa', 'douala', ['manu-dibango', 'eboa-lotin', 'petit-pays']],
    ['taarab', 'taarab', 'zanzibar', ['siti-binti-saad', 'bi-kidude', 'culture-musical-club']],
  ] as const)('makes %s and its artists searchable in the African timelines', (genre, query, place, artists) => {
    const index = buildIndex(graph)
    const genreId = `genre:${genre}`
    expect(searchNodes(graph, query)[0]?.node.id).toBe(genreId)
    expect(index.outEdges.get(genreId)).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'originated_in', to: `place:${place}` }),
    ]))
    expect(createTimelineModel(index, 'genre').lanes.find((lane) => lane.family === 'african')
      ?.bars.some((bar) => bar.node.id === genreId)).toBe(true)

    const artistModel = createTimelineModel(index, 'artist')
    for (const artist of artists) {
      const artistId = `artist:${artist}`
      expect(index.outEdges.get(artistId)).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'key_artist_of', to: genreId }),
      ]))
      expect(artistModel.lanes.find((lane) => lane.family === 'african')
        ?.bars.some((bar) => bar.node.id === artistId), artistId).toBe(true)
    }
  })

  it('connects the new recordings, instrument, and documented influences', () => {
    const index = buildIndex(graph)
    for (const [from, type, to] of [
      ['track:didi-khaled', 'anthem_of', 'genre:rai'],
      ['track:didi-khaled', 'recorded_by', 'artist:khaled'],
      ['track:soul-makossa-manu-dibango', 'anthem_of', 'genre:makossa'],
      ['track:soul-makossa-manu-dibango', 'recorded_by', 'artist:manu-dibango'],
      ['instrument:algerian-mandole', 'featured_in', 'genre:algerian-chaabi'],
      ['artist:el-hadj-mhamed-el-anka', 'plays', 'instrument:algerian-mandole'],
      ['artist:siti-binti-saad', 'influences', 'artist:bi-kidude'],
    ]) {
      expect(index.outEdges.get(from)).toEqual(expect.arrayContaining([
        expect.objectContaining({ type, to, sources: expect.arrayContaining([expect.any(String)]) }),
      ]))
    }
    const genreIndex = createTimelineModel(index, 'genre').index
    const ancestors = lineage(genreIndex, 'genre:mbalax').ancestors
    expect(ancestors).toContain('genre:congolese-rumba')
    expect(ancestors).toContain('genre:salsa')
    expect(searchNodes(graph, 'Cheb Khaled')[0]?.node.id).toBe('artist:khaled')
    expect(searchNodes(graph, "Youssou N'Dour")[0]?.node.id).toBe('artist:youssou-ndour')
  })

  it('gives every genre at least three sourced key artists', () => {
    for (const genre of graph.nodes.filter((node) => node.type === 'genre')) {
      const artists = graph.edges.filter((edge) =>
        edge.type === 'key_artist_of' && edge.to === genre.id,
      )
      expect(artists.length, genre.id).toBeGreaterThanOrEqual(3)
      for (const edge of artists) expect(edge.sources?.length, edge.id).toBeGreaterThan(0)
    }
  })

  it('requires artist sources and validates HTTPS sources throughout the graph', () => {
    const artists = graph.nodes.filter((node) => node.type === 'artist')
    const artistIds = new Set(artists.map((node) => node.id))
    for (const artist of artists) {
      expect(artist.sources?.length, artist.id).toBeGreaterThan(0)
    }
    for (const edge of graph.edges.filter((candidate) =>
      candidate.type === 'key_artist_of' || (artistIds.has(candidate.from) && artistIds.has(candidate.to)),
    )) {
      expect(edge.sources?.length, edge.id).toBeGreaterThan(0)
    }
    for (const source of [
      ...graph.nodes.flatMap((node) => node.sources ?? []),
      ...graph.edges.flatMap((edge) => edge.sources ?? []),
      ...graph.nodes.flatMap((node) => (node.phases ?? []).flatMap((phase) => phase.sources ?? [])),
    ]) {
      const url = new URL(source)
      expect(url.protocol).toBe('https:')
      expect(url.hostname).not.toBe('')
      expect(url.username).toBe('')
      expect(url.password).toBe('')
    }
  })

  it('carries over all nine entities from the v1 catalogue', () => {
    const names = new Set(graph.nodes.map((node) => node.name))
    const v1Entities = [
      'Detroit techno',
      'Chicago house',
      'Kraftwerk',
      'Juan Atkins',
      'Derrick May',
      'Kevin Saunderson',
      'Cybotron',
      'Metroplex',
      'Detroit',
    ]
    for (const name of v1Entities) {
      expect(names.has(name), name).toBe(true)
    }
  })

  it('leaves no node completely disconnected', () => {
    const connected = new Set<string>()
    for (const edge of graph.edges) {
      connected.add(edge.from)
      connected.add(edge.to)
    }
    for (const node of graph.nodes) {
      expect(connected.has(node.id), node.id).toBe(true)
    }
  })
})
