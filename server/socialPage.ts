import type { IncomingMessage, ServerResponse } from 'node:http'
import { viewFromPath } from '../src/graph/timeline.ts'
import type { GraphNode } from '../src/graph/types.ts'
import { renderSocialMetadata, socialMetadata } from '../src/socialMetadata.ts'

type PageRequest = Pick<IncomingMessage, 'headers' | 'method' | 'url'>

export function isPageRequest(request: PageRequest): boolean {
  const path = request.url?.split('?', 1)[0]
  return (request.method === 'GET' || request.method === 'HEAD') && (path === '/' || path === '/index.html' || (path !== undefined && viewFromPath(path) !== undefined))
}

export function pageRequestUrl(request: PageRequest): URL {
  const host = request.headers.host
  if (!host || /[\s/?#@\\]/.test(host)) throw new Error('A valid Host header is required')
  const forwarded = request.headers['x-forwarded-proto']
  const protocol = typeof forwarded === 'string' && forwarded.split(',')[0].trim() === 'https' ? 'https' : 'http'
  const url = new URL(`${protocol}://${host}/`)
  const target = request.url ?? '/'
  const query = target.indexOf('?')
  url.pathname = query < 0 ? target : target.slice(0, query)
  if (query >= 0) url.search = target.slice(query)
  // Vercel can pass the rewritten path to the page function.
  const pagePath = url.searchParams.get('__page_path')
  if (url.pathname === '/api/page' && pagePath && viewFromPath(pagePath)) url.pathname = pagePath
  return url
}

export function sendSocialPage(
  request: PageRequest,
  response: ServerResponse,
  html: string,
  nodeById: ReadonlyMap<string, GraphNode>,
): void {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.setHeader('Allow', 'GET, HEAD')
    response.end('Method Not Allowed')
    return
  }

  const rendered = renderSocialMetadata(html, socialMetadata(pageRequestUrl(request), nodeById))
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.setHeader('Cache-Control', 'no-cache')
  response.setHeader('Content-Length', Buffer.byteLength(rendered))
  response.end(request.method === 'HEAD' ? undefined : rendered)
}
