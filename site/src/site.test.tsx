import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { APP_URL } from '../../src/projectLinks.ts'
import brief from '../../docs/loops/briefs/turntable-hip-hop.json'
import selection from '../../docs/loops/briefs/turntable-hip-hop.selection.json'
import saxophoneIcon from '../../public/instrument-icons/saxophone.svg?raw'
import { wavPeaks } from '../scripts/waveform.ts'
import { App, Head } from './components/App.tsx'
import { hipHopLoop, instrumentBrief, instruments } from './components/assets.ts'
import { readIconBlueprint } from './components/blueprint.ts'
import { Legend } from './components/Diagrams.tsx'
import { PreviewView } from './components/Previews.tsx'
import { actors, copy, locales, repository, siteUrl, slugs, stats, type Flow, type FlowStep } from './content.ts'
import { matchRoute, repositoryUrl, routeFile, routePath, routes } from './routes.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
const base = import.meta.env.BASE_URL

describe('project companion content', () => {
  it.each(locales)('gives %s the same pages, workflows and resources as English', (locale) => {
    expect(copy[locale].stats.map(([key]) => key)).toEqual(copy.en.stats.map(([key]) => key))
    for (const slug of slugs) {
      const [en, fr] = [copy.en.pages[slug], copy[locale].pages[slug]]
      expect(fr.sections).toHaveLength(en.sections.length)
      expect(fr.flows.map((flow) => [flow.steps.map((step) => [step.actor, step.output[0], step.preview.kind]), flow.loops?.map(({ from, to }) => [from, to])])).toEqual(
        en.flows.map((flow) => [flow.steps.map((step) => [step.actor, step.output[0], step.preview.kind]), flow.loops?.map(({ from, to }) => [from, to])]),
      )
      expect(fr.overview?.lanes.map(([, stations]) => stations.length)).toEqual(en.overview?.lanes.map(([, stations]) => stations.length))
      expect(fr.example?.rows.length).toBe(en.example?.rows.length)
      expect(fr.example?.path).toBe(en.example?.path)
      expect(fr.showcase).toBe(en.showcase)
      expect(fr.resources.map(([path]) => path)).toEqual(en.resources.map(([path]) => path))
    }
  })

  it.each([
    ['en', 'From a data file to your screen', 'The AI-assisted team'],
    ['fr', 'Du fichier de données à votre écran', 'L’équipe assistée par IA'],
  ] as const)('shows only the app workflow on the %s build page', (locale, title, removedTitle) => {
    expect(copy[locale].pages.build.flows.map((flow) => flow.title)).toEqual([title])
    const html = renderToStaticMarkup(<App locale={locale} slug="build" />)
    expect(html).toContain(title)
    expect(html).not.toContain(removedTitle)
  })

  it.each(locales)('links Open Data from the %s music data resources, not the page navigation', (locale) => {
    const link = `href="${new URL(`${locale}/data`, APP_URL).href}"`
    const graph = renderToStaticMarkup(<App locale={locale} slug="graph" />)
    expect(graph.slice(graph.indexOf('id="resources"'))).toContain(link)
    expect(graph.split(link)).toHaveLength(2)
    expect(renderToStaticMarkup(<App locale={locale} slug="artwork" />)).not.toContain(link)
  })

  it('only links to repository paths that exist', () => {
    const paths = Object.values(copy.en.pages).flatMap((page) => [
      ...page.resources.map(([path]) => path).filter((path) => !/^https?:/.test(path)),
      ...(page.example ? [page.example.path] : []),
      ...(page.showcase ? instruments.map(({ slug }) => instrumentBrief(slug)) : []),
    ])
    for (const path of paths) expect(existsSync(`${root}${path.split('#')[0]}`), path).toBe(true)
  })

  it.each(locales)('links to the public Storybook on the %s build page', (locale) => {
    const html = renderToStaticMarkup(<App locale={locale} slug="build" />)
    expect(html).toContain(`href="${siteUrl}/storybook/"`)
  })

  it.each(routes)('opens header links in new tabs: $locale/$slug', (route) => {
    const html = renderToStaticMarkup(<App {...route} />)
    const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'))
    expect(header).toContain(`href="${siteUrl}/storybook/"`)
    expect(header).toContain(`href="${repository}" target="_blank" rel="noopener noreferrer" aria-label="GitHub"`)
    expect(header.match(/<a\b[^>]*>/g)).toHaveLength(4)
    expect(header.match(/<a\b[^>]* target="_blank"[^>]*>/g)).toHaveLength(4)
    expect(header).toContain('aria-label="Storybook"')
    expect(header.match(/group-focus-visible:visible/g)).toHaveLength(2)
    expect(header).toContain(`href="${new URL(route.locale, APP_URL).href}"`)
    expect(header).toContain(copy[route.locale].openApp)
  })

  it.each(routes)('provides $locale/$slug language links without JavaScript', (route) => {
    const html = renderToStaticMarkup(<App {...route} />)
    const fallback = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1]
    expect(fallback).toBeDefined()
    for (const locale of locales) expect(fallback).toContain(`href="${base}${routePath({ ...route, locale })}"`)
  })

  it.each(locales)('links directly to the evidence guide on the %s graph page', (locale) => {
    const html = renderToStaticMarkup(<App locale={locale} slug="graph" />)
    expect(html).toContain(`href="${repository}/blob/main/docs/graph/evidence/README.md"`)
    expect(html).not.toContain(`href="${repository}/tree/main/docs/graph/evidence"`)
  })

  it.each(routes)('shows real examples right after the workflows, with their brief: $locale/$slug', (route) => {
    const page = copy[route.locale].pages[route.slug]
    if (!page.example && !page.showcase) return
    const html = renderToStaticMarkup(<App {...route} />)
    const lastFlow = html.indexOf(`id="flow-${page.flows.length - 1}"`)
    const examples = html.indexOf(page.example ? 'id="example"' : 'id="showcase"')
    expect(lastFlow).toBeGreaterThan(-1)
    expect(examples).toBeGreaterThan(lastFlow)
    if (page.sections.length) expect(examples).toBeLessThan(html.indexOf('id="section-0"'))
    const briefs = page.example ? [page.example.path] : instruments.map(({ slug }) => instrumentBrief(slug))
    for (const path of briefs) expect(html).toContain(`href="${repositoryUrl(repository, path)}"`)
  })

  it('resolves every figure placeholder from the repository', () => {
    expect(stats.entries).toBeGreaterThan(0)
    expect(stats.connections).toBeGreaterThan(0)
    for (const locale of locales) expect(JSON.stringify(copy[locale])).not.toMatch(/\{\w+\}/)
  })
})

