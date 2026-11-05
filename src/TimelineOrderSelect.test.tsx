import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { TimelineOrderSelect } from './App.tsx'
import type { TimelineOrder } from './graph/layout.ts'
import type { TimelineView } from './graph/timeline.ts'

function renderOrder(view: TimelineView, order: TimelineOrder) {
  const markup = renderToStaticMarkup(
    <TimelineOrderSelect view={view} order={order} changeOrder={vi.fn()} />,
  )
  const radios = [...markup.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(([radio]) => radio)
  return { markup, radios }
}

describe('timeline order toggle', () => {
  it.each([
    ['genre', 'Genre', 'family', 0],
    ['genre', 'Genre', 'oldest-first', 1],
    ['artist', 'Artist', 'family', 0],
    ['artist', 'Artist', 'oldest-first', 1],
    ['instrument', 'Instrument', 'family', 0],
    ['instrument', 'Instrument', 'oldest-first', 1],
  ] as const)('renders the %s %s toggle with %s selected', (view, label, order, selectedIndex) => {
    const { markup, radios } = renderOrder(view, order)
    expect(markup).toContain(`role="radiogroup" aria-label="${label} order"`)
    expect(markup).toContain('rounded-full border border-slate-700 bg-slate-900 p-1')
    expect(markup).toContain('lucide-arrow-down-wide-narrow')
    expect(markup).toMatch(/<svg\b[^>]*aria-hidden="true"/)
    expect(markup).not.toContain('>Order<')
    expect(radios).toHaveLength(2)
    expect(radios[0]).toContain('Family groups')
    expect(radios[1]).toContain('Oldest first')

    for (const [index, radio] of radios.entries()) {
      const selected = index === selectedIndex
      expect(radio).toContain('role="radio"')
      expect(radio).toContain(`aria-checked="${selected}"`)
      expect(radio).toMatch(new RegExp(`tabindex="${selected ? 0 : -1}"`, 'i'))
      expect(radio).toContain('flex-1 justify-center')
      expect(radio).not.toContain('md:flex-none')
      if (selected) {
        expect(radio).toContain('border-cyan-500/50 bg-cyan-500/15')
      } else {
        expect(radio).not.toContain('border-cyan-500/50 bg-cyan-500/15')
      }
    }
  })
})
