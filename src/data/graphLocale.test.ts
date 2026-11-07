import { describe, expect, it } from 'vitest'
import englishGraph from './graph.json'
import { frenchGraphTranslation, graphForLocale, translateGraph, type GraphTranslation } from './graphLocale.ts'
import type { MusicGraph } from '../graph/types.ts'

function withoutTranslatedText(graph: MusicGraph): MusicGraph {
  const copy = structuredClone(graph)
  for (const node of copy.nodes) {
    node.name = ''
    delete node.description
    delete node.phaseNote
    if (node.period) delete node.period.estimateNote
    if (node.period === undefined) delete node.period
    if (node.phases === undefined) delete node.phases
    for (const phase of node.phases ?? []) delete phase.note
  }
  for (const edge of copy.edges) {
    delete edge.note
    if (edge.period) delete edge.period.estimateNote
  }
  return copy
}

describe('localized graph overlays', () => {
  it('translates text without changing graph entities or relationships', () => {
    const english = graphForLocale('en-US')
    const french = graphForLocale('fr')

    expect(withoutTranslatedText(french)).toStrictEqual(withoutTranslatedText(english))
    expect(french.nodes.find((node) => node.id === 'artist:fela-kuti')).toMatchObject({
      name: 'Fela Kuti',
      description: expect.stringContaining('Compositeur, chef d’orchestre'),
    })
    expect(french.nodes.find((node) => node.id === 'event:napster-launch')?.name)
      .toBe('Napster popularise le partage de musique de pair à pair')
    expect(french.nodes.find((node) => node.id === 'genre:jazz')).toMatchObject({
      name: 'Jazz',
      description: expect.stringContaining('Musique afro-américaine'),
    })
    expect(french.nodes.find((node) => node.id === 'artist:3-steps-ahead')).toMatchObject({
      description: expect.stringContaining('néerlandais'),
      phaseNote: expect.stringContaining('3 Steps Ahead'),
    })
    expect(french.nodes.find((node) => node.id === 'artist:ahn-sook-sun')?.period?.estimateNote)
      .toContain('55 ans')
    expect(french.nodes.find((node) => node.id === 'artist:aretha-franklin')?.phases)
      .toContainEqual(expect.objectContaining({ start: 1967, note: expect.stringContaining('Atlantic') }))
    expect(french.nodes.find((node) => node.id === 'event:afm-recording-ban-start')?.name)
      .toContain('interdiction d’enregistrer')
  })

  it('translates node, phase, period, and relationship text without changing graph structure', () => {
    const graph: MusicGraph = {
      version: 1,
      nodes: [{
        id: 'genre:example',
        type: 'genre',
        name: 'Example',
        description: 'Description',
        period: { start: 1900, estimated: true, estimateNote: 'Estimate' },
        phaseNote: 'Phase summary',
        phases: [{ start: 1900, prominence: 'emerging', note: 'Phase note' }],
      }],
      edges: [{
        id: 'edge:example',
        type: 'influences',
        from: 'genre:example',
        to: 'genre:example',
        period: { start: 1900, estimateNote: 'Edge estimate' },
        note: 'Relationship note',
      }],
    }
    const translated = translateGraph(graph, {
      nodes: {
        'genre:example': {
          name: 'Exemple',
          description: 'Description française',
          estimateNote: 'Estimation',
          phaseNote: 'Résumé des phases',
          phaseNotes: { '1900': 'Note de phase' },
        },
      },
      edges: {
        'edge:example': { note: 'Note de relation', estimateNote: 'Estimation de la relation' },
      },
    })

    expect(translated.nodes[0]).toEqual({
      ...graph.nodes[0],
      name: 'Exemple',
      description: 'Description française',
      period: { start: 1900, estimated: true, estimateNote: 'Estimation' },
      phaseNote: 'Résumé des phases',
      phases: [{ start: 1900, prominence: 'emerging', note: 'Note de phase' }],
    })
    expect(translated.edges[0]).toEqual({
      ...graph.edges[0],
      period: { start: 1900, estimateNote: 'Estimation de la relation' },
      note: 'Note de relation',
    })
    expect(graph.edges[0].note).toBe('Relationship note')
    expect(graph.nodes[0].period?.estimateNote).toBe('Estimate')
    expect(graph.nodes[0].phases?.[0].note).toBe('Phase note')
  })

  it('covers every node descriptive text field in the French overlay', () => {
    const translations = frenchGraphTranslation()
    const missing: string[] = []
    for (const node of (englishGraph as MusicGraph).nodes) {
      const translation = translations.nodes[node.id]
      const requireTranslation = (value: string | undefined, field: string) => {
        if (!value?.trim()) missing.push(`${node.id}.${field}`)
      }

      if (['event', 'instrument', 'place', 'scene'].includes(node.type)) {
        requireTranslation(translation?.name, 'name')
      }
      if (node.description) requireTranslation(translation?.description, 'description')
      if (node.phaseNote) requireTranslation(translation?.phaseNote, 'phaseNote')
      if (node.period?.estimateNote) requireTranslation(translation?.estimateNote, 'estimateNote')
      for (const phase of node.phases ?? []) {
        if (phase.note) requireTranslation(translation?.phaseNotes?.[String(phase.start)], `phaseNotes.${phase.start}`)
      }
    }

    expect(missing).toEqual([])
  })

  it('uses French graph labels while preserving artist and recording names', () => {
    const french = graphForLocale('fr')
    const names = new Map(french.nodes.map((node) => [node.id, node.name]))
    expect(names.get('instrument:drum-kit')).toBe('Batterie')
    expect(names.get('instrument:french-horn')).toBe('Cor d’harmonie')
    expect(names.get('place:london')).toBe('Londres')
    expect(names.get('genre:alternative-rock')).toBe('Rock alternatif')
    for (const node of (englishGraph as MusicGraph).nodes) {
      if (node.type === 'artist' || node.type === 'track') {
        expect(names.get(node.id)).toBe(node.name)
      }
    }
  })

  it('covers every relationship note and period estimate in French', () => {
    const translations = frenchGraphTranslation()
    const missing: string[] = []
    for (const edge of (englishGraph as MusicGraph).edges) {
      const translation = translations.edges[edge.id]
      if (edge.note && !translation?.note?.trim()) missing.push(`${edge.id}.note`)
      if (edge.period?.estimateNote && !translation?.estimateNote?.trim()) {
        missing.push(`${edge.id}.estimateNote`)
      }
    }
    expect(missing).toEqual([])
  })

  it('preserves untranslated source entries and reports invalid translation ids', () => {
    const english = englishGraph as MusicGraph
    const artist = english.nodes.find((node) => node.id === 'artist:fela-kuti')
    if (!artist) throw new Error('Expected the Fela Kuti node to exist in the source graph')
    const miniGraph: MusicGraph = {
      version: 1,
      nodes: [artist],
      edges: [],
    }
    const translation: GraphTranslation = {
      nodes: { 'artist:missing': { name: 'Entrée inconnue' } },
      edges: {},
    }

    expect(() => translateGraph(miniGraph, translation))
      .toThrow('French graph translation references unknown node artist:missing')
  })

  it('rejects an edge estimate translation when the edge has no period', () => {
    const graph: MusicGraph = {
      version: 1,
      nodes: [],
      edges: [{ id: 'edge:example', type: 'influences', from: 'a', to: 'b' }],
    }

    expect(() => translateGraph(graph, {
      nodes: {},
      edges: { 'edge:example': { estimateNote: 'Estimation' } },
    })).toThrow('French estimate-note translation references edge without a period edge:example')
  })
})
