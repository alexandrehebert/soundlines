import { describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../../ExplorerContext.ts'
import { buildIndex } from '../../graph/graph.ts'
import type { StatsTab } from '../../graph/stats.ts'
import { createTimelineModel } from '../../graph/timeline.ts'
import type { MusicGraph } from '../../graph/types.ts'
import type { Locale } from '../../i18n/routing.ts'
import { renderWithIntl } from '../../i18n/test-utils.tsx'
import { PROJECT_SITE_URL, REPOSITORY_URL } from '../../projectLinks.ts'
import { DatasetStats } from './DatasetStats.tsx'

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:jazz', type: 'genre', name: 'Jazz', family: 'jazz', period: { start: 1910 }, sources: ['https://example.com/jazz'] },
    { id: 'artist:miles', type: 'artist', name: 'Miles Davis', kind: 'person', period: { start: 1944, end: 1991 } },
    { id: 'place:nowhere', type: 'place', name: 'Nowhere' },
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
    expect(markup).toContain('Ensemble vérifié')
    expect(markup).toContain('En cours')
    expect(markup).toContain('Confiance après vérification')
    expect(markup).toContain('Terminé')
    expect(markup).toContain('1 en attente')
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

  it('omits the confidence breakdown from the links tab', () => {
    const markup = render('links')
    expect(markup).toContain('By relation type')
    expect(markup).toContain('Key artist of')
    expect(markup).toContain('Confidence rated')
    expect(markup).not.toContain('High')
    expect(markup).not.toContain('Medium')
    expect(markup).not.toContain('Not rated')
  })

  it('shows cited sources on the links tab but not the review tab', () => {
    const links = render('links')
    const review = render('review')
    expect(links).toContain('Top cited sources')
    expect(links).toContain('example.com')
    expect(review).not.toContain('Most cited in reviewed items')
    expect(review).not.toContain('example.com')
    expect(review).toContain('Links by kind')
  })

  it('summarizes the whole dataset on the overview tab', () => {
    const markup = render('overview')
    expect(markup).toContain('Entries by type')
    expect(markup).toContain('Most connected entries')
    expect(markup).not.toContain('has no links yet')
  })

  it('notes entries without links on the review tab', () => {
    expect(render('review')).toContain('1 entry has no links yet.')
    expect(render('review', ['genre:jazz', 'e1'], 'fr')).toContain('1 entrée ne possède encore aucun lien.')
  })

  it('links the review tab to the sourcing method and repository', () => {
    const en = render('review')
    expect(en).toContain(`href="${PROJECT_SITE_URL}/en/graph/"`)
    expect(en).toContain('How sources are reviewed')
    expect(en).toContain(`href="${REPOSITORY_URL}"`)
    expect(en).toContain('GitHub repository')
    const fr = render('review', ['genre:jazz', 'e1'], 'fr')
    expect(fr).toContain(`href="${PROJECT_SITE_URL}/fr/graph/"`)
    expect(fr).toContain('Comment les sources sont vérifiées')
    expect(fr).toContain('Dépôt GitHub')
    expect(render('links')).not.toContain(`href="${REPOSITORY_URL}"`)
  })

  it('reports source-review progress on the review tab', () => {
    const markup = render('review')
    expect(markup).toMatch(/aria-selected="true"[^>]*>.*?Source review/)
    expect(markup).toContain('Last review 2026-11-03')
    expect(markup).toMatch(/50%<\/div><div[^>]*>Reviewed overall.*?2 \/ 4.*?In progress<\/div><\/div>/)
    expect(markup).not.toContain('role="progressbar"')
    expect(markup).not.toContain('Genres &amp; artists by family')
    expect(markup).toContain('Confidence after review')
    expect(markup.indexOf('Reviewed overall')).toBeLessThan(markup.indexOf('Confidence after review'))
    expect(markup).toContain('Genres')
    expect(markup).toContain('1 pending')
  })

  it('marks source review finished when all items are reviewed', () => {
    const markup = render('review', ['genre:jazz', 'artist:miles', 'place:nowhere', 'e1'])
    expect(markup).toMatch(/100%<\/div><div[^>]*>Reviewed overall.*?4 \/ 4.*?text-green-400.*?Review finished<\/div><\/div>/)
    expect(markup).toContain('Complete')
    expect(render('review', ['genre:jazz', 'artist:miles', 'place:nowhere', 'e1'], 'fr')).toContain('Vérification terminée')
  })
})
