import type { Task } from './types.ts'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function audioPath(file: string): string {
  const url = new URL(file, 'http://ace.local')
  if (url.origin !== 'http://ace.local' || url.pathname !== '/v1/audio' || !url.searchParams.get('path')) {
    throw new Error('Invalid ACE audio URL')
  }
  return `${url.pathname}${url.search}`
}

export function parseTask(value: unknown): Task {
  if (!isRecord(value) || typeof value.task_id !== 'string' || typeof value.result !== 'string' ||
      typeof value.status !== 'number' || ![0, 1, 2].includes(value.status)) {
    throw new Error('Invalid ACE task response')
  }
  const parsed: unknown = JSON.parse(value.result)
  if (!Array.isArray(parsed) || !parsed.every(isRecord)) {
    throw new Error(`Invalid result for task ${value.task_id}`)
  }
  const first = parsed[0]
  const files = parsed.flatMap(item =>
    typeof item.file === 'string' && item.file ? [audioPath(item.file)] : [],
  )
  const status = parsed.length === 0 ? 'unavailable'
    : value.status === 1 ? 'succeeded' : value.status === 2 ? 'failed' : 'active'
  return {
    id: value.task_id,
    status,
    stage: typeof first?.stage === 'string' ? first.stage : status,
    progress: typeof first?.progress === 'number' ? Math.max(0, Math.min(1, first.progress)) : null,
    createdAt: typeof first?.create_time === 'number' ? first.create_time : null,
    prompt: typeof first?.prompt === 'string' ? first.prompt : '',
    seed: typeof first?.seed_value === 'string' ? first.seed_value : '',
    model: typeof first?.dit_model === 'string' ? first.dit_model : '',
    error: typeof first?.error === 'string' ? first.error : null,
    files,
    result: parsed,
  }
}
