import { describe, expect, it } from 'vitest'
import { isLocale, localeFromPath, localizePath, routing, stripLocalePrefix } from './routing.ts'

describe('locale routing', () => {
  it('declares supported locales and the default locale for next-intl', () => {
    expect(routing.locales).toEqual(['en', 'fr'])
    expect(routing.defaultLocale).toBe('en')
    expect(routing.localePrefix).toBeUndefined()
  })

  it('uses language-only locale identifiers and URL prefixes', () => {
    expect(isLocale('fr')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('en-US')).toBe(false)
    expect(localeFromPath('/fr/artists')).toBe('fr')
    expect(localeFromPath('/en')).toBe('en')
    expect(localeFromPath('/en/genres')).toBe('en')
    expect(localeFromPath('/en-US')).toBeUndefined()
    expect(localeFromPath('/en-US/artists')).toBeUndefined()
    expect(localeFromPath('/enough/genres')).toBeUndefined()
    expect(localeFromPath('/de/genres')).toBeUndefined()
  })

  it('prefixes both root and nested paths without changing route names', () => {
    expect(localizePath('/', 'en')).toBe('/en')
    expect(localizePath('/', 'fr')).toBe('/fr')
    expect(localizePath('/artists', 'en')).toBe('/en/artists')
    expect(localizePath('history', 'fr')).toBe('/fr/history')
  })

  it.each([
    ['/en', '/'],
    ['/en/', '/'],
    ['/en/genres', '/genres'],
    ['/en-US/artists/', '/en-US/artists/'],
    ['/fr/history', '/history'],
    ['/enough/genres', '/enough/genres'],
    ['/genres', '/genres'],
  ])('removes a recognized locale prefix from %s', (pathname, unprefixed) => {
    expect(stripLocalePrefix(pathname)).toBe(unprefixed)
  })
})
