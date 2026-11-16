// @vitest-environment jsdom

import graph from '@soundlines/catalogue/data/graph.json'
import type { MusicGraph } from '@soundlines/catalogue/types'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createFeed } from './feed.ts'

vi.mock('virtual:mobile-catalogue', () => ({ default: createFeed(graph as MusicGraph) }))
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
})

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it.each([false, true])('only offers playback after the manifest confirms a preview (available: %s)', async (available) => {
  vi.stubGlobal('__SOUNDLINES_INITIAL_FEED__', [])
  let completeManifest!: (response: Response) => void
  vi.mocked(fetch).mockReturnValue(new Promise((resolve) => { completeManifest = resolve }))
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  const { App } = await import('./App.tsx')
  const { container } = render(<App />)
  const feed = screen.getByRole('region', { name: 'Discover feed' })
  const [firstCard] = await within(feed).findAllByRole('article')
  const card = within(firstCard)
  const genre = card.getByRole('heading', { level: 1 }).textContent!.trim()
  const node = (graph as MusicGraph).nodes.find(({ name, type }) => type === 'genre' && name === genre)!

  expect(card.getByText('Checking for a preview…')).toBeTruthy()
  expect(card.queryByRole('button')).toBeNull()

  completeManifest(Response.json({
    version: 1,
    instrumentArtwork: {},
    genrePreviews: available ? { [node.id]: { path: 'previews/first.mp3' } } : {},
  }))

  if (available) await card.findByRole('button', { name: `Play preview for ${genre}` })
  else {
    await card.findByText('No preview available')
    expect(card.queryByRole('button')).toBeNull()
  }
  expect(card.queryByText('Checking for a preview…')).toBeNull()
  expect(container.querySelector('audio')?.hasAttribute('src')).toBe(false)
  expect(play).not.toHaveBeenCalled()
})

it('clears the current search when Search is selected again', async () => {
  vi.stubGlobal('__SOUNDLINES_INITIAL_FEED__', [])
  const { App } = await import('./App.tsx')
  const user = userEvent.setup()
  render(<App />)
  const search = within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Search' })

  await user.click(search)
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Search' }))
  await screen.findByRole('heading', { name: 'Try a search' })
  await user.type(screen.getByRole('searchbox'), 'rai')
  expect(screen.getByRole('link', { name: 'Raï genre' })).toBeTruthy()

  const historyLength = window.history.length
  await user.click(search)

  expect(search.getAttribute('aria-current')).toBe('page')
  expect(window.history.length).toBe(historyLength)
  expect(screen.getByRole<HTMLInputElement>('searchbox').value).toBe('')
  expect(screen.queryByRole('list', { name: 'Search results' })).toBeNull()
  expect(screen.getByRole('heading', { name: 'Try a search' })).toBeTruthy()
})

it('moves focus to the Library heading when the Library tab is selected', async () => {
  vi.stubGlobal('__SOUNDLINES_INITIAL_FEED__', [])
  const { App } = await import('./App.tsx')
  const user = userEvent.setup()
  render(<App />)
  const library = within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Library' })

  await user.click(library)

  expect(library.getAttribute('aria-current')).toBe('page')
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Library' }))
})

