'use client'

import { useEffect, useState } from 'react'
import type { ServerStatus, Snapshot, Task } from '../lib/types'

function ServerCard({ server }: { server: ServerStatus }) {
  const { health, stats } = server
  const ready = health.status === 'ok' && health.models_initialized
  const status = health.status !== 'ok' ? health.status : ready ? 'Ready' : 'Models loading'
  return <article className="server-card" aria-label={`ACE server on port ${server.port}`}>
    <div className="section-heading">
      <h3>Server :{server.port}</h3>
      <span className={`connection ${ready ? 'online' : ''}`}>{status}</span>
    </div>
    {!!server.errors.length && <div className="errors" role="alert">
      {server.errors.map((message, index) => <p key={index}>{message}</p>)}
    </div>}
    <div className="server-stats" aria-label={`Statistics for port ${server.port}`}>
      {[
        ['Queued', stats?.queue_size],
        ['Running', stats?.jobs.running],
        ['Succeeded', stats?.jobs.succeeded],
        ['Failed', stats?.jobs.failed],
        ['Avg. render', stats ? `${Math.round(stats.avg_job_seconds)}s` : undefined],
      ].map(([label, value]) => <div className="server-stat" key={label}>
        <span>{label}</span><strong>{value ?? '--'}</strong>
      </div>)}
    </div>
    <div className="models">
      <div><span className="muted">DiT model</span><strong>{health.loaded_model || 'Not loaded'}</strong></div>
      <div><span className="muted">Language model</span><strong>{health.loaded_lm_model || 'Disabled / not loaded'}</strong></div>
      <div><span className="muted">Queue capacity</span><strong>{stats ? `${stats.queue_size} / ${stats.queue_maxsize}` : '--'}</strong></div>
    </div>
    {server.progressText && (!stats || stats.jobs.running > 0) && <div className="server-progress">
      <span className="muted">Latest server message · not tied to a specific task</span>
      <pre>{server.progressText}</pre>
    </div>}
  </article>
}

function TaskCard({ task }: { task: Task }) {
  const [audioError, setAudioError] = useState(false)
  return <article className="task">
    <div className="task-heading">
      <span className={`badge ${task.status}`}>{task.status === 'active' ? task.stage : task.status}</span>
      <time>{task.createdAt ? new Date(task.createdAt * 1000).toLocaleString('en-US') : 'Time unavailable'}</time>
    </div>
    <h3>{task.prompt || (task.status === 'active' ? 'Render in progress' : 'Render task')}</h3>
    <p className="muted mono">{task.id}</p>
    {task.status === 'active' && <>
      <label className="progress-label">Reported progress {task.progress === null ? '(unavailable)' : `${Math.round(task.progress * 100)}%`}</label>
      <progress aria-label="Reported render progress" max={1} {...(task.progress === null ? {} : { value: task.progress })} />
    </>}
    {(task.seed || task.model) && <p className="muted">Seed {task.seed || 'not reported'} · {task.model || 'Model not reported'}</p>}
    {task.error && <p className="error">{task.error}</p>}
    {task.status === 'unavailable' && <p className="muted">ACE no longer has a result for this cached task ID.</p>}
    {task.files.map((file, index) => <div className="audio" key={file}>
      <audio controls preload="none" src={`/api/audio?file=${encodeURIComponent(file)}`}
        aria-label={`Render ${index + 1}`} onError={() => setAudioError(true)} />
      <a href={`/api/audio?file=${encodeURIComponent(file)}`} download>Download {index + 1}</a>
    </div>)}
    {audioError && <p className="error">Audio unavailable. The server may have removed the file.</p>}
    <details><summary>Result metadata</summary><pre>{JSON.stringify(task.result, null, 2)}</pre></details>
  </article>
}

export default function Page() {
  const [data, setData] = useState<Snapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [paused, setPaused] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch('/api/status', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error(`Dashboard HTTP ${response.status}`)
        const next: Snapshot = await response.json()
        if (!stopped) { setData(next); setError(null) }
      } catch (err) {
        if (!stopped) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!stopped && !paused) timer = setTimeout(load, 3000)
      }
    }
    void load()
    return () => { stopped = true; controller.abort(); clearTimeout(timer) }
  }, [paused, refresh])

  const tasks = data?.tasks.filter(task =>
    (filter === 'all' || task.status === filter) &&
    `${task.id} ${task.prompt} ${task.seed} ${task.model}`.toLowerCase().includes(search.toLowerCase()),
  ) || []
  const connected = data?.servers.length ?? 0

  return <main>
    <header>
      <div><p className="eyebrow">LOCAL RENDERING / READ ONLY</p><h1>ACE Monitor</h1></div>
      <div className="toolbar">
        <span className={`connection ${connected ? 'online' : ''}`}>{!data ? 'Connecting' : connected
          ? `${connected} server${connected === 1 ? '' : 's'} online` : 'Offline'}</span>
        <button onClick={() => setPaused(!paused)}>{paused ? 'Resume live' : 'Pause live'}</button>
        <button onClick={() => setRefresh(value => value + 1)}>Refresh</button>
      </div>
    </header>
    <p className="muted">Updated {data ? new Date(data.updatedAt).toLocaleTimeString('en-US') : '...'} · {paused ? 'Live refresh paused' : 'Refreshes every 3 seconds'}{error ? ' · Last snapshot is stale' : ''}</p>
    {error && <p className="error" role="alert">{error}</p>}
    {!!data?.errors.length && <div className="errors" role="alert">{data.errors.map((message, i) => <p key={i}>{message}</p>)}</div>}
    <section className="servers-section">
      <div className="section-heading">
        <h2>Servers</h2>
        {data?.scannedPorts && <span className="muted">Scanning ports {data.scannedPorts.start}–{data.scannedPorts.end}</span>}
      </div>
      <div className="servers">{data?.servers.map(server => <ServerCard key={server.port} server={server} />)}</div>
      {data && !connected && <p className="empty">No ACE servers detected. Check the discovery errors above.</p>}
    </section>
    <section>
      <div className="section-heading"><h2>Renderings</h2><span className="muted">{tasks.length} shown</span></div>
      <div className="filters">
        <label>Search<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Prompt, task ID, seed or model" /></label>
        <label>Status<select value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="all">All tasks</option><option value="active">Queued / running</option>
          <option value="succeeded">Succeeded</option><option value="failed">Failed</option>
          <option value="unavailable">Unavailable</option>
        </select></label>
      </div>
      <p className="muted">Latest 100 unexpired task IDs from the mounted cache, deduplicated across servers. ACE does not identify the originating port; queued jobs may not be cached yet.</p>
      <div className="tasks">{tasks.map(task => <TaskCard key={task.id} task={task} />)}</div>
      {data && !tasks.length && <p className="empty">No matching tasks. Check the cache error above if task discovery is unavailable.</p>}
    </section>
    <section className="log-section">
      <h2>Configured server log</h2><p className="muted">Last 150 lines from one configured log file; it may not include every server. HTTP polling noise omitted.</p>
      <pre className="log" tabIndex={0}>{data?.log ?? 'Log unavailable'}</pre>
    </section>
  </main>
}
