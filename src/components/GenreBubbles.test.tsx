import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { buildIndex } from '../graph/graph.ts'
import { createTimelineModel } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import { GenreBubbles } from './GenreBubbles.tsx'

const graph: MusicGraph = {
  version: 1,
  nodes: ['A', 'B', 'C', 'D'].map((name) => ({
    id: `genre:${name}`, name, type: 'genre', family: 'jazz', period: { start: 1900 },
  })),
  edges: [
    { id: 'ab', type: 'derived_from', from: 'genre:B', to: 'genre:A' },
    { id: 'bc', type: 'influences', from: 'genre:B', to: 'genre:C' },
    { id: 'ad', type: 'subgenre_of', from: 'genre:D', to: 'genre:A' },
  ],
}

function renderBubbles(selectedId: string | null) {
  const index = buildIndex(graph)
  return renderToStaticMarkup(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, 'genre'), view: 'genre',
      selectedId, selectNode: vi.fn(), changeView: vi.fn(),
      order: 'family', changeOrder: vi.fn(),
      genreDisplay: 'bubbles', changeGenreDisplay: vi.fn(), goHome: vi.fn(),
      historyFilters: { category: 'all', landmarksOnly: false }, changeHistoryFilters: vi.fn(),
      viewRange: [1948, 2026], setViewRange: vi.fn(),
    }}>
      <GenreBubbles />
    </ExplorerContext.Provider>,
  )
}

function bubbleMarkup(markup: string, name: string) {
  return markup.match(new RegExp(`<button\\b[^>]*aria-label="${name} [^"]*"[^>]*>`))?.[0]
}

describe('bubble lineage rendering', () => {
  it('uses a compact map with floating, touch-sized zoom controls instead of a title or subtitle', () => {
    const markup = renderBubbles(null)
    expect(markup).not.toContain('<h2')
    expect(markup).not.toMatch(/<p(?:\s|>)/)
    expect(markup).not.toContain('A world of influence')
    expect(markup).toContain('aria-label="Bubble zoom" class="absolute right-3 top-3')
    expect(markup).toContain('touch-none')
    expect(markup).toContain('Pinch or Cmd/Ctrl+scroll to zoom.')
    for (const label of ['Zoom out bubbles', 'Zoom in bubbles']) {
      expect(markup.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0])
        .toContain('h-11 w-11')
    }
  })

  it('leaves the full map visible without a selection and never scales individual bubbles', () => {
    const markup = renderBubbles(null)
    for (const name of ['A', 'B', 'C', 'D']) {
      expect(bubbleMarkup(markup, name)).toContain('opacity:1')
      expect(bubbleMarkup(markup, name)).not.toContain('scale')
      expect(bubbleMarkup(markup, name)).toContain('class="visualization-item genre-bubble ')
    }
    expect(markup).not.toContain('data-bubble-link')
  })

  it('matches bar selection styling and dims unrelated branches to 20 percent', () => {
    const markup = renderBubbles('genre:B')
    for (const name of ['A', 'B', 'C']) {
      expect(bubbleMarkup(markup, name)).toContain('opacity:1')
    }
    expect(bubbleMarkup(markup, 'D')).toContain('opacity:0.2')
    expect(bubbleMarkup(markup, 'B')).toContain('aria-pressed="true"')
    expect(bubbleMarkup(markup, 'B')).toContain('border-color:#f8fafc')
    expect(bubbleMarkup(markup, 'B')).toContain('border-width:1.5px')
    expect(bubbleMarkup(markup, 'B')).toContain('outline-style:auto')
    expect(bubbleMarkup(markup, 'B')).toContain('outline-width:5px')
    expect(bubbleMarkup(markup, 'B')).toContain('outline-color:-webkit-focus-ring-color')
    expect(bubbleMarkup(markup, 'B')).toContain('outline-offset:4px')
    expect(bubbleMarkup(markup, 'A')).not.toContain('outline-style:auto')
    expect(markup).toContain('data-bubble-link="ab"')
    expect(markup).toContain('data-bubble-link="bc"')
    expect(markup).not.toContain('data-bubble-link="ad"')
    expect(markup).not.toMatch(/(?:NaN|Infinity)/)
  })

  it('keeps every bubble in place when selecting or clearing a genre', () => {
    const overview = renderBubbles(null)
    const focused = renderBubbles('genre:B')
    const anotherSelection = renderBubbles('genre:A')
    const cleared = renderBubbles(null)
    const position = (markup: string, name: string) => {
      const match = bubbleMarkup(markup, name)?.match(/left:([^;]+);top:([^;]+);/)
      if (!match) throw new Error(`Missing position for ${name}`)
      return match.slice(1)
    }

    for (const name of ['A', 'B', 'C', 'D']) {
      expect(position(focused, name)).toEqual(position(overview, name))
      expect(position(anotherSelection, name)).toEqual(position(overview, name))
      expect(position(cleared, name)).toEqual(position(overview, name))
    }
  })
})
