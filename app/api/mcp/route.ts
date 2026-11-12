import { mcpHandler } from '../../../src/mcp/server.ts'
import { PROJECT_SITE_URL, companionBaseUrl } from '../../../src/projectLinks.ts'

const companionOrigins = new Set([new URL(PROJECT_SITE_URL).origin, new URL(companionBaseUrl()).origin])

function corsHeaders(request: Request) {
  const headers = new Headers({ Vary: 'Origin' })
  const origin = request.headers.get('Origin')
  if (origin && (companionOrigins.has(origin) || origin === new URL(request.url).origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Expose-Headers', 'Mcp-Protocol-Version')
  }
  return headers
}

function originRejected(request: Request, headers: Headers) {
  return request.headers.has('Origin') && !headers.has('Access-Control-Allow-Origin')
}

export function OPTIONS(request: Request) {
  const headers = corsHeaders(request)
  if (originRejected(request, headers)) return new Response(null, { status: 403, headers })
  headers.set('Allow', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Mcp-Protocol-Version, Mcp-Method, Mcp-Name')
  headers.set('Access-Control-Max-Age', '600')
  return new Response(null, { status: 204, headers })
}

export async function POST(request: Request) {
  const headers = corsHeaders(request)
  if (originRejected(request, headers)) return new Response(null, { status: 403, headers })
  const response = await mcpHandler.fetch(request)
  response.headers.append('Vary', 'Origin')
  for (const [key, value] of headers) {
    if (key !== 'vary') response.headers.set(key, value)
  }
  return response
}

export function GET(request: Request) {
  const headers = corsHeaders(request)
  if (originRejected(request, headers)) return new Response(null, { status: 403, headers })
  headers.set('Allow', 'POST, OPTIONS')
  return new Response(null, { status: 405, headers })
}

export { GET as DELETE }
