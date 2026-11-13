import { describe, expect, it, vi } from 'vitest'
import DataPage from '../../app/[locale]/data/page.tsx'
import { generateMetadata as datasetMetadata } from '../../app/[locale]/data/dataset/page.tsx'
import { generateMetadata as graphMetadata } from '../../app/[locale]/data/graph/page.tsx'
import { generateMetadata as queryMetadata } from '../../app/[locale]/data/query/page.tsx'
import { generateMetadata as changelogMetadata } from '../../app/[locale]/data/changelog/page.tsx'
import { generateMetadata as contributeMetadata } from '../../app/[locale]/data/contribute/page.tsx'
import { APP_URL } from '../projectLinks.ts'
import { catalogueFor } from './catalogue.ts'
import { LOCALES, localizePath } from './routing.ts'
import { generateOpenDataMetadata, openDataLocale } from './openDataPage.ts'

vi.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NOT_FOUND') },
  redirect: (href: string) => { throw new Error(`REDIRECT ${href}`) },
}))

describe('localized Open Data pages', () => {
  it.each(LOCALES)('redirects the %s data root to the dataset page', async (locale) => {
    await expect(DataPage({ params: Promise.resolve({ locale }) })).rejects.toThrow(`REDIRECT /${locale}/data/dataset`)
  })

  it.each(LOCALES)('gives all %s subpages independent canonical metadata', async (locale) => {
    const copy = catalogueFor(locale)
    for (const [section, metadata] of [
      ['dataset', datasetMetadata], ['graph', graphMetadata], ['query', queryMetadata], ['changelog', changelogMetadata], ['contribute', contributeMetadata],
    ] as const) {
      const result = await metadata({ params: Promise.resolve({ locale }) })
      const url = new URL(localizePath(`/data/${section}`, locale), APP_URL).href
      expect(result.title).toBe(`${copy.openData[section].title} | ${copy.seo.data.title}`)
      expect(result.description).toBe(copy.openData[section].description)
      expect(result.alternates).toEqual({
        canonical: url,
        languages: Object.fromEntries(LOCALES.map((target) => [
          target, new URL(localizePath(`/data/${section}`, target), APP_URL).href,
        ])),
      })
      expect(result.openGraph).toMatchObject({ url })
    }
  })

  it('rejects unsupported locales', async () => {
    const props = { params: Promise.resolve({ locale: 'xx' }) }
    await expect(openDataLocale(props)).rejects.toThrow('NOT_FOUND')
    await expect(generateOpenDataMetadata(props, 'dataset')).rejects.toThrow('NOT_FOUND')
    await expect(contributeMetadata(props)).rejects.toThrow('NOT_FOUND')
  })
})
