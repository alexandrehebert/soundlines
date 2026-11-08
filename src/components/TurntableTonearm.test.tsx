import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TurntableTonearm } from './TurntableTonearm.tsx'

describe('TurntableTonearm', () => {
  it.each([false, true])('renders the active state %s as decorative artwork', (active) => {
    const markup = renderToStaticMarkup(<TurntableTonearm active={active} />)

    expect(markup).toContain('aria-hidden="true"')
    expect(markup.includes('data-active="true"')).toBe(active)
  })

  it('uses separate gradient IDs for each instance', () => {
    const markup = renderToStaticMarkup(<><TurntableTonearm active={false} /><TurntableTonearm active /></>)
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
    const references = [...markup.matchAll(/url\(#([^)]+)\)/g)].map((match) => match[1])

    expect(ids).toHaveLength(4)
    expect(new Set(ids).size).toBe(ids.length)
    expect(references.length).toBeGreaterThan(0)
    for (const reference of references) expect(ids).toContain(reference)
  })
})
