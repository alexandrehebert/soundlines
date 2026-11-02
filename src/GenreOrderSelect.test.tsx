import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { GenreOrderSelect } from './App.tsx'
import type { GenreOrder } from './graph/layout.ts'

function renderOrder(genreOrder: GenreOrder) {
  const markup = renderToStaticMarkup(
    <GenreOrderSelect genreOrder={genreOrder} changeGenreOrder={vi.fn()} />,
  )
  const radios = [...markup.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(([radio]) => radio)
  return { markup, radios }
}

describe('genre order toggle', () => {
  it.each([
    ['family', 0],
    ['oldest-first', 1],
  ] as const)('renders %s as the selected order', (order, selectedIndex) => {
    const { markup, radios } = renderOrder(order)
    expect(markup).toContain('role="radiogroup" aria-label="Genre order"')
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
      if (selected) {
        expect(radio).toContain('border-cyan-500/50 bg-cyan-500/15')
      } else {
        expect(radio).not.toContain('border-cyan-500/50 bg-cyan-500/15')
      }
    }
  })
})
