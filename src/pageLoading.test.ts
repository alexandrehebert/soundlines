import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('page loading lifecycle', () => {
  let overlay: { dataset: { loading: string }; setAttribute: ReturnType<typeof vi.fn> }
  let root: { setAttribute: ReturnType<typeof vi.fn> }
  let documentState: { readyState: string; getElementById: (id: string) => unknown }
  let events: EventTarget
  let loading: typeof import('./pageLoading.ts')

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    overlay = { dataset: { loading: 'true' }, setAttribute: vi.fn() }
    root = { setAttribute: vi.fn() }
    events = new EventTarget()
    documentState = {
      readyState: 'complete',
      getElementById: (id) => id === 'page-loading' ? overlay : root,
    }
    vi.stubGlobal('document', documentState)
    vi.stubGlobal('window', Object.assign(events, { matchMedia: () => ({ matches: false }) }))
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(performance.now()), 16))
    vi.stubGlobal('cancelAnimationFrame', clearTimeout)
    loading = await import('./pageLoading.ts')
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('keeps the initial overlay visible for 550ms, then clears its accessible loading state', () => {
    loading.finishPageLoading()
    vi.advanceTimersByTime(549)
    expect(overlay.dataset.loading).toBe('true')
    vi.advanceTimersByTime(1)
    expect(overlay.dataset.loading).toBe('false')
    expect(overlay.setAttribute).toHaveBeenLastCalledWith('aria-hidden', 'true')
    expect(root.setAttribute).toHaveBeenLastCalledWith('aria-busy', 'false')
  })

  it('waits for the document to load even after the minimum duration', () => {
    documentState.readyState = 'loading'
    loading.finishPageLoading()
    vi.advanceTimersByTime(1000)
    expect(overlay.dataset.loading).toBe('true')
    events.dispatchEvent(new Event('load'))
    vi.advanceTimersByTime(33)
    expect(overlay.dataset.loading).toBe('false')
  })

  it('paints the overlay before navigation and waits for the committed view to finish', () => {
    overlay.dataset.loading = 'false'
    const update = vi.fn()
    loading.transitionPage(update)
    expect(overlay.dataset.loading).toBe('true')
    expect(root.setAttribute).toHaveBeenLastCalledWith('aria-busy', 'true')
    vi.advanceTimersByTime(191)
    expect(update).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(update).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1000)
    expect(overlay.dataset.loading).toBe('true')
    loading.finishPageLoading()
    vi.advanceTimersByTime(33)
    expect(overlay.dataset.loading).toBe('false')
  })

  it('cancels a previous dismissal when another transition starts', () => {
    loading.finishPageLoading()
    vi.advanceTimersByTime(300)
    loading.transitionPage(() => loading.finishPageLoading())
    vi.advanceTimersByTime(549)
    expect(overlay.dataset.loading).toBe('true')
    vi.advanceTimersByTime(1)
    expect(overlay.dataset.loading).toBe('false')
  })

  it('only performs the latest navigation if another starts during the fade-in', () => {
    const obsolete = vi.fn()
    const latest = vi.fn()
    loading.transitionPage(obsolete)
    vi.advanceTimersByTime(80)
    loading.transitionPage(latest)
    vi.advanceTimersByTime(192)
    expect(obsolete).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledOnce()
  })

  it('cleans up pending work and supports StrictMode effect setup replay', () => {
    const cancel = loading.finishPageLoading()
    cancel()
    vi.advanceTimersByTime(1000)
    expect(overlay.dataset.loading).toBe('true')
    loading.finishPageLoading()
    vi.advanceTimersByTime(33)
    expect(overlay.dataset.loading).toBe('false')
  })
})
