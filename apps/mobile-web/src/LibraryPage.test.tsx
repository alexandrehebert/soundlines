// @vitest-environment jsdom

import graph from '@soundlines/catalogue/data/graph.json'
import type { MusicGraph } from '@soundlines/catalogue/types'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { createFeed } from './feed.ts'
import { readRoute } from './nodeUrl.ts'
import { AtlasDetail, LibraryPage } from './LibraryPage.tsx'

const { atlas } = createFeed(graph as MusicGraph)
const entries = new Map(atlas.map((entry) => [entry.node.id, entry]))

afterEach(cleanup)

it('shows catalogue types and the existing artist families as separate panels', () => {
  const props = { entries: atlas, hidden: false, headingRef: null, loadFailed: false, onNavigate: vi.fn() }
  const { rerender } = render(<LibraryPage {...props} />)
  const artists = screen.getByRole<HTMLAnchorElement>('link', { name: /^Artists/ })
  const { libraryType, libraryGroup } = readRoute(artists.search)
  expect(libraryType).toBe('artist')
  expect(screen.getByRole('link', { name: /^Instruments/ })).toBeTruthy()
  expect(screen.queryByRole('slider')).toBeNull()

  rerender(<LibraryPage {...props} selection={{ type: libraryType, group: libraryGroup }} />)
  expect(screen.getByRole('heading', { name: 'Artists' })).toBeTruthy()
  expect(screen.getByRole('link', { name: /^Classical/ })).toBeTruthy()
  expect(screen.getByRole('link', { name: /^Jazz/ })).toBeTruthy()
})

it('groups instrument artwork by period and jumps between dates without replacing the list', () => {
  render(<LibraryPage entries={atlas} hidden={false} headingRef={null} loadFailed={false} onNavigate={vi.fn()}
    selection={{ type: 'instrument', group: 'strings' }}
    renderArtwork={(node) => <img alt="" src={`/art/${node.id}.svg`} />} />)

  const first = screen.getByRole('region', { name: '1900–1999' })
  const slider = screen.getByRole<HTMLInputElement>('slider', { name: 'Jump to date' })
  expect(slider.getAttribute('aria-valuetext')).toBe('1900–1999')
  fireEvent.change(slider, { target: { value: slider.max } })
  expect(slider.getAttribute('aria-valuetext')).toBe('Before 1 CE')
  expect(first.isConnected).toBe(true)

  const guitar = within(screen.getByRole('region', { name: '1500–1599' }))
    .getByRole<HTMLAnchorElement>('link', { name: 'Guitar' })
  expect(guitar.querySelector('img')?.getAttribute('src')).toBe('/art/instrument:guitar.svg')
  expect(readRoute(guitar.search)).toMatchObject({
    page: 'library', nodeId: 'instrument:guitar', libraryType: 'instrument', libraryGroup: 'strings',
  })
})

it('uses decades for electronic instruments so the slider can reach their oldest and newest groups', () => {
  render(<LibraryPage entries={atlas} hidden={false} headingRef={null} loadFailed={false} onNavigate={vi.fn()}
    selection={{ type: 'instrument', group: 'electronic' }} />)

  const slider = screen.getByRole<HTMLInputElement>('slider', { name: 'Jump to date' })
  expect(slider.getAttribute('aria-valuetext')).toBe('1990–1999')
  expect(within(screen.getByRole('region', { name: '1980–1989' })).getByRole('link', { name: 'Roland TR-808' })).toBeTruthy()
  fireEvent.change(slider, { target: { value: slider.max } })
  expect(slider.getAttribute('aria-valuetext')).toBe('1920–1929')
  expect(within(screen.getByRole('region', { name: '1920–1929' })).getByRole('link', { name: 'Theremin' })).toBeTruthy()
})

it('labels both ends of the scale with exact years and uses round years in between', () => {
  const artists = atlas.filter(({ node }) => node.type === 'artist').slice(0, 3)
    .map((entry, index) => ({ ...entry, startYear: [1993, 1987, 1972][index] }))
  render(<LibraryPage entries={artists} hidden={false} headingRef={null} loadFailed={false} onNavigate={vi.fn()}
    selection={{ type: 'artist', group: 'all' }} />)

  const scale = screen.getByRole('navigation', { name: 'Browse by date' })
  const ticks = [...scale.querySelectorAll('.chronology-ticks span:not(.chronology-minor-tick)')].map((tick) => tick.textContent)
  expect(ticks).toEqual(['1993', '1990', '1985', '1980', '1975', '1972'])
  const minorTicks = [...scale.querySelectorAll<HTMLElement>('.chronology-minor-tick')]
  const minorYears = minorTicks.map((tick) => 1993 - Number(tick.style.getPropertyValue('--tick-position')) * 21)
  expect(minorYears).toContain(1989)
  expect(minorYears).not.toContain(1990)
  expect(minorTicks.every((tick) => tick.textContent === '')).toBe(true)
  expect(screen.getByRole('heading', { name: '1987' })).toBeTruthy()
})

