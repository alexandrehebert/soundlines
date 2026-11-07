import { audioPath, isRecord } from './tasks.ts'
import type { Health } from './types.ts'

interface AceConfig {
  ACE_API_URL?: string
  ACE_API_PORT_COUNT?: string
}

export interface Endpoint {
  port: number
  url: URL
}

export interface DiscoveredServer {
  endpoint: Endpoint
  health: Health
}

export function serverEndpoints(config: AceConfig = {
  ACE_API_URL: process.env.ACE_API_URL,
  ACE_API_PORT_COUNT: process.env.ACE_API_PORT_COUNT,
}): Endpoint[] {
  const base = new URL(config.ACE_API_URL || 'http://127.0.0.1:8020')
  if (!['http:', 'https:'].includes(base.protocol)) throw new Error('ACE_API_URL must be HTTP(S)')
  if (base.username || base.password) throw new Error('Use ACE_API_KEY instead of credentials in ACE_API_URL')

  const start = base.port ? Number(base.port) : base.protocol === 'https:' ? 443 : 80
  const countText = config.ACE_API_PORT_COUNT ?? '10'
  const count = Number(countText)
  if (!/^\d+$/.test(countText) || !Number.isSafeInteger(count) || count < 1 || count > 100) {
    throw new Error('ACE_API_PORT_COUNT must be an integer from 1 to 100')
  }
  if (start < 1 || start + count - 1 > 65535) throw new Error('ACE API port range must be within 1–65535')

  base.pathname = '/'
  base.search = ''
  base.hash = ''
  return Array.from({ length: count }, (_, index) => {
    const port = start + index
    const url = new URL(base)
    url.port = String(port)
    return { port, url }
  })
}

async function aceFetch(
  endpoint: Endpoint,
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean; timeout?: number } = {},
): Promise<Response> {
  const url = new URL(path, endpoint.url)
  if (url.origin !== endpoint.url.origin) throw new Error('ACE request must use the configured host')
  const headers = new Headers(init.headers)
  if (options.authenticated !== false && process.env.ACE_API_KEY) {
    headers.set('Authorization', `Bearer ${process.env.ACE_API_KEY}`)
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 10_000)
  const signal = init.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal
  try {
    return await fetch(url, { ...init, headers, signal, cache: 'no-store', redirect: 'error' })
  } finally {
    clearTimeout(timeout)
  }
}

async function aceJson(
  endpoint: Endpoint,
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean; timeout?: number } = {},
): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 10_000)
  const signal = init.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal
  try {
    const response = await aceFetch(endpoint, path, { ...init, signal }, options)
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(`ACE ${path}: HTTP ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function aceData(endpoint: Endpoint, path: string, init?: RequestInit): Promise<unknown> {
  const body = await aceJson(endpoint, path, init)
  if (!isRecord(body) || body.code !== 200 || body.error) {
    throw new Error(`ACE ${path}: invalid response or API error`)
  }
  return body.data
}

function parseHealth(value: unknown): Health {
  if (!isRecord(value) || value.service !== 'ACE-Step API') {
    throw new Error('Health endpoint did not identify as ACE-Step API')
  }
  if (typeof value.status !== 'string' ||
      typeof value.models_initialized !== 'boolean' || typeof value.llm_initialized !== 'boolean' ||
      !(value.loaded_model === null || typeof value.loaded_model === 'string') ||
      !(value.loaded_lm_model === null || typeof value.loaded_lm_model === 'string')) {
    throw new Error('Invalid ACE health response')
  }
  return {
    status: value.status, models_initialized: value.models_initialized,
    llm_initialized: value.llm_initialized, loaded_model: value.loaded_model,
    loaded_lm_model: value.loaded_lm_model,
  }
}

function connectionRefused(error: unknown): boolean {
  if (!isRecord(error)) return false
  if (error.code === 'ECONNREFUSED') return true
  if (Array.isArray(error.errors) && error.errors.length > 0 && error.errors.every(connectionRefused)) return true
  return error.cause !== undefined && connectionRefused(error.cause)
}

export async function discoverServers(endpoints: Endpoint[]): Promise<{
  servers: DiscoveredServer[]
  errors: string[]
}> {
  const probes = await Promise.all(endpoints.map(async endpoint => {
    try {
      // Health is public; do not send a configured API key to an unidentified service.
      const checkHealth = () => aceJson(endpoint, '/health', {}, { authenticated: false, timeout: 1_500 })
      let body: unknown
      try {
        body = await checkHealth()
      } catch (error) {
        if (!(error instanceof TypeError) || error.message !== 'fetch failed' || connectionRefused(error)) throw error
        body = await checkHealth()
      }
      if (!isRecord(body) || body.code !== 200 || body.error) {
        throw new Error('Health endpoint did not identify as ACE-Step API')
      }
      return { server: { endpoint, health: parseHealth(body.data) }, error: null }
    } catch (error) {
      if (connectionRefused(error)) return { server: null, error: null }
      const message = error instanceof Error && error.name === 'AbortError'
        ? 'Health check timed out'
        : error instanceof Error ? error.message : String(error)
      console.warn(`[ace-monitor] Port ${endpoint.port}: ${message}`)
      return { server: null, error: `Port ${endpoint.port}: ${message}` }
    }
  }))
  return {
    servers: probes.flatMap(probe => probe.server ? [probe.server] : []),
    errors: probes.flatMap(probe => probe.error ? [probe.error] : []),
  }
}

export async function proxyAudio(file: string, range: string | null): Promise<Response> {
  const path = audioPath(file)
  const endpoints = serverEndpoints()
  const { servers, errors } = await discoverServers(endpoints)
  if (!servers.length) {
    console.error('[ace-monitor] No ACE server available for audio', errors)
    return Response.json({ error: 'No ACE server available for audio' }, { status: 502 })
  }

  const failures: string[] = []
  let onlyMissing = true
  for (const { endpoint } of servers) {
    try {
      const response = await aceFetch(endpoint, path, { headers: range ? { Range: range } : undefined })
      if (response.ok || response.status === 416) return response
      failures.push(`Port ${endpoint.port}: HTTP ${response.status}`)
      if (response.status !== 403 && response.status !== 404) onlyMissing = false
      await response.body?.cancel()
    } catch (error) {
      onlyMissing = false
      failures.push(`Port ${endpoint.port}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  console.error('[ace-monitor] Audio unavailable', failures)
  return Response.json(
    { error: onlyMissing ? 'Audio file is not accessible on any ACE server' : 'ACE audio request failed' },
    { status: onlyMissing ? 404 : 502 },
  )
}
