import { describe, expect, it, vi } from 'vitest'
import { claimPlayback, releasePlayback } from './exclusivePlayback.ts'

describe('exclusive playback', () => {
  it('stops the previous player when another one starts', () => {
    const first = vi.fn()
    const second = vi.fn()
    claimPlayback(first)
    claimPlayback(second)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
    releasePlayback(second)
  })

  it('does not stop a player that claims again or was released', () => {
    const first = vi.fn()
    const second = vi.fn()
    claimPlayback(first)
    claimPlayback(first)
    releasePlayback(first)
    claimPlayback(second)
    expect(first).not.toHaveBeenCalled()
    releasePlayback(second)
  })
})
