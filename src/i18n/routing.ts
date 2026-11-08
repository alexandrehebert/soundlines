import { defineRouting } from 'next-intl/routing'

export const LOCALES = ['en', 'fr', 'de', 'it', 'es'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
})

export function isLocale(value: string): value is Locale {
  return LOCALES.some((locale) => locale === value)
}

export function localeFromPath(pathname: string): Locale | undefined {
  const firstSegment = pathname.split('/')[1]
  if (!firstSegment) return undefined
  return LOCALES.find((locale) => locale === firstSegment)
}

export function stripLocalePrefix(pathname: string): string {
  if (!localeFromPath(pathname)) return pathname
  const nextSlash = pathname.indexOf('/', 1)
  return nextSlash === -1 ? '/' : pathname.slice(nextSlash)
}

export function localizePath(path: string, locale: Locale): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `/${locale}${normalizedPath === '/' ? '' : normalizedPath}`
}
