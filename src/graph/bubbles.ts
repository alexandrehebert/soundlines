import { lineage, lineageSource, lineageTarget, type GraphIndex } from './graph.ts'
import { FAMILY_ORDER, isGenreFamily } from './types.ts'

export type GenreDisplay = 'bars' | 'bubbles'

export function createGenreBubbles(index: GraphIndex) {
  const genres = index.graph.nodes.filter((node) => node.type === 'genre')
  const bubbles = genres.map((node) => {
    if (!isGenreFamily(node.family)) throw new Error(`Genre bubble ${node.id} needs a genre family`)
    const influence = [...lineage(index, node.id).descendants]
      .filter((id) => index.nodeById.get(id)?.type === 'genre').length
    return { node, family: node.family, influence }
  })
  const maximum = Math.max(0, ...bubbles.map((bubble) => bubble.influence))
  return bubbles.map((bubble) => {
    const intensity = maximum === 0 ? 0 : bubble.influence / maximum
    return {
      ...bubble,
      intensity,
      // Circle area, rather than diameter, grows linearly with influence.
      diameter: Math.sqrt(104 ** 2 + intensity * (204 ** 2 - 104 ** 2)),
    }
  }).sort((a, b) => b.influence - a.influence
    || a.node.name.localeCompare(b.node.name) || a.node.id.localeCompare(b.node.id))
}

const layoutCache = new WeakMap<GraphIndex, ReturnType<typeof computeGenreBubbleLayout>>()

export function layoutGenreBubbles(index: GraphIndex) {
  let layout = layoutCache.get(index)
  if (!layout) {
    layout = computeGenreBubbleLayout(index)
    layoutCache.set(index, layout)
  }
  return layout
}

function computeGenreBubbleLayout(index: GraphIndex) {
  const familyCounts = new Map<string, number>()
  const bubbles = createGenreBubbles(index)
    .sort((a, b) => a.node.id.localeCompare(b.node.id))
    .map((bubble) => {
      const position = familyCounts.get(bubble.family) ?? 0
      familyCounts.set(bubble.family, position + 1)
      const familyAngle = FAMILY_ORDER.indexOf(bubble.family) * Math.PI * 2 / FAMILY_ORDER.length
      const angle = position * Math.PI * (3 - Math.sqrt(5))
      const radius = Math.sqrt(position) * 90
      return {
        ...bubble,
        x: Math.cos(familyAngle) * 420 + Math.cos(angle) * radius,
        y: Math.sin(familyAngle) * 420 + Math.sin(angle) * radius,
      }
    })
  if (bubbles.length === 0) return { bubbles, width: 0, height: 0 }

  const byId = new Map(bubbles.map((bubble) => [bubble.node.id, bubble]))
  const pairs = new Set<string>()
  const links = [...index.graph.edges].sort((a, b) => a.id.localeCompare(b.id)).flatMap((edge) => {
    const source = lineageSource(edge)
    const target = lineageTarget(edge)
    if (!source || !target || source === target) return []
    const a = byId.get(source)
    const b = byId.get(target)
    const key = [source, target].sort().join('|')
    if (!a || !b || pairs.has(key)) return []
    pairs.add(key)
    return [{ a, b }]
  })

  const count = bubbles.length
  const related = new Uint8Array(count * count)
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      if (pairs.has(`${bubbles[i].node.id}|${bubbles[j].node.id}`)) related[i * count + j] = 1
    }
  }

  // Springs bring lineage neighbors together; collision relaxation keeps labels separate.
  for (let iteration = 0; iteration < 700; iteration += 1) {
    if (iteration < 500) {
      const cooling = 1 - iteration / 500
      for (const { a, b } of links) {
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.hypot(dx, dy) || 1
        const ideal = (a.diameter + b.diameter) / 2 + 22
        const pull = (distance - ideal) / distance * 0.045 * cooling
        a.x += dx * pull
        a.y += dy * pull
        b.x -= dx * pull
        b.y -= dy * pull
      }
      for (const bubble of bubbles) {
        bubble.x *= 1 - 0.001 * cooling
        bubble.y *= 1 - 0.001 * cooling
      }
    }

    const spacing = iteration < 500
    for (let i = 0; i < count; i += 1) {
      const a = bubbles[i]
      for (let j = i + 1; j < count; j += 1) {
        const b = bubbles[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const unrelatedGap = spacing && !related[i * count + j] ? 32 : 0
        const minimum = (a.diameter + b.diameter) / 2 + 12 + unrelatedGap
        // Cheap squared-distance rejection before the square root.
        if (dx * dx + dy * dy >= minimum * minimum) continue
        const distance = Math.hypot(dx, dy)
        if (distance >= minimum) continue
        const angle = distance === 0 ? (i + j) * 2.399963 : Math.atan2(dy, dx)
        const push = (minimum - distance) / 2
        a.x -= Math.cos(angle) * push
        a.y -= Math.sin(angle) * push
        b.x += Math.cos(angle) * push
        b.y += Math.sin(angle) * push
      }
    }
  }

  const left = Math.min(...bubbles.map((bubble) => bubble.x - bubble.diameter / 2)) - 24
  const top = Math.min(...bubbles.map((bubble) => bubble.y - bubble.diameter / 2)) - 24
  const right = Math.max(...bubbles.map((bubble) => bubble.x + bubble.diameter / 2)) + 24
  const bottom = Math.max(...bubbles.map((bubble) => bubble.y + bubble.diameter / 2)) + 24
  return {
    bubbles: bubbles.map((bubble) => ({ ...bubble, x: bubble.x - left, y: bubble.y - top })),
    width: right - left,
    height: bottom - top,
  }
}
