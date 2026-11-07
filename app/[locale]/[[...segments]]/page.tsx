import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import App from '../../../src/App.tsx'
import { buildIndex } from '../../../src/graph/graph.ts'
import { isLocale, LOCALES, localizePath, stripLocalePrefix, type Locale } from '../../../src/i18n/routing.ts'
import { socialMetadata } from '../../../src/socialMetadata.ts'
import type { GraphNode } from '../../../src/graph/types.ts'
import { graphForLocale } from '../../../src/data/graphLocale.ts'

const routePaths = new Set(['', 'genres', 'artists', 'instruments', 'history'])

type LocalizedPageProps = {
  params: Promise<{ locale: string; segments?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const nodeByIdByLocale = new Map<Locale, ReadonlyMap<string, GraphNode>>(
  LOCALES.map((locale) => [locale, buildIndex(graphForLocale(locale)).nodeById]),
)

async function pageRequest(props: LocalizedPageProps) {
  const [{ locale: rawLocale, segments }, query, requestHeaders] = await Promise.all([
    props.params,
    props.searchParams,
    headers(),
  ])
  if (!isLocale(rawLocale)) notFound()
  const locale: Locale = rawLocale
  const route = segments?.join('/') ?? ''
  if (!routePaths.has(route)) notFound()

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((entry) => search.append(key, entry))
    else if (value !== undefined) search.set(key, value)
  }
  const pathname = localizePath(route, locale)
  const host = (requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'))?.split(',')[0].trim()
  if (!host || /[\s/?#@\\]/.test(host)) throw new Error('A valid request Host header is required')
  const forwardedProtocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0].trim()
  const protocol = forwardedProtocol === 'https' ? 'https' : 'http'
  const initialUrl = new URL(`${pathname}${search.size ? `?${search}` : ''}`, `${protocol}://${host}`).href

  return { locale, initialUrl }
}

export async function generateMetadata(props: LocalizedPageProps): Promise<Metadata> {
  const { locale, initialUrl } = await pageRequest(props)
  const metadata = socialMetadata(new URL(initialUrl), nodeByIdByLocale.get(locale)!, locale)
  const canonical = new URL(metadata.url)
  const untranslatedPath = stripLocalePrefix(canonical.pathname)
  const languages = Object.fromEntries(LOCALES.map((targetLocale) => {
    const alternate = new URL(canonical.href)
    alternate.pathname = localizePath(untranslatedPath, targetLocale)
    return [targetLocale, alternate.href]
  }))

  return {
    metadataBase: new URL(canonical.origin),
    title: metadata.title,
    description: metadata.description,
    alternates: { canonical: metadata.url, languages },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: metadata.url,
      siteName: 'Soundlines',
      type: 'website',
      images: [{ url: metadata.image, width: 1200, height: 630, alt: metadata.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: [{ url: metadata.image, alt: metadata.imageAlt }],
    },
  }
}

export default async function LocalizedPage(props: LocalizedPageProps) {
  const { locale, initialUrl } = await pageRequest(props)
  return <App locale={locale} initialUrl={initialUrl} />
}
