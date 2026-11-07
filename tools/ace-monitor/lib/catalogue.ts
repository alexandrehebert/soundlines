import { readFile } from 'node:fs/promises'
import { isRecord } from './tasks.ts'
import type { Catalogue, CatalogueJob } from './types.ts'

const text = (value: unknown) => typeof value === 'string' ? value : ''

export function parseCatalogue(value: unknown): Catalogue {
  if (!isRecord(value) || !Array.isArray(value.jobs)) throw new Error('Invalid catalogue queue file')
  const job = (item: unknown): CatalogueJob => {
    if (!isRecord(item) || typeof item.slug !== 'string') throw new Error('Invalid catalogue job')
    return {
      slug: item.slug,
      status: text(item.status) || 'unknown',
      seed: item.current_seed == null ? null : String(item.current_seed),
      error: text(item.error) || null,
    }
  }
  return {
    status: text(value.status) || 'unknown',
    current: text(value.current) || null,
    updatedAt: text(value.updated_at) || null,
    jobs: value.jobs.map(job),
    blocked: Array.isArray(value.blocked) ? value.blocked.map(job) : [],
  }
}

/** Returns null when no catalogue run has been started. */
export async function readCatalogue(path: string): Promise<Catalogue | null> {
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return null
    throw error
  }
  return parseCatalogue(JSON.parse(raw))
}
