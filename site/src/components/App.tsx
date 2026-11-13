import { AudioLines, Cable, ChevronDown, Hammer, History, House, Network, Palette } from 'lucide-react'
import type { ReactNode } from 'react'
import { locales, slugs, copy, repository, siteUrl, type SiteCopy as Copy, type Locale, type Page, type Slug } from '../content.ts'
import { appUrl, storybookUrl } from '../links.ts'
import { repositoryUrl, routePath, type Route } from '../routes.ts'
import { favicon, instrumentBrief, instruments } from './assets.ts'
import { ExampleCard, FlowDiagram, Legend, Overview, Stats } from './Diagrams.tsx'
import { openDataPath, type OpenDataSection } from '../../../src/openData.ts'

const base = import.meta.env.BASE_URL
const href = (route: Route) => `${base}${routePath(route)}`
const openDataHref = (locale: Locale, section?: OpenDataSection) => new URL(`${locale}${section ? openDataPath(section) : '/data'}`, appUrl).href
const external = <span aria-hidden="true">↗</span>
const languageNames: Record<Locale, string> = { en: 'English', fr: 'Français', de: 'Deutsch', it: 'Italiano', es: 'Español' }
const pageIcons = { index: House, graph: Network, artwork: Palette, audio: AudioLines, build: Hammer, mcp: Cable, changelog: History }

function pageContent(c: Copy, slug: Slug): Page {
  const page = c.pages[slug]
  return slug === 'mcp' || slug === 'changelog'
    ? { ...page, label: c.openDataTitle, title: c.openDataTitle, intro: c.openDataDescription, resources: [] }
    : page
}

export function App({ locale, slug, page: pageNumber }: Route) {
  const c = copy[locale]
  const movedToApp = slug === 'mcp' || slug === 'changelog'
  const page = pageContent(c, slug)
  const home = slug === 'index'
  return (
    <>
      <a href="#main" className="skip-link">{c.skip}</a>
      <Header c={c} locale={locale} slug={slug} page={pageNumber} />
      <PageNav c={c} locale={locale} slug={slug} className="xl:border-b" />
      <main id="main" className="shell pb-12">
        <Hero c={c} page={page} home={home} />
        {home && <Stats c={c} locale={locale} />}
        {page.overview && <Overview overview={page.overview} />}
        <Legend c={c} flows={page.flows} />
        {page.flows.map((flow, i) => (
          <FlowDiagram key={flow.title} c={c} flow={flow} id={`flow-${i}`} locale={locale} />
        ))}
        {page.example && <ExampleCard c={c} example={page.example} href={repositoryUrl(repository, page.example.path)} />}
        {page.showcase && <Showcase c={c} locale={locale} />}
        <div className="max-w-190 pt-4">
          {page.sections.map(([title, text], i) => (
            <section key={title} aria-labelledby={`section-${i}`} className="my-10">
              <h2 id={`section-${i}`} className="heading-2">{title}</h2>
              <p className="mt-3 leading-[1.8] text-muted">{text}</p>
            </section>
          ))}
        </div>
        {movedToApp && (
          <section aria-label={c.openDataTitle} className="max-w-190 rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <a className="inline-flex min-h-11 items-center gap-3 rounded-full bg-fg px-5 font-semibold text-bg transition-colors hover:bg-accent"
              href={openDataHref(locale, slug === 'mcp' ? 'query' : 'changelog')} target="_blank" rel="noopener noreferrer">
              {c.openDataLink} {external}
            </a>
          </section>
        )}
        {home && <Chapters c={c} locale={locale} />}
        {!movedToApp && <Resources c={c} page={page} />}
      </main>
      <PageNav c={c} locale={locale} slug={slug} className="xl:border-t" />
      <footer className="shell flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-line py-8 text-sm text-muted">
        <a className="font-bold tracking-tight text-fg" href={href({ locale, slug: 'index' })} target="_blank" rel="noopener noreferrer">Soundlines</a>
        <p className="mr-auto max-w-150">{c.footer}</p>
        <a href={storybookUrl} target="_blank" rel="noopener noreferrer">Storybook {external}</a>
        <a href={repository} target="_blank" rel="noopener noreferrer">GitHub {external}</a>
      </footer>
    </>
  )
}

type ChromeProps = { c: Copy } & Route

