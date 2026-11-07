import { describe, expect, it, vi } from 'vitest'
import { generateMetadata } from './page.tsx'

vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(new Headers({
    host: 'soundlines.example',
    'x-forwarded-proto': 'https',
  })),
}))

vi.mock('../../../src/App.tsx', () => ({ default: () => null }))

describe('localized page metadata', () => {
  it.each([
    ['en-US', undefined, {}, '/en', '/fr'],
    ['en-US', ['artists'], { sort: 'oldest-first' }, '/en/artists?sort=oldest-first', '/fr/artists?sort=oldest-first'],
    ['fr', ['history'], { focus: 'event:mtv-launch' }, '/en/history?focus=event%3Amtv-launch', '/fr/history?focus=event%3Amtv-launch'],
  ])('generates canonical and alternate URLs for %s', async (locale, segments, searchParams, english, french) => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale, segments }),
      searchParams: Promise.resolve(searchParams),
    })
    const origin = 'https://soundlines.example'
    const canonical = `${origin}${locale === 'fr' ? french : english}`

    expect(metadata.alternates).toEqual({
      canonical,
      languages: { 'en-US': `${origin}${english}`, fr: `${origin}${french}` },
    })
    expect(metadata.openGraph).toMatchObject({ url: canonical })
  })
})
