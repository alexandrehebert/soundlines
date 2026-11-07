import { describe, expect, it } from 'vitest'
import { explorerUrl, readExplorerLocation } from './explorerLocation.ts'
import type { GraphNode } from './graph/types.ts'

const nodes: GraphNode[] = [
  { id: 'genre:jazz', type: 'genre', name: 'Jazz' },
  { id: 'artist:example', type: 'artist', name: 'Example artist' },
  { id: 'event:example', type: 'event', name: 'Example event' },
]
const nodeById = new Map(nodes.map((node) => [node.id, node]))
const origin = 'https://soundlines.example'

describe('explorer URL state', () => {
  it.each([
    ['/en', true, 'genre'],
    ['/fr/genres', false, 'genre'],
    ['/en/artists', false, 'artist'],
    ['/fr/instruments', false, 'instrument'],
    ['/en/history', false, 'history'],
    ['/en?view=artists', false, 'artist'],
    ['/en?layout=bubbles', false, 'genre'],
  ] as const)('reads %s', (path, isHome, view) => {
    const location = readExplorerLocation(new URL(path, origin), nodeById)
    expect(location.isHome).toBe(isHome)
    expect(location.view).toBe(view)
  })

  it('uses the focused entity to select its view, including from legacy home URLs', () => {
    const location = readExplorerLocation(new URL('/en?focus=artist%3Aexample', origin), nodeById)
    expect(location).toMatchObject({
      isHome: false,
      view: 'artist',
      timelineView: 'artist',
      selectedId: 'artist:example',
    })
    expect(explorerUrl(location, 'en', `${origin}/en?focus=artist%3Aexample`).pathname).toBe('/en/artists')
  })

  it('selects history for an event and drops unknown focus values', () => {
    const event = readExplorerLocation(new URL('/fr/genres?focus=event%3Aexample', origin), nodeById)
    expect(event).toMatchObject({ isHome: false, view: 'history', selectedId: 'event:example' })

    const unknown = readExplorerLocation(new URL('/en?focus=artist%3Amissing', origin), nodeById)
    expect(unknown).toMatchObject({ isHome: true, selectedId: null })
    expect(explorerUrl(unknown, 'en', `${origin}/en?focus=artist%3Amissing`).searchParams.has('focus')).toBe(false)
  })

  it('preserves independent sorting, layout, unrelated parameters, and non-discovery hashes', () => {
    const url = new URL('/fr/genres?view=artists&focus=artist%3Aexample&sort=oldest-first&artist-sort=oldest-first&instrument-sort=oldest-first&layout=bubbles&other=1#details', origin)
    const location = readExplorerLocation(url, nodeById)
    const result = explorerUrl(location, 'fr', url)

    expect(result.pathname).toBe('/fr/artists')
    expect(result.hash).toBe('#details')
    expect(result.searchParams.get('focus')).toBe('artist:example')
    expect(result.searchParams.get('sort')).toBe('oldest-first')
    expect(result.searchParams.get('artist-sort')).toBe('oldest-first')
    expect(result.searchParams.get('instrument-sort')).toBe('oldest-first')
    expect(result.searchParams.get('layout')).toBe('bubbles')
    expect(result.searchParams.get('other')).toBe('1')
    expect(result.searchParams.has('view')).toBe(false)
  })

  it('removes the discovery anchor when entering the explorer', () => {
    const source = new URL('/en#discover', origin)
    const location = { ...readExplorerLocation(source, nodeById), isHome: false }
    expect(explorerUrl(location, 'en', source).href).toBe(`${origin}/en/genres`)
  })
})