describe('workflow legends', () => {
  it('renders nothing when no workflow has steps', () => {
    expect(renderToStaticMarkup(<Legend c={copy.en} flows={[]} />)).toBe('')
    expect(renderToStaticMarkup(<Legend c={copy.en} flows={[{ title: 'Empty', caption: '', steps: [] }]} />)).toBe('')
  })

  it('combines actors across workflows without duplicates, in the usual order', () => {
    const step: FlowStep = { actor: 'human', title: '', text: '', output: ['doc', ''], preview: { kind: 'checks', items: [] } }
    const flows: Flow[] = [
      { title: 'First', caption: '', steps: [{ ...step, actor: 'script' }, { ...step, actor: 'agent' }, { ...step, actor: 'script' }] },
      { title: 'Second', caption: '', steps: [{ ...step, actor: 'human' }, { ...step, actor: 'test' }] },
    ]
    const legend = renderToStaticMarkup(<Legend c={copy.en} flows={flows} />)
    const labels = [...legend.matchAll(/>(Person|AI assistant|AI model|Code|Automatic check)<\/span>/g)].map((match) => match[1])
    expect(labels).toEqual(['Person', 'AI assistant', 'Code', 'Automatic check'])
  })

  it.each(routes)('shows exactly the actors used across the $locale/$slug page workflows', (route) => {
    const c = copy[route.locale]
    const page = c.pages[route.slug]
    const usedActors = new Set(page.flows.flatMap((flow) => flow.steps.map((step) => step.actor)))
    const legend = renderToStaticMarkup(<Legend c={c} flows={page.flows} />)
    const html = renderToStaticMarkup(<App {...route} />)

    if (usedActors.size === 0) {
      expect(legend).toBe('')
      expect(html).not.toContain(`>${c.legend}</span>`)
    } else {
      expect(html).toContain(legend)
    }

    for (const actor of actors) {
      const label = renderToStaticMarkup(<>{c.actors[actor]}</>)
      expect(legend.split(`>${label}</span>`)).toHaveLength(usedActors.has(actor) ? 2 : 1)
    }
  })
})

