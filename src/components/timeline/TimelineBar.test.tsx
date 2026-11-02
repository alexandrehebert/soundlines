import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../../ExplorerContext.ts'
import { buildIndex } from '../../graph/graph.ts'
import { yearToX, type TimeScale } from '../../graph/layout.ts'
import { intensityStops, visibilityStops } from '../../graph/phases.ts'
import { createTimelineModel } from '../../graph/timeline.ts'
import type { GraphNode } from '../../graph/types.ts'
import { TimelineBar } from './TimelineBar.tsx'
import type { BarPosition, OffscreenIndicator } from './geometry.ts'

function renderBar(node: GraphNode, selected: boolean, indicator?: OffscreenIndicator, position?: Partial<BarPosition>,
  scale: TimeScale = { start: 1948, end: 2026, width: 800 }) {
  const index = buildIndex({ version: 1, nodes: [node], edges: [] })
  const view = node.type === 'artist' ? 'artist' : 'genre'
  const bar: BarPosition = {
    node, start: 1960, end: 2026, x1: 20, x2: 300, yCenter: 50,
    visibleSpans: [[20, 300]], color: '#60a5fa', ended: !!node.period?.end, ...position,
  }
  return renderToStaticMarkup(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, view), view,
      selectedId: selected ? node.id : null, selectNode: vi.fn(), changeView: vi.fn(),
      order: 'family', changeOrder: vi.fn(),
      genreDisplay: 'bars', changeGenreDisplay: vi.fn(),
      viewRange: [1948, 2026], setViewRange: vi.fn(),
    }}>
      <svg>
        <TimelineBar bar={bar} scale={scale}
          dimmed={false} indicator={indicator} onHover={vi.fn()} onSelect={vi.fn()} />
      </svg>
    </ExplorerContext.Provider>,
  )
}

