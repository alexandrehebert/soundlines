import { describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { buildIndex } from '../graph/graph.ts'
import type { StatsTab } from '../graph/stats.ts'
import { createTimelineModel } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import type { Locale } from '../i18n/routing.ts'
import { renderWithIntl } from '../i18n/test-utils.tsx'
import { DatasetStats } from './DatasetStats.tsx'

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:jazz', type: 'genre', name: 'Jazz', family: 'jazz', period: { start: 1910 } },
    { id: 'artist:miles', type: 'artist', name: 'Miles Davis', kind: 'person', period: { start: 1944, end: 1991 } },
  ],
  edges: [{ id: 'e1', type: 'key_artist_of', from: 'artist:miles', to: 'genre:jazz', confidence: 'high' }],
}

function render(initialTab: StatsTab, reviewed = ['genre:jazz', 'e1'], locale: Locale = 'en') {
  const index = buildIndex(graph)
  return renderWithIntl(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, 'genre'), locale, view: 'genre',
      selectedId: null, selectNode: vi.fn(), changeView: vi.fn(),
      order: 'family', changeOrder: vi.fn(), genreDisplay: 'bars', changeGenreDisplay: vi.fn(), goHome: vi.fn(), isHome: false,
      historyFilters: { category: 'all', landmarksOnly: false }, changeHistoryFilters: vi.fn(),
      viewRange: [1900, 2000], setViewRange: vi.fn(),
    }}>
      <DatasetStats initialTab={initialTab} onClose={vi.fn()} review={{ reviewed, lastReviewed: '2026-11-03' }} />
    </ExplorerContext.Provider>,
    locale,
  )
}

describe('DatasetStats', () => {
  it('localizes the source-review experience in French', () => {
    const markup = render('review', ['genre:jazz', 'e1'], 'fr')
    expect(markup).toContain('Statistiques du catalogue')
    expect(markup).toContain('Vérification des sources')
    expect(markup).toContain('Toutes les entrées et tous les liens')
    expect(markup).toContain('Ensemble vérifié')
    expect(markup).toContain('Confiance après vérification')
    expect(markup).not.toContain('Reviewed overall')
    expect(markup).not.toContain('Source review')
  })

  it('renders an accessible dialog with the requested tab selected', () => {
    const markup = render('artist')
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toMatch(/aria-selected="true"[^>]*>.*?Artists/)
    expect(markup).toMatch(/<button[^>]*id="[^"]+-tab-review"[^>]*class="[^"]*\bml-auto\b[^"]*"/)
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

  it('reports source-review progress on the review tab', () => {
    const markup = render('review')
    expect(markup).toMatch(/aria-selected="true"[^>]*>.*?Source review/)
    expect(markup).toContain('Last review 2026-11-03')
    expect(markup).toContain('67%')
    expect(markup).toContain('aria-label="All entries and links: 2 of 3 reviewed"')
    expect(markup).toContain('Reviewed overall')
    expect(markup).not.toContain('Genres &amp; artists by family')
    expect(markup).toContain('Confidence after review')
    expect(markup.indexOf('aria-label="All entries and links: 2 of 3 reviewed"')).toBeLessThan(markup.indexOf('Reviewed overall'))
    expect(markup.indexOf('Reviewed overall')).toBeLessThan(markup.indexOf('Confidence after review'))
    expect(markup).toContain('In progress')
  })

  it('marks source review finished beside the progress bar when all items are reviewed', () => {
    const markup = render('review', ['genre:jazz', 'artist:miles', 'e1'])
    expect(markup).toContain('Review finished')
  })
})
