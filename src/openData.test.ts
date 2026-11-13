import { describe, expect, it } from 'vitest'
import { isOpenDataPath, OPEN_DATA_SECTIONS, openDataPath } from './openData.ts'
import { LOCALES, localizePath } from './i18n/routing.ts'

describe('Open Data routes', () => {
  it.each(LOCALES)('recognizes the entire data space in %s without matching other pages', (locale) => {
    expect(isOpenDataPath(localizePath('/data', locale))).toBe(true)
    for (const section of OPEN_DATA_SECTIONS) {
      expect(isOpenDataPath(localizePath(openDataPath(section), locale))).toBe(true)
    }
    for (const path of ['/', '/database', '/metadata', '/genres', '/genres/data']) {
      expect(isOpenDataPath(localizePath(path, locale))).toBe(false)
    }
  })

  it('handles unprefixed routes and an unavailable pathname', () => {
    expect(isOpenDataPath('/data/query')).toBe(true)
    expect(isOpenDataPath('/data/')).toBe(true)
    expect(isOpenDataPath(null)).toBe(false)
  })
})
