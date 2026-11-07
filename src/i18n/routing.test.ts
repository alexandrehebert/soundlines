import { describe, expect, it } from 'vitest'
import { isLocale, localeFromPath, localizePath, routing } from './routing.ts'

describe('locale routing', () => {
  it('declares supported locales and the default locale for next-intl', () => {
    expect(routing.locales).toEqual(['en-US', 'fr'])
    expect(routing.defaultLocale).toBe('en-US')
  })

  it('recognizes only supported locale path segments', () => {
    expect(isLocale('fr')).toBe(true)
    expect(isLocale('en-US')).toBe(true)
    expect(isLocale('en')).toBe(false)
    expect(localeFromPath('/fr/artists')).toBe('fr')
    expect(localeFromPath('/en-US')).toBe('en-US')
    expect(localeFromPath('/en/genres')).toBeUndefined()
  })

  it('prefixes both root and nested paths without changing route names', () => {
    expect(localizePath('/', 'fr')).toBe('/fr')
    expect(localizePath('/artists', 'en-US')).toBe('/en-US/artists')
    expect(localizePath('history', 'fr')).toBe('/fr/history')
  })
})
