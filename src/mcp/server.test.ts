import { describe, expect, it } from 'vitest'
import { GET, OPTIONS, POST } from '../../app/api/mcp/route.ts'
import { MCP_URL, PROJECT_SITE_URL } from '../projectLinks.ts'
import { frenchTouchQuery } from './example.ts'

const origin = new URL(PROJECT_SITE_URL).origin
const modernVersion = '2026-07-28'
const legacyVersion = '2025-11-25'

function rpc(method: string, params: Record<string, unknown> = {}, options: { legacy?: boolean; origin?: string } = {}) {
  const headers = new Headers({
    Accept: 'application/json, text/event-stream',
    'Content-Type': 'application/json',
    'Mcp-Protocol-Version': options.legacy ? legacyVersion : modernVersion,
  })
  if (options.origin) headers.set('Origin', options.origin)
  if (!options.legacy) {
    headers.set('Mcp-Method', method)
    if (method === 'tools/call') headers.set('Mcp-Name', String(params.name))
    params = {
      ...params,
      _meta: {
        'io.modelcontextprotocol/protocolVersion': modernVersion,
        'io.modelcontextprotocol/clientCapabilities': {},
      },
    }
  }
  return POST(new Request(MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  }))
}

async function readRpc(response: Response) {
  const text = await response.text()
  expect(response.status, text).toBe(200)
  if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
    return JSON.parse(text.split('\n').find((line) => line.startsWith('data: '))!.slice(6))
  }
  return JSON.parse(text)
}

describe('Soundlines MCP endpoint', () => {
  it('advertises read-only tools and serves legacy clients without a session', async () => {
    const initialized = await readRpc(await rpc('initialize', {
      protocolVersion: legacyVersion,
      capabilities: {},
      clientInfo: { name: 'soundlines-test', version: '1' },
    }, { legacy: true }))
    expect(initialized.result.protocolVersion).toBe(legacyVersion)

    const response = await rpc('tools/list', {}, { legacy: true })
    expect(response.headers.get('Mcp-Session-Id')).toBeNull()
    const { result } = await readRpc(response)
    expect(result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'search_nodes', 'get_node', 'get_relationships', 'query_graph',
    ])
    expect(result.tools.every((tool: { annotations: { readOnlyHint: boolean } }) => tool.annotations.readOnlyHint)).toBe(true)
  })

  it('lists the same tools through the modern protocol', async () => {
    const { result } = await readRpc(await rpc('tools/list'))
    expect(result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'search_nodes', 'get_node', 'get_relationships', 'query_graph',
    ])
    const query = result.tools.find((tool: { name: string }) => tool.name === 'query_graph')
    expect(query.inputSchema.required).toEqual(['root', 'branches'])
  })

  it('runs the documented query and returns the evidence for each branch', async () => {
    const response = await rpc('tools/call', {
      name: 'query_graph',
      arguments: { ...frenchTouchQuery, locale: 'fr' },
    }, { origin })
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    const { result } = await readRpc(response)
    const graph = result.structuredContent
    expect(graph.locale).toBe('fr')
    expect(graph.matches.map((match: { rootId: string }) => match.rootId)).toContain('artist:daft-punk')
    expect(graph.matches.map((match: { rootId: string }) => match.rootId)).not.toContain('artist:air')
    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'signed_to', from: 'artist:daft-punk', confidence: 'high', sources: expect.any(Array) }),
    ]))
  })

  it('follows ordered steps, including incoming relationships', async () => {
    const response = await rpc('tools/call', {
      name: 'query_graph',
      arguments: {
        root: { id: 'genre:french-touch' },
        branches: [[
          { direction: 'in', types: ['key_artist_of'], node: { id: 'artist:daft-punk' } },
          { direction: 'out', types: ['signed_to'], node: { id: 'label:virgin-records' } },
        ]],
      },
    })
    const { result } = await readRpc(response)
    expect(result.structuredContent.matches[0].branches[0].paths[0]).toEqual([
      expect.objectContaining({ nodeId: 'artist:daft-punk', direction: 'in' }),
      expect.objectContaining({ nodeId: 'label:virgin-records', direction: 'out' }),
    ])
  })

  it('validates browser origins, including for preflights and errors', async () => {
    const preflight = OPTIONS(new Request(MCP_URL, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' },
    }))
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    expect(preflight.headers.get('Access-Control-Allow-Headers')).toContain('Mcp-Protocol-Version')
    expect(preflight.headers.get('Vary')).toBe('Origin')

    const unsupported = GET(new Request(MCP_URL, { headers: { Origin: origin } }))
    expect(unsupported.status).toBe(405)
    expect(unsupported.headers.get('Access-Control-Allow-Origin')).toBe(origin)

    const rejected = await rpc('tools/list', {}, { origin: 'https://example.org' })
    expect(rejected.status).toBe(403)
    expect(rejected.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
