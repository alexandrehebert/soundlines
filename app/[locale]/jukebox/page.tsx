import type { Metadata } from 'next'
import { APP_URL } from '../../../src/projectLinks.ts'
import { notFound } from 'next/navigation'
import { Jukebox } from '../../../src/components/Jukebox.tsx'
import { catalogueFor } from '../../../src/i18n/catalogue.ts'
import { isLocale, localizePath, LOCALES } from '../../../src/i18n/routing.ts'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const { title, description } = catalogueFor(locale).jukebox

  return {
    metadataBase: new URL(APP_URL),
    title: `${title} · Soundlines`,
    description,
    alternates: {
      canonical: localizePath('/jukebox', locale),
      languages: Object.fromEntries(LOCALES.map((language) => [language, localizePath('/jukebox', language)])),
    },
  }
}

export default function JukeboxPage() {
  return <Jukebox />
}
