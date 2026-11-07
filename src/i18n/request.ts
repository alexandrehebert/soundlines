import { getRequestConfig } from 'next-intl/server'
import * as rootParams from 'next/root-params'
import english from './locales/en.json'
import french from './locales/fr.json'
import { DEFAULT_LOCALE, isLocale, type Locale } from './routing.ts'

const catalogues = { en: english, fr: french } satisfies Record<Locale, typeof english>

export default getRequestConfig(async ({ locale: localeOverride }) => {
  const requestedLocale = localeOverride ?? await rootParams.locale()
  const locale: Locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE

  return {
    locale,
    messages: catalogues[locale],
  }
})
