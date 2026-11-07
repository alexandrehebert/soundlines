import english from './locales/en-US.json'
import french from './locales/fr.json'
import type { Locale } from './routing.ts'

const catalogues = { 'en-US': english, fr: french } satisfies Record<Locale, typeof english>

export function catalogueFor(locale: Locale) {
  return catalogues[locale]
}
