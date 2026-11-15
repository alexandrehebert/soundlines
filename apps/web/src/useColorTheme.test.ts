import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColorTheme } from './useColorTheme.ts'
import { initializeColorTheme, useColorTheme } from './useColorTheme.ts'

const store = vi.hoisted(() => ({
  subscribe: undefined as undefined | ((notify: () => void) => () => void),
  serverSnapshot: undefined as undefined | (() => ColorTheme),
}))

vi.mock('react', () => ({
  useSyncExternalStore: (
    subscribe: (notify: () => void) => () => void,
    snapshot: () => ColorTheme,
    serverSnapshot: () => ColorTheme,
  ) => {
    store.subscribe = subscribe
    store.serverSnapshot = serverSnapshot
    return snapshot()
  },
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function setup(theme = 'dark') {
  const dataset = { theme }
  const events = new EventTarget()
  const storage = { getItem: vi.fn(), setItem: vi.fn() }
  const favicons = { dark: { setAttribute: vi.fn() }, light: { setAttribute: vi.fn() } }
  vi.stubGlobal('document', {
    documentElement: { dataset },
    querySelector: (selector: string) => selector === 'link[data-soundlines-favicon="dark"]'
      ? favicons.dark
      : selector === 'link[data-soundlines-favicon="light"]' ? favicons.light : null,
  })
  vi.stubGlobal('window', events)
  vi.stubGlobal('localStorage', storage)
  return { dataset, events, favicons, storage }
}

describe('color theme preference', () => {
  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    [null, 'dark'],
  ])('restores saved theme %s and selects its favicon', (saved, expected) => {
    const { dataset, storage, favicons } = setup()
    storage.getItem.mockReturnValue(saved)

    initializeColorTheme()

    expect(storage.getItem).toHaveBeenCalledWith('soundlines-theme')
    expect(dataset.theme).toBe(expected)
    expect(favicons.dark.setAttribute).toHaveBeenCalledWith('media', expected === 'dark' ? 'all' : 'not all')
    expect(favicons.light.setAttribute).toHaveBeenCalledWith('media', expected === 'light' ? 'all' : 'not all')
  })

  it('uses the default theme when saved preferences are unavailable', () => {
    const { dataset, storage } = setup('light')
    const error = new Error('Storage unavailable')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    storage.getItem.mockImplementation(() => { throw error })

    initializeColorTheme()

    expect(dataset.theme).toBe('dark')
    expect(warn).toHaveBeenCalledWith('Unable to initialize the Soundlines theme preference.', error)
  })

  it('flips both ways and saves the app-wide preference', () => {
    const { dataset, favicons, storage } = setup()
    const { theme, toggleTheme } = useColorTheme()
    expect(theme).toBe('dark')
    toggleTheme()
    expect(dataset.theme).toBe('light')
    expect(favicons.dark.setAttribute).toHaveBeenLastCalledWith('media', 'not all')
    expect(favicons.light.setAttribute).toHaveBeenLastCalledWith('media', 'all')
    expect(storage.setItem).toHaveBeenLastCalledWith('soundlines-theme', 'light')
    expect(useColorTheme().theme).toBe('light')
    toggleTheme()
    expect(dataset.theme).toBe('dark')
    expect(favicons.dark.setAttribute).toHaveBeenLastCalledWith('media', 'all')
    expect(favicons.light.setAttribute).toHaveBeenLastCalledWith('media', 'not all')
    expect(storage.setItem).toHaveBeenLastCalledWith('soundlines-theme', 'dark')
  })

  it('uses a stable dark server snapshot and reads the initialized client theme', () => {
    setup('light')
    expect(useColorTheme().theme).toBe('light')
    expect(store.serverSnapshot?.()).toBe('dark')
  })

  it('notifies subscribers, synchronizes other tabs, and cleans up listeners', () => {
    const { dataset, events, favicons } = setup()
    const { toggleTheme } = useColorTheme()
    const notify = vi.fn()
    const unsubscribe = store.subscribe!(notify)
    toggleTheme()
    expect(notify).toHaveBeenCalledTimes(1)
    const change = new Event('storage')
    Object.assign(change, { key: 'soundlines-theme', newValue: 'dark' })
    events.dispatchEvent(change)
    expect(dataset.theme).toBe('dark')
    expect(favicons.dark.setAttribute).toHaveBeenLastCalledWith('media', 'all')
    expect(favicons.light.setAttribute).toHaveBeenLastCalledWith('media', 'not all')
    expect(notify).toHaveBeenCalledTimes(2)
    unsubscribe()
    toggleTheme()
    expect(notify).toHaveBeenCalledTimes(2)
  })

  it('suppresses CSS transitions until the new theme has painted', () => {
    const { dataset, events } = setup()
    const frames: FrameRequestCallback[] = []
    Object.assign(events, {
      requestAnimationFrame: (callback: FrameRequestCallback) => frames.push(callback),
      cancelAnimationFrame: vi.fn(),
    })
    useColorTheme().toggleTheme()
    expect(dataset).toMatchObject({ theme: 'light', themeSwitching: '' })
    frames.shift()!(0)
    expect(dataset).toHaveProperty('themeSwitching')
    frames.shift()!(0)
    expect(dataset).not.toHaveProperty('themeSwitching')
  })

  it('crossfades the page through a view transition unless motion is reduced', async () => {
    const { dataset, events } = setup()
    const classes = new Set<string>()
    let finish!: () => void
    const startViewTransition = vi.fn((update: () => void) => {
      update()
      return { ready: Promise.resolve(), finished: new Promise<void>((resolve) => { finish = resolve }) }
    })
    Object.assign(document, { startViewTransition })
    Object.assign(document.documentElement, { classList: { add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name) } })
    let reduced = false
    Object.assign(events, { matchMedia: () => ({ matches: reduced }) })
    const notify = vi.fn()
    store.subscribe?.(notify)
    useColorTheme().toggleTheme()
    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(dataset.theme).toBe('light')
    expect(notify).toHaveBeenCalled()
    expect(classes.has('soundlines-theme-transition')).toBe(true)
    finish()
    await Promise.resolve()
    expect(classes.size).toBe(0)
    reduced = true
    useColorTheme().toggleTheme()
    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(dataset.theme).toBe('dark')
  })

  it('keeps the toggle working and warns when persistence is blocked', () => {
    const { dataset, storage } = setup()
    const error = new Error('Storage unavailable')
    storage.setItem.mockImplementation(() => { throw error })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    useColorTheme().toggleTheme()
    expect(dataset.theme).toBe('light')
    expect(warn).toHaveBeenCalledWith('Unable to save the Soundlines theme preference.', error)
  })
})