describe('artwork master preview', () => {
  it.each(locales)('shows the real outline, curve controls and drawing units in %s', (locale) => {
    const preview = copy[locale].pages.artwork.flows[0].steps.find((step) => step.preview.kind === 'blueprint')?.preview
    if (!preview || preview.kind !== 'blueprint') throw new Error('Missing artwork blueprint preview')
    const blueprint = readIconBlueprint(saxophoneIcon)
    const html = renderToStaticMarkup(<PreviewView preview={preview} locale={locale} final={false} />)
    expect(html).toContain(`d="${blueprint.path}"`)
    expect(html).toContain(`M${blueprint.curve.start.join(' ')}L${blueprint.curve.control1.join(' ')}`)
    expect(html).toContain(`M${blueprint.curve.end.join(' ')}L${blueprint.curve.control2.join(' ')}`)
    expect(html).toContain(`24 × 24 ${preview.units}`)
    expect(html).toContain(preview.description)
    expect(html).toContain(preview.anchors)
    expect(html).toContain(preview.handles)
    expect(html).not.toContain('mask-icon')
  })
})

describe('loop selection preview', () => {
  it.each([
    ['en', 'Full take', 'schematic waveform', 'Not kept', 'Selected section', 'Kept loop', '11.668 s', '22.103 s', '10.4 s', '11.67 s', '22.10 s'],
    ['fr', 'Prise complète', 'forme d’onde schématique', 'Non conservé', 'Passage sélectionné', 'Boucle conservée', '11,668 s', '22,103 s', '10,4 s', '11,67 s', '22,10 s'],
  ] as const)('shows the selected interval and retained loop in %s', (locale, take, schematic, discarded, selected, kept, start, end, length, startTick, endTick) => {
    const preview = copy[locale].pages.audio.flows[0].steps.find((step) => step.preview.kind === 'loop')?.preview
    expect(preview).toBeDefined()
    if (!preview) throw new Error('Missing loop selection preview')

    const html = renderToStaticMarkup(<PreviewView preview={preview} locale={locale} final={false} />)
    const left = selection.source_start_seconds / brief.duration * 100
    const width = selection.duration_seconds / brief.duration * 100
    expect(selection.source_start_seconds).toBeGreaterThan(0)
    expect(selection.duration_seconds).toBeGreaterThan(0)
    expect(selection.source_start_seconds + selection.duration_seconds).toBeLessThan(brief.duration)
    expect(html).toContain(`style="left:${left}%;width:${width}%"`)
    expect(html).toContain(`style="left:${left + width}%"`)
    expect(html).toContain(`aria-label="${take}: 36 s (${schematic}). ${selected}: ${start} – ${end}. ${discarded}: 0 s – ${start}, ${end} – 36 s. ${kept}: ${length}."`)
    expect(html).toContain(`>${startTick}</span>`)
    expect(html).toContain(`>${endTick}</span>`)
    expect(html).toContain('fill="var(--color-muted)"')
    expect(html).toContain('fill="var(--actor)"')
    expect(html).toContain(`>${kept}</span>`)
  })
})

