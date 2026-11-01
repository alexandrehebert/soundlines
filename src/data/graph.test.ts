import { describe, expect, it } from 'vitest'
import rawGraph from './graph.json'
import type { GenreFamily, GraphNode, MusicGraph, NodeType } from '../graph/types.ts'
import { MAX_YEAR, MIN_YEAR } from '../graph/layout.ts'
import { buildIndex, lineage, neighbors, searchNodes } from '../graph/graph.ts'
import { artistFamily, createTimelineModel } from '../graph/timeline.ts'
import { FAMILY_COLORS } from '../theme.ts'
import {
  EDGE_TYPE_LABELS,
  FAMILY_LABELS,
  FAMILY_ORDER,
  NODE_TYPE_LABELS,
  PROMINENCE_LABELS,
} from '../graph/types.ts'

const graph = rawGraph as MusicGraph

describe('graph.json integrity', () => {
  it('has ordered, known editorial phases within each genre or artist lifespan', () => {
    for (const node of graph.nodes.filter((candidate) => candidate.phases !== undefined)) {
      expect(['genre', 'artist']).toContain(node.type)
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
    expect(new Set(FAMILY_ORDER).size).toBe(FAMILY_ORDER.length)
    expect(Object.keys(FAMILY_LABELS).sort()).toEqual([...FAMILY_ORDER].sort())
    expect(Object.keys(FAMILY_COLORS).sort()).toEqual([...FAMILY_ORDER].sort())
    expect(new Set(Object.values(FAMILY_LABELS)).size).toBe(FAMILY_ORDER.length)
    expect(new Set(Object.values(FAMILY_COLORS)).size).toBe(FAMILY_ORDER.length)
    for (const family of FAMILY_ORDER) {
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
    for (const view of ['genre', 'artist'] as const) {
      const model = createTimelineModel(index, view)
      const ids = model.lanes.flatMap((lane) => lane.bars.map((bar) => bar.node.id))
      expect(new Set(ids).size).toBe(graph.nodes.filter((node) => node.type === view).length)
      for (const family of ['classical', 'jazz', 'rock']) {
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
        'serialism',
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
      'genre:soukous',
      'genre:khoomei',
    ])
    expect(ids.length).toBeGreaterThan(0)
    const visited = new Set([ids[0]])
    const queue = [ids[0]]
    for (const id of queue) {
      for (const { node } of neighbors(index, id)) {
        if (!visited.has(node.id)) {
          visited.add(node.id)
          queue.push(node.id)
        }
      }
    }
    expect(visited).toEqual(new Set(ids.filter((id) => !roots.has(id))))
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

  it('provides valid HTTPS sources for every artist and artist relationship', () => {
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
