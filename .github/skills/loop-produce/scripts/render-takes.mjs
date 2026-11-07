// Phase 2: render one take per seed through the local ACE-Step API, resumably.
//   node render-takes.mjs <brief.json> <stage-dir> [final|draft] [seed ...]
// final: XL SFT DiT, 80 steps, guidance 7 + ADG, from the 4B LM codes in <stage>/codes (plan-codes.py).
// draft: turbo DiT, 8 steps, in-server 1.7B LM planning. For brief iteration only; never ship a draft.
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { planningHash, readBrief } from './brief.mjs'

const [briefPath, stage, profile = 'final', ...only] = process.argv.slice(2)
if (!briefPath || !stage || !['final', 'draft'].includes(profile)) {
  throw new Error('Usage: node render-takes.mjs <brief.json> <stage-dir> [final|draft] [seed ...]')
}
const brief = readBrief(briefPath)
const seeds = only.length ? only.map(Number) : brief.seeds
const endpoint = `http://127.0.0.1:${process.env.ACESTEP_API_PORT ?? 8020}`
const model = profile === 'final' ? 'acestep-v15-xl-sft' : 'acestep-v15-turbo'
const takes = join(stage, profile === 'final' ? 'takes' : 'drafts')
await mkdir(takes, { recursive: true })

async function call(path, payload) {
  const response = await fetch(endpoint + path, {
    method: payload ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: payload && JSON.stringify(payload),
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

for (const seed of seeds) {
  const wav = join(takes, `${seed}.wav`)
  if (existsSync(wav)) {
    console.log(`seed ${seed}: already rendered`)
    continue
  }
  const request = profile === 'final'
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
        audio_code_string: readFileSync(join(stage, 'codes', `${seed}.codes.txt`), 'utf8').trim(),
      }
    : { ...common, seed, model, inference_steps: 8, thinking: true }
  await writeFile(join(takes, `${seed}.request.json`), JSON.stringify(request, null, 2) + '\n')
  const { task_id: id } = await call('/release_task', request)
  console.log(`seed ${seed}: queued ${id}`)
  // A final take takes ~6-8 min (≈5 s/step on M-series MPS + ~10 s VAE decode).
  const deadline = Date.now() + (profile === 'final' ? 30 : 6) * 60_000
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