it.each(['Soundlines home', 'Home'].flatMap((link) => [
  { link, position: 1, reducedMotion: false, animatedCards: 1 },
  { link, position: 12, reducedMotion: false, animatedCards: 3 },
  { link, position: 12, reducedMotion: true, animatedCards: 0 },
]))('returns to the top via $link from card $position with reducedMotion=$reducedMotion', async ({ link, position, reducedMotion, animatedCards }) => {
  vi.stubGlobal('__SOUNDLINES_INITIAL_FEED__', [])
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reducedMotion, addEventListener: vi.fn(), addListener: vi.fn() })))
  let nextFrame: FrameRequestCallback
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { nextFrame = callback; return 1 })
  window.history.replaceState(null, '', '/mobile/?')
  const { App } = await import('./App.tsx')
  const user = userEvent.setup()
  render(<App />)
  const feed = screen.getByRole('region', { name: 'Discover feed' })
  const [firstCard] = await within(feed).findAllByRole('article')
  Object.defineProperty(feed, 'clientHeight', { value: 600 })
  for (let card = 1; card <= position; card++) {
    feed.scrollTop = card * feed.clientHeight
    fireEvent.scroll(feed)
  }
  expect(firstCard.hasAttribute('inert')).toBe(true)
  feed.scrollTo = (options?: ScrollToOptions | number) => {
    if (typeof options !== 'object') return
    feed.scrollTop = options.top ?? 0
    fireEvent.scroll(feed)
  }
  const historyLength = window.history.length

  await user.click(screen.getByRole('link', { name: link }))

  expect(feed.scrollTop).toBe(animatedCards * feed.clientHeight)
  if (!reducedMotion) {
    act(() => nextFrame(100))
    act(() => nextFrame(240))
    expect(feed.scrollTop).toBeGreaterThan(0)
    expect(feed.scrollTop).toBeLessThan(feed.clientHeight)
    act(() => nextFrame(380))
    expect(feed.style.scrollSnapType).toBe('')
  }
  expect(feed.scrollTop).toBe(0)
  expect(firstCard.hasAttribute('inert')).toBe(false)
  expect(window.location.href).toBe(`${window.location.origin}/mobile/`)
  expect(window.history.length).toBe(historyLength)
})

it('returns from a feed entry to the same card on Home', async () => {
  vi.stubGlobal('__SOUNDLINES_INITIAL_FEED__', [])
  const { App } = await import('./App.tsx')
  const user = userEvent.setup()
  render(<App />)
  const feed = screen.getByRole('region', { name: 'Discover feed' })
  await within(feed).findAllByRole('article')
  Object.defineProperty(feed, 'clientHeight', { value: 600 })
  feed.scrollTop = feed.clientHeight
  fireEvent.scroll(feed)
  const card = feed.querySelector<HTMLElement>('article:not([inert])')!
  const masthead = within(screen.getByRole('banner'))

  await user.click(within(card).getByRole('link'))
  await user.click(masthead.getByRole('link', { name: 'Home' }))

  expect(document.activeElement).toBe(feed)
  expect(feed.scrollTop).toBe(feed.clientHeight)
  expect(card.hasAttribute('inert')).toBe(false)
})

it('resumes the current card when switching from Search to Home', async () => {
  const { App } = await import('./App.tsx')
  const user = userEvent.setup()
  render(<App />)
  const feed = screen.getByRole('region', { name: 'Discover feed' })
  await within(feed).findAllByRole('article')
  Object.defineProperty(feed, 'clientHeight', { value: 600 })
  feed.scrollTop = feed.clientHeight
  fireEvent.scroll(feed)
  const card = feed.querySelector<HTMLElement>('article:not([inert])')!
  const navigation = within(screen.getByRole('navigation', { name: 'Main navigation' }))

  await user.click(navigation.getByRole('link', { name: 'Search' }))
  await user.click(navigation.getByRole('link', { name: 'Home' }))

  expect(feed.scrollTop).toBe(feed.clientHeight)
  expect(card.hasAttribute('inert')).toBe(false)
})

it('opens the clean Home URL when the logo is tapped from Search', async () => {
  vi.stubGlobal('__SOUNDLINES_INITIAL_FEED__', [])
  window.history.replaceState(null, '', '/mobile/?view=search')
  const { App } = await import('./App.tsx')
  const user = userEvent.setup()
  const { container } = render(<App />)
  container.querySelector<HTMLElement>('.feed')!.scrollTo = vi.fn()

  await user.click(screen.getByRole('link', { name: 'Soundlines home' }))

  expect(window.location.href).toBe(`${window.location.origin}/mobile/`)
  expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Discover feed' }))
})