it('lists places alphabetically without assigning them a date', () => {
  const places = atlas.filter(({ node }) => node.type === 'place').slice(0, 3).reverse()
  render(<LibraryPage entries={places} hidden={false} headingRef={null} loadFailed={false} onNavigate={vi.fn()}
    selection={{ type: 'place', group: 'all' }} />)

  expect(screen.queryByText('Undated')).toBeNull()
  expect(screen.queryByRole('slider')).toBeNull()
  expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(places.map(({ node }) => node.name).sort((a, b) => a.localeCompare(b)))
})

it('shows catalogue context and opens related links by node type', async () => {
  const user = userEvent.setup()
  const { nodeId } = readRoute('?view=timeline&node=genre%3Adisco')
  render(<AtlasDetail entries={entries} nodeId={nodeId!} loadFailed={false} headingRef={null} onNavigate={vi.fn()} />)

  expect(screen.getByRole('heading', { name: 'Disco' })).toBeTruthy()
  expect(screen.getByText(graph.nodes.find(({ id }) => id === nodeId)!.description!)).toBeTruthy()
  expect(screen.getByText('Disco & House')).toBeTruthy()
  expect(screen.getByText('1970s – Present')).toBeTruthy()

  const related = screen.getByRole('region', { name: 'Explore more' })
  const tracks = within(related).getByText('Tracks').closest('details')!
  const genres = within(related).getByText('Genres').closest('details')!
  expect(tracks.open).toBe(true)
  expect(genres.open).toBe(true)
  expect(within(tracks).getByRole('link', { name: /I Feel Love.*anthems/i })).toBeTruthy()
  expect(within(tracks).queryByRole('link', { name: /^Soul/ })).toBeNull()

  await user.click(within(tracks).getByText('Tracks'))
  expect(tracks.open).toBe(false)
  expect(genres.open).toBe(true)
  await user.click(within(tracks).getByText('Tracks'))
  expect(tracks.open).toBe(true)
  expect(within(genres).getByRole('link', { name: /^Soul.*influenced by/i })).toBeTruthy()
  for (const link of within(related).getAllByRole('link')) {
    const url = new URL((link as HTMLAnchorElement).href)
    expect(url.origin).toBe(window.location.origin)
    expect(entries.has(readRoute(url.search).nodeId!)).toBe(true)
  }

  const references = screen.getByLabelText('Entry references')
  const sources = within(references).getByText('Sources')
  expect(within(related).queryByText('Sources')).toBeNull()
  expect(sources.closest('details')?.open).toBe(false)
  await user.click(sources)
  expect(sources.closest('details')?.open).toBe(true)
  const source = screen.getByRole('link', { name: /pbs.org.*disco sounds seventies/i })
  expect(source.getAttribute('href')).toBe('https://www.pbs.org/wgbh/americanexperience/features/war-disco-sounds-seventies/')
})

it('replaces the loading skeleton when the entry becomes available', () => {
  const props = { nodeId: 'genre:disco', loadFailed: false, headingRef: null, onNavigate: vi.fn() }
  const { rerender } = render(<AtlasDetail {...props} />)
  expect(screen.getByRole('status', { name: 'Loading atlas entry' })).toBeTruthy()
  expect(screen.queryByRole('region', { name: 'Explore more' })).toBeNull()

  rerender(<AtlasDetail {...props} entries={entries} />)
  expect(screen.queryByRole('status', { name: 'Loading atlas entry' })).toBeNull()
  expect(screen.getByRole('heading', { name: 'Disco' })).toBeTruthy()
})

it('replaces an instrument album placeholder with its entries and keeps errors actionable', () => {
  const props = {
    hidden: false, headingRef: null, loadFailed: false, onNavigate: vi.fn(),
    selection: { type: 'instrument', group: 'strings' } as const,
  }
  const { rerender } = render(<LibraryPage {...props} />)
  expect(screen.getByRole('status', { name: 'Loading the catalogue' })).toBeTruthy()
  expect(screen.queryByRole('link')).toBeNull()
  expect(screen.queryByRole('slider')).toBeNull()

  rerender(<LibraryPage {...props} entries={atlas} />)
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.getByRole('link', { name: 'Guitar' })).toBeTruthy()

  rerender(<LibraryPage {...props} loadFailed />)
  expect(screen.queryByRole('status', { name: 'Loading the catalogue' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Reload catalogue' })).toBeTruthy()
})