describe('bar selection outline', () => {
  const nodes: GraphNode[] = [
    { id: 'genre:plain', type: 'genre', name: 'Plain', family: 'jazz', period: { start: 1960 } },
    { id: 'genre:phased', type: 'genre', name: 'Phased', family: 'jazz',
      period: { start: 1960, end: 2000 }, phases: [
        { start: 1960, prominence: 'golden-age' },
        { start: 1980, prominence: 'niche' },
        { start: 1990, prominence: 'established' },
      ] },
    { id: 'artist:a', type: 'artist', name: 'Artist', family: 'jazz', period: { start: 1960 } },
  ]

  it('fades historical bar tails all the way to transparency', () => {
    const node: GraphNode = {
      id: 'genre:historical', type: 'genre', name: 'Historical', family: 'classical',
      period: { start: 500, end: 1400 },
    }
    const scale = { start: 500, end: 2028, width: 800 }
    const x1 = yearToX(scale, 500)
    const x2 = yearToX(scale, 1400)
    const markup = renderBar(node, true, undefined, {
      start: 500, end: 1400, x1, x2, visibleSpans: [[x1, x2]],
    }, scale)
    expect(markup).toContain(`<stop offset="${1 - 22 / (x2 - x1)}" stop-color="#fff" stop-opacity="1"`)
    expect(markup).toContain('<stop offset="1" stop-color="#fff" stop-opacity="0"')
    expect(markup).toContain('</g></g><text data-bar-label="inside"')
  })

  it('aligns prominence and hidden-phase stops with the era-weighted year positions', () => {
    const node: GraphNode = {
      id: 'genre:historical', type: 'genre', name: 'Historical', family: 'classical',
      period: { start: 1300, end: 1800 },
      phases: [
        { start: 1300, prominence: 'golden-age' },
        { start: 1600, prominence: 'niche' },
        { start: 1750, prominence: 'established' },
      ],
    }
    const scale = { start: 500, end: 2028, width: 800 }
    const x1 = yearToX(scale, 1300)
    const x2 = yearToX(scale, 1800)
    const markup = renderBar(node, false, undefined, {
      start: 1300, end: 1800, x1, x2, visibleSpans: [[x1, yearToX(scale, 1600)], [yearToX(scale, 1750), x2]],
    }, scale)
    for (const stops of [intensityStops(node, 1800), visibilityStops(node, 1800)]) {
      for (const stop of stops) {
        const offset = (yearToX(scale, 1300 + stop.offset * 500) - x1) / (x2 - x1)
        expect(markup).toContain(`<stop offset="${offset}"`)
      }
    }
    expect(markup).toContain(`x1="${x1}" x2="${x2}" y1="50" y2="50"`)
  })

  it.each(nodes)('keeps the rounded outline ready before $id is selected', (node) => {
    const markup = renderBar(node, true)
    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain('outline:none')
    expect(markup).not.toContain('stroke="#f8fafc"')
    expect(markup.match(/data-bar-selection-outline=/g)).toHaveLength(1)
    expect(markup).toContain('<foreignObject data-bar-selection-outline="" x="20" y="39" width="280" height="22" overflow="visible" pointer-events="none" aria-hidden="true"><div')
    expect(markup).toContain('border-style:solid;border-color:#f8fafc;border-width:1.5px')
    expect(markup).toContain('outline-style:auto;outline-width:5px;outline-color:-webkit-focus-ring-color;outline-offset:4px')
    expect(markup).toContain('transform:scale(0.75);transform-origin:top left')
    expect(markup).toContain(node.period?.end
      ? 'border-radius:14.666666666666666px 0 0 14.666666666666666px'
      : 'border-radius:14.666666666666666px')
    const unselected = renderBar(node, false)
    expect(unselected).toContain('aria-pressed="false"')
    expect(unselected).toContain('outline:none')
    expect(unselected.match(/data-bar-selection-outline=/g)).toHaveLength(1)
    if (node.phases) {
      expect(markup).toContain('mask="url(#bar-visibility-genre-phased)"')
      expect(markup).toContain('mask="url(#bar-tail-genre-phased)"')
      expect(markup).toContain('id="bar-tail-genre-phased-gradient" gradientUnits="userSpaceOnUse" x1="20" y1="50" x2="300" y2="50"')
      expect(markup).toContain('id="bar-tail-genre-phased" maskUnits="userSpaceOnUse" x="13.25" y="28" width="293.5" height="44"')
    }
  })

  describe('bar labels', () => {
    const node: GraphNode = {
      id: 'genre:short', type: 'genre', name: 'Short-lived genre', family: 'jazz',
      period: { start: 1960, end: 1963 },
      phases: [{ start: 1960, prominence: 'golden-age' }, { start: 1962, prominence: 'niche' }],
    }

    it.each(['genre', 'artist'] as const)('renders an unmasked, unclipped label beside a short %s bar', (type) => {
      const markup = renderBar({ ...node, type }, false, undefined, {
        x2: 50, visibleSpans: [[20, 50]],
      })
      expect(markup).toContain('<text data-bar-label="outside" x="60" y="54" text-anchor="start"')
      const start = markup.indexOf('<text data-bar-label=')
      const label = markup.slice(start, markup.indexOf('</text>', start) + 7)
      expect(label).toContain(node.name)
      expect(label).not.toContain('clip-path')
      expect(label).toContain('fill="#f8fafc"')
      expect(markup).toContain('</g></g><text data-bar-label="outside"')
    })

    it('keeps wide labels within the bar shape but outside activity and tail masks', () => {
      const markup = renderBar(node, false)
      expect(markup).toContain('</g></g><text data-bar-label="inside"')
      expect(markup).toContain('clip-path="url(#bar-clip-genre-short)" fill="#f8fafc"')
    })

    it('moves a label across the bar to show its full name near the viewport edge', () => {
      const markup = renderBar({ ...node, name: 'Minimal techno' }, false, undefined, {
        x1: 80, x2: 300, visibleSpans: [[80, 300]],
      }, { start: 1948, end: 2026, width: 160 })
      const start = markup.indexOf('<text data-bar-label=')
      const label = markup.slice(start, markup.indexOf('</text>', start) + 7)
      expect(label).toContain('data-bar-label="outside"')
      expect(label).toContain('Minimal techno</text>')
      expect(label).not.toContain('clip-path')
    })

    it('ellipsizes only when the full label cannot fit in the viewport', () => {
      const markup = renderBar(node, false, undefined, undefined, { start: 1948, end: 2026, width: 90 })
      const start = markup.indexOf('<text data-bar-label=')
      const label = markup.slice(start, markup.indexOf('</text>', start) + 7)
      expect(label).toContain('<title>Short-lived genre</title>')
      expect(label).toMatch(/…<\/text>$/u)
      expect(label).not.toContain('Short-lived genre</text>')
    })

    it('does not add an outside label to a wholly off-screen bar', () => {
      const markup = renderBar(node, false, { x: 8, width: 220, direction: 'left', targetX: -10 }, {
        x1: -50, x2: -10, visibleSpans: [[-50, -10]],
      })
      expect(markup).not.toContain('data-bar-label=')
      expect(markup).toContain('data-offscreen-indicator="genre:short"')
    })

    it('shows complete off-screen indicator labels when there is room', () => {
      const markup = renderBar({ ...node, name: 'Medieval music' }, false,
        { x: 8, width: 150, direction: 'left', targetX: -10 }, {
          x1: -50, x2: -10, visibleSpans: [[-50, -10]],
        })
      expect(markup).toContain('data-indicator-label=""')
      expect(markup).toContain('>Medieval music</text>')
    })

    it('ellipsizes an off-screen indicator only when its available width is insufficient', () => {
      const markup = renderBar(node, false, { x: 8, width: 90, direction: 'left', targetX: -10 }, {
        x1: -50, x2: -10, visibleSpans: [[-50, -10]],
      })
      const start = markup.indexOf('<text data-indicator-label=')
      const label = markup.slice(start, markup.indexOf('</text>', start) + 7)
      expect(label).toMatch(/…<\/text>$/u)
      expect(markup).toContain('Short-lived genre · off-screen to the left; activate to reveal')
    })
  })

  it('also outlines a selected off-screen indicator', () => {
    const markup = renderBar(nodes[0], true, { x: 8, width: 220, direction: 'left', targetX: -100 })
    const indicator = markup.slice(markup.indexOf('data-offscreen-indicator'))
    expect(indicator.match(/data-bar-selection-outline=/g)).toHaveLength(1)
    expect(indicator).toContain('<foreignObject data-bar-selection-outline="" x="8" y="39" width="220" height="22"')
    expect(indicator).toContain('outline-style:auto')
    expect(indicator).toContain('outline-width:5px')
    expect(indicator).toContain('outline-color:-webkit-focus-ring-color')
    expect(indicator).toContain('outline-offset:4px')
  })

  it('keeps the off-screen outline ready for keyboard focus before selection', () => {
    const markup = renderBar(nodes[0], false, { x: 8, width: 220, direction: 'left', targetX: -100 })
    expect(markup).toContain('aria-pressed="false"')
    expect(markup).toContain('outline:none')
    const indicator = markup.slice(markup.indexOf('data-offscreen-indicator'))
    expect(indicator.match(/data-bar-selection-outline=/g)).toHaveLength(1)
  })
})
