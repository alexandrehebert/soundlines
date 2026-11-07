import { isValidElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import HomePage, { generateMetadata as homeMetadata } from '../../app/[locale]/page.tsx'
import GenresPage, { generateMetadata as genresMetadata } from '../../app/[locale]/genres/page.tsx'
import ArtistsPage, { generateMetadata as artistsMetadata } from '../../app/[locale]/artists/page.tsx'
import InstrumentsPage, { generateMetadata as instrumentsMetadata } from '../../app/[locale]/instruments/page.tsx'
import HistoryPage, { generateMetadata as historyMetadata } from '../../app/[locale]/history/page.tsx'

vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(new Headers({
    host: 'soundlines.example',
    'x-forwarded-proto': 'https',
  })),
}))

vi.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NOT_FOUND') },
  redirect: (href: string) => { throw new Error(`REDIRECT ${href}`) },
}))

vi.mock('../App.tsx', () => ({ default: () => null }))

const origin = 'https://soundlines.example'

describe('localized App Router pages', () => {
  it.each([
    ['home', HomePage, homeMetadata, 'en-US', {}, '/en', '/fr'],
    ['genres', GenresPage, genresMetadata, 'fr', {}, '/en/genres', '/fr/genres'],
    ['artists', ArtistsPage, artistsMetadata, 'en-US', { sort: 'oldest-first' }, '/en/artists?sort=oldest-first', '/fr/artists?sort=oldest-first'],
    ['instruments', InstrumentsPage, instrumentsMetadata, 'fr', {}, '/en/instruments', '/fr/instruments'],
    ['history', HistoryPage, historyMetadata, 'fr', { focus: 'event:mtv-launch' }, '/en/history?focus=event%3Amtv-launch', '/fr/history?focus=event%3Amtv-launch'],
  ] as const)('renders %s with canonical and alternate URLs', async (_name, page, generateMetadata, locale, searchParams, english, french) => {
    const props = {
      params: Promise.resolve({ locale }),
      searchParams: Promise.resolve(searchParams),
    }
    expect(isValidElement(await page(props))).toBe(true)

    const metadata = await generateMetadata(props)
    const canonical = `${origin}${locale === 'fr' ? french : english}`
    expect(metadata.alternates).toEqual({
      canonical,
      languages: { 'en-US': `${origin}${english}`, fr: `${origin}${french}` },
    })
    expect(metadata.openGraph).toMatchObject({ url: canonical })
  })

  it.each([
    ['legacy view', HomePage, 'en-US', { view: 'artists', 'artist-sort': 'oldest-first', other: '1' }, '/en/artists?artist-sort=oldest-first&other=1'],
    ['focused event', GenresPage, 'fr', { focus: 'event:mtv-launch', other: '1' }, '/fr/history?focus=event%3Amtv-launch&other=1'],
    ['unknown focus', HomePage, 'en-US', { focus: 'artist:missing', other: '1' }, '/en?other=1'],
    ['invalid order', ArtistsPage, 'en-US', { sort: 'invalid' }, '/en/artists'],
  ] as const)('redirects %s to the canonical route', async (_name, page, locale, searchParams, target) => {
    const props = { params: Promise.resolve({ locale }), searchParams: Promise.resolve(searchParams) }
    await expect(page(props)).rejects.toThrow(`REDIRECT ${target}`)
  })

  it('generates canonical metadata for a legacy home link', async () => {
    const metadata = await homeMetadata({
      params: Promise.resolve({ locale: 'en-US' }),
      searchParams: Promise.resolve({ view: 'artists' }),
    })
    expect(metadata.alternates).toEqual({
      canonical: `${origin}/en/artists`,
      languages: { 'en-US': `${origin}/en/artists`, fr: `${origin}/fr/artists` },
    })
  })

  it('rejects unsupported locales', async () => {
    await expect(homeMetadata({
      params: Promise.resolve({ locale: 'de' }),
      searchParams: Promise.resolve({}),
    })).rejects.toThrow()
  })
})