it('returns from an artist entry to the selected timeline group', async () => {
  vi.stubGlobal('__SOUNDLINES_INITIAL_FEED__', [])
  window.history.replaceState(null, '', '/mobile/?view=library')
  const { App } = await import('./App.tsx')
  const user = userEvent.setup()
  render(<App />)

  await user.click(await screen.findByRole('link', { name: /^Artists/ }))
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Artists' }))
  const header = within(screen.getByRole('banner'))
  expect(header.getByRole('link', { name: 'Library' }).getAttribute('href')).toBe('?view=library')

  await user.click(screen.getByRole('link', { name: /^Jazz/ }))
  expect(header.getByRole('link', { name: 'Artists' }).getAttribute('href')).toBe('?view=library&type=artist')
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Jazz' }))

  await user.click(screen.getByRole('link', { name: /^Miles Davis/ }))
  expect(screen.getByRole('heading', { level: 1, name: 'Miles Davis' })).toBeTruthy()
  const back = screen.getAllByRole('banner')
    .map((banner) => within(banner).queryByRole('link', { name: 'Jazz' }))
    .find((link) => link !== null)!
  expect(back.getAttribute('href')).toBe('?view=library&type=artist&group=jazz')
  await user.click(back)
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Jazz' }))
})

it('returns from a search result to the existing query', async () => {
  vi.stubGlobal('__SOUNDLINES_INITIAL_FEED__', [])
  window.history.replaceState(null, '', '/mobile/?view=search')
  const { App } = await import('./App.tsx')
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('heading', { name: 'Try a search' })
  await user.type(screen.getByRole('searchbox'), 'rai')
  await user.click(screen.getByRole('link', { name: 'Raï genre' }))
  const back = screen.getAllByRole('banner')
    .map((banner) => within(banner).queryByRole('link', { name: 'Search' }))
    .find((link) => link !== null)!
  await user.click(back)
  expect(screen.getByRole<HTMLInputElement>('searchbox').value).toBe('rai')
})

it.each(['browser', 'masthead'])('restores an entry after following a related link and going back via %s', async (backControl) => {
  vi.stubGlobal('__SOUNDLINES_INITIAL_FEED__', [])
  window.history.replaceState(null, '', '/mobile/?view=library&node=genre%3Adisco')
  const { App } = await import('./App.tsx')
  const user = userEvent.setup()
  const { unmount } = render(<App />)

  const disco = await screen.findByRole('region', { name: 'Disco' })
  const explore = within(screen.getByRole('region', { name: 'Explore more' }))
  const track = explore.getByRole('link', { name: /I Feel Love/ })
  const tracks = track.closest('details')!
  const collapsedGroup = Array.from(disco.querySelectorAll('details[open]')).find((group) => group !== tracks)!
  await user.click(collapsedGroup.querySelector('summary')!)
  disco.scrollTop = 240
  await user.click(track)
  expect(screen.getByRole('region', { name: 'I Feel Love' }).scrollTop).toBe(0)

  if (backControl === 'browser') window.history.back()
  else await user.click(within(screen.getAllByRole('banner')[0]).getByRole('link', { name: 'Disco' }))

  const restored = await screen.findByRole('region', { name: 'Disco' })
  expect(restored.scrollTop).toBe(240)
  expect(restored.querySelectorAll('details[open]')).toHaveLength(disco.querySelectorAll('details[open]').length)
  expect(document.activeElement).toBe(within(restored).getByRole('heading', { level: 1 }))

  // A reload starts a fresh app with the same URL and browser history entry.
  unmount()
  render(<App />)
  const reloaded = await screen.findByRole('region', { name: 'Disco' })
  expect(reloaded.scrollTop).toBe(0)
  expect(reloaded.querySelectorAll('details[open]')).toHaveLength(disco.querySelectorAll('details[open]').length + 1)
})
