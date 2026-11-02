import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { buildIndex } from '../graph/graph.ts'
import type { StatsTab } from '../graph/stats.ts'
import { createTimelineModel } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import { DatasetStats } from './DatasetStats.tsx'

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:jazz', type: 'genre', name: 'Jazz', family: 'jazz', period: { start: 1910 } },
    { id: 'artist:miles', type: 'artist', name: 'Miles Davis', kind: 'person', period: { start: 1944, end: 1991 } },
  ],
  edges: [{ id: 'e1', type: 'key_artist_of', from: 'artist:miles', to: 'genre:jazz', confidence: 'high' }],
}

function render(initialTab: StatsTab) {
  const index = buildIndex(graph)
  return renderToStaticMarkup(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, 'genre'), view: 'genre',
      selectedId: null, selectNode: vi.fn(), changeView: vi.fn(),
      order: 'family', changeOrder: vi.fn(), genreDisplay: 'bars', changeGenreDisplay: vi.fn(),
      viewRange: [1900, 2000], setViewRange: vi.fn(),
    }}>
      <DatasetStats initialTab={initialTab} onClose={vi.fn()} />
    </ExplorerContext.Provider>,
  )
}

describe('DatasetStats', () => {
  it('renders an accessible dialog with the requested tab selected', () => {
    const markup = render('artist')
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toMatch(/aria-selected="true"[^>]*>.*?Artists/)
    expect(markup).toContain('When artists emerged')
    expect(markup).toContain('Miles Davis')
    expect(markup).toContain('Individuals')
  })

  it('shows link confidence on the links tab', () => {
    const markup = render('links')
    expect(markup).toContain('By relation type')
    expect(markup).toContain('Key artist of')
    expect(markup).toContain('High')
  })

  it('summarizes the whole dataset on the overview tab', () => {
    const markup = render('overview')
    expect(markup).toContain('Entries by type')
    expect(markup).toContain('Most connected entries')
  })
})
