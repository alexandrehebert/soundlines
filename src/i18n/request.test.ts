import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { getRequestConfig } from 'next-intl/server'
import english from './locales/en.json'
import french from './locales/fr.json'
import requestConfig from './request.ts'
import { LOCALES } from './routing.ts'

const { rootLocale } = vi.hoisted(() => ({
  rootLocale: vi.fn<() => Promise<string | undefined>>(),
}))

vi.mock('next-intl/server', () => ({
  getRequestConfig: (config: Parameters<typeof getRequestConfig>[0]) => config,
}))

vi.mock('next/root-params', () => ({
  locale: rootLocale,
}))

const params = { requestLocale: Promise.resolve(undefined) }
const catalogues = { en: english, fr: french }

describe('request locale configuration', () => {
  beforeEach(() => {
    rootLocale.mockReset()
  })

  it.each(LOCALES)('loads the %s root locale catalogue', async (locale) => {
    rootLocale.mockResolvedValue(locale)

    expect(await requestConfig(params)).toEqual({ locale, messages: catalogues[locale] })
  })

  it.each([undefined, '', 'unknown.txt'])('falls back for root locale %s', async (locale) => {
    rootLocale.mockResolvedValue(locale)

    expect(await requestConfig(params)).toEqual({ locale: 'en', messages: english })
  })

  it.each(LOCALES)('uses explicit %s overrides without reading root params', async (locale) => {
    expect(await requestConfig({ ...params, locale })).toEqual({ locale, messages: catalogues[locale] })
    expect(rootLocale).not.toHaveBeenCalled()
  })

  it('propagates failures when reading root params', async () => {
    const error = new Error('Root params unavailable')
    rootLocale.mockRejectedValue(error)

    await expect(requestConfig(params)).rejects.toBe(error)
  })
})
