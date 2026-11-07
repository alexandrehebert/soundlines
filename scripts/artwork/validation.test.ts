import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repository = process.cwd()
const briefValidator = resolve('.github/skills/artwork-brief/scripts/check-brief.mjs')
const artworkValidator = resolve('.github/skills/artwork-validate/scripts/check-artwork.mjs')
const validBrief = JSON.parse(readFileSync('docs/artwork/briefs/charango.json', 'utf8'))
let fixture: string

function run(script: string, args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { cwd: fixture, encoding: 'utf8' })
}

beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), 'soundlines-artwork-validation-'))
  for (const file of ['src/data/graph.json', 'src/theme.ts', 'scripts/artwork/generate-instrument-artwork.py']) {
    const target = join(fixture, file)
    mkdirSync(resolve(target, '..'), { recursive: true })
    cpSync(resolve(repository, file), target)
  }
  for (const kind of ['icons', 'banners', 'avatars', 'header-backgrounds']) {
    const folder = join(fixture, 'public', `instrument-${kind}`)
    mkdirSync(folder, { recursive: true })
    cpSync(resolve(repository, 'public', `instrument-${kind}`, 'guitar.svg'), join(folder, 'guitar.svg'))
  }
})

afterAll(() => {
  if (fixture) rmSync(fixture, { recursive: true, force: true })
})

describe('artwork brief validation', () => {
  it('accepts the reference brief', () => {
    const file = join(fixture, 'charango.json')
    writeFileSync(file, JSON.stringify(validBrief))
    const result = run(briefValidator, [file])
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('PASS')
  })

  it.each([
    null, false, 0, 'brief', [],
    { ...validBrief, references: null },
    { ...validBrief, references: {} },
    { ...validBrief, references: [null, false] },
    { ...validBrief, silhouette: null },
    { ...validBrief, silhouette: {} },
    { ...validBrief, features: null },
    { ...validBrief, iconFeatures: {} },
    { ...validBrief, avoid: false },
    { ...validBrief, notes: [] },
    { ...validBrief, slug: {} },
    { ...validBrief, slug: { toString: null } },
    { ...validBrief, family: { toString: null } },
    { ...validBrief, references: [{ url: { toString: null } }, null] },
  ])('reports malformed input %# without crashing', (brief) => {
    const file = join(fixture, 'charango.json')
    writeFileSync(file, JSON.stringify(brief))
    const result = run(briefValidator, [file])
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('FAIL')
    expect(result.stderr).toBe('')
  })

  it('continues checking later briefs after invalid input', () => {
    const badFile = join(fixture, 'invalid.json')
    const validFile = join(fixture, 'charango.json')
    writeFileSync(badFile, 'null')
    writeFileSync(validFile, JSON.stringify(validBrief))
    const result = run(briefValidator, [badFile, validFile])
    expect(result.status).toBe(1)
    expect(result.stdout).toContain(`PASS ${validFile}`)
    expect(result.stderr).toBe('')
  })
})

describe('icon overflow validation', () => {
  it.each([
    { shift: 0, clipped: false },
    { shift: 6, clipped: true },
    { shift: -6, clipped: true },
  ])('detects canvas overflow for a shift of $shift px', ({ shift, clipped }) => {
    const original = readFileSync(resolve(repository, 'public/instrument-icons/guitar.svg'), 'utf8')
    const shifted = original
      .replace('<path ', `<g transform="translate(${shift} 0)"><path `)
      .replace('</svg>', '</g></svg>')
    writeFileSync(join(fixture, 'public/instrument-icons/guitar.svg'), shifted)
    const result = run(artworkValidator, ['guitar', '--require-render', '--json'])
    expect(result.stderr).toBe('')
    const { findings } = JSON.parse(result.stdout)
    expect(findings.filter(({ check }: { check: string }) => check === 'overflow')).toHaveLength(clipped ? 1 : 0)
    expect(result.status).toBe(clipped ? 1 : 0)
  })
})
