import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { graphForLocale } from '../data/graphLocale.ts'
import { explorerUrl, readExplorerLocation } from '../explorerLocation.ts'
import { buildIndex } from '../graph/graph.ts'
import type { GraphNode } from '../graph/types.ts'
import { socialMetadata } from '../socialMetadata.ts'
import { isLocale, LOCALES, localizePath, stripLocalePrefix, type Locale } from './routing.ts'

export type LocalizedPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type PageRoute = '' | 'genres' | 'artists' | 'instruments' | 'history'

const nodeByIdByLocale = new Map<Locale, ReadonlyMap<string, GraphNode>>(
  LOCALES.map((locale) => [locale, buildIndex(graphForLocale(locale)).nodeById]),
)

function nodesForLocale(locale: Locale): ReadonlyMap<string, GraphNode> {
  const nodes = nodeByIdByLocale.get(locale)
  if (!nodes) throw new Error(`Missing graph index for locale ${locale}`)
  return nodes
}

async function pageRequest(props: LocalizedPageProps, route: PageRoute) {
  const [{ locale: rawLocale }, query, requestHeaders] = await Promise.all([
    props.params,
    props.searchParams,
    headers(),
  ])
  if (!isLocale(rawLocale)) notFound()
  const locale: Locale = rawLocale

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

export async function ensureCanonicalPage(props: LocalizedPageProps, route: PageRoute): Promise<void> {
  const { locale, initialUrl } = await pageRequest(props, route)
  const url = new URL(initialUrl)
  const location = readExplorerLocation(url, nodesForLocale(locale))
  const canonical = explorerUrl(location, locale, url)
  if (canonical.pathname !== url.pathname || canonical.search !== url.search) {
    redirect(`${canonical.pathname}${canonical.search}`)
  }
}

export async function generateLocalizedMetadata(props: LocalizedPageProps, route: PageRoute): Promise<Metadata> {
  const { locale, initialUrl } = await pageRequest(props, route)
  const metadata = socialMetadata(new URL(initialUrl), nodesForLocale(locale), locale)
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
