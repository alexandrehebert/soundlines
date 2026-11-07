import { afterEach, describe, expect, it, vi } from 'vitest'
import { observeViewTransition } from './viewTransition.ts'

afterEach(() => vi.restoreAllMocks())

describe('view transition lifecycle', () => {
  it('accepts a skipped transition and still runs cleanup', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cleanup = vi.fn()
    observeViewTransition({
      ready: Promise.reject(new DOMException('Transition was skipped', 'AbortError')),
      finished: Promise.resolve(),
    }, cleanup)

    await Promise.resolve()
    expect(cleanup).toHaveBeenCalledOnce()
    expect(warn).not.toHaveBeenCalled()
  })

  it('reports unexpected failures and cleans up a failed transition', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cleanup = vi.fn()
    const error = new Error('Transition failed')
    observeViewTransition({
      ready: Promise.reject(error),
      finished: Promise.reject(error),
    }, cleanup)

    await Promise.resolve()
    expect(cleanup).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith('Unable to start the view transition.', error)
  })
})
