import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { APP_URL } from '../projectLinks.ts'
import { openDataPath, type OpenDataSection } from '../openData.ts'
import { catalogueFor } from './catalogue.ts'
import { isLocale, LOCALES, localizePath } from './routing.ts'

export type OpenDataPageProps = { params: Promise<{ locale: string }> }

export async function openDataLocale({ params }: OpenDataPageProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return locale
}

export async function generateOpenDataMetadata(props: OpenDataPageProps, section: OpenDataSection): Promise<Metadata> {
  const locale = await openDataLocale(props)
  const copy = catalogueFor(locale)
  const path = openDataPath(section)
  const title = `${copy.openData[section].title} | ${copy.seo.data.title}`
  const description = copy.openData[section].description
  const url = new URL(localizePath(path, locale), APP_URL).href
  const image = new URL('/social-card.png', APP_URL).href
  return {
    metadataBase: new URL(APP_URL),
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(LOCALES.map((target) => [
        target, new URL(localizePath(path, target), APP_URL).href,
      ])),
    },
    openGraph: {
      title, description, url, siteName: 'Soundlines', type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: copy.social.imageAlt }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}
