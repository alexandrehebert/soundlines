import english from './locales/en.json'
import french from './locales/fr.json'
import german from './locales/de.json'
import italian from './locales/it.json'
import spanish from './locales/es.json'
import type { Locale } from './routing.ts'

const catalogues = { en: english, fr: french, de: german, it: italian, es: spanish } satisfies Record<Locale, typeof english>

export function catalogueFor(locale: Locale) {
  return catalogues[locale]
}
