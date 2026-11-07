import { copy, repository, siteUrl, type Copy, type Locale, type Page, type Slug } from '../content.ts'
import { repositoryUrl, routePath, type Route } from '../routes.ts'
import { favicon, instrumentBrief, instruments } from './assets.ts'
import { ExampleCard, FlowDiagram, Legend, Overview, Stats } from './Diagrams.tsx'

const base = import.meta.env.BASE_URL
const href = (route: Route) => `${base}${routePath(route)}`
const external = <span aria-hidden="true">↗</span>

export function App({ locale, slug }: Route) {
  const c = copy[locale]
  const page = c.pages[slug]
  const home = slug === 'index'
  return (
    <>
      <a href="#main" className="skip-link">{c.skip}</a>
      <Header c={c} locale={locale} slug={slug} />
      <PageNav c={c} locale={locale} slug={slug} className="border-b" />
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
        {home && <Chapters c={c} locale={locale} />}
        <Resources c={c} page={page} />
        <PageNav c={c} locale={locale} slug={slug} className="border-t" />
      </main>
      <footer className="shell flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-line py-8 text-sm text-muted">
        <a className="font-bold tracking-tight text-fg" href={href({ locale, slug: 'index' })}>Soundlines</a>
        <p className="mr-auto max-w-150">{c.footer}</p>
        <a href={repository}>GitHub {external}</a>
      </footer>
    </>
  )
}

type ChromeProps = { c: Copy; locale: Locale; slug: Slug }

function Header({ c, locale, slug }: ChromeProps) {
  return (
    <header className="shell flex items-center gap-2 py-6 sm:gap-6">
      <a className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight sm:text-xl" href={href({ locale, slug: 'index' })}>
        <img src={favicon} width={34} height={34} alt="" />
        Soundlines
        <span className="ml-2 hidden border-l border-line pl-4 text-sm font-normal tracking-normal text-muted md:inline">{c.navigation}</span>
      </a>
      <nav aria-label={c.language} className="ml-auto flex text-xs font-bold">
        {(['en', 'fr'] as const).map((target) => (
          <a
            key={target}
            href={href({ locale: target, slug })}
            lang={target}
            hrefLang={target}
            aria-current={target === locale ? 'page' : undefined}
            className="rounded-full p-3 text-muted aria-[current=page]:bg-surface aria-[current=page]:text-fg"
          >
            {target.toUpperCase()}
          </a>
        ))}
      </nav>
      <a className="py-3 text-sm" href={repository}>GitHub {external}</a>
    </header>
  )
}

function PageNav({ c, locale, slug, className }: ChromeProps & { className: string }) {
  return (
    <nav aria-label={c.navigation} className={`shell flex flex-wrap gap-x-6 border-line ${className}`}>
      {Object.entries(c.pages).map(([key, value]) => (
        <a
          key={key}
          href={href({ locale, slug: key as Slug })}
          aria-current={key === slug ? 'page' : undefined}
          className="py-3.5 text-sm text-muted hover:text-fg aria-[current=page]:text-accent aria-[current=page]:shadow-[inset_0_-2px_var(--color-accent)]"
        >
          {value.label}
        </a>
      ))}
    </nav>
  )
}

function Hero({ c, page, home }: { c: Copy; page: Page; home: boolean }) {
  return (
    <section
      aria-labelledby="title"
      className={home ? 'grid items-center gap-12 py-12 sm:py-20 md:grid-cols-[1.5fr_1fr]' : 'max-w-212 py-12 sm:pt-20'}
    >
      <div>
        <p className="eyebrow">{home ? c.eyebrow : page.label}</p>
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
  const chapters = Object.entries(c.pages).filter(([key]) => key !== 'index')
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
            <a className="inline-block py-2 underline underline-offset-4" href={repositoryUrl(repository, path)}>
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
export function Head({ locale, slug }: Route) {
  const page = copy[locale].pages[slug]
  const url = (target: Locale) => `${siteUrl}/${routePath({ locale: target, slug })}`
  const title = `${page.label} · Soundlines`
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={page.intro} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={page.intro} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url(locale)} />
      <link rel="canonical" href={url(locale)} />
      <link rel="alternate" hrefLang="en" href={url('en')} />
      <link rel="alternate" hrefLang="fr" href={url('fr')} />
      <link rel="alternate" hrefLang="x-default" href={url('en')} />
      <link rel="icon" href={favicon} type="image/svg+xml" />
    </>
  )
}
