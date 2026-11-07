// Shared brief loader for the loop scripts: the exact caption and metadata that both render phases use.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

export function readBrief(path) {
  const brief = JSON.parse(readFileSync(path, 'utf8'))
  for (const field of ['slug', 'genre', 'bpm', 'meter', 'key', 'bars', 'duration', 'seeds', 'prompt']) {
    if (brief[field] === undefined) throw new Error(`${path}: missing ${field}`)
  }
  return brief
}

// Codes planned by the LM are only valid for the caption and metadata they were planned with.
// Must match the digest computed in plan-codes.py.
export function planningHash(brief) {
  const { prompt, bpm, meter, key, duration } = brief
  return createHash('sha256').update(JSON.stringify({ prompt, bpm, meter, key, duration })).digest('hex')
}
