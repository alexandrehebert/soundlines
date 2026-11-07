import { describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { graphForLocale } from '../data/graphLocale.ts'
import { buildIndex } from '../graph/graph.ts'
import { createTimelineModel } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import type { Locale } from '../i18n/routing.ts'
import { renderWithIntl } from '../i18n/test-utils.tsx'
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

function renderPanel(data: MusicGraph, selectedId: string, showCloseButton = true, locale: Locale = 'en') {
  const index = buildIndex(data)
  return renderWithIntl(
    <ExplorerContext.Provider value={{
      index,
      model: createTimelineModel(index, 'genre'),
      locale,
      view: 'genre',
      selectedId,
      selectNode: vi.fn(),
      changeView: vi.fn(),
      order: 'family',
      changeOrder: vi.fn(),
      genreDisplay: 'bars',
      changeGenreDisplay: vi.fn(), goHome: vi.fn(), isHome: false,
      historyFilters: { category: 'all', landmarksOnly: false }, changeHistoryFilters: vi.fn(),
      viewRange: [1948, 2026],
      setViewRange: vi.fn(),
    }}>
      <DetailPanel showCloseButton={showCloseButton} />
    </ExplorerContext.Provider>,
    locale,
  )
}

describe('detail panel sources', () => {
  it('shows festival relationship citations in both panels and omits an unsourced festival', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: [...graph.nodes,
        { id: 'festival:example', type: 'festival', name: 'Cited festival' },
        { id: 'festival:uncited', type: 'festival', name: 'Uncited festival' },
      ],
      edges: [...graph.edges,
        { id: 'festival:cited', type: 'festival_related', from: 'genre:jazz', to: 'festival:example',
          note: 'A documented jazz programme.', sources: ['https://example.com/Festival-programme'] },
        { id: 'festival:uncited', type: 'festival_related', from: 'genre:jazz', to: 'festival:uncited' },
      ],
    }
    const entityPanel = renderPanel(data, 'genre:jazz')
    expect(entityPanel).toContain('Cited festival')
    expect(entityPanel).toContain('festivals')
    expect(entityPanel).toContain('href="https://example.com/Festival-programme"')
    expect(entityPanel).not.toContain('Uncited festival')
    const festivalPanel = renderPanel(data, 'festival:example')
    expect(festivalPanel).toContain('connected entities')
    expect(festivalPanel).toContain('Jazz')
    expect(festivalPanel).toContain('href="https://example.com/Festival-programme"')
    expect(renderPanel(data, 'festival:example', true, 'fr')).toContain('entités liées')
  })

  it('localizes source links without a page title', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => ({ ...node, sources: ['https://example.com/'] })),
    }
    expect(renderPanel(data, 'genre:jazz', true, 'fr')).toContain('Site web')
    expect(renderPanel(data, 'genre:jazz')).toContain('Website')
  })
  it('keeps the normal close action in the top-right and allows a sheet to provide its own', () => {
    const normal = renderPanel(graph, 'genre:jazz')
    const closeButton = normal.match(/<button\b[^>]*aria-label="Close panel"[^>]*>/)?.[0]
    expect(closeButton).toContain('absolute right-1 top-1')
    expect(closeButton).toContain('h-11 w-11')
    const withoutCloseButton = renderPanel(graph, 'genre:jazz', false)
    expect(withoutCloseButton).not.toContain('aria-label="Close panel"')
    expect(withoutCloseButton).toContain('Jazz')
  })

  it('localizes panel controls and graph labels in French', () => {
    const markup = renderPanel(graph, 'genre:jazz', true, 'fr')
    expect(markup).toContain('aria-label="Fermer le panneau"')
    expect(markup).toContain('title="Écouter Jazz"')
    expect(markup).toContain('aria-label="À propos de cet extrait audio"')
    expect(markup).toContain('1900 – aujourd’hui')
    expect(markup).toContain('artistes clés')
    expect(markup).not.toContain('Close panel')
  })

  it('labels estimated periods and explains their evidence without implying a prominence curve', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => node.id === 'genre:jazz' ? {
        ...node, period: {
          start: 1900, estimated: true, precision: 'decade',
          estimateNote: 'Broad historical context, not a verified inception year.',
        },
      } : node),
    }
    const markup = renderPanel(data, 'genre:jazz')
    expect(markup).toContain('1900 – now (estimated)')
    expect(markup).toContain('Estimated period: Broad historical context, not a verified inception year.')
    expect(markup).not.toContain('Historical prominence')
    expect(markup).toContain('href="https://example.com/Jazz"')
  })

  it.each([
    ['en', 'c. 586 BCE – 582 BCE', 'Estimated period: The 586–582 BCE range'],
    ['fr', 'vers 586 AEC – 582 AEC', 'Période estimée : La période 586–582'],
  ] as const)('shows the Pythian date range and its explanation in %s', (locale, date, explanation) => {
    const source = graphForLocale(locale)
    const data: MusicGraph = {
      ...source,
      nodes: source.nodes.filter((node) => node.id === 'event:pythian-games-panhellenic-reorganisation'),
      edges: [],
    }
    expect(data.nodes).toHaveLength(1)
    const markup = renderPanel(data, 'event:pythian-games-panhellenic-reorganisation', true, locale)
    expect(markup).toContain(date)
    expect(markup).toContain(explanation)
    expect(markup).not.toContain(`${date} (`)
  })

  it.each([undefined, null])('explains an undated entry and retains its sources and relationships (%s)', (period) => {
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => node.id === 'genre:jazz' ? {
        ...node, period, phases: [], phaseNote: 'No single origin date is supported.',
      } : node),
    }
    const markup = renderPanel(data, 'genre:jazz')
    expect(markup).toContain('No period specified')
    expect(markup).toContain('No single origin date is supported.')
    expect(markup).toContain('Example artist')
    expect(markup).toContain('href="https://example.com/Jazz"')
  })

  it('shows the editorial explanation for a dated entry without prominence phases', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => node.id === 'genre:jazz' ? {
        ...node, phases: [], phaseNote: 'A breakthrough is documented, but no complete curve is assigned.',
      } : node),
    }
    const markup = renderPanel(data, 'genre:jazz')

    expect(markup).toContain('A breakthrough is documented, but no complete curve is assigned.')
    expect(markup).not.toContain('Historical prominence')
    expect(markup).toContain('href="https://example.com/Jazz"')
  })

  it('distinguishes entry-level confidence from phase and relationship confidence', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => node.id === 'genre:jazz' ? {
        ...node, confidence: 'medium',
      } : node),
    }
    const markup = renderPanel(data, 'genre:jazz')

    expect(markup).toContain('title="Overall editorial confidence in this entry; individual claims and phases may differ."')
    expect(markup).toContain('Entry confidence:')
    expect(markup).toContain('>medium</span>')
    expect(markup).toContain('title="Confidence: high"')
  })

  it('shows phase-specific confidence, notes, and sources alongside the editorial summary', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => node.id === 'genre:jazz' ? {
        ...node,
        phases: [
          {
            start: 1900, prominence: 'emerging', confidence: 'medium',
            note: 'A documented transition.', sources: ['https://example.com/Phase'],
          },
          { start: 1920, prominence: 'established' },
        ],
        phaseNote: 'Editorial shading, not a measured ranking.',
      } : node),
    }
    const markup = renderPanel(data, 'genre:jazz')

    expect(markup).toContain('title="Phase confidence: medium"')
    expect(markup).toContain('Confidence: medium')
    expect(markup.match(/title="Phase confidence:/g)).toHaveLength(1)
    expect(markup).toContain('A documented transition.')
    expect(markup).toContain('href="https://example.com/Phase"')
    expect(markup).toContain('Editorial shading, not a measured ranking.')
    expect(markup).toContain('Continuing')
    expect(markup).not.toContain('undefined')
  })

  it('shows event category, landmark status, approximate dates, and graph links', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: [...graph.nodes, {
        id: 'event:example', type: 'event', name: 'Example event', category: 'society',
        significance: 'landmark', period: { start: 1910, end: 1970, precision: 'decade' },
        sources: ['https://example.com/Event'],
      }],
      edges: [...graph.edges, {
        id: 'event-jazz', type: 'shaped', from: 'event:example', to: 'genre:jazz',
      }],
    }
    const markup = renderPanel(data, 'event:example')
    expect(markup).toContain('Society &amp; migration')
    expect(markup).toContain('Landmark')
    expect(markup).toContain('1910 – 1970 (approx.)')
    expect(markup).toContain('Jazz')
    expect(markup).toContain('href="https://example.com/Event"')
  })

  it.each([
    ['genre:jazz', 'Jazz', 'Artist', 'Example artist'],
    ['artist:example', 'Artist', 'Jazz', 'Jazz'],
  ])('shows only sources of the selected %s', (id, source, otherSource, relatedName) => {
    const markup = renderPanel(graph, id)

    expect(markup).toContain(`href="https://example.com/${source}"`)
    expect(markup).not.toContain(`href="https://example.com/${otherSource}"`)
    expect(markup).not.toContain('https://example.com/Relationship')
    const previewInfo = 'aria-label="About this audio preview"'
    if (id.startsWith('genre:')) {
      expect(markup).toContain(previewInfo)
      expect(markup).toContain('href="https://ace-step.github.io/ACE-Step-1.5/"')
      expect(markup).toContain('preview · 10 seconds')
    } else {
      expect(markup).not.toContain(previewInfo)
    }
    expect(markup.match(/<a /g)).toHaveLength(id.startsWith('genre:') ? 2 : 1)
    expect(markup).toContain(relatedName)
    expect(markup).toContain('Confidence: high')
    expect(markup).toContain('A representative artist.')
  })

  it('shows a colored icon for related instruments', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: [...graph.nodes, {
        id: 'instrument:flute', type: 'instrument', name: 'Flute',
      }],
      edges: [...graph.edges, {
        id: 'jazz-flute', type: 'featured_in', from: 'genre:jazz', to: 'instrument:flute',
      }],
    }

    const markup = renderPanel(data, 'genre:jazz')

    expect(markup).toContain('Flute')
    expect(markup).toContain('instrument-icons/flute.svg')
    expect(markup).toContain('aria-hidden="true"')
  })

  it.each([undefined, []])('omits the sources section when selected sources are %j', (sources) => {
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => ({ ...node, sources })),
    }
    const markup = renderPanel(data, 'genre:jazz')

    expect(markup).not.toContain('Sources')
    expect(markup.match(/<a /g)).toHaveLength(1)
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
    const sourcesSection = markup.slice(markup.indexOf('Sources'))
    const links = [...sourcesSection.matchAll(/<a\b[^>]*>.*?<\/a>/g)].map(([link]) => link)

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
