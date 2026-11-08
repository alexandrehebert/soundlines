import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import rawGraph from '../data/graph.json'
import { buildIndex, lineageHighlight } from './graph.ts'
import { resolveSoundtrail, SOUNDTRAILS } from './soundtrails.ts'
import type { MusicGraph } from './types.ts'

const index = buildIndex(rawGraph as MusicGraph)

describe('Soundtrails', () => {
  it('uses unique trail ids', () => {
    expect(new Set(SOUNDTRAILS.map((trail) => trail.id)).size).toBe(SOUNDTRAILS.length)
  })

  it.each(SOUNDTRAILS.map((trail) => [trail.id, trail] as const))('%s follows the graph in time order', (_, trail) => {
    const stops = resolveSoundtrail(index, trail)
    expect(stops.length).toBeGreaterThanOrEqual(4)
    expect(stops[0].link).toBeNull()
    expect(stops.slice(1).every((stop) => stop.link)).toBe(true)
    const starts = stops.map((stop) => stop.node.period?.start ?? Number.NaN)
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })

  it.each(SOUNDTRAILS.map((trail) => [trail.id, trail] as const))('%s stays inside the final stop timeline highlight', (_, trail) => {
    const highlight = lineageHighlight(index, trail.stops.at(-1)!)
    expect(trail.stops.filter((id) => !highlight?.nodes.has(id))).toEqual([])
    const stops = resolveSoundtrail(index, trail)
    expect(stops.slice(1).filter((stop) => !highlight?.edges.has(stop.link!.edge.id))).toEqual([])
  })

  it.each(SOUNDTRAILS.map((trail) => [trail.id, trail] as const))('%s has a preview and listening hints at every stop', (_, trail) => {
    for (const stop of resolveSoundtrail(index, trail)) {
      const slug = stop.node.id.slice('genre:'.length)
      expect(existsSync(new URL(`../../public/genre-previews/${slug}.m4a`, import.meta.url)), slug).toBe(true)
      expect(stop.keyArtists.length, slug).toBeGreaterThan(0)
      expect(stop.keyArtists.length).toBeLessThanOrEqual(3)
      if (stop.anthem) expect(stop.anthem.artist?.type ?? 'artist').toBe('artist')
    }
  })

  it('reports trails the graph no longer supports', () => {
    const broken = { id: 'soul-to-techno', stops: ['genre:soul', 'genre:dubstep'] } as never
    expect(() => resolveSoundtrail(index, broken)).toThrow('no lineage edge from genre:soul to genre:dubstep')
  })
})
