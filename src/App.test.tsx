import { readFileSync } from 'node:fs'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Explorer, GenreDisplaySelect, ViewToggle } from './App.tsx'
import { ExplorerContext } from './ExplorerContext.ts'
import { DatasetStats } from './components/DatasetStats.tsx'
import { Home } from './components/Home.tsx'
import { Legend } from './components/Legend.tsx'
import { buildIndex } from './graph/graph.ts'
import { createTimelineModel, type ExplorerView } from './graph/timeline.ts'
import type { MusicGraph } from './graph/types.ts'
import { DEFAULT_LOCALE, type Locale } from './i18n/routing.ts'
import { renderWithIntl } from './i18n/test-utils.tsx'

vi.mock('./components/SearchBar.tsx', () => ({ SearchBar: () => null }))

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:jazz', type: 'genre', name: 'Jazz', family: 'jazz', period: { start: 1900 } },
    { id: 'artist:a', type: 'artist', name: 'Artist A', period: { start: 1950 } },
    { id: 'artist:b', type: 'artist', name: 'Artist B', period: { start: 1960 } },
    { id: 'instrument:a', type: 'instrument', name: 'Instrument A', family: 'strings', period: { start: 1800 } },
    { id: 'instrument:b', type: 'instrument', name: 'Instrument B', family: 'winds', period: { start: 1800 } },
    { id: 'instrument:c', type: 'instrument', name: 'Instrument C', family: 'brass', period: { start: 1800 } },
  ],
  edges: [
    { id: 'e1', type: 'key_artist_of', from: 'artist:a', to: 'genre:jazz' },
    { id: 'e2', type: 'key_artist_of', from: 'artist:b', to: 'genre:jazz' },
    { id: 'e3', type: 'plays', from: 'artist:a', to: 'instrument:a' },
    { id: 'e4', type: 'plays', from: 'artist:b', to: 'instrument:b' },
  ],
}

function render(
  graph: MusicGraph,
  children: ReactNode,
  selectedId: string | null = null,
  view: ExplorerView = 'genre',
  locale: Locale = DEFAULT_LOCALE,
) {
  const index = buildIndex(graph)
  return renderWithIntl(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, 'genre'), locale, view,
      selectedId, selectNode: vi.fn(), changeView: vi.fn(),
      order: 'family', changeOrder: vi.fn(), genreDisplay: 'bars', changeGenreDisplay: vi.fn(), goHome: vi.fn(), isHome: false,
      historyFilters: { category: 'all', landmarksOnly: false }, changeHistoryFilters: vi.fn(),
      viewRange: [1900, 2000], setViewRange: vi.fn(),
    }}>
      {children}
    </ExplorerContext.Provider>,
    locale,
  )
}

