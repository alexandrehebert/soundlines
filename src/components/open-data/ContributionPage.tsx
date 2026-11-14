import { ArrowUpRight, CirclePlus, PencilLine } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { localizePath, type Locale } from '../../i18n/routing.ts'
import { REPOSITORY_URL } from '../../projectLinks.ts'

export async function ContributionPage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'openData.contribute' })
  const feedback = await getTranslations({ locale, namespace: 'feedback' })
  const actions = [
    {
      title: t('editTitle'),
      text: t('editText'),
      label: t('findEntry'),
      href: localizePath('/', locale),
      icon: PencilLine,
      external: false,
    },
    {
      title: t('addTitle'),
      text: t('addText'),
      label: feedback('add'),
      href: `${REPOSITORY_URL}/issues/new?template=graph-contribution.yml`,
      icon: CirclePlus,
      external: true,
    },
  ]

  return (
    <section aria-labelledby="contribute-title" className="pb-8">
      <header className="mb-8">
        <h2 id="contribute-title" className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">{t('description')}</p>
      </header>
      <section aria-label={t('actionsLabel')} className="grid gap-4 md:grid-cols-2">
        {actions.map(({ title, text, label, href, icon: Icon, external }) => (
          <article key={title} className="flex flex-col items-start rounded-2xl border border-[var(--home-line)] bg-[var(--home-surface)] p-5 sm:p-7">
            <Icon size={22} className="text-[var(--home-accent)]" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-bold tracking-tight">{title}</h3>
            <p className="mt-2 flex-1 leading-relaxed text-[var(--home-muted)]">{text}</p>
            <a
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--home-text)] px-4 text-sm font-bold text-[var(--home-background)] transition-opacity hover:opacity-80 focus-visible:outline-none"
            >
              {label}
              {external && <ArrowUpRight size={16} aria-hidden="true" />}
            </a>
          </article>
        ))}
      </section>

      <p className="mt-5 text-sm text-[var(--home-muted)]">{t('githubNote')}</p>
      <aside className="mt-8 max-w-3xl rounded-2xl border border-[var(--home-line)] px-5 py-5 sm:px-7">
        <h3 className="text-lg font-bold">{t('guideTitle')}</h3>
        <p className="mt-2 leading-relaxed text-[var(--home-muted)]">{t('guideText')}</p>
        <a
          href={`${REPOSITORY_URL}/blob/main/docs/DATA.md#graph-contribution-workflow`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--home-accent)] underline decoration-current/40 underline-offset-4 transition-colors hover:text-[var(--home-text)]"
        >
          {t('guide')}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </aside>
    </section>
  )
}
