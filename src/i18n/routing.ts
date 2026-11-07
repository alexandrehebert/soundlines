import { defineRouting } from 'next-intl/routing'

export const LOCALES = ['en-US', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en-US'
const LOCALE_PREFIXES = { 'en-US': '/en', fr: '/fr' } as const satisfies Record<Locale, string>

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: { mode: 'always', prefixes: LOCALE_PREFIXES },
})

export function isLocale(value: string): value is Locale {
  return LOCALES.some((locale) => locale === value)
}

export function localeFromPath(pathname: string): Locale | undefined {
  const firstSegment = pathname.split('/')[1]
  if (!firstSegment) return undefined
  return LOCALES.find((locale) => locale === firstSegment || LOCALE_PREFIXES[locale].slice(1) === firstSegment)
}

export function stripLocalePrefix(pathname: string): string {
  if (!localeFromPath(pathname)) return pathname
  const nextSlash = pathname.indexOf('/', 1)
  return nextSlash === -1 ? '/' : pathname.slice(nextSlash)
}

export function localizePath(path: string, locale: Locale): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${LOCALE_PREFIXES[locale]}${normalizedPath === '/' ? '' : normalizedPath}`
}
