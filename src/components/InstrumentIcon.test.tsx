import { existsSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import graph from '../data/graph.json'
import { InstrumentIcon } from './InstrumentIcon.tsx'

describe('instrument icons', () => {
  it('uses a decorative, base-aware mask with an encoded instrument slug', () => {
    const markup = renderToStaticMarkup(
      <InstrumentIcon id="instrument:steel guitar" className="icon" style={{ color: '#123456' }} />,
    )
    expect(markup).toContain('data-instrument-icon="instrument:steel guitar" aria-hidden="true"')
    expect(markup).toContain('/instrument-icons/steel%20guitar.svg')
    expect(markup).toContain('color:#123456')
    expect(markup).toContain('mask:')
    expect(markup).toContain('-webkit-mask:')
  })

  it('has an icon asset for every catalogued instrument', () => {
    const instruments = graph.nodes.filter((node) => node.type === 'instrument')
    expect(instruments.length).toBeGreaterThan(0)
    for (const instrument of instruments) {
      const file = `${encodeURIComponent(instrument.id.slice('instrument:'.length))}.svg`
      expect(existsSync(new URL(`../../public/instrument-icons/${file}`, import.meta.url)), instrument.id).toBe(true)
    }
  })
})
