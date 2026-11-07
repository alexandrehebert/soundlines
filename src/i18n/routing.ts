import { defineRouting } from 'next-intl/routing'

export const LOCALES = ['en-US', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en-US'

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
})

export function isLocale(value: string): value is Locale {
  return LOCALES.some((locale) => locale === value)
}

export function localeFromPath(pathname: string): Locale | undefined {
  const firstSegment = pathname.split('/')[1]
  return firstSegment && isLocale(firstSegment) ? firstSegment : undefined
}

export function localizePath(path: string, locale: Locale): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `/${locale}${normalizedPath === '/' ? '' : normalizedPath}`
}
