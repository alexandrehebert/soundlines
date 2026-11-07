import { DatabaseSync } from 'node:sqlite'
import { open } from 'node:fs/promises'
import { aceData, discoverServers, serverEndpoints } from './ace.ts'
import { readCatalogue } from './catalogue.ts'
import { isRecord, parseTask } from './tasks.ts'
import type { ServerStatus, Snapshot, Stats, Task } from './types.ts'

const prefix = 'ace_step_v1.5_'

export function discoverTasks(databasePath: string, limit = 100): string[] {
  const database = new DatabaseSync(databasePath, { readOnly: true })
  try {
    const rows = database.prepare(`
      SELECT key FROM Cache
      WHERE substr(key, 1, ?) = ? AND (expire_time IS NULL OR expire_time > ?)
      ORDER BY store_time DESC LIMIT ?
    `).all(prefix.length, prefix, Date.now() / 1000, limit)
    return rows.map(row => {
      if (typeof row.key !== 'string') throw new Error('Unsupported ACE cache key format')
      return row.key.slice(prefix.length)
    })
  } finally {
    database.close()
  }
}

export async function readLog(path: string): Promise<string> {
  const file = await open(path, 'r')
  try {
    const { size } = await file.stat()
    const start = Math.max(0, size - 64 * 1024)
    const buffer = Buffer.alloc(size - start)
    const { bytesRead } = await file.read(buffer, 0, buffer.length, start)
    let text = buffer.subarray(0, bytesRead).toString('utf8')
    if (start > 0) text = text.slice(text.indexOf('\n') + 1)
    // Diffusion progress uses carriage returns; omit noisy HTTP polling lines.
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\r/g, '\n')
      .split('\n').filter(line => line.trim() && !/"(?:GET|POST) \/(?:health|query_result|v1\/stats)/.test(line))
      .slice(-150).join('\n')
  } finally {
    await file.close()
  }
}

function parseStats(value: unknown): Stats {
  if (!isRecord(value) || !isRecord(value.jobs)) throw new Error('Invalid ACE stats response')
  const jobs = value.jobs
  function number(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error('Invalid ACE stats number')
    }
    return value
  }
  return {
    jobs: {
      total: number(jobs.total), queued: number(jobs.queued), running: number(jobs.running),
      succeeded: number(jobs.succeeded), failed: number(jobs.failed),
    },
    queue_size: number(value.queue_size), queue_maxsize: number(value.queue_maxsize),
    avg_job_seconds: number(value.avg_job_seconds),
  }
}

export async function snapshot(): Promise<Snapshot> {
  const data: Snapshot = {
    updatedAt: new Date().toISOString(), catalogue: null, scannedPorts: null, servers: [], tasks: [], log: null, errors: [],
  }
  function report(name: string, error: unknown, errors: string[]) {
    console.error(`[ace-monitor] ${name}`, error)
    errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
  async function capture<T>(name: string, work: () => Promise<T>, errors = data.errors): Promise<T | undefined> {
    try {
      return await work()
    } catch (error) {
      report(name, error, errors)
      return undefined
    }
  }
  const idsPromise = capture('Task history', async () => {
    if (!process.env.ACE_CACHE_DB) throw new Error('ACE_CACHE_DB is not configured')
    return discoverTasks(process.env.ACE_CACHE_DB)
  })
  const logPromise = capture('Server log', async () => {
    if (!process.env.ACE_LOG_PATH) throw new Error('ACE_LOG_PATH is not configured')
    data.log = await readLog(process.env.ACE_LOG_PATH)
  })
  const cataloguePromise = process.env.ACE_CATALOGUE_PATH ? capture('Loop catalogue queue', async () => {
    data.catalogue = await readCatalogue(process.env.ACE_CATALOGUE_PATH!)
  }) : Promise.resolve()
  const discoveryPromise = capture('Server discovery', async () => {
    const endpoints = serverEndpoints()
    data.scannedPorts = { start: endpoints[0].port, end: endpoints[endpoints.length - 1].port }
    const discovery = await discoverServers(endpoints)
    data.errors.push(...discovery.errors)
    if (!discovery.servers.length) {
      data.errors.push(`No ACE servers found on ports ${data.scannedPorts.start}–${data.scannedPorts.end}.`)
      return
    }

    const ids = await idsPromise
    const responses = await Promise.all(discovery.servers.map(async ({ endpoint, health }) => {
      const server: ServerStatus = {
        port: endpoint.port, health, stats: null, progressText: null, errors: [],
      }
      const [stats, results] = await Promise.all([
        capture(`Port ${endpoint.port} queue statistics`, async () =>
          parseStats(await aceData(endpoint, '/v1/stats')), server.errors),
        ids?.length ? capture(`Port ${endpoint.port} task results`, async () => {
          const value = await aceData(endpoint, '/query_result', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id_list: ids }),
          })
          if (!Array.isArray(value)) throw new Error('Invalid ACE task list response')
          return value
        }, server.errors) : Promise.resolve(undefined),
      ])
      server.stats = stats ?? null
      const progress = results?.find(item =>
        isRecord(item) && typeof item.progress_text === 'string' && item.progress_text.trim())
      if (isRecord(progress) && typeof progress.progress_text === 'string') {
        server.progressText = progress.progress_text
      }
      return { server, results }
    }))
    data.servers = responses.map(response => response.server)

    const tasks = new Map<string, Task>()
    const requestedIds = new Set(ids)
    const rank = (task: Task) => task.status === 'unavailable' ? 0 : task.status === 'active' ? 1 : 2
    for (const { server, results } of responses) {
      for (const result of results ?? []) {
        try {
          const task = parseTask(result)
          if (!requestedIds.has(task.id)) throw new Error(`Unexpected task ID ${task.id}`)
          const previous = tasks.get(task.id)
          if (!previous || rank(task) > rank(previous)) tasks.set(task.id, task)
          else if (rank(task) === 2 && rank(previous) === 2 && task.status !== previous.status) {
            throw new Error(`Conflicting terminal results for task ${task.id}`)
          }
        } catch (error) {
          report(`Port ${server.port} task result`, error, server.errors)
        }
      }
    }
    data.tasks = [...tasks.values()].sort((a, b) =>
      Number(b.status === 'active') - Number(a.status === 'active') ||
      (b.createdAt || 0) - (a.createdAt || 0))
  })
  await Promise.all([idsPromise, logPromise, cataloguePromise, discoveryPromise])
  return data
}
