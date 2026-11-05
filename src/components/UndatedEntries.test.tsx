import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { TIMELINE_BAR_HEIGHT } from '../graph/phases.ts'
import type { GraphNode } from '../graph/types.ts'
import { FAMILY_COLORS, NODE_TYPE_COLORS, timelineBarOpacity } from '../theme.ts'
import { BAR_LABEL_FONT_SIZE } from './timeline/geometry.ts'
import { UndatedEntries } from './UndatedEntries.tsx'

const nodes: GraphNode[] = [
  { id: 'artist:a', type: 'artist', name: 'Artist A', family: 'jazz' },
  { id: 'genre:a', type: 'genre', name: 'Genre A', family: 'rock' },
  { id: 'instrument:a', type: 'instrument', name: 'Instrument A', family: 'strings' },
  { id: 'event:a', type: 'event', name: 'Event A' },
]

describe('undated entries', () => {
  it.each(nodes)('uses compact timeline bar styling for $id', (node) => {
    const markup = renderToStaticMarkup(
      <UndatedEntries label="entries" nodes={[node]} selectedId={null} onSelect={vi.fn()} />,
    )
    const color = node.family ? FAMILY_COLORS[node.family] : NODE_TYPE_COLORS[node.type]

    expect(markup).toContain(`data-undated-node="${node.id}" aria-pressed="false"`)
    expect(markup).toContain(`title="${node.name}: no period specified"`)
    expect(markup).toContain('class="visualization-item')
    expect(markup).toContain(`height:${TIMELINE_BAR_HEIGHT}px`)
    expect(markup).toContain(`font-size:${BAR_LABEL_FONT_SIZE}px`)
    expect(markup).toContain('font-bold')
    expect(markup).toContain(`background-color:${color};opacity:${timelineBarOpacity(node.type, false)}`)
    expect(markup).toContain('visualization-hover-border')
    expect(markup).toContain('data-bar-selection-outline=""')
    expect(markup).toContain('border-style:solid;border-color:#f8fafc;border-width:1.5px')
    expect(markup).toContain('outline-style:auto;outline-width:5px')
    expect(markup).not.toContain('min-h-11')
  })

  it('brightens selection and dims unrelated entries', () => {
    const markup = renderToStaticMarkup(
      <UndatedEntries label="artists" nodes={nodes.slice(0, 2)} selectedId="artist:a"
        highlightedIds={new Set(['artist:a'])} onSelect={vi.fn()} />,
    )
    const buttons = markup.match(/<button\b[\s\S]*?<\/button>/g) ?? []

    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toContain('aria-pressed="true"')
    expect(buttons[0]).toContain('style="opacity:1"')
    expect(buttons[0]).toContain('background-color:#60a5fa;opacity:0.95')
    expect(buttons[1]).toContain('aria-pressed="false"')
    expect(buttons[1]).toContain('style="opacity:0.2"')
  })

  it('omits the strip when there are no undated entries', () => {
    expect(renderToStaticMarkup(
      <UndatedEntries label="artists" nodes={[]} selectedId={null} onSelect={vi.fn()} />,
    )).toBe('')
  })
})
