import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildIndex, groupedRelations, searchNodes } from '../graph/graph.ts'
import { viewForNode } from '../graph/timeline.ts'
import type { MusicGraph, NodeType } from '../graph/types.ts'
import data from './graph.json'
import sourceAudit from '../../docs/evidence/audits/festival-sources-001.json'
import wikipediaReview from '../../docs/evidence/audits/festival-wikipedia-events-002.json'
import { createHistoryModel } from '../graph/history.ts'

const graph = data as MusicGraph
const index = buildIndex(graph)

describe('sourced festival collection', () => {
  it('cross-checks every festival with a retrieved Wikipedia article without treating it as automatic corroboration', () => {
    const ids = graph.nodes.filter((node) => node.type === 'festival').map((node) => node.id).sort()
    expect(wikipediaReview.festivals.map((row) => row.festivalId).sort()).toEqual(ids)
    for (const row of wikipediaReview.festivals) {
      expect(row.status, row.festivalId).toBe('retrieved')
      expect(index.nodeById.get(row.festivalId)?.sources, row.festivalId).toContain(row.url)
      expect(new URL(row.url).hostname, row.festivalId).toMatch(/^(en|es|fr)\.wikipedia\.org$/)
      expect(row.finding.trim(), row.festivalId).not.toBe('')
      expect(row.sourceCaution, row.festivalId).toContain('not automatically independent')
    }
    expect(index.nodeById.get('festival:petronio-alvarez')?.period?.start).toBe(1997)
    expect(index.nodeById.get('festival:womad')?.period?.start).toBe(1982)
    expect(index.nodeById.get('festival:tomorrowland')?.period?.start).toBe(2005)
  })

  it('makes selected turning points visible in History and navigable to their festival', () => {
    const history = createHistoryModel(graph).dated
    expect(wikipediaReview.addedEvents.length).toBeGreaterThan(0)
    for (const row of wikipediaReview.addedEvents) {
      const event = history.find((node) => node.id === row.id)
      expect(event, row.id).toMatchObject({
        period: { start: row.year, end: row.endYear ?? row.year },
        confidence: row.confidence,
        significance: row.significance,
      })
      expect(viewForNode(event?.type, 'genre')).toBe('history')
      expect(groupedRelations(index, row.id).flatMap((group) => group.entries).map(({ node }) => node.id))
        .toContain(row.festivalId)
      expect(event?.sources, row.id).toEqual(row.sources)
      expect(row.inclusionReason.trim(), row.id).not.toBe('')
    }
    for (const [festivalId, eventId] of [
      ['festival:woodstock', 'event:woodstock-festival'],
      ['festival:monterey-pop', 'event:monterey-pop-festival'],
      ['festival:gnaoua-world-music', 'event:essaouira-gnawa-festival'],
    ]) {
      expect(wikipediaReview.festivals.find((row) => row.festivalId === festivalId)?.historyEventIds).toContain(eventId)
      expect(wikipediaReview.addedEvents.map((row) => row.id)).not.toContain(eventId)
    }
    expect(index.outEdges.get('event:dylan-electric-newport-1965')?.map((edge) => edge.to))
      .toEqual(expect.arrayContaining(['artist:bob-dylan', 'instrument:electric-guitar', 'track:like-a-rolling-stone-bob-dylan']))
  })

  it('documents the whole expanded worldwide collection in the coverage register', () => {
    const register = readFileSync(new URL('../../docs/evidence/festivals.md', import.meta.url), 'utf8')
    const rows = [...register.matchAll(/^\| `(festival:[^`]+)` \| ([^|]+) \| ([^|]+) \| (-?\d+) \|$/gm)]
    const festivals = graph.nodes.filter((node) => node.type === 'festival')
    expect(rows.map((row) => row[1]).sort()).toEqual(festivals.map((node) => node.id).sort())
    const countries = rows.map((row) => row[2].replace(/\s*\([^)]*\)/g, '').trim())
    expect(new Set(countries).size).toBeGreaterThanOrEqual(24)
    expect(new Set(rows.map((row) => row[3].trim())).size).toBe(6)
    for (const row of rows) expect(index.nodeById.get(row[1])?.period?.start).toBe(Number(row[4]))
  })

  it('keeps the confidence audit and its retained references aligned with the graph', () => {
    const festivals = graph.nodes.filter((node) => node.type === 'festival')
    expect(sourceAudit.festivals.map((row) => row.id).sort()).toEqual(festivals.map((node) => node.id).sort())
    for (const row of sourceAudit.festivals) {
      const node = index.nodeById.get(row.id)!
      expect(row.confidence, row.id).toBe(node.confidence)
      expect(row.sourceCount, row.id).toBe(node.sources?.length)
      expect(row.sources, row.id).toEqual(node.sources)
      expect(new Set(node.sources).size, row.id).toBeGreaterThanOrEqual(2)
      expect(row.assessment.trim(), row.id).not.toBe('')
    }
    const associations = graph.edges.filter((edge) => edge.type === 'festival_related')
    expect(sourceAudit.relationships.map((row) => row.id).sort()).toEqual(associations.map((edge) => edge.id).sort())
    for (const row of sourceAudit.relationships) {
      const edge = associations.find((edge) => edge.id === row.id)!
      expect(row.confidence, row.id).toBe(edge.confidence)
      expect(row.sources, row.id).toEqual(edge.sources)
    }
    const retired = new Set(sourceAudit.retiredReferences.map((row) => row.url))
    for (const source of [...festivals, ...associations].flatMap((item) => item.sources ?? [])) {
      expect(retired.has(source), source).toBe(false)
    }
  })

  it('distinguishes ancient festival precedents from conventionally dated surviving festivals', () => {
    expect(index.nodeById.get('festival:pythian-games')).toMatchObject({
      confidence: 'medium', period: { start: -582, end: 424, estimated: true, precision: 'circa' },
    })
    expect(index.nodeById.get('festival:three-choirs')).toMatchObject({
      confidence: 'medium', period: { start: 1715, estimated: true, precision: 'circa' },
    })
    for (const id of ['festival:pythian-games', 'festival:three-choirs']) {
      expect(index.nodeById.get(id)?.period?.estimateNote).toBeTruthy()
      expect(groupedRelations(index, id).some((group) => group.entries.some(({ node }) => node.type === 'place'))).toBe(true)
    }
    expect(searchNodes(graph, 'Pythian Games')[0]?.node.id).toBe('festival:pythian-games')
    expect(searchNodes(graph, 'Three Choirs')[0]?.node.id).toBe('festival:three-choirs')
  })

  it.each([
    ['woodstock', 1969],
    ['monterey-pop', 1967],
  ])('bounds the original %s gathering instead of implying continuing operation', (slug, year) => {
    expect(index.nodeById.get(`festival:${slug}`)?.period).toMatchObject({ start: year, end: year })
    expect(index.nodeById.get(`event:${slug === 'woodstock' ? 'woodstock-festival' : 'monterey-pop-festival'}`)?.type).toBe('event')
  })

  it.each([
    ['track:like-a-rolling-stone-bob-dylan', 'newport-folk', 1965],
    ['instrument:electric-guitar', 'newport-folk', 1965],
    ['artist:nirvana', 'reading', 1992],
    ['artist:carl-craig', 'movement-detroit', 2000],
    ['artist:bhimsen-joshi', 'sawai-gandharva', 1953],
    ['artist:massive-attack', 'baalbeck', 2004],
    ['genre:taarab', 'sauti-za-busara', undefined],
    ['scene:new-orleans-jazz-scene', 'new-orleans-jazz-heritage', undefined],
  ])('preserves the documented connection from %s to %s', (entity, festival, year) => {
    const connection = index.outEdges.get(entity)?.find((edge) =>
      edge.type === 'festival_related' && edge.to === `festival:${festival}`,
    )
    expect(connection?.sources?.length).toBeGreaterThan(0)
    if (year !== undefined) expect(connection?.period).toMatchObject({ start: year, end: year })
    expect(groupedRelations(index, entity).flatMap((group) => group.entries).map(({ node }) => node.id))
      .toContain(`festival:${festival}`)
  })

  it('keeps festivals connected, searchable, and outside dedicated timeline modes', () => {
    const festivals = graph.nodes.filter((node) => node.type === 'festival')
    expect(festivals.length).toBeGreaterThanOrEqual(10)
    for (const festival of festivals) {
      expect(festival.sources?.length, festival.id).toBeGreaterThan(0)
      expect(festival.description, festival.id).toBeTruthy()
      expect(Number.isFinite(festival.period?.start), festival.id).toBe(true)
      expect(festival.family, festival.id).toBeUndefined()
      expect(festival.phases, festival.id).toBeUndefined()
      expect(groupedRelations(index, festival.id).length, festival.id).toBeGreaterThan(0)
      expect(searchNodes(graph, festival.name).map(({ node }) => node.id)).toContain(festival.id)
    }
    for (const view of ['genre', 'artist', 'instrument', 'history'] as const) {
      expect(viewForNode('festival', view)).toBe(view)
    }
  })

  it('requires cited, explained associations directed from an entity to a festival', () => {
    for (const edge of graph.edges) {
      const from = index.nodeById.get(edge.from)!
      const to = index.nodeById.get(edge.to)!
      if (edge.type !== 'festival_related' && from.type !== 'festival' && to.type !== 'festival') continue
      expect(edge.type, edge.id).toBe('festival_related')
      expect(to.type, edge.id).toBe('festival')
      expect(edge.note?.trim(), edge.id).toBeTruthy()
      expect(edge.confidence, edge.id).toBeTruthy()
      expect(edge.sources?.length, edge.id).toBeGreaterThan(0)
      for (const source of edge.sources ?? []) expect(new URL(source).protocol).toBe('https:')
    }
  })

  it('preserves edition-specific appearances and the existing Gnaoua founding event', () => {
    expect(groupedRelations(index, 'artist:aphex-twin')).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'festival_related', entries: expect.arrayContaining([
        expect.objectContaining({
          node: expect.objectContaining({ id: 'festival:fuji-rock' }),
          edge: expect.objectContaining({ period: { start: 1997, end: 1997, precision: 'year' } }),
        }),
      ]) }),
    ]))
    expect(index.nodeById.get('event:essaouira-gnawa-festival')?.type).toBe('event')
    expect(groupedRelations(index, 'event:essaouira-gnawa-festival')).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'festival_related' }),
    ]))
  })
})

describe('festival details evidence boundary', () => {
  it.each<NodeType>(['genre', 'artist', 'instrument', 'label', 'place', 'track', 'scene', 'event', 'festival'])(
    'allows a cited festival connection from %s and hides missing or invalid citations in both directions',
    (type) => {
      const fixture: MusicGraph = {
        version: 1,
        nodes: [
          { id: `${type}:entity`, type, name: 'Related entity' },
          { id: 'festival:example', type: 'festival', name: 'Example festival' },
        ],
        edges: [{ id: 'connection', type: 'festival_related', from: `${type}:entity`, to: 'festival:example' }],
      }
      for (const sources of [undefined, [], [''], ['invalid'], ['http://example.com/evidence']]) {
        fixture.edges[0].sources = sources
        const fixtureIndex = buildIndex(fixture)
        expect(groupedRelations(fixtureIndex, `${type}:entity`)).toEqual([])
        expect(groupedRelations(fixtureIndex, 'festival:example')).toEqual([])
      }
      fixture.edges[0].sources = ['https://example.com/programme']
      const fixtureIndex = buildIndex(fixture)
      expect(groupedRelations(fixtureIndex, `${type}:entity`)[0].entries[0].node.id).toBe('festival:example')
      expect(groupedRelations(fixtureIndex, 'festival:example')[0].entries[0].node.id).toBe(`${type}:entity`)
    },
  )
})
