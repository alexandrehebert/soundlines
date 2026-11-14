import type { GraphNode } from '../../graph/types.ts'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const SPOTLIGHT_COUNT = 5

export function utcDay(timestamp: number) {
  return Math.floor(timestamp / MILLISECONDS_PER_DAY)
}

export function currentUtcDay() {
  return utcDay(Date.now())
}

export function subscribeToUtcDay(notify: () => void) {
  let timer: ReturnType<typeof setTimeout>
  const schedule = () => {
    const now = Date.now()
    const nextDay = (utcDay(now) + 1) * MILLISECONDS_PER_DAY
    timer = setTimeout(() => {
      schedule()
      notify()
    }, nextDay - now)
  }
  const onVisibilityChange = () => {
    if (document.visibilityState !== 'visible') return
    clearTimeout(timer)
    schedule()
    notify()
  }

  schedule()
  document.addEventListener('visibilitychange', onVisibilityChange)
  return () => {
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}

function stableHash(id: string) {
  let hash = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 0x01000193)
  }
  return hash >>> 0
}

export function dailySpotlights(nodes: readonly GraphNode[], type: 'artist' | 'instrument', day: number) {
  const candidates = nodes
    .filter((node) => node.type === type)
    .map((node) => ({ node, hash: stableHash(node.id) }))
    .sort((a, b) => a.hash - b.hash || (a.node.id < b.node.id ? -1 : a.node.id > b.node.id ? 1 : 0))
  if (candidates.length === 0) return []

  // Move through a stable ordering in groups of five, avoiding repeats on adjacent days when possible.
  const start = ((day * SPOTLIGHT_COUNT) % candidates.length + candidates.length) % candidates.length
  return Array.from(
    { length: Math.min(SPOTLIGHT_COUNT, candidates.length) },
    (_, offset) => candidates[(start + offset) % candidates.length].node,
  )
}
