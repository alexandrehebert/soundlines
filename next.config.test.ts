import { getRedirectUrl, unstable_getResponseFromNextConfig } from 'next/experimental/testing/server'
import { describe, expect, it } from 'vitest'
import nextConfig from './next.config.ts'

const origin = 'https://soundlines.example'

describe('locale URL routing', () => {
  it.each([
    ['/en-US', '/en'],
    ['/en-US/artists?focus=artist%3Ajuan-atkins&sort=oldest-first', '/en/artists?focus=artist%3Ajuan-atkins&sort=oldest-first'],
    ['/en-US/history', '/en/history'],
  ])('permanently redirects %s to %s', async (path, target) => {
    const response = await unstable_getResponseFromNextConfig({
      url: `${origin}${path}`,
      nextConfig,
    })

    expect(response.status).toBe(308)
    expect(getRedirectUrl(response)).toBe(`${origin}${target}`)
  })

  it.each(['/en', '/en/genres', '/fr/history', '/en-US-extra'])(
    'does not redirect a non-legacy path %s through the legacy redirect',
    async (path) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `${origin}${path}`,
        nextConfig,
      })

      expect(getRedirectUrl(response)).toBeNull()
    },
  )

  it('keeps a legacy English link English despite a French preference', async () => {
    const response = await unstable_getResponseFromNextConfig({
      url: `${origin}/en-US/history`,
      headers: { 'accept-language': 'fr' },
      cookies: { NEXT_LOCALE: 'fr' },
      nextConfig,
    })

    expect(response.status).toBe(308)
    expect(getRedirectUrl(response)).toBe(`${origin}/en/history`)
  })
})