describe('landing loop player', () => {
  it.each(locales)('renders the actual shipped waveform, audio and initial cursor in %s', (locale) => {
    const preview = copy[locale].pages.audio.flows[0].steps.find((step) => step.preview.kind === 'player')?.preview
    if (!preview || preview.kind !== 'player') throw new Error('Missing landing loop player')
    const html = renderToStaticMarkup(<PreviewView preview={preview} locale={locale} final />)
    expect(__LOOP_PEAKS__).toEqual(wavPeaks(`${root}public/loops/turntable-hip-hop.wav`))
    const heights = [...html.matchAll(/<rect\b[^>]*height="([^"]+)"/g)].map((match) => Number(match[1]))
    const waveform = __LOOP_PEAKS__.map((peak) => peak * 2)
    expect(heights).toEqual([...waveform, ...waveform])
    expect(html).toContain(`src="${hipHopLoop}"`)
    expect(html).toContain(`aria-label="${preview.waveformLabel}"`)
    expect(html).toContain(`aria-label="${preview.playerLabel}"`)
    expect(html).toContain('fill="var(--color-muted)" opacity="0.4"')
    expect(html).toContain('fill="var(--actor)" opacity="0.85"')
    expect(html).toContain('--progress:0%')
    expect(html).toContain('clip-path:inset(0 calc(100% - var(--progress)) 0 0)')
    expect(html).toContain('left:clamp(0px, var(--progress), calc(100% - 2px))')
    expect(html).toContain('controls="" loop=""')
  })
})

describe('routes', () => {
  it('covers every locale and page with clean, unique URLs', () => {
    expect(routes).toHaveLength(locales.length * slugs.length)
    expect(new Set(routes.map(routeFile)).size).toBe(routes.length)
    expect(routePath({ locale: 'fr', slug: 'index' })).toBe('fr/')
    expect(routeFile({ locale: 'en', slug: 'graph' })).toBe('en/graph/index.html')
  })

  it('resolves every route from its URL and falls back to the English overview', () => {
    for (const route of routes) expect(matchRoute(`/soundlines/${routePath(route)}`, '/soundlines/')).toEqual(route)
    expect(matchRoute('/soundlines/', '/soundlines/')).toEqual({ locale: 'en', slug: 'index' })
    expect(matchRoute('/soundlines/xx/nope/', '/soundlines/')).toEqual({ locale: 'en', slug: 'index' })
  })

  it('opens files as blobs and folders as trees on GitHub', () => {
    expect(repositoryUrl(repository, 'docs/DATA.md#instrument-artwork')).toBe(`${repository}/blob/main/docs/DATA.md#instrument-artwork`)
    expect(repositoryUrl(repository, '.github/skills')).toBe(`${repository}/tree/main/.github/skills`)
  })
})

describe.each(routes)('$locale/$slug page', (route) => {
  const html = renderToStaticMarkup(<App {...route} />)
  const page = copy[route.locale].pages[route.slug]

  it('has one title, a skip link and its translated content', () => {
    expect(html.match(/<h1\b/g)).toHaveLength(1)
    expect(html).toContain('href="#main"')
    expect(html).toContain('id="main"')
    expect(html).toContain(renderToStaticMarkup(<>{page.title}</>))
  })

  it('offers the same page in every language and links to the repository', () => {
    for (const locale of locales) expect(html).toContain(`value="${base}${routePath({ ...route, locale })}"`)
    expect(html).toContain(`href="${repository}"`)
  })

  it('declares canonical and alternate URLs', () => {
    const head = renderToStaticMarkup(<Head {...route} />)
    expect(head).toContain(`<link rel="canonical" href="https://alexandrehebert.github.io/soundlines/${routePath(route)}"/>`)
    for (const locale of locales) expect(head).toContain(`hrefLang="${locale}"`)
  })
})
