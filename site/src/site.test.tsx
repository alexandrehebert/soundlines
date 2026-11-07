import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App, Head } from './components/App.tsx'
import { copy, locales, repository, slugs } from './content.ts'
import { matchRoute, repositoryUrl, routeFile, routePath, routes } from './routes.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
const base = import.meta.env.BASE_URL

describe('project companion content', () => {
  it('gives English and French the same pages, stages and resources', () => {
    for (const slug of slugs) {
      const [en, fr] = [copy.en.pages[slug], copy.fr.pages[slug]]
      expect(fr.sections).toHaveLength(en.sections.length)
      expect(fr.steps?.length).toBe(en.steps?.length)
      expect(Boolean(fr.command)).toBe(Boolean(en.command))
      expect(fr.showcase).toBe(en.showcase)
      expect(fr.resources.map(([path]) => path)).toEqual(en.resources.map(([path]) => path))
    }
  })

  it('only links to repository paths that exist', () => {
    for (const [path] of Object.values(copy.en.pages).flatMap((page) => page.resources)) {
      expect(existsSync(`${root}${path.split('#')[0]}`), path).toBe(true)
    }
  })
})

describe('routes', () => {
  it('covers every locale and page with clean, unique URLs', () => {
    expect(routes).toHaveLength(locales.length * slugs.length)
    expect(new Set(routes.map(routeFile)).size).toBe(routes.length)
    expect(routePath({ locale: 'fr', slug: 'index' })).toBe('fr/')
    expect(routeFile({ locale: 'en', slug: 'graph' })).toBe('en/graph/index.html')
  })

  it('resolves every route from its URL and falls back to the English overview', () => {
    for (const route of routes) expect(matchRoute(`/soundlines/${routePath(route)}`, '/soundlines/')).toEqual(route)
    expect(matchRoute('/soundlines/', '/soundlines/')).toEqual({ locale: 'en', slug: 'index' })
    expect(matchRoute('/soundlines/de/nope/', '/soundlines/')).toEqual({ locale: 'en', slug: 'index' })
  })

  it('opens files as blobs and folders as trees on GitHub', () => {
    expect(repositoryUrl(repository, 'docs/DATA.md#instrument-artwork')).toBe(`${repository}/blob/main/docs/DATA.md#instrument-artwork`)
    expect(repositoryUrl(repository, '.github/skills')).toBe(`${repository}/tree/main/.github/skills`)
  })
})

describe.each(routes)('$locale/$slug page', (route) => {
  const html = renderToStaticMarkup(<App {...route} />)
  const page = copy[route.locale].pages[route.slug]
  const other = route.locale === 'en' ? 'fr' : 'en'

  it('has one title, a skip link and its translated content', () => {
    expect(html.match(/<h1\b/g)).toHaveLength(1)
    expect(html).toContain('href="#main"')
    expect(html).toContain('id="main"')
    expect(html).toContain(renderToStaticMarkup(<>{page.title}</>))
  })

  it('links to the same page in the other language and to the repository', () => {
    expect(html).toContain(`href="${base}${routePath({ ...route, locale: other })}"`)
    expect(html).toContain(`href="${repository}"`)
  })

  it('declares canonical and alternate URLs', () => {
    const head = renderToStaticMarkup(<Head {...route} />)
    expect(head).toContain(`<link rel="canonical" href="https://alexandrehebert.github.io/soundlines/${routePath(route)}"/>`)
    expect(head).toContain(`hrefLang="${other}"`)
  })
})
