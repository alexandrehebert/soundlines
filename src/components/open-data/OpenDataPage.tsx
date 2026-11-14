import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '../../i18n/routing.ts'
import { DiscoveryFooter, DiscoveryHeader } from '../DiscoveryChrome.tsx'
import { OpenDataNavigation } from './OpenDataNavigation.tsx'

export async function OpenDataPage({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = await getTranslations({ locale, namespace: 'openData' })
  return (
    <div className="discovery flex flex-col">
      <DiscoveryHeader current="data" />
      <main className="discovery-width discovery-main flex-1">
        <header className="mb-10 border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{t('title')}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">{t('intro')}</p>
          <OpenDataNavigation locale={locale} />
        </header>
        {children}
      </main>
      <DiscoveryFooter current="data" />
    </div>
  )
}
