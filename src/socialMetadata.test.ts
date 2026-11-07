import { describe, expect, it } from 'vitest'
import rawGraph from './data/graph.json'
import { buildIndex } from './graph/graph.ts'
import { graphForLocale } from './data/graphLocale.ts'
import type { GraphNode, MusicGraph } from './graph/types.ts'
import { renderSocialMetadata, socialMetadata, socialMetaTags } from './socialMetadata.ts'

const index = buildIndex(rawGraph as MusicGraph)
const frenchIndex = buildIndex(graphForLocale('fr'))
const origin = 'https://soundlines.example'
const template = '<html><head><!-- social-metadata:start --><title>Old</title><!-- social-metadata:end --></head><body>App</body></html>'

describe('social metadata', () => {
  it.each([
    ['/en-US', 'Soundlines | Discover Music History'],
    ['/en-US/genres', 'Music Genres | Soundlines'],
    ['/en-US/artists', 'Music Artists | Soundlines'],
    ['/en-US/instruments', 'Musical Instruments | Soundlines'],
    ['/en-US/history', 'Music History | Soundlines'],
    ['/en-US/genres?layout=bubbles', 'Music Genre Map | Soundlines'],
  ])('describes the %s view', (path, title) => {
    const metadata = socialMetadata(new URL(path, origin), index.nodeById)
    expect(metadata.title).toBe(title)
    expect(metadata.description).toBeTruthy()
    expect(metadata.url).toBe(new URL(path, origin).href)
    expect(metadata.image).toBe(`${origin}/social-card.png`)
  })

  it('localizes page metadata and keeps the locale in the canonical URL', () => {
    const metadata = socialMetadata(new URL('/fr/history', origin), index.nodeById)
    expect(metadata.title).toBe('Histoire de la musique | Soundlines')
    expect(metadata.url).toBe(`${origin}/fr/history`)
    expect(metadata.description).toContain('Explorez les événements')

    const event = socialMetadata(
      new URL('/fr/history?focus=event%3Amtv-launch', origin),
      frenchIndex.nodeById,
    )
    expect(event.title).toBe('MTV commence ses émissions | Événement | Soundlines')
    expect(event.description).toContain('MTV commence à émettre aux États-Unis')
  })

  it('uses French graph text and image alt text in French metadata', () => {
    const metadata = socialMetadata(
      new URL('/fr/genres?focus=genre%3Ajazz', origin),
      frenchIndex.nodeById,
    )
    expect(metadata.title).toBe('Jazz | Genre | Soundlines')
    expect(metadata.description).toContain('Musique afro-américaine')
    expect(metadata.imageAlt).toBe('Soundlines : une carte chronologique des lignées musicales')
    expect(socialMetaTags(metadata)).toContainEqual({
      attribute: 'property',
      key: 'og:image:alt',
      content: metadata.imageAlt,
    })
  })

  it.each([
    ['genre:house', 'House', 'Genre', '/en-US/genres'],
    ['artist:juan-atkins', 'Juan Atkins', 'Artist', '/en-US/artists'],
    ['instrument:timbales', 'Timbales', 'Instrument', '/en-US/instruments'],
    ['label:metroplex', 'Metroplex', 'Label', '/en-US/artists'],
    ['place:detroit', 'Detroit', 'Place', '/en-US/artists'],
    ['track:clear', 'Clear', 'Track', '/en-US/artists'],
    ['scene:the-warehouse', 'The Warehouse', 'Scene', '/en-US/artists'],
    ['event:mtv-launch', 'MTV launches', 'Event', '/en-US/history'],
  ])('describes the %s entity and uses the effective view', (id, name, type, view) => {
    const url = new URL('/en-US/artists?sort=oldest-first&layout=bubbles&utm_source=example', origin)
    url.searchParams.set('focus', id)
    const metadata = socialMetadata(url, index.nodeById)
    const canonical = new URL(metadata.url)

    expect(metadata.title).toBe(`${name} | ${type} | Soundlines`)
    expect(metadata.description).toBeTruthy()
    expect(Array.from(metadata.description).length).toBeLessThanOrEqual(200)
    expect(canonical.searchParams.get('focus')).toBe(id)
    expect(canonical.pathname).toBe(view)
    expect(canonical.searchParams.has('view')).toBe(false)
    expect(canonical.searchParams.get('sort')).toBe('oldest-first')
    expect(canonical.searchParams.get('layout')).toBe('bubbles')
    expect(canonical.searchParams.has('utm_source')).toBe(false)
  })

  it.each([
    ['/en-US', '/en-US'],
    ['/en-US/genres?layout=bubbles', '/en-US/genres?layout=bubbles'],
    ['/en-US?view=artists', '/en-US/artists'],
    ['/en-US/history?view=history', '/en-US/history'],
    ['/en-US/genres/?view=artists', '/en-US/genres'],
  ])('canonicalizes %s to %s', (path, canonical) => {
    expect(socialMetadata(new URL(path, origin), index.nodeById).url).toBe(`${origin}${canonical}`)
  })

  it('uses the dataset description when available and a meaningful fallback otherwise', () => {
    const timbales = socialMetadata(new URL('/en-US?focus=instrument%3Atimbales', origin), index.nodeById)
    expect(timbales.description).toContain('shallow, single-headed Cuban metal drums')

    const node: GraphNode = { id: 'artist:no-description', type: 'artist', name: 'Example Artist' }
    const fallback = socialMetadata(new URL('/en-US?focus=artist%3Ano-description', origin), new Map([[node.id, node]]))
    expect(fallback.description).toContain('Example Artist (Artist)')
    expect(fallback.description).toContain('connections across music history')
  })

  it('provides a usable preview and canonical focus for every graph entity', () => {
    for (const node of index.graph.nodes) {
      const url = new URL('/en-US', origin)
      url.searchParams.set('focus', node.id)
      const metadata = socialMetadata(url, index.nodeById)
      expect(metadata.title).toContain(node.name)
      expect(metadata.description.length).toBeGreaterThan(0)
      expect(new URL(metadata.url).searchParams.get('focus')).toBe(node.id)
    }
  })

  it('falls back to the requested view for unknown focus and removes unsupported parameters', () => {
    const metadata = socialMetadata(
      new URL('/en-US?view=instruments&focus=instrument%3Aunknown&sort=invalid&layout=invalid&other=1', origin),
      index.nodeById,
    )
    expect(metadata.title).toBe('Musical Instruments | Soundlines')
    expect(metadata.url).toBe(`${origin}/en-US/instruments`)
  })

  it('preserves the shared sort order for every timeline', () => {
    const metadata = socialMetadata(
      new URL('/en-US/artists?sort=oldest-first&artist-sort=oldest-first&instrument-sort=oldest-first', origin),
      index.nodeById,
    )
    const params = new URL(metadata.url).searchParams
    expect(params.get('sort')).toBe('oldest-first')
    expect(params.get('artist-sort')).toBe('oldest-first')
    expect(params.get('instrument-sort')).toBe('oldest-first')
  })

  it('escapes entity text and URLs in the initial HTML without duplicating metadata', () => {
    const node: GraphNode = {
      id: 'genre:unsafe',
      type: 'genre',
      name: 'A & "B" <C>',
      description: 'A </title><script>alert("x")</script> & more',
    }
    const metadata = socialMetadata(
      new URL('/en-US?focus=genre%3Aunsafe&layout=bubbles', origin),
      new Map([[node.id, node]]),
    )
    const html = renderSocialMetadata(template, metadata)

    expect(html).toContain('<title>A &amp; &quot;B&quot; &lt;C&gt; | Genre | Soundlines</title>')
    expect(html).toContain('&lt;/title&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; more')
    expect(html).toContain('genre%3Aunsafe&amp;layout=bubbles')
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('<body>App</body>')
    expect(renderSocialMetadata(html, metadata)).toBe(html)

    for (const { attribute, key } of socialMetaTags(metadata)) {
      expect(html.split(`<meta ${attribute}="${key}"`).length - 1).toBe(1)
    }
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toContain('property="og:image:width" content="1200"')
    expect(html).toContain('property="og:image:height" content="630"')
  })

  it('reports a missing HTML template marker instead of returning incomplete metadata', () => {
    const metadata = socialMetadata(new URL('/', origin), index.nodeById)
    expect(() => renderSocialMetadata('<html></html>', metadata)).toThrow('Social metadata markers are missing')
  })
})
