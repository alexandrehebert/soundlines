import { describe, expect, it } from 'vitest'
import { readTimelineOrders, TIMELINE_VIEWS, writeTimelineOrders, type TimelineOrders } from './graph/timeline.ts'
import type { GraphNode } from './graph/types.ts'
import { socialMetadata } from './socialMetadata.ts'

describe('timeline order URLs', () => {
  it('round-trips each combination of independent orders without disturbing other parameters', () => {
    for (const genre of ['family', 'oldest-first'] as const) {
      for (const artist of ['family', 'oldest-first'] as const) {
        for (const instrument of ['family', 'oldest-first'] as const) {
          const orders: TimelineOrders = { genre, artist, instrument }
          const params = new URLSearchParams('keep=value&sort=invalid&artist-sort=invalid&instrument-sort=invalid')
          writeTimelineOrders(params, orders)
          expect(readTimelineOrders(params)).toEqual(orders)
          expect(params.get('keep')).toBe('value')
          for (const [view, param] of [
            ['genre', 'sort'], ['artist', 'artist-sort'], ['instrument', 'instrument-sort'],
          ] as const) {
            expect(params.get(param)).toBe(orders[view] === 'oldest-first' ? 'oldest-first' : null)
          }
        }
      }
    }
  })

  it('keeps existing sort links specific to genres, even in another view', () => {
    const params = new URLSearchParams('view=artists&sort=oldest-first')
    expect(readTimelineOrders(params)).toEqual({
      genre: 'oldest-first', artist: 'family', instrument: 'family',
    })
  })

  it('defaults missing or unsupported values to family groups', () => {
    const orders = readTimelineOrders(new URLSearchParams('sort=recent&artist-sort=family&instrument-sort=unknown'))
    expect(TIMELINE_VIEWS.map((view) => orders[view])).toEqual(['family', 'family', 'family'])
  })

  it('preserves all valid orders in canonical and social share URLs', () => {
    const node: GraphNode = {
      id: 'artist:example', type: 'artist', name: 'Example', family: 'jazz', period: { start: 1950 },
    }
    const input = new URL('https://soundlines.example/en?focus=artist%3Aexample&sort=oldest-first&artist-sort=oldest-first&instrument-sort=oldest-first&ignored=value')
    const metadata = socialMetadata(input, new Map([[node.id, node]]))
    const canonical = new URL(metadata.url)

    expect(canonical.pathname).toBe('/en/artists')
    expect(canonical.searchParams.get('focus')).toBe(node.id)
    expect(readTimelineOrders(canonical.searchParams)).toEqual({
      genre: 'oldest-first', artist: 'oldest-first', instrument: 'oldest-first',
    })
    expect(canonical.searchParams.has('ignored')).toBe(false)
  })
})
