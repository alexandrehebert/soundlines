import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import type { ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getNow, getTranslations } from 'next-intl/server'
import '../../styles.css'
import { PageLoading } from '../../src/design-system/ui/PageLoading.tsx'
import { GRAPH_OVERLAYS } from '@soundlines/catalogue/graphLocale'
import { SoundlinesProviders } from '../../src/SoundlinesProviders.tsx'
import { faviconUrl } from '../../src/favicon.ts'
import { isLocale } from '../../src/i18n/routing.ts'
import { pageMetadata } from '../../src/i18n/seo.ts'

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return {
    ...pageMetadata(locale, 'home'),
    openGraph: {
      siteName: 'Soundlines',
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  // The explorer's initial server render depends on the request's search parameters.
  await connection()
  // Share the request time so daily selections match during hydration.
  const [messages, t, now] = await Promise.all([getMessages(), getTranslations(), getNow()])

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href={faviconUrl('dark')} media="all" data-soundlines-favicon="dark" suppressHydrationWarning />
        <link rel="icon" type="image/svg+xml" href={faviconUrl('light')} media="not all" data-soundlines-favicon="light" suppressHydrationWarning />
      </head>
      <body>
        <NextIntlClientProvider messages={messages} now={now}>
          <PageLoading label={t('loading')} />
          <noscript>
            <style>{'#page-loading { display: none; }'}</style>
            {t('requiresJavascript')}
          </noscript>
          <div id="root" aria-busy="true">
            <SoundlinesProviders locale={locale} overlay={locale === 'en' ? undefined : GRAPH_OVERLAYS[locale]}>{children}</SoundlinesProviders>
          </div>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
