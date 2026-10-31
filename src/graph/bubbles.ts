/**
 * Scatter artist bubbles around their genre bar. Placement looks random but
 * is seeded by the artist/genre pair, so bubbles don't jump between renders.
 */

/** Deterministic [0, 1) generator seeded from a string (FNV-1a + mulberry32). */
export function seededRandom(seed: string): () => number {
  let state = 2166136261
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i)
    state = Math.imul(state, 16777619)
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function initials(name: string): string {
  const [first, second] = name.match(/[\p{L}\p{N}]+/gu) ?? []
  if (!first) return '?'
  if (!second) return first.slice(0, 2)
  return (first[0] + second[0]).toUpperCase()
}

export interface BubbleRequest {
  /** Seed, e.g. `${artistId}|${genreId}`. */
  key: string
  /** Preferred x (the artist's start year). */
  x: number
  minX: number
  maxX: number
  yCenter: number
  barHalfHeight: number
}

export interface Bubble {
  key: string
  x: number
  y: number
  r: number
  /** Point on the bar edge the tether connects to. */
  anchorY: number
}

export interface Rect {
  x1: number
  x2: number
  y1: number
  y2: number
}

const GAP = 3

/**
 * `obstacles` (e.g. genre labels) are areas bubbles should not cover; they
 * walk right past them.
 */
export function placeBubbles(requests: BubbleRequest[], obstacles: Rect[] = []): Bubble[] {
  const placed: Bubble[] = []
  const hitsRect = (x: number, y: number, r: number, rect: Rect) => {
    const dx = x - Math.min(Math.max(x, rect.x1), rect.x2)
    const dy = y - Math.min(Math.max(y, rect.y1), rect.y2)
    return Math.hypot(dx, dy) < r + GAP
  }
  const collides = (x: number, y: number, r: number) =>
    placed.some((other) => Math.hypot(other.x - x, other.y - y) < other.r + r + GAP) ||
    obstacles.some((rect) => hitsRect(x, y, r, rect))

  for (const request of requests) {
    const random = seededRandom(request.key)
    const r = 9 + random() * 3
    let side = random() < 0.5 ? -1 : 1
    const distance = request.barHalfHeight + r + 2 + random() * 8
    const lo = Math.min(request.minX + r, request.maxX)
    const hi = Math.max(request.maxX - r, lo)
    const clamp = (value: number) => Math.min(Math.max(value, lo), hi)
    // Skewed right: artists usually start at or after their genre's birth.
    let x = clamp(request.x + (random() - 0.3) * 60)
    let y = request.yCenter + side * distance

    // Resolve overlaps: try the other side of the bar, then walk right.
    for (let attempt = 0; attempt < 60 && collides(x, y, r); attempt++) {
      const flippedY = request.yCenter - side * distance
      if (!collides(x, flippedY, r)) {
        side = -side
        y = flippedY
        break
      }
      if (x + r / 2 > hi) break
      x += r / 2
    }

    placed.push({ key: request.key, x, y, r, anchorY: request.yCenter + side * request.barHalfHeight })
  }
  return placed
}
