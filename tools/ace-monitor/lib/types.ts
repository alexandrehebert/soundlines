export interface Health {
  status: string
  models_initialized: boolean
  llm_initialized: boolean
  loaded_model: string | null
  loaded_lm_model: string | null
}

export interface Stats {
  jobs: { total: number; queued: number; running: number; succeeded: number; failed: number }
  queue_size: number
  queue_maxsize: number
  avg_job_seconds: number
}

export interface ServerStatus {
  port: number
  health: Health
  stats: Stats | null
  progressText: string | null
  errors: string[]
}

export interface Task {
  id: string
  status: 'active' | 'succeeded' | 'failed' | 'unavailable'
  stage: string
  progress: number | null
  createdAt: number | null
  prompt: string
  seed: string
  model: string
  error: string | null
  files: string[]
  result: Record<string, unknown>[]
}

export interface CatalogueJob {
  slug: string
  status: string
  seed: string | null
  error: string | null
}

export interface Catalogue {
  status: string
  current: string | null
  updatedAt: string | null
  jobs: CatalogueJob[]
  blocked: CatalogueJob[]
}

export interface Snapshot {
  updatedAt: string
  catalogue: Catalogue | null
  scannedPorts: { start: number; end: number } | null
  servers: ServerStatus[]
  tasks: Task[]
  log: string | null
  errors: string[]
}
