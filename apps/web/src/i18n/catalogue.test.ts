import { describe, expect, it } from 'vitest'
import { createTranslator } from 'next-intl'
import english from './locales/en.json'
import french from './locales/fr.json'
import { catalogueFor } from './catalogue.ts'
import { graphLabels } from './graphLabels.ts'
import { LOCALES } from './routing.ts'
import { pageMetadata } from './seo.ts'

function leafEntries(value: unknown, path = ''): Record<string, unknown> {
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).flatMap(([key, child]) =>
      Object.entries(leafEntries(child, path ? `${path}.${key}` : key))))
  }
  return { [path]: value }
}

describe('translation catalogues', () => {
  it.each(LOCALES)('keeps every %s key, value type, and interpolation parameter in sync', (locale) => {
    const source = leafEntries(english)
    const translated = leafEntries(catalogueFor(locale))
    expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort())
    for (const [key, value] of Object.entries(source)) {
      expect(typeof translated[key], key).toBe(typeof value)
      if (typeof value !== 'string') continue
      expect(translated[key], key).not.toBe('')
      const parameters = (text: string) => [...text.matchAll(/\{(\w+)(?:,|\})/g)].map((match) => match[1]).sort()
      expect(parameters(String(translated[key])), key).toEqual(parameters(value))
    }
  })

  it.each(LOCALES)('uses %s catalogue for UI, taxonomy and metadata', (locale) => {
    const catalogue = catalogueFor(locale)
    expect(catalogue.homeContent.headline.first).toBeTruthy()
    expect(graphLabels(locale)).toEqual(catalogue.graphLabels)
    for (const page of ['home', 'genre', 'artist', 'instrument', 'history', 'bubbles', 'data'] as const) {
      expect(pageMetadata(locale, page)).toEqual(catalogue.seo[page])
    }
  })

  it.each(LOCALES)('formats dynamic %s messages without exposing placeholders', (locale) => {
    const catalogue = catalogueFor(locale)
    const history = createTranslator({ locale, messages: catalogue, namespace: 'history' })
    const stats = createTranslator({ locale, messages: catalogue, namespace: 'stats' })
    const timeline = createTranslator({ locale, messages: catalogue, namespace: 'timeline' })
    for (const count of [0, 1, 2, 1000]) {
      const output = [
        history('showing', { count, dating: history('dating.dated') }),
        history('showing', { count, dating: history('dating.undated', { count }) }),
        stats('noLinksYet', { count }), stats('years', { count }), stats('linksCount', { count }),
        stats('withoutFamily', { count }),
        timeline('compressedTime', { factor: count }),
      ]
      for (const message of output) expect(message).not.toMatch(/\{\w+\}/)
    }
    expect(stats('summary', { entries: '1', links: '2', span: '' })).not.toMatch(/\{\w+\}/)
    const summary = stats('summary', { entries: '1', links: '2', span: stats('summarySpan', { start: -500, end: 2026 }) })
    expect(summary).toContain('-500')
    expect(summary).toContain('2026')
    expect(stats('whenEmerged', { plural: 'genres' })).toContain('genres')
    expect(stats('lastReview', { date: '2026-11-06' })).toContain('2026-11-06')
    expect(timeline('region', { view: 'Genres' })).toContain('Genres')
    expect(timeline('undated', { label: 'genres' })).toContain('genres')
    expect(timeline('undatedTitle', { name: 'Jazz' })).toContain('Jazz')
    expect(timeline('estimatedPeriod', { period: '1900' })).toContain('1900')
    expect(timeline('phasePeriod', { label: 'Peak', circa: catalogue.dates.circa, start: '1960', end: '1980' })).toContain('1960–1980')
    for (const direction of ['left', 'right'] as const) {
      expect(timeline('offscreen', { name: 'Jazz', direction: catalogue.timeline.directions[direction] }))
        .toContain(catalogue.timeline.directions[direction])
    }
  })

  it('preserves singular, zero, plural and grouped French counts', () => {
    const en = createTranslator({ locale: 'en', messages: english })
    const fr = createTranslator({ locale: 'fr', messages: french })
    expect(en('stats.noLinksYet', { count: 1 })).toBe('1 entry has no links yet.')
    expect(en('stats.noLinksYet', { count: 0 })).toBe('0 entries have no links yet.')
    expect(fr('stats.noLinksYet', { count: 1 })).toBe('1 entrée ne possède encore aucun lien.')
    expect(fr('stats.noLinksYet', { count: 2 })).toBe('2 entrées ne possèdent encore aucun lien.')
    expect(en('stats.years', { count: 1 })).toBe('1 yr')
    expect(en('stats.years', { count: 2 })).toBe('2 yrs')
    expect(fr('stats.years', { count: 1 })).toBe('1 an')
    expect(fr('stats.years', { count: 0 })).toBe('0 ans')
    expect(fr('stats.linksCount', { count: 1 })).toBe('1 lien')
    expect(fr('stats.linksCount', { count: 2 })).toBe('2 liens')
    expect(en('history.showing', { count: 1000, dating: en('history.dating.dated') })).toBe(
      'Showing 1,000 events by start year · dates may be approximate, landmarks are editorial.',
    )
    expect(fr('history.showing', {
      count: 1000,
      dating: fr('history.dating.undated', { count: 1000 }),
    })).toBe(
      `Affichage de ${new Intl.NumberFormat('fr').format(1000)} événements (${new Intl.NumberFormat('fr').format(1000)} sans date ; événements datés classés par année de début) · dates parfois approximatives, repères établis par la rédaction.`,
    )
  })
})
