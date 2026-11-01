import { describe, expect, it } from 'vitest'
import rawGraph from '../data/graph.json'
import { createGenreBubbles, layoutGenreBubbles } from './bubbles.ts'
import { buildIndex, lineageSource, lineageTarget } from './graph.ts'
import { createTimelineModel } from './timeline.ts'
import type { GraphEdge, MusicGraph } from './types.ts'

const graph: MusicGraph = {
  version: 1,
  nodes: ['a', 'b', 'c', 'd', 'isolated'].map((name) => ({
    id: `genre:${name}`, name, type: 'genre', family: 'jazz', period: { start: 1900 },
  })),
  edges: [
    { id: 'ab', type: 'influences', from: 'genre:a', to: 'genre:b' },
    { id: 'ac', type: 'derived_from', from: 'genre:c', to: 'genre:a' },
    { id: 'bd', type: 'subgenre_of', from: 'genre:d', to: 'genre:b' },
    { id: 'cd', type: 'fusion_of', from: 'genre:d', to: 'genre:c' },
  ],
}

describe('genre bubbles', () => {
  it('counts unique direct and indirect descendants, honoring lineage orientation', () => {
    const bubbles = createGenreBubbles(buildIndex(graph))
    expect(bubbles.map(({ node, influence }) => [node.id, influence])).toEqual([
      ['genre:a', 3], ['genre:b', 1], ['genre:c', 1], ['genre:d', 0], ['genre:isolated', 0],
    ])
    expect(bubbles[0].family).toBe('jazz')
  })

  describe('organic bubble layout', () => {
    it('handles an empty catalogue', () => {
      expect(layoutGenreBubbles(buildIndex({ version: 1, nodes: [], edges: [] })))
        .toEqual({ bubbles: [], width: 0, height: 0 })
    })

    it('is deterministic, including when input node and edge order changes', () => {
      const layout = layoutGenreBubbles(buildIndex(graph))
      expect(layoutGenreBubbles(buildIndex(graph))).toEqual(layout)
      expect(layoutGenreBubbles(buildIndex({
        ...graph, nodes: [...graph.nodes].reverse(), edges: [...graph.edges].reverse(),
      }))).toEqual(layout)
    })

    it('pulls linked genres closer than disconnected genres', () => {
      const nodes = graph.nodes.slice(0, 4)
      const layout = layoutGenreBubbles(buildIndex({
        ...graph,
        nodes,
        edges: [{ id: 'ad', type: 'derived_from', from: 'genre:d', to: 'genre:a' }],
      }))
      const [a, b, c, d] = layout.bubbles
      const distance = (first: typeof a, second: typeof a) =>
        Math.hypot(first.x - second.x, first.y - second.y)
      expect(distance(a, d)).toBeLessThan(distance(a, b))
      expect(distance(a, d)).toBeLessThan(distance(a, c))
    })

    it('keeps every real bubble inside the map without overlaps or rows', () => {
      const model = createTimelineModel(buildIndex(rawGraph as MusicGraph), 'genre')
      const { bubbles, width, height } = layoutGenreBubbles(model.index)
      const byId = new Map(bubbles.map((bubble) => [bubble.node.id, bubble]))
      const linkedDistances = model.index.graph.edges.map((edge) => {
        const a = byId.get(lineageSource(edge)!)!
        const b = byId.get(lineageTarget(edge)!)!
        return Math.hypot(a.x - b.x, a.y - b.y)
      })
      const allDistances: number[] = []
      expect(bubbles).toHaveLength(model.index.graph.nodes.length)
      for (const [i, bubble] of bubbles.entries()) {
        expect(bubble.x - bubble.diameter / 2).toBeGreaterThanOrEqual(23.99)
        expect(bubble.y - bubble.diameter / 2).toBeGreaterThanOrEqual(23.99)
        expect(bubble.x + bubble.diameter / 2).toBeLessThanOrEqual(width - 23.99)
        expect(bubble.y + bubble.diameter / 2).toBeLessThanOrEqual(height - 23.99)
        for (const other of bubbles.slice(i + 1)) {
          const distance = Math.hypot(bubble.x - other.x, bubble.y - other.y)
          allDistances.push(distance)
          expect(distance)
            .toBeGreaterThanOrEqual((bubble.diameter + other.diameter) / 2 + 11.9)
        }
      }
      expect(new Set(bubbles.map(({ y }) => Math.round(y))).size).toBeGreaterThan(bubbles.length * 0.9)
      const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
      expect(average(linkedDistances)).toBeLessThan(average(allDistances) * 0.65)
    })
  })

  it('excludes the selected genre itself when the graph contains cycles', () => {
    const cycle: GraphEdge = { id: 'cycle', type: 'influences', from: 'genre:d', to: 'genre:a' }
    const bubbles = createGenreBubbles(buildIndex({ ...graph, edges: [...graph.edges, cycle] }))
    expect(bubbles.find(({ node }) => node.id === 'genre:a')?.influence).toBe(3)
    expect(bubbles.every(({ influence }) => influence <= 3)).toBe(true)
  })

  it('uses the same normalized influence for brightness and area, with a visible minimum', () => {
    const bubbles = createGenreBubbles(buildIndex(graph))
    const [largest, middle] = bubbles
    const smallest = bubbles.at(-1)!
    expect(largest.intensity).toBe(1)
    expect(largest.diameter).toBe(204)
    expect(smallest.intensity).toBe(0)
    expect(smallest.diameter).toBe(104)
    expect(middle.intensity).toBeCloseTo(1 / 3)
    expect((middle.diameter ** 2 - smallest.diameter ** 2)
      / (largest.diameter ** 2 - smallest.diameter ** 2)).toBeCloseTo(1 / 3)
  })

  it('handles disconnected and empty catalogues without invalid sizes', () => {
    expect(createGenreBubbles(buildIndex({ version: 1, nodes: [], edges: [] }))).toEqual([])
    expect(createGenreBubbles(buildIndex({ ...graph, edges: [] }))
      .every(({ diameter, intensity }) => diameter === 104 && intensity === 0)).toBe(true)
  })

  it('projects every real genre exactly once without artist or other relationships', () => {
    const data = rawGraph as MusicGraph
    const model = createTimelineModel(buildIndex(data), 'genre')
    const bubbles = createGenreBubbles(model.index)
    const count = data.nodes.filter((node) => node.type === 'genre').length
    expect(bubbles).toHaveLength(count)
    expect(new Set(bubbles.map(({ node }) => node.id)).size).toBe(count)
    expect(bubbles.every(({ influence, diameter }) =>
      influence < count && Number.isFinite(diameter))).toBe(true)
  })
})
