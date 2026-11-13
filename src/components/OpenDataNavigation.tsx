'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Database, HeartHandshake, History, Terminal } from 'lucide-react'
import { localizePath, type Locale } from '../i18n/routing.ts'
import { OPEN_DATA_SECTIONS, openDataPath } from '../openData.ts'

const icons = { dataset: Database, query: Terminal, changelog: History, contribute: HeartHandshake }

export function OpenDataNavigation({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const t = useTranslations('openData')
  return (
    <nav aria-label={t('title')} className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
      {OPEN_DATA_SECTIONS.map((section) => {
        const href = localizePath(openDataPath(section), locale)
        const selected = pathname === href
        const Icon = icons[section]
        return (
          <Link key={section} href={href} aria-current={selected ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              selected ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200' : 'border-slate-700 text-slate-400 hover:border-cyan-400 hover:text-cyan-200'
            }`}>
            <Icon size={16} aria-hidden="true" />
            {t(`${section}.title`)}
          </Link>
        )
      })}
    </nav>
  )
}
