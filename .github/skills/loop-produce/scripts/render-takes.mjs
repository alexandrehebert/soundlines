// Phase 2: render one take per seed through the local ACE-Step API, resumably.
//   node render-takes.mjs <brief.json> <stage-dir> [final|draft] [seed ...]
// final: XL SFT DiT, 80 steps, guidance 7 + ADG, from the 4B LM codes in <stage>/codes (plan-codes.py).
// draft: turbo DiT, 8 steps, in-server 1.7B LM planning. For brief iteration only; never ship a draft.
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readdir, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { planningHash, readBrief } from './brief.mjs'
import { createHash } from 'node:crypto'

const [briefPath, stage, profile = 'final', ...only] = process.argv.slice(2)
if (!briefPath || !stage || !['final', 'draft', 'arrangement'].includes(profile)) {
  throw new Error('Usage: node render-takes.mjs <brief.json> <stage-dir> [final|draft|arrangement] [seed ...]')
}
const brief = readBrief(briefPath)
if (brief.arrangement && profile !== 'arrangement') {
  throw new Error('A source-conditioned brief must use the arrangement profile, not text-to-music or draft.')
}
const seeds = only.length ? only.map(Number) : brief.seeds
const endpoint = `http://127.0.0.1:${process.env.ACESTEP_API_PORT ?? 8020}`
const finalQuality = profile !== 'draft'
let sourceProvenance
const model = finalQuality ? 'acestep-v15-xl-sft' : 'acestep-v15-turbo'
const takes = join(stage, finalQuality ? 'takes' : 'drafts')
await mkdir(takes, { recursive: true })

async function call(path, payload) {
  const multipart = payload instanceof FormData
  const response = await fetch(endpoint + path, {
    method: payload ? 'POST' : 'GET',
    headers: multipart ? undefined : { 'Content-Type': 'application/json' },
    body: multipart ? payload : payload && JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${await response.text()}`)
  const body = await response.json()
  if (body.code !== 200) throw new Error(`${path}: ${JSON.stringify(body)}`)
  return body.data
}

// The server silently defaults to turbo; refuse to render on anything but the profile's model.
const health = await call('/health')
if (health.loaded_model !== model) {
  throw new Error(`Server has ${health.loaded_model} loaded; run ace-server.sh start ${profile}`)
}
if (finalQuality && health.llm_initialized) throw new Error('Final-quality renders need the LM disabled.')
if (profile === 'arrangement') {
  if (!brief.arrangement || !existsSync(join(stage, 'source.wav'))) {
    throw new Error('Arrangement renders require a source-conditioned brief and prepared <stage>/source.wav.')
  }
  if (!Number.isFinite(brief.arrangement.strength) || brief.arrangement.strength <= 0 || brief.arrangement.strength > 1) {
    throw new Error('Arrangement conditioning strength must be in (0, 1].')
  }
  sourceProvenance = JSON.parse(readFileSync(join(stage, 'source.json'), 'utf8'))
  const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
  if (sourceProvenance.brief_sha256 !== digest(briefPath)
      || sourceProvenance.source_sha256 !== digest(brief.arrangement.source)
      || sourceProvenance.conditioning_sha256 !== digest(join(stage, 'source.wav'))) {
    throw new Error('Arrangement source or brief changed; prepare conditioning again.')
  }
}
if (profile === 'final') {
  if (health.llm_initialized) throw new Error('Final renders need the LM disabled (ace-server.sh start final).')
  const recorded = join(stage, 'codes', 'brief.sha256')
  if (!existsSync(recorded) || readFileSync(recorded, 'utf8').trim() !== planningHash(brief)) {
    throw new Error('Codes are missing or were planned for another prompt/meta; rerun plan-codes.py.')
  }
}

const common = {
  prompt: brief.prompt,
  lyrics: '[Instrumental]',
  bpm: brief.bpm,
  time_signature: String(brief.meter),
  key_scale: brief.key,
  audio_duration: brief.duration,
  audio_format: 'wav',
  batch_size: 1,
  use_format: false,
  use_cot_caption: false,
  use_cot_language: false,
  use_random_seed: false,
}

// Extraction considers the whole takes directory, including seeds outside this invocation.
for (const file of await readdir(takes)) {
  if (!file.endsWith('.wav')) continue
  const seed = file.slice(0, -4)
  const requestPath = join(takes, `${seed}.request.json`)
  const previous = existsSync(requestPath) ? JSON.parse(readFileSync(requestPath, 'utf8')) : null
  if (!previous || previous.model !== model
      || Object.entries(common).some(([key, value]) => previous[key] !== value)
      || JSON.stringify(previous.source_provenance) !== JSON.stringify(sourceProvenance)) {
    throw new Error(`seed ${seed}: existing take does not match the current render request; use a fresh stage.`)
  }
}

for (const seed of seeds) {
  const wav = join(takes, `${seed}.wav`)
  if (existsSync(wav)) {
    console.log(`seed ${seed}: already rendered`)
    continue
  }
  const request = finalQuality
    ? {
        ...common,
        seed,
        model,
        inference_steps: 80,
        guidance_scale: 7,
        use_adg: true,
        shift: 1,
        dcw_enabled: false,
        thinking: false,
        ...(profile === 'arrangement'
          ? {
              task_type: 'cover',
              src_audio_path: resolve(stage, 'source.wav'),
              audio_cover_strength: brief.arrangement.strength,
              source_provenance: sourceProvenance,
            }
          : { audio_code_string: readFileSync(join(stage, 'codes', `${seed}.codes.txt`), 'utf8').trim() }),
      }
    : { ...common, seed, model, inference_steps: 8, thinking: true }
  await writeFile(join(takes, `${seed}.request.json`), JSON.stringify(request, null, 2) + '\n')
  const payload = { ...request }
  delete payload.source_provenance
  let submission = payload
  if (profile === 'arrangement') {
    const form = new FormData()
    delete payload.src_audio_path
    for (const [key, value] of Object.entries(payload)) form.set(key, String(value))
    form.set('src_audio', new Blob([readFileSync(join(stage, 'source.wav'))], { type: 'audio/wav' }), 'source.wav')
    submission = form
  }
  const { task_id: id } = await call('/release_task', submission)
  console.log(`seed ${seed}: queued ${id}`)
  // A final take takes ~6-8 min (≈5 s/step on M-series MPS + ~10 s VAE decode).
  const deadline = Date.now() + (finalQuality ? 30 : 6) * 60_000
  let clip
  while (!clip) {
    if (Date.now() > deadline) throw new Error(`seed ${seed}: timed out`)
    await delay(3000)
    const [task] = await call('/query_result', { task_id_list: [id] })
    if (task?.status === 2) throw new Error(`seed ${seed}: ${task.result}`)
    if (task?.status === 1) [clip] = JSON.parse(task.result)
  }
  await writeFile(join(takes, `${seed}.result.json`), JSON.stringify(clip, null, 2) + '\n')
  const url = new URL(clip.file, endpoint)
  if (url.origin !== endpoint) throw new Error('ACE-Step returned a non-local audio URL.')
  const audio = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!audio.ok) throw new Error(`seed ${seed}: audio HTTP ${audio.status}`)
  await writeFile(`${wav}.part`, Buffer.from(await audio.arrayBuffer()))
  await rename(`${wav}.part`, wav)
  console.log(`seed ${seed}: rendered ${wav}`)
}