describe('Explorer header statistics', () => {
  it.each([
    ['en-US', '/en'],
    ['fr', '/fr'],
  ] as const)('uses the public %s locale prefix for the home link', (locale, prefix) => {
    const markup = render(graph, <Explorer />, null, 'genre', locale)
    expect(markup).toContain(`href="${prefix}"`)
    expect(markup).not.toContain('href="/en-US')
  })

  it('explains estimated bar edges in the timeline legend', () => {
    const estimatedGraph: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => node.id === 'genre:jazz'
        ? { ...node, period: { start: 1900, estimated: true } } : node),
    }
    const markup = render(estimatedGraph, <Legend />)

    expect(markup).toContain('Soft edges indicate estimated dates')
    expect(markup).toContain('linear-gradient(to right, transparent, #94a3b8 25%, #94a3b8 75%, transparent)')
  })

  it.each([
    ['with links', graph],
    ['without links', { ...graph, edges: [] }],
  ])('shows entity counts but no link count %s', (_description, graph) => {
    const markup = render(graph, <Explorer />)
    const header = markup.match(/<header\b[\s\S]*?<\/header>/)?.[0]

    expect(header).toBeDefined()
    expect(header).toContain('aria-label="1 genres – show dataset statistics"')
    expect(header).toContain('aria-label="2 artists – show dataset statistics"')
    expect(header).toContain('aria-label="3 instruments – show dataset statistics"')
    expect(header).toContain('>1</strong> genres')
    expect(header).toContain('>2</strong> artists')
    expect(header).toContain('>3</strong> instruments')
    expect(header).not.toMatch(/\blinks\b/i)
  })

  it('places desktop options next to the page selector and the legend outside the menu', () => {
    const markup = render(graph, <Explorer />)
    const headerEnd = markup.indexOf('</header>')
    const header = markup.slice(0, headerEnd)
    const selectorStart = header.indexOf('aria-label="Timeline view"')
    const optionsStart = header.indexOf('aria-label="Timeline options"')
    const optionsButton = header.match(/<button\b[^>]*aria-label="Timeline options"[^>]*>/)?.[0]
    const legend = markup.match(/<div role="region" aria-label="Timeline legend"[^>]*>/)?.[0]

    expect(headerEnd).toBeGreaterThan(-1)
    expect(selectorStart).toBeGreaterThan(-1)
    expect(optionsStart).toBeGreaterThan(selectorStart)
    expect(optionsButton).toContain('aria-haspopup="dialog"')
    expect(optionsButton).toContain('aria-expanded="false"')
    expect(optionsButton).toContain('aria-controls=')
    expect(markup).not.toContain('aria-label="Visualization controls"')
    expect(markup).not.toContain('aria-label="Genre display"')
    expect(markup).not.toContain('Genre order')
    expect(legend).toContain('hidden')
    expect(legend).toContain('md:block')
    expect(markup.indexOf('aria-label="Timeline legend"')).toBeGreaterThan(headerEnd)
    expect(markup.indexOf('Editorial phases, not popularity scores')).toBeLessThan(markup.indexOf('<main'))
  })

  it('places the sheet close action in its top row, without a duplicate inside the panel', () => {
    const markup = render(graph, <Explorer />, 'genre:jazz')
    const sheetStart = markup.indexOf('data-mobile-detail-sheet=""')
    const sheet = markup.slice(sheetStart)
    const closeButton = sheet.match(/<button\b[^>]*aria-label="Close panel"[^>]*>/)?.[0]

    expect(sheetStart).toBeGreaterThan(-1)
    expect(markup.slice(0, sheetStart)).toContain('aria-label="Close panel"')
    expect(sheet.indexOf('aria-label="Expand details"')).toBeLessThan(sheet.indexOf('aria-label="Close panel"'))
    expect(sheet.indexOf('aria-label="Close panel"')).toBeLessThan(sheet.indexOf('<aside'))
    expect(sheet.match(/aria-label="Close panel"/g)).toHaveLength(1)
    expect(closeButton).toContain('absolute right-1 top-1')
    expect(closeButton).toContain('h-11 w-11')
  })

  it('disables hidden content scrolling in the collapsed mobile sheet without changing desktop scrolling', () => {
    const markup = render(graph, <Explorer />, 'genre:jazz')
    const sheetStart = markup.indexOf('data-mobile-detail-sheet=""')
    const sheet = markup.slice(sheetStart)
    const sheetContainer = sheet.match(/data-mobile-detail-sheet=""[^>]*>/)?.[0]
    const mobilePanel = sheet.match(/<aside\b[^>]*>/)?.[0]
    const desktopPanel = markup.slice(0, sheetStart).match(/<aside\b[^>]*>/)?.[0]

    expect(sheetContainer).toContain('touch-none')
    expect(mobilePanel).toContain('overflow-hidden')
    expect(mobilePanel).not.toContain('overflow-y-auto')
    expect(desktopPanel).toContain('overflow-y-auto')
    expect(sheet).toContain('data-detail-drag-region=""')
  })

  it('omits empty desktop history options while retaining the mobile entry point', () => {
    const markup = render(graph, <Explorer />, null, 'history')
    const header = markup.slice(0, markup.indexOf('</header>'))
    const mobileNavigation = markup.slice(markup.indexOf('</main>'))

    expect(header).not.toContain('aria-label="History options"')
    expect(header).toContain('show dataset statistics')
    expect(mobileNavigation).toContain('aria-label="History options"')
  })

  it('keeps link counts in the statistics dialog', () => {
    const markup = render(graph, <DatasetStats initialTab="links" onClose={vi.fn()} />)
    expect(markup).toContain('6 entries and 4 links')
    expect(markup).toContain('By relation type')
  })
})

