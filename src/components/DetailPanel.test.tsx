import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { buildIndex } from '../graph/graph.ts'
import { createTimelineModel } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import { DetailPanel } from './DetailPanel.tsx'

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:jazz', type: 'genre', name: 'Jazz',
      family: 'jazz', period: { start: 1900 },
      sources: ['https://example.com/Jazz'] },
    { id: 'artist:example', type: 'artist', name: 'Example artist', period: { start: 1942 },
      sources: ['https://example.com/Artist'] },
  ],
  edges: [
    { id: 'example-jazz', type: 'key_artist_of', from: 'artist:example',
      to: 'genre:jazz', confidence: 'high', note: 'A representative artist.',
      sources: ['https://example.com/Relationship'] },
  ],
}

function renderPanel(data: MusicGraph, selectedId: string) {
  const index = buildIndex(data)
  return renderToStaticMarkup(
    <ExplorerContext.Provider value={{
      index,
      model: createTimelineModel(index, 'genre'),
      view: 'genre',
      selectedId,
      selectNode: vi.fn(),
      changeView: vi.fn(),
      genreOrder: 'family',
      changeGenreOrder: vi.fn(),
      genreDisplay: 'bars',
      changeGenreDisplay: vi.fn(),
      viewRange: [1948, 2026],
      setViewRange: vi.fn(),
    }}>
      <DetailPanel />
    </ExplorerContext.Provider>,
  )
}

describe('detail panel sources', () => {
  it.each([
    ['genre:jazz', 'Jazz', 'Artist', 'Example artist'],
    ['artist:example', 'Artist', 'Jazz', 'Jazz'],
  ])('shows only sources of the selected %s', (id, source, otherSource, relatedName) => {
    const markup = renderPanel(graph, id)

    expect(markup).toContain(`href="https://example.com/${source}"`)
    expect(markup).not.toContain(`href="https://example.com/${otherSource}"`)
    expect(markup).not.toContain('https://example.com/Relationship')
    expect(markup.match(/<a /g)).toHaveLength(1)
    expect(markup).toContain(relatedName)
    expect(markup).toContain('Confidence: high')
    expect(markup).toContain('A representative artist.')
  })

  it.each([undefined, []])('omits the sources section when selected sources are %j', (sources) => {
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => ({ ...node, sources })),
    }
    const markup = renderPanel(data, 'genre:jazz')

    expect(markup).not.toContain('Sources')
    expect(markup).not.toContain('<a ')
    expect(markup).toContain('Example artist')
  })

  it('displays the website next to each source link, including trailing-slash and homepage URLs', () => {
    const sources = [
      'https://en.wikipedia.org/wiki/B._B._King',
      'https://www.allmusic.com/artist/bb-king',
      'https://www.loc.gov/collections/story/',
      'https://ra.co/',
      'https://en.wikipedia.org/wiki/Fran%C3%A7ois_Couperin',
    ]
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => node.id === 'genre:jazz' ? { ...node, sources } : node),
    }
    const markup = renderPanel(data, 'genre:jazz')
    const links = [...markup.matchAll(/<a\b[^>]*>.*?<\/a>/g)].map(([link]) => link)

    expect(links).toHaveLength(sources.length)
    for (const [index, title, website] of [
      [0, 'B. B. King', 'en.wikipedia.org'],
      [1, 'bb-king', 'allmusic.com'],
      [2, 'story', 'loc.gov'],
      [3, 'Website', 'ra.co'],
      [4, 'François Couperin', 'en.wikipedia.org'],
    ] as const) {
      expect(links[index]).toContain(`href="${sources[index]}"`)
      expect(links[index]).toContain(`>${title}</span>`)
      expect(links[index]).toContain(`> (${website})</span>`)
      expect(links[index]).toContain('target="_blank"')
    }
  })
})
