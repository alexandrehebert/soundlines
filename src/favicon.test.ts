import { readFileSync } from 'node:fs'
import { Disc3 } from 'lucide-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

function iconShapes(markup: string) {
  return [...markup.matchAll(/<(?:circle|path)\b[^>]*>/g)]
    .map(([tag]) => tag.replace(/\s*\/?>$/, '>'))
}

describe('favicon', () => {
  it('uses the same vinyl-disc geometry and stroke style as the header icon', () => {
    const favicon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
    const headerIcon = renderToStaticMarkup(createElement(Disc3))
    const embeddedIcon = favicon.match(/<svg\b[^>]*viewBox="0 0 24 24"[^>]*>/)?.[0]

    expect(embeddedIcon).toBeDefined()
    expect(embeddedIcon).toContain('stroke="#a684ff"')
    expect(iconShapes(favicon)).toEqual(iconShapes(headerIcon))
    for (const attribute of ['viewBox', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']) {
      const pattern = new RegExp(`\\b${attribute}="([^"]+)"`)
      expect(embeddedIcon?.match(pattern)?.[1]).toBe(headerIcon.match(pattern)?.[1])
    }
  })

  it.each([
    '../app/[locale]/layout.tsx',
    '../.storybook/preview-head.html',
    '../.storybook/manager-head.html',
  ])('uses the cache-busted favicon in %s', (path) => {
    const html = readFileSync(new URL(path, import.meta.url), 'utf8')
    expect(html).toContain('favicon.svg?v=disc3')
  })
})
