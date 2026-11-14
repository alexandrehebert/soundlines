import { afterEach, describe, expect, it, vi } from 'vitest'
import { afterSvgLayout } from './svgLayout.ts'

describe('SVG layout measurement', () => {
  afterEach(() => vi.unstubAllGlobals())

  function setup(rendered: boolean) {
    const rects = Object.assign(new Array<DOMRect>(), { item: () => null })
    rects.length = rendered ? 1 : 0
    const element = { getClientRects: (): DOMRectList => rects } as SVGGraphicsElement
    let resize: (() => void) | undefined
    const observe = vi.fn()
    const disconnect = vi.fn()
    const createObserver = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) {
        createObserver()
        resize = callback
      }
      observe = observe
      disconnect = disconnect
    })
    const measure = vi.fn()
    const cleanup = afterSvgLayout(element, measure)
    return { element, rects, resize: () => resize?.(), observe, disconnect, createObserver, measure, cleanup }
  }

  it('measures laid-out SVGs synchronously without creating an observer', () => {
    const { measure, createObserver, cleanup } = setup(true)
    expect(measure).toHaveBeenCalledOnce()
    expect(createObserver).not.toHaveBeenCalled()
    expect(cleanup).toBeUndefined()
  })

  it('waits for layout when mounted inside a display:none preview', () => {
    const { element, rects, resize, observe, disconnect, measure, cleanup } = setup(false)
    expect(measure).not.toHaveBeenCalled()
    expect(observe).toHaveBeenCalledWith(element)
    resize()
    expect(measure).not.toHaveBeenCalled()
    expect(disconnect).not.toHaveBeenCalled()

    rects.length = 1
    resize()
    expect(measure).toHaveBeenCalledOnce()
    expect(disconnect).toHaveBeenCalledOnce()
    cleanup?.()
  })

  it('disconnects the pending observer when the component unmounts', () => {
    const { cleanup, disconnect, measure } = setup(false)
    cleanup?.()
    expect(disconnect).toHaveBeenCalledOnce()
    expect(measure).not.toHaveBeenCalled()
  })
})
