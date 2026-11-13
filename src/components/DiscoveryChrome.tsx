'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useExplorer } from '../ExplorerContext.ts'
import { localizePath, stripLocalePrefix } from '../i18n/routing.ts'
import { companionUrl, newIssueUrl, REPOSITORY_URL } from '../projectLinks.ts'
import { BrandLink } from './BrandLink.tsx'
import { follow } from './followLink.ts'
import { ViewLink } from './HomeLinks.tsx'
import { SearchBar } from './SearchBar.tsx'
import './Home.css'

export type DiscoveryPage = 'home' | 'data' | 'jukebox'

const FOOTER_VIEWS = ['genre', 'artist', 'instrument', 'history'] as const

const LANGUAGES = [
  { locale: 'en', label: 'english' },
  { locale: 'fr', label: 'french' },
  { locale: 'de', label: 'german' },
  { locale: 'it', label: 'italian' },
  { locale: 'es', label: 'spanish' },
] as const

export function DiscoveryHeader({ current }: { current: DiscoveryPage }) {
  const { locale } = useExplorer()
  const t = useTranslations('projectLinks')
  const isHome = current === 'home'
  return (
    <header className="discovery-header">
      <div className="discovery-width discovery-header-inner">
        <BrandLink className="discovery-brand" href={localizePath('/', locale)} aria-current={isHome ? 'page' : undefined}
          onClick={isHome ? (event) => follow(event) : undefined}>Soundlines</BrandLink>
        <div className="discovery-search"><SearchBar /></div>
        <a href={REPOSITORY_URL} className="discovery-repository" aria-label={t('repository')} title={t('repository')}>
          <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
            <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.94.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.64 0c2.15-1.45 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.33-2.64 5.28-5.15 5.56.4.35.76 1.04.76 2.1v3.08c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
          </svg>
        </a>
      </div>
    </header>
  )
}

export function DiscoveryFooter({ current }: { current: DiscoveryPage }) {
  const { locale } = useExplorer()
  const pathname = usePathname()
  const t = useTranslations()
  const tHome = useTranslations('homeCopy')
  const tViews = useTranslations('views')
  // Language links keep the visitor on the same page, e.g. /fr/data/query -> /de/data/query.
  const localizedPath = current === 'home' || !pathname ? '/' : stripLocalePrefix(pathname)
  return (
    <footer className="discovery-footer">
      <div className="discovery-width">
        <nav className="discovery-footer-links discovery-footer-languages" aria-label={tHome('footer.languages')}>
          {LANGUAGES.map(({ locale: targetLocale, label }) => (
            <a
              key={targetLocale}
              href={localizePath(localizedPath, targetLocale)}
              lang={targetLocale}
              hrefLang={targetLocale}
              aria-current={locale === targetLocale ? 'page' : undefined}
            >
              {tHome(`footer.${label}`)}
            </a>
          ))}
        </nav>
        <nav className="discovery-footer-links discovery-footer-pages" aria-label={tHome('footer.pages')}>
          <a href={localizePath('/', locale)} aria-current={current === 'home' ? 'page' : undefined}>{tHome('footer.home')}</a>
          {FOOTER_VIEWS.map((view) => (
            <ViewLink key={view} view={view} className="discovery-footer-link">{tViews(view)}</ViewLink>
          ))}
          <Link href={localizePath('/jukebox', locale)} aria-current={current === 'jukebox' ? 'page' : undefined}>{t('jukebox.title')}</Link>
          <a href={localizePath('/data', locale)} aria-current={current === 'data' ? 'page' : undefined}>{t('openData.title')}</a>
        </nav>
        <nav className="discovery-footer-links discovery-footer-project" aria-label={t('projectLinks.navigation')}>
          <a href={REPOSITORY_URL}>{t('projectLinks.repository')}</a>
          <a href={companionUrl(locale)}>{t('projectLinks.about')}</a>
          <a href={newIssueUrl(t('feedback.addTitle'), t('feedback.addBody'))} target="_blank" rel="noopener noreferrer">{t('feedback.add')}</a>
          <a href={newIssueUrl(t('feedback.appTitle'), t('feedback.appBody'))} target="_blank" rel="noopener noreferrer">{t('feedback.app')}</a>
        </nav>
        <div className="discovery-footer-meta">
          <p>
            {tHome('madeWith')} <Heart className="discovery-footer-heart" size={16} aria-hidden="true" />
            <span className="sr-only">{tHome('madeWithLove')}</span>{' '}{tHome('by')} Alexandre <strong>“Axoune”</strong> Hebert
          </p>
          <p className="discovery-copyright">© 2026 Soundlines. {t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
