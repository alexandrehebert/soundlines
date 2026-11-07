import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('page loading lifecycle', () => {
  let overlay: {
    dataset: { loading: string; opening?: string; docking?: string }
    setAttribute: ReturnType<typeof vi.fn>
    hasAttribute: ReturnType<typeof vi.fn>
    querySelector: ReturnType<typeof vi.fn>
    animate: ReturnType<typeof vi.fn>
  }
  let root: { setAttribute: ReturnType<typeof vi.fn> }
  let documentState: {
    readyState: string
    documentElement: { dataset: { theme: string } }
    getElementById: (id: string) => unknown
    querySelector: ReturnType<typeof vi.fn>
  }
  let events: EventTarget
  let loading: typeof import('./pageLoading.ts')

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    overlay = {
      dataset: { loading: 'true', opening: '' },
      setAttribute: vi.fn(),
      hasAttribute: vi.fn((name) => name === 'data-opening' && overlay.dataset.opening !== undefined),
      querySelector: vi.fn(),
      animate: vi.fn(),
    }
    root = { setAttribute: vi.fn() }
    events = new EventTarget()
    documentState = {
      readyState: 'complete',
      documentElement: { dataset: { theme: 'dark' } },
      getElementById: (id) => id === 'page-loading' ? overlay : root,
      querySelector: vi.fn(),
    }
    vi.stubGlobal('document', documentState)
    vi.stubGlobal('window', Object.assign(events, { matchMedia: () => ({ matches: false }), innerWidth: 1200, innerHeight: 800 }))
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

  it('cancels a pending navigation and releases the loading overlay', () => {
    const obsolete = vi.fn()
    loading.transitionPage(obsolete)
    vi.advanceTimersByTime(80)
    loading.cancelPageTransition()
    loading.finishPageLoading()
    vi.advanceTimersByTime(1000)

    expect(obsolete).not.toHaveBeenCalled()
    expect(overlay.dataset.loading).toBe('false')
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

  function mockLandingVinyl(recordOpacity = '1') {
    const cancel = vi.fn()
    class MockKeyframeEffect {
      setKeyframes = vi.fn()
    }
    vi.stubGlobal('KeyframeEffect', MockKeyframeEffect)
    const animate = vi.fn(() => ({ cancel, effect: new MockKeyframeEffect() }))
    overlay.animate = animate
    const record = { animate }
    const style = {
      width: '',
      removeProperty: vi.fn(() => { style.width = '' }),
    }
    const vinyl = {
      style,
      querySelector: vi.fn(() => record),
      getBoundingClientRect: () => style.width === '300px'
        ? { left: 350, top: 260, width: 300, height: 300 }
        : { left: 400, top: 300, width: 200, height: 200 },
      animate,
    }
    const destination = {
      getBoundingClientRect: vi.fn(() => ({ left: 830, top: 130, width: 300, height: 300 })),
    }
    const hero = {
      getBoundingClientRect: vi.fn(() => ({ left: 20, top: 80, right: 1180, bottom: 600 })),
    }
    const recordContainer = {}
    const target = {
      transform: 'rotate(-16deg)',
      offsetWidth: 300,
      getBoundingClientRect: vi.fn(() => ({ left: 900, top: 100, width: 20, height: 360 })),
      closest: vi.fn((selector: string) => {
        if (selector === '.discovery-record-perspective') return destination
        if (selector === '.discovery-hero') return hero
        if (selector === '.discovery-record') return recordContainer
        return null
      }),
    }
    documentState.querySelector.mockReturnValue(target)
    overlay.querySelector.mockReturnValue(vinyl)
    vi.stubGlobal('getComputedStyle', (element: unknown) => ({
      transform: element === target ? target.transform : 'rotate(-16deg)',
      opacity: element === recordContainer ? recordOpacity : '1',
      borderRadius: '24px',
      borderTopWidth: '1px',
      borderRightWidth: '1px',
      borderBottomWidth: '1px',
      borderLeftWidth: '1px',
    }))
    return { animate, cancel, style, target, destination, hero }
  }

  it.each([
    ['dark', 'a'],
    ['light', 'b'],
  ])('moves the opening vinyl to the stable landing center for the %s theme', (theme, side) => {
    documentState.documentElement.dataset.theme = theme
    const { animate, cancel, style, target } = mockLandingVinyl()
    loading.finishPageLoading()
    vi.advanceTimersByTime(550)
    expect(documentState.querySelector).toHaveBeenCalledWith(`#root .discovery-record-face-${side} .discovery-vinyl`)
    expect(target.getBoundingClientRect).not.toHaveBeenCalled()
    expect(overlay.dataset.docking).toBe('')
    expect(overlay.dataset.loading).toBe('true')
    expect(style.width).toBe('300px')
    expect(animate).toHaveBeenCalledWith([
      { transform: `translate(0px, -10px) scale(${200 / 300})`, opacity: 1 },
      { transform: 'translate(480px, -130px) scale(1)', opacity: '1' },
    ], expect.objectContaining({ duration: 700, fill: 'forwards' }))
    expect(animate).toHaveBeenCalledWith([
      { clipPath: 'inset(0px round 0px)', offset: 0 },
      { clipPath: 'inset(0px round 0px)', offset: 0.5 },
      { clipPath: 'inset(81px 21px 201px 21px round 23px)' },
    ], expect.objectContaining({ duration: 700 }))
    vi.advanceTimersByTime(699)
    expect(overlay.dataset.loading).toBe('true')
    vi.advanceTimersByTime(1)
    expect(overlay.dataset.loading).toBe('false')
    expect(cancel).toHaveBeenCalledTimes(3)
    expect(style.width).toBe('')
  })

  it('matches the landing record opacity when docking on mobile', () => {
    documentState.documentElement.dataset.theme = 'light'
    const { animate } = mockLandingVinyl('0.35')
    loading.finishPageLoading()
    vi.advanceTimersByTime(550)
    expect(animate).toHaveBeenCalledWith([
      { transform: `translate(0px, -10px) scale(${200 / 300})`, opacity: 1 },
      { transform: 'translate(480px, -130px) scale(1)', opacity: '0.35' },
    ], expect.objectContaining({ duration: 700 }))
  })

  it.each(['dark', 'light'])('tracks scrolling and rotation throughout docking in the %s theme', (theme) => {
    documentState.documentElement.dataset.theme = theme
    const { animate, target, destination, hero } = mockLandingVinyl()
    loading.finishPageLoading()
    vi.advanceTimersByTime(550)
    const effects = animate.mock.results.map((result) => result.value.effect)
    destination.getBoundingClientRect.mockReturnValue({ left: 830, top: -70, width: 300, height: 300 })
    hero.getBoundingClientRect.mockReturnValue({ left: 20, top: -120, right: 1180, bottom: 400 })
    target.transform = 'rotate(134deg)'
    vi.advanceTimersByTime(16)
    expect(effects[0].setKeyframes).toHaveBeenLastCalledWith([
      { clipPath: 'inset(0px round 0px)', offset: 0 },
      { clipPath: 'inset(0px round 0px)', offset: 0.5 },
      { clipPath: 'inset(0px 21px 401px 21px round 23px)' },
    ])
    expect(effects[1].setKeyframes).toHaveBeenLastCalledWith([
      { transform: `translate(0px, -10px) scale(${200 / 300})`, opacity: 1 },
      { transform: 'translate(480px, -330px) scale(1)', opacity: '1' },
    ])
    expect(effects[2].setKeyframes).toHaveBeenLastCalledWith([
      { transform: 'rotate(-16deg)' },
      { transform: 'rotate(134deg)' },
    ])
    target.transform = 'rotate(180deg)'
    vi.advanceTimersByTime(16)
    expect(effects[2].setKeyframes).toHaveBeenLastCalledWith([
      { transform: 'rotate(-16deg)' },
      { transform: 'rotate(180deg)' },
    ])
    vi.advanceTimersByTime(668)
    expect(overlay.dataset.loading).toBe('false')
    effects.forEach((effect) => effect.setKeyframes.mockClear())
    vi.advanceTimersByTime(100)
    effects.forEach((effect) => expect(effect.setKeyframes).not.toHaveBeenCalled())
  })

  it('cancels docking animations and dismissal on navigation', () => {
    const { animate, cancel, style } = mockLandingVinyl()
    loading.finishPageLoading()
    vi.advanceTimersByTime(550)
    loading.transitionPage(vi.fn())
    expect(cancel).toHaveBeenCalledTimes(3)
    expect(style.width).toBe('')
    expect(overlay.dataset.docking).toBeUndefined()
    expect(overlay.dataset.opening).toBeUndefined()
    vi.advanceTimersByTime(700)
    animate.mock.results.forEach((result) => expect(result.value.effect.setKeyframes).not.toHaveBeenCalled())
    expect(overlay.dataset.loading).toBe('true')
  })

  it('does not dock on subsequent navigation to the landing page', () => {
    const { animate } = mockLandingVinyl()
    delete overlay.dataset.opening
    loading.finishPageLoading()
    vi.advanceTimersByTime(550)
    expect(animate).not.toHaveBeenCalled()
    expect(overlay.dataset.loading).toBe('false')
  })

  it('reveals the landing vinyl without movement for reduced motion', () => {
    const { animate } = mockLandingVinyl()
    vi.stubGlobal('window', Object.assign(events, { matchMedia: () => ({ matches: true }) }))
    loading.finishPageLoading()
    vi.advanceTimersByTime(550)
    expect(animate).not.toHaveBeenCalled()
    expect(overlay.dataset.loading).toBe('false')
  })
})
