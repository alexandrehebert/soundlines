export const feedReturnCards = 3
const duration = 280

export function scrollToFeedStart(feed: HTMLElement, animate: boolean): (() => void) | undefined {
  if (!animate || feed.clientHeight === 0) {
    feed.scrollTo({ top: 0, behavior: 'instant' })
    return
  }
  const start = Math.min(feed.scrollTop, feedReturnCards * feed.clientHeight)
  if (start <= 0) return

  // Snap to cards again once the animation reaches the top or the user takes over.
  const previousSnap = feed.style.scrollSnapType
  feed.style.scrollSnapType = 'none'
  feed.scrollTo({ top: start, behavior: 'instant' })
  let frame: number
  let startedAt: number | undefined
  let running = true

  function cancel() {
    if (!running) return
    running = false
    cancelAnimationFrame(frame)
    feed.style.scrollSnapType = previousSnap
    feed.removeEventListener('wheel', cancel)
    feed.removeEventListener('pointerdown', cancel)
  }

  function tick(now: number) {
    startedAt ??= now
    const remaining = Math.max(0, 1 - (now - startedAt) / duration)
    feed.scrollTo({ top: start * remaining ** 3, behavior: 'instant' })
    if (remaining > 0) frame = requestAnimationFrame(tick)
    else cancel()
  }

  feed.addEventListener('wheel', cancel, { passive: true })
  feed.addEventListener('pointerdown', cancel, { passive: true })
  frame = requestAnimationFrame(tick)
  return cancel
}
