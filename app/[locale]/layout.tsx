import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import type { ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getNow, getTranslations } from 'next-intl/server'
import '../../src/index.css'
import '../../src/pageLoading.css'
import { GRAPH_OVERLAYS } from '../../src/data/graphLocale.ts'
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
          <div id="page-loading" role="status" aria-label={t('loading')} data-loading="true" data-opening>
            <div className="page-loading-record" aria-hidden="true">
              <div className="page-loading-vinyl">
                <div className="discovery-vinyl">
                  <div className="discovery-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
                    </svg>
                  </div>
                </div>
              </div>
              <span className="page-loading-wordmark">Soundlines</span>
            </div>
          </div>
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
