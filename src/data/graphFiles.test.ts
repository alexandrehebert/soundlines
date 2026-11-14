import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DATA_DIR = join(ROOT, 'src/data')
const AUDITS_DIR = join(ROOT, 'docs/graph/evidence/audits')

const jsonFiles = [
  ...readdirSync(DATA_DIR).filter((file) => /^(graph(\.[a-z-]+)?|review-status)\.json$/i.test(file))
    .map((file) => join('src/data', file)),
  ...readdirSync(AUDITS_DIR).filter((file) => file.endsWith('.json')).map((file) => join('docs/graph/evidence/audits', file)),
]

describe('graph data files', () => {
  it.each(jsonFiles)('keeps %s in canonical JSON formatting', (file) => {
    const text = readFileSync(join(ROOT, file), 'utf8')
    expect(text === `${JSON.stringify(JSON.parse(text), null, 2)}\n`, `reformat ${file} as JSON.stringify(data, null, 2) + '\\n'`)
      .toBe(true)
  })
})