function Header({ c, locale, slug, page }: ChromeProps) {
  return (
    <>
      <header className="shell relative flex items-center gap-1 py-4 sm:gap-3 lg:gap-6 lg:py-6">
        <a className="inline-flex min-w-0 items-center gap-2 text-sm font-bold tracking-tight sm:text-xl" href={href({ locale, slug: 'index' })} target="_blank" rel="noopener noreferrer">
          <img src={favicon} width={34} height={34} alt="" className="size-7 shrink-0 sm:size-8.5" />
          <span className="truncate">Soundlines</span>
          <span className="ml-2 hidden shrink-0 border-l border-line pl-4 text-sm font-normal tracking-normal text-muted xl:inline">{c.navigation}</span>
        </a>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
          <a className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-fg px-2 text-xs sm:px-4 font-bold text-bg sm:text-sm" href={new URL(locale, appUrl).href} target="_blank" rel="noopener noreferrer">
            <span className="sr-only sm:not-sr-only">{c.openApp}</span> {external}
          </a>
          <label className="site-language-select relative flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-bold text-muted transition-colors hover:text-fg focus-within:ring-2 focus-within:ring-focus">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" />
            </svg>
            <span aria-hidden="true">{locale.toUpperCase()}</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
            <select aria-label={c.language} value={href({ locale, slug, page })}
              onChange={(event) => { window.location.href = event.target.value }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
              {locales.map((target) => (
                <option key={target} value={href({ locale: target, slug, page })} lang={target}>
                  {languageNames[target]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <HeaderIconLink href={storybookUrl} label="Storybook">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.34.15l-.12 2.71 1.1-.84.94.74-.1-2.72 2.29-.14a1.45 1.45 0 0 1 1.54 1.45v21.2A1.45 1.45 0 0 1 20.39 24L3.1 22.84a1.45 1.45 0 0 1-1.35-1.4L1.02 2.47A1.45 1.45 0 0 1 2.38.97L16.34.15zM14.8 9.2c0 .57 3.83.3 3.83-.38.1-4.12-2.1-6.28-6.13-6.28-4.03 0-6.28 2.2-6.28 5.49 0 5.73 7.74 5.83 7.74 8.96 0 .89-.43 1.42-1.38 1.42-1.23 0-1.72-.63-1.66-2.77 0-.47-3.96-.6-4.08 0-.3 5.18 2.91 6.67 5.8 6.67 2.8 0 6.07-1.49 6.07-5.37 0-6.14-7.86-5.98-7.86-9.02 0-1.24.92-1.4 1.46-1.4.6 0 1.65.11 1.49 2.68z" transform="translate(2 1) scale(.85)" />
              </svg>
            </HeaderIconLink>
            <HeaderIconLink href={repository} label="GitHub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.62 0c2.15-1.46 3.1-1.15 3.1-1.15.61 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08v3.11c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75z" />
              </svg>
            </HeaderIconLink>
          </div>
        </div>
      </header>
      <noscript>
        <style>{'.site-language-select { display: none; }'}</style>
        <nav aria-label={c.language} className="shell flex flex-wrap gap-x-4 gap-y-2 pb-4 text-sm">
          {locales.map((target) => (
            <a key={target} href={href({ locale: target, slug, page })} lang={target} hrefLang={target} aria-current={target === locale ? 'page' : undefined}>
              {languageNames[target]}
            </a>
          ))}
        </nav>
      </noscript>
    </>
  )
}

function HeaderIconLink({ href, label, children }: {
  href: string
  label: string
  children: ReactNode
}) {
  return (
    <a
      className="group relative flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-fg sm:size-11"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      {children}
      <span aria-hidden="true" className="invisible absolute top-full right-0 z-10 pt-1 group-hover:visible group-focus-visible:visible">
        <span className="block rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold whitespace-nowrap text-fg shadow-lg">
          {label}
        </span>
      </span>
    </a>
  )
}

function PageNav({ c, locale, slug, className }: ChromeProps & { className: string }) {
  const CurrentIcon = pageIcons[slug]
  const links = slugs.filter((key) => key !== 'mcp' && key !== 'changelog').map((key) => {
    const Icon = pageIcons[key]
    return (
      <a
        key={key}
        href={href({ locale, slug: key })}
        aria-current={key === slug ? 'page' : undefined}
        className="flex items-center gap-1.5 py-3.5 text-sm text-muted hover:text-fg aria-[current=page]:text-accent xl:shrink-0 xl:whitespace-nowrap xl:aria-[current=page]:shadow-[inset_0_-2px_var(--color-accent)]"
      >
        <Icon size={16} aria-hidden="true" className="shrink-0" />
        {c.pages[key].nav ?? c.pages[key].label}
      </a>
    )
  }).concat(
    <a key="open-data" href={openDataHref(locale)} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 py-3.5 text-sm text-muted hover:text-fg xl:shrink-0 xl:whitespace-nowrap">
      <Network size={16} aria-hidden="true" className="shrink-0" />
      {c.openDataLink}
      {external}
    </a>,
  )

  return (
    <nav aria-label={c.navigation} className={`shell border-line ${className}`}>
      <details className="group py-2 xl:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
          <CurrentIcon size={16} aria-hidden="true" className="shrink-0 text-accent" />
          {c.pages[slug].label}
          <ChevronDown size={16} aria-hidden="true" className="ml-auto shrink-0 group-open:rotate-180" />
        </summary>
        <div className="mt-1 divide-y divide-line px-3">{links}</div>
      </details>
      <div className="hidden gap-x-5 overflow-x-auto xl:flex">{links}</div>
    </nav>
  )
}

function Hero({ c, page, home }: { c: Copy; page: Page; home: boolean }) {
  return (
    <section
      aria-labelledby="title"
      className={`py-12 sm:pt-20 ${home ? 'grid items-center gap-12 sm:pb-20 md:grid-cols-[1.5fr_1fr]' : 'max-w-212'}`}
    >
      <div className="self-start">
        <p className="eyebrow">{home ? c.eyebrow : (page.eyebrow ?? page.label)}</p>
        <h1 id="title" className="my-5 text-[clamp(2.6rem,5.6vw,4.8rem)] leading-[1.06] font-bold tracking-[-0.065em] text-balance">
          {page.title}
        </h1>
        <p className="max-w-190 text-lg leading-[1.8] text-muted">{page.intro}</p>
        {home && (
          <a
            className="mt-4 inline-flex gap-6 rounded-full border border-accent px-6 py-3.5 text-sm font-semibold hover:bg-accent hover:text-bg"
            href={repository}
          >
            {c.source} {external}
          </a>
        )}
      </div>
      {home && <Record />}
    </section>
  )
}

function Record() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto grid aspect-square w-[min(320px,75%)] place-items-center rounded-full border-2 border-[#464051] bg-[repeating-radial-gradient(circle,#121019_0_3px,#302b38_4px,#17141f_5px_7px)] shadow-[0_2rem_5rem_#0005] motion-safe:animate-[spin_40s_linear_infinite] md:w-full"
    >
      <div className="flex aspect-square w-[41%] flex-col items-center justify-center gap-1 rounded-full bg-accent text-center text-sm font-extrabold tracking-tight text-[#201637] md:text-base">
        SOUNDLINES
        <span className="font-mono text-[0.55em] tracking-widest">SIDE A / FACE A</span>
      </div>
    </div>
  )
}

function Chapters({ c, locale }: { c: Copy; locale: Locale }) {
  const chapters = Object.entries(c.pages).filter(([key]) => key !== 'index' && key !== 'mcp' && key !== 'changelog')
  return (
    <section aria-labelledby="inside" className="my-14">
      <h2 id="inside" className="heading-2">{c.next}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {chapters.map(([key, value], i) => (
          <a key={key} href={href({ locale, slug: key as Slug })} className="card group">
            <span className="eyebrow">0{i + 1}</span>
            <h3 className="mt-4 mb-2 text-2xl font-bold tracking-tight">{value.label}</h3>
            <p className="text-sm leading-[1.8] text-muted">{value.intro}</p>
            <span aria-hidden="true" className="mt-2 inline-block text-accent transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
          </a>
        ))}
        <a href={openDataHref(locale)} target="_blank" rel="noopener noreferrer" className="card group">
          <span className="eyebrow">Open Data</span>
          <h3 className="mt-4 mb-2 text-2xl font-bold tracking-tight">{c.openDataTitle}</h3>
          <p className="text-sm leading-[1.8] text-muted">{c.openDataDescription}</p>
          <span aria-hidden="true" className="mt-2 inline-block text-accent transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
        </a>
      </div>
    </section>
  )
}

function Showcase({ c, locale }: { c: Copy; locale: Locale }) {
  return (
    <section aria-labelledby="showcase" className="my-14">
      <h2 id="showcase" className="eyebrow">{c.examples}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {instruments.map((instrument) => (
          <figure key={instrument.slug} className="rounded-xl border border-line bg-surface p-5">
            <img src={instrument.banner} width={640} height={160} alt={instrument.name[locale]} loading="lazy" />
            <figcaption className="flex flex-wrap items-center gap-3 pt-4 text-sm text-muted">
              <img src={instrument.icon} width={24} height={24} alt="" className="box-content rounded bg-accent p-0.5" />
              {instrument.name[locale]}
              <a
                className="ml-auto inline-block py-1 text-fg underline underline-offset-4"
                href={repositoryUrl(repository, instrumentBrief(instrument.slug))}
              >
                {c.brief}<span className="sr-only"> ({instrument.name[locale]})</span> {external}
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Resources({ c, page }: { c: Copy; page: Page }) {
  return (
    <aside aria-labelledby="resources" className="my-12 border-l-3 border-accent bg-surface px-5 py-6 sm:px-8">
      <h2 id="resources" className="heading-2">{c.resources}</h2>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {page.resources.map(([path, title]) => (
          <li key={path}>
            <a
              className="inline-block py-2 underline underline-offset-4"
              href={/^https?:/.test(path) ? path : repositoryUrl(repository, path)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {title} {external}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">{c.docsNote}</p>
    </aside>
  )
}

/** Document metadata, rendered into <head> by the prerender step. */
export function Head({ locale, slug, page: pageNumber }: Route) {
  const page = pageContent(copy[locale], slug)
  const url = (target: Locale) => `${siteUrl}/${routePath({ locale: target, slug, page: pageNumber })}`
  const title = `${page.label}${pageNumber ? ` · ${pageNumber}` : ''} · Soundlines`
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={page.intro} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={page.intro} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url(locale)} />
      <link rel="canonical" href={url(locale)} />
      {locales.map((target) => <link key={target} rel="alternate" hrefLang={target} href={url(target)} />)}
      <link rel="alternate" hrefLang="x-default" href={url('en')} />
      <link rel="icon" href={favicon} type="image/svg+xml" />
    </>
  )
}
