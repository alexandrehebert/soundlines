import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { GraphNode } from '../src/graph/types.ts'
import { isPageRequest, pageRequestUrl, sendSocialPage } from './socialPage.ts'

const node: GraphNode = {
  id: 'instrument:timbales',
  type: 'instrument',
  name: 'Timbales',
  description: 'Cuban metal drums.',
}
const nodes = new Map([[node.id, node]])
const template = '<html><head><!-- social-metadata:start --><!-- social-metadata:end --></head><body>App</body></html>'

describe('social page responses', () => {
  let server: Server
  let address: string

  beforeAll(async () => {
    server = createServer((request, response) => sendSocialPage(request, response, template, nodes))
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const listening = server.address()
    if (!listening || typeof listening === 'string') throw new Error('Test server did not start')
    address = `http://127.0.0.1:${listening.port}`
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  })

  it('returns crawler-readable HTML using the incoming host and protocol', async () => {
    const response = await fetch(`${address}/?focus=instrument%3Atimbales`, {
      headers: { 'x-forwarded-proto': 'https' },
    })
    const html = await response.text()
    const origin = address.replace('http:', 'https:')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('no-cache')
    expect(html).toContain('<title>Timbales | Instrument | Soundlines</title>')
    expect(html).toContain('content="Cuban metal drums."')
    expect(html).toContain(`${origin}/?view=instruments&amp;focus=instrument%3Atimbales`)
    expect(html).toContain(`content="${origin}/social-card.png"`)
    expect(html).toContain('<body>App</body>')
  })

  it('responds to HEAD consistently and rejects unsupported methods', async () => {
    const get = await fetch(`${address}/?view=artists`)
    const html = await get.text()
    const head = await fetch(`${address}/?view=artists`, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(head.headers.get('content-length')).toBe(String(Buffer.byteLength(html)))
    expect(await head.text()).toBe('')

    const post = await fetch(address, { method: 'POST' })
    expect(post.status).toBe(405)
    expect(post.headers.get('allow')).toBe('GET, HEAD')
  })

  it('only intercepts HTML entry points and requires a valid host', () => {
    expect(isPageRequest({ method: 'GET', url: '/?view=artists', headers: {} })).toBe(true)
    expect(isPageRequest({ method: 'HEAD', url: '/index.html', headers: {} })).toBe(true)
    expect(isPageRequest({ method: 'GET', url: '/assets/index.js', headers: {} })).toBe(false)
    expect(isPageRequest({ method: 'POST', url: '/', headers: {} })).toBe(false)
    expect(pageRequestUrl({
      headers: { host: 'preview.example.test', 'x-forwarded-proto': 'https' },
      url: '/?view=artists',
      method: 'GET',
    }).href).toBe('https://preview.example.test/?view=artists')
    expect(() => pageRequestUrl({ headers: {}, url: '/', method: 'GET' })).toThrow('valid Host')
    expect(() => pageRequestUrl({ headers: { host: 'site.test@evil.test' }, url: '/', method: 'GET' })).toThrow('valid Host')
  })
})
