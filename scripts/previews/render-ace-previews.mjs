import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const scripts = fileURLToPath(new URL('.', import.meta.url))
const graph = JSON.parse(readFileSync(join(scripts, '../../src/data/graph.json'), 'utf8'))
const genres = graph.nodes.filter((node) => node.type === 'genre').map((node) => node.id.slice(6))
const assets = process.env.ACESTEP_PREVIEW_OUTPUT ?? join(scripts, '../../public/genre-previews')
const planner = process.env.ACESTEP_PYTHON
const endpoint = 'http://127.0.0.1:8020'
const files = ['acoustic', 'electric', 'regional'].map((name) => join(scripts, 'briefs', `${name}.json`))
const approved = ['rock', 'funk']
const selected = process.argv.slice(2)
const targets = selected.length ? selected : genres
const reviewRetake = process.env.ACESTEP_PREVIEW_RETAKE === '1'
const failures = new Map()
const inFlight = new Set()
const finished = new Set()

if (!planner) throw new Error('Set ACESTEP_PYTHON to the Python executable in the local ACE-Step environment.')
if (targets.some((id) => !genres.includes(id))) throw new Error('Use genre slugs from graph.json.')
if (reviewRetake && (!selected.length || !process.env.ACESTEP_PREVIEW_OUTPUT)) {
  throw new Error('Specify the flagged genres and a staging output folder for review retakes.')
}
await mkdir(assets, { recursive: true })

function readBriefs() {
  const briefs = new Map()
  for (const file of files) {
    if (!existsSync(file)) continue
    const entries = Object.entries(JSON.parse(readFileSync(file, 'utf8')))
    for (const [id, brief] of entries) {
      if (!genres.includes(id) || briefs.has(id)) throw new Error(`Invalid or duplicate brief: ${id}`)
      if (!brief.prompt?.trim()) throw new Error(`Missing prompt for ${id}`)
      briefs.set(id, brief)
    }
  }
  return briefs
}

async function post(path, body) {
  const response = await fetch(endpoint + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  const payload = await response.json()
  if (payload.code !== 200) throw new Error(JSON.stringify(payload))
  return payload.data
}

async function render(id, brief) {
  const lyrics = brief.lyrics ?? '[Instrumental]'
  const production = reviewRetake
    ? 'Make the signature rhythmic and instrumental interplay audible throughout the middle section. Use distinct instrument attacks, realistic performance dynamics, clean separation, and a coherent stereo mix.'
    : 'Full arrangement and characteristic groove through the middle section.'
  const { task_id: taskId } = await post('/release_task', {
    prompt: `${brief.prompt} ${production} Original studio recording.`,
    lyrics,
    ...(brief.bpm ? { bpm: brief.bpm } : {}),
    ...(brief.meter ? { time_signature: brief.meter } : {}),
    audio_duration: 32,
    audio_format: 'wav',
    batch_size: 1,
    thinking: true,
    use_format: false,
    use_cot_caption: false,
    inference_steps: 8,
  })
  for (let attempt = 0; attempt < 180; attempt++) {
    await delay(2000)
    const [task] = await post('/query_result', { task_id_list: [taskId] })
    if (task?.status === 2) throw new Error(task.result)
    if (task?.status !== 1) continue
    const [clip] = JSON.parse(task.result)
    const mediaUrl = new URL(clip.file, endpoint)
    if (mediaUrl.origin !== endpoint) throw new Error('ACE-Step returned a nonlocal audio URL.')
    const response = await fetch(mediaUrl, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`Audio download returned HTTP ${response.status}.`)
    const scratch = await mkdtemp(join(tmpdir(), 'soundlines-excerpt-'))
    const temporaryAsset = join(assets, `.${id}.${process.pid}.tmp`)
    try {
      const wav = join(scratch, 'render.wav')
      const excerpt = join(scratch, 'excerpt.wav')
      await writeFile(wav, Buffer.from(await response.arrayBuffer()))
      await exec(planner, [join(scripts, 'extract-ace-preview.py'), wav, excerpt])
      const encoded = join(scratch, 'preview.m4a')
      await exec('afconvert', ['-f', 'm4af', '-d', 'aac ', '-b', '160000', excerpt, encoded])
      const { stdout } = await exec('afinfo', [encoded])
      if (!stdout.includes('estimated duration: 10.000000 sec')) throw new Error('Expected a ten-second AAC preview.')
      await writeFile(temporaryAsset, readFileSync(encoded))
      await rename(temporaryAsset, join(assets, `${id}.m4a`))
      return
    } finally {
      await rm(scratch, { recursive: true, force: true })
      await rm(temporaryAsset, { force: true })
    }
  }
  throw new Error(`Timed out waiting for ACE-Step task ${taskId}`)
}

const state = process.env.ACESTEP_PREVIEW_STATE
if (!state) throw new Error('Set ACESTEP_PREVIEW_STATE to a local progress log path.')
if (existsSync(state)) {
  for (const id of readFileSync(state, 'utf8').split('\n')) {
    if (genres.includes(id) && existsSync(join(assets, `${id}.m4a`))) finished.add(id)
  }
}
for (const id of approved) {
  if (existsSync(join(assets, `${id}.m4a`))) finished.add(id)
}

async function worker() {
  const start = Date.now()
  while (true) {
    const pending = targets.filter((id) => !finished.has(id) && !failures.has(id))
    if (!pending.length) return
    const briefs = readBriefs()
    const id = pending.find((id) => !inFlight.has(id) && briefs.has(id))
    if (!id) {
      if (pending.every((id) => inFlight.has(id))) return
      if (!inFlight.size && Date.now() - start > 15 * 60_000) throw new Error('Timed out waiting for genre briefs.')
      await delay(3000)
      continue
    }
    inFlight.add(id)
    try {
      console.log(`Rendering ${id}`)
      await render(id, briefs.get(id))
      await writeFile(state, `${id}\n`, { flag: 'a' })
      finished.add(id)
      console.log(`Ready ${id} (${finished.size}/${genres.length})`)
    } catch (error) {
      failures.set(id, error)
      console.error(`Failed ${id}: ${error.message}`)
    } finally {
      inFlight.delete(id)
    }
  }
}

// Keep one request queued as the previous clip is being downloaded and encoded.
await Promise.all([worker(), worker()])
if (failures.size) {
  console.error(`Retry these genres: ${[...failures.keys()].join(' ')}`)
  process.exitCode = 1
}
