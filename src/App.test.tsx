import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { Explorer, ViewToggle } from './App.tsx'
import { ExplorerContext } from './ExplorerContext.ts'
import { DatasetStats } from './components/DatasetStats.tsx'
import { buildIndex } from './graph/graph.ts'
import { createTimelineModel } from './graph/timeline.ts'
import type { MusicGraph } from './graph/types.ts'

vi.mock('./components/SearchBar.tsx', () => ({ SearchBar: () => null }))

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:jazz', type: 'genre', name: 'Jazz', family: 'jazz', period: { start: 1900 } },
    { id: 'artist:a', type: 'artist', name: 'Artist A', period: { start: 1950 } },
    { id: 'artist:b', type: 'artist', name: 'Artist B', period: { start: 1960 } },
    { id: 'instrument:a', type: 'instrument', name: 'Instrument A', family: 'strings', period: { start: 1800 } },
    { id: 'instrument:b', type: 'instrument', name: 'Instrument B', family: 'winds', period: { start: 1800 } },
    { id: 'instrument:c', type: 'instrument', name: 'Instrument C', family: 'brass', period: { start: 1800 } },
  ],
  edges: [
    { id: 'e1', type: 'key_artist_of', from: 'artist:a', to: 'genre:jazz' },
    { id: 'e2', type: 'key_artist_of', from: 'artist:b', to: 'genre:jazz' },
    { id: 'e3', type: 'plays', from: 'artist:a', to: 'instrument:a' },
    { id: 'e4', type: 'plays', from: 'artist:b', to: 'instrument:b' },
  ],
}

function render(graph: MusicGraph, children: ReactNode) {
  const index = buildIndex(graph)
  return renderToStaticMarkup(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, 'genre'), view: 'genre',
      selectedId: null, selectNode: vi.fn(), changeView: vi.fn(),
      order: 'family', changeOrder: vi.fn(), genreDisplay: 'bars', changeGenreDisplay: vi.fn(), goHome: vi.fn(),
      historyFilters: { category: 'all', landmarksOnly: false }, changeHistoryFilters: vi.fn(),
      viewRange: [1900, 2000], setViewRange: vi.fn(),
    }}>
      {children}
    </ExplorerContext.Provider>,
  )
}

describe('Explorer header statistics', () => {
  it.each([
    ['with links', graph],
    ['without links', { ...graph, edges: [] }],
  ])('shows entity counts but no link count %s', (_description, graph) => {
    const markup = render(graph, <Explorer />)
    const header = markup.match(/<header\b[\s\S]*?<\/header>/)?.[0]

    expect(header).toBeDefined()
    expect(header).toContain('aria-label="1 genres – show dataset statistics"')
    expect(header).toContain('aria-label="2 artists – show dataset statistics"')
    expect(header).toContain('aria-label="3 instruments – show dataset statistics"')
    expect(header).toContain('>1</strong> genres')
    expect(header).toContain('>2</strong> artists')
    expect(header).toContain('>3</strong> instruments')
    expect(header).not.toMatch(/\blinks\b/i)
  })

  it('keeps link counts in the statistics dialog', () => {
    const markup = render(graph, <DatasetStats initialTab="links" onClose={vi.fn()} />)
    expect(markup).toContain('6 entries and 4 links')
    expect(markup).toContain('By relation type')
  })
})

describe('view toggle', () => {
  it('spaces mobile options from the view list and hides its label below the small breakpoint', () => {
    const markup = render(graph, <Explorer />)
    const mobileNavigation = markup.match(/<div class="[^"]*\bmd:hidden"[^>]*><div[^>]*role="radiogroup"[\s\S]*?aria-label="Timeline options and legend"[\s\S]*?<\/button><\/div>/)?.[0]

    expect(mobileNavigation).toBeDefined()
    expect(mobileNavigation).toMatch(/^<div class="[^"]*\bgap-2\b/)
    expect(mobileNavigation).toMatch(/<button[^>]*class="[^"]*\bshrink-0\b[^"]*"[^>]*aria-label="Timeline options and legend"/)
    expect(mobileNavigation).toContain('<span class="hidden sm:inline">Options</span>')
  })

  it('includes History as the selected fourth view', () => {
    const markup = renderToStaticMarkup(<ViewToggle view="history" changeView={vi.fn()} />)
    const buttons = markup.match(/<button\b[^>]*role="radio"[^>]*>[\s\S]*?<\/button>/g) ?? []
    expect(buttons).toHaveLength(4)
    const selected = buttons.filter((button) => button.includes('aria-checked="true"'))
    expect(selected).toHaveLength(1)
    expect(selected[0]).toContain('History')
    expect(markup).toContain('Genres')
    expect(markup).toContain('Artists')
    expect(markup).toContain('Instruments')
  })
})
