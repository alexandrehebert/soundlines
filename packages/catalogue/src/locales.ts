export const LOCALES = ['en', 'fr', 'de', 'it', 'es'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'
