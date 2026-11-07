import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColorTheme } from './useColorTheme.ts'
import { useColorTheme } from './useColorTheme.ts'

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
  const storage = { setItem: vi.fn() }
  vi.stubGlobal('document', { documentElement: { dataset } })
  vi.stubGlobal('window', events)
  vi.stubGlobal('localStorage', storage)
  return { dataset, events, storage }
}

describe('color theme preference', () => {
  it('flips both ways and saves the app-wide preference', () => {
    const { dataset, storage } = setup()
    const { theme, toggleTheme } = useColorTheme()
    expect(theme).toBe('dark')
    toggleTheme()
    expect(dataset.theme).toBe('light')
    expect(storage.setItem).toHaveBeenLastCalledWith('soundlines-theme', 'light')
    expect(useColorTheme().theme).toBe('light')
    toggleTheme()
    expect(dataset.theme).toBe('dark')
    expect(storage.setItem).toHaveBeenLastCalledWith('soundlines-theme', 'dark')
  })

  it('uses a stable dark server snapshot and reads the initialized client theme', () => {
    setup('light')
    expect(useColorTheme().theme).toBe('light')
    expect(store.serverSnapshot?.()).toBe('dark')
  })

  it('notifies subscribers, synchronizes other tabs, and cleans up listeners', () => {
    const { dataset, events } = setup()
    const { toggleTheme } = useColorTheme()
    const notify = vi.fn()
    const unsubscribe = store.subscribe!(notify)
    toggleTheme()
    expect(notify).toHaveBeenCalledTimes(1)
    const change = new Event('storage')
    Object.assign(change, { key: 'soundlines-theme', newValue: 'dark' })
    events.dispatchEvent(change)
    expect(dataset.theme).toBe('dark')
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
