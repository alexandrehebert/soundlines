import { describe, expect, it, vi } from 'vitest'
import { TIMELINE_BAR_HEIGHT } from '../graph/phases.ts'
import type { GraphNode } from '../graph/types.ts'
import { chartColor, FAMILY_COLORS, NODE_TYPE_COLORS, timelineBarOpacity } from '../theme.ts'
import { BAR_LABEL_FONT_SIZE } from './timeline/geometry.ts'
import { UndatedEntries } from './UndatedEntries.tsx'
import { renderWithIntl } from '../i18n/test-utils.tsx'

const nodes: GraphNode[] = [
  { id: 'artist:a', type: 'artist', name: 'Artist A', family: 'jazz' },
  { id: 'genre:a', type: 'genre', name: 'Genre A', family: 'rock' },
  { id: 'instrument:a', type: 'instrument', name: 'Instrument A', family: 'strings' },
  { id: 'event:a', type: 'event', name: 'Event A' },
]

describe('undated entries', () => {
  it.each(nodes)('uses compact timeline bar styling for $id', (node) => {
    const markup = renderWithIntl(
      <UndatedEntries label="entries" nodes={[node]} selectedId={null} onSelect={vi.fn()} />,
    )
    const color = chartColor(node.family ? FAMILY_COLORS[node.family] : NODE_TYPE_COLORS[node.type])

    expect(markup).toContain(`data-undated-node="${node.id}" aria-pressed="false"`)
    expect(markup).toContain(`title="${node.name}: no period specified"`)
    expect(markup).toContain('class="visualization-item')
    expect(markup).toContain(`height:${TIMELINE_BAR_HEIGHT}px`)
    expect(markup).toContain(`font-size:${BAR_LABEL_FONT_SIZE}px`)
    expect(markup).toContain('font-bold')
    expect(markup).toContain(`background-color:${color};opacity:${timelineBarOpacity(node.type, false)}`)
    expect(markup).toContain('visualization-hover-border')
    expect(markup).toContain('data-bar-selection-outline=""')
    expect(markup).toContain('border-style:solid;border-color:var(--chart-selection-border, #f8fafc);border-width:1.5px')
    expect(markup).toContain('outline-style:auto;outline-width:5px')
    expect(markup).not.toContain('min-h-11')
  })

  it('brightens selection and dims unrelated entries', () => {
    const markup = renderWithIntl(
      <UndatedEntries label="artists" nodes={nodes.slice(0, 2)} selectedId="artist:a"
        highlightedIds={new Set(['artist:a'])} onSelect={vi.fn()} />,
    )
    const buttons = markup.match(/<button\b[\s\S]*?<\/button>/g) ?? []

    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toContain('aria-pressed="true"')
    expect(buttons[0]).toContain('style="opacity:1"')
    expect(buttons[0]).toContain(`background-color:${chartColor('#60a5fa')};opacity:0.95`)
    expect(buttons[1]).toContain('aria-pressed="false"')
    expect(buttons[1]).toContain('style="opacity:0.2"')
  })

  it('puts a decorative instrument icon before an undated instrument bar', () => {
    const markup = renderWithIntl(
      <UndatedEntries label="instruments" nodes={[nodes[2]]} selectedId={null} onSelect={vi.fn()} />,
    )
    expect(markup).toContain('data-instrument-icon="instrument:a" aria-hidden="true"')
    expect(markup).toContain('instrument-icons/a.svg')
    expect(markup).toContain('left:21px;height:22px')
    expect(markup).toContain('margin-left:13px;font-size:11.5px')
    expect(renderWithIntl(
      <UndatedEntries label="genres" nodes={[nodes[1]]} selectedId={null} onSelect={vi.fn()} />,
    )).not.toContain('data-instrument-icon=')
  })

  it('omits the strip when there are no undated entries', () => {
    expect(renderWithIntl(
      <UndatedEntries label="artists" nodes={[]} selectedId={null} onSelect={vi.fn()} />,
    )).toBe('')
  })
})
