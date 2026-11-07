import { describe, expect, it } from 'vitest'
import { isLocale, localeFromPath, localizePath, routing, stripLocalePrefix } from './routing.ts'

describe('locale routing', () => {
  it('declares supported locales and the default locale for next-intl', () => {
    expect(routing.locales).toEqual(['en-US', 'fr'])
    expect(routing.defaultLocale).toBe('en-US')
    expect(routing.localePrefix).toEqual({
      mode: 'always',
      prefixes: { 'en-US': '/en', fr: '/fr' },
    })
  })

  it('recognizes locale prefixes without changing internal locale identifiers', () => {
    expect(isLocale('fr')).toBe(true)
    expect(isLocale('en-US')).toBe(true)
    expect(isLocale('en')).toBe(false)
    expect(localeFromPath('/fr/artists')).toBe('fr')
    expect(localeFromPath('/en')).toBe('en-US')
    expect(localeFromPath('/en/genres')).toBe('en-US')
    expect(localeFromPath('/en-US')).toBe('en-US')
    expect(localeFromPath('/en-US/artists')).toBe('en-US')
    expect(localeFromPath('/enough/genres')).toBeUndefined()
    expect(localeFromPath('/de/genres')).toBeUndefined()
  })

  it('prefixes both root and nested paths without changing route names', () => {
    expect(localizePath('/', 'en-US')).toBe('/en')
    expect(localizePath('/', 'fr')).toBe('/fr')
    expect(localizePath('/artists', 'en-US')).toBe('/en/artists')
    expect(localizePath('history', 'fr')).toBe('/fr/history')
  })

  it.each([
    ['/en', '/'],
    ['/en/', '/'],
    ['/en/genres', '/genres'],
    ['/en-US/artists/', '/artists/'],
    ['/fr/history', '/history'],
    ['/enough/genres', '/enough/genres'],
    ['/genres', '/genres'],
  ])('removes a recognized locale prefix from %s', (pathname, unprefixed) => {
    expect(stripLocalePrefix(pathname)).toBe(unprefixed)
  })
})