describe('view toggle', () => {
  it('localizes view labels for a French route', () => {
    const markup = render(graph, <ViewToggle view="genre" changeView={vi.fn()} />, null, 'genre', 'fr')
    expect(markup).toContain('aria-label="Vue chronologique"')
    expect(markup).toContain('Artistes')
    expect(markup).toContain('Histoire')
  })

  it('lets genre display options fill equal-width segments on desktop and mobile', () => {
    const markup = render(graph, <GenreDisplaySelect />)
    const buttons = markup.match(/<button\b[^>]*>/g) ?? []

    expect(buttons).toHaveLength(2)
    for (const button of buttons) {
      expect(button).toContain('flex-1 justify-center')
      expect(button).not.toContain('md:flex-none')
    }
  })

  it('uses taller desktop spacing while retaining mobile button height', () => {
    const markup = renderWithIntl(<ViewToggle view="genre" changeView={vi.fn()} />)
    const buttons = markup.match(/<button\b[^>]*role="radio"[^>]*>/g) ?? []

    expect(buttons).toHaveLength(4)
    expect(buttons.every((button) => button.includes('min-h-9') && button.includes('md:py-1.5'))).toBe(true)
  })

  it('matches tablet view labels to Options while preserving phone and desktop sizes', () => {
    const markup = render(graph, <Explorer />)
    const buttons = markup.match(/<button\b[^>]*role="radio"[^>]*>/g) ?? []
    const viewButtons = buttons.filter((button) => button.includes('text-[11px]'))
    const desktopOptions = markup.match(/<button\b[^>]*aria-label="Timeline options"[^>]*>/)?.[0]
    const mobileOptions = markup.match(/<button\b[^>]*aria-label="Timeline options and legend"[^>]*>/)?.[0]

    expect(viewButtons).toHaveLength(8)
    expect(viewButtons.every((button) =>
      button.includes('sm:text-sm') && button.includes('md:text-xs') && button.includes('font-semibold'),
    )).toBe(true)
    expect(desktopOptions).toContain('text-xs font-semibold')
    expect(mobileOptions).toContain('text-sm font-semibold')
    expect(desktopOptions).toContain('aria-expanded="false"')
    expect(mobileOptions).toContain('aria-expanded="false"')
  })

  it('spaces mobile options from the view list and hides its label below the small breakpoint', () => {
    const markup = render(graph, <Explorer />)
    const mobileNavigation = markup.match(/<div\b[^>]*\bclass="[^"]*\bmd:hidden"[^>]*><div[^>]*role="radiogroup"[\s\S]*?aria-label="Timeline options and legend"[\s\S]*?<\/button><\/div>/)?.[0]

    expect(mobileNavigation).toBeDefined()
    expect(mobileNavigation).toMatch(/^<div\b[^>]*\bclass="[^"]*\bgap-2\b/)
    expect(mobileNavigation).toMatch(/<button[^>]*class="[^"]*\bshrink-0\b[^"]*"[^>]*aria-label="Timeline options and legend"/)
    expect(mobileNavigation).toContain('<span class="hidden sm:inline">Options</span>')
  })

  it('includes History as the selected fourth view', () => {
    const markup = renderWithIntl(<ViewToggle view="history" changeView={vi.fn()} />)
    const buttons = markup.match(/<button\b[^>]*role="radio"[^>]*>[\s\S]*?<\/button>/g) ?? []
    expect(buttons).toHaveLength(4)
    const selected = buttons.filter((button) => button.includes('aria-checked="true"'))
    expect(selected).toHaveLength(1)
    expect(selected[0]).toContain('History')
    expect(markup).toContain('Genres')
    expect(markup).toContain('Artists')
    expect(markup).toContain('Instruments')
  })
})

describe('landing view transition', () => {
  it('shares uppercase caption typography between the loader and landing vinyl', () => {
    const vinylCss = readFileSync(new URL('./vinyl.css', import.meta.url), 'utf8')
    const homeCss = readFileSync(new URL('./components/Home.css', import.meta.url), 'utf8')
    const loadingCss = readFileSync(new URL('./pageLoading.css', import.meta.url), 'utf8')

    expect(homeCss).toContain('@import "../vinyl.css";')
    expect(loadingCss).toContain('@import "./vinyl.css";')
    expect(vinylCss).toMatch(/\.discovery-kicker,\s*\.discovery-record-caption,\s*\.page-loading-wordmark\s*\{\s*font: 650 \.69rem\/1\.5 ui-monospace, monospace;\s*letter-spacing: \.17em;/)
    expect(vinylCss).toMatch(/\.discovery-record-caption,\s*\.page-loading-wordmark\s*\{\s*text-transform: uppercase;/)
  })

  it.each([
    ['en-US', '/en'],
    ['fr', '/fr'],
  ] as const)('uses the public %s locale prefix for landing links', (locale, prefix) => {
    const markup = render(graph, <Home />, null, 'genre', locale)
    for (const path of ['', '/genres', '/artists', '/instruments', '/history']) {
      expect(markup).toContain(`href="${prefix}${path}"`)
    }
    expect(markup).not.toContain('href="/en-US')
  })

  it('renders both vinyl faces without side letters or an inline flip transform', () => {
    const markup = render(graph, <Home />)
    const labels = [...markup.matchAll(/<div class="discovery-label">([\s\S]*?)<\/div>/g)]

    expect(markup).toContain('<div class="discovery-record-flip">')
    expect(labels).toHaveLength(2)
    for (const label of labels) expect(label[1]).toMatch(/^<svg\b[\s\S]*<\/svg>$/)
  })

  it('restores the selected face without animating during the opening dock', () => {
    const homeCss = readFileSync(new URL('./components/Home.css', import.meta.url), 'utf8')
    const loadingCss = readFileSync(new URL('./pageLoading.css', import.meta.url), 'utf8')

    expect(homeCss).toContain(':root[data-theme="light"] .discovery-record-flip { transform: rotateY(180deg); }')
    expect(homeCss).toContain('transition: transform .75s cubic-bezier(.22, .75, .25, 1);')
    expect(homeCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.discovery-record-flip \{ transition: none; \}/)
    expect(loadingCss).toContain('#page-loading[data-opening][data-loading="true"] ~ #root .discovery-record-flip {\n  transition: none;')
  })

  it('keeps the mobile detail sheet above the timeline content and below the navigation', () => {
    const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8')
    expect(css).toContain('.soundlines-home-transition [data-mobile-detail-sheet] { view-transition-name: soundlines-detail-sheet; }')
    expect(css).toContain('.soundlines-home-transition::view-transition-group(soundlines-detail-sheet) { z-index: 1; }')
    expect(css).toContain('.soundlines-home-transition::view-transition-group(soundlines-explorer-navigation) { z-index: 2; }')
  })
})
