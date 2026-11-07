#!/usr/bin/env node
// Lint instrument artwork briefs (docs/artwork/briefs/<slug>.json).
// Usage (repository root): node .github/skills/artwork-brief/scripts/check-brief.mjs [brief.json ...]
// Without arguments every brief is checked. Exit code 1 on any FAIL.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const DIR = 'docs/artwork/briefs'
const METHODS = ['generator', 'hand']
const KEYS = ['slug', 'instrument', 'family', 'method', 'references', 'silhouette', 'features', 'iconFeatures', 'avoid', 'notes']
// Brand marks are trademarks; a model name that is also the graph name (TB-303) is allowed.
const BRANDS = /\b(roland|moog|yamaha|korg|fender|gibson|steinway|hammond suzuki|selmer|ludwig|zildjian|technics|akai|antares)\b/i
const IMITATION = /\b(in the style of|copy|trace|traced|replicate|exact replica)\b/i

if (!existsSync('src/data/graph.json')) {
  console.error('Run from the repository root.')
  process.exit(2)
}
const nodes = new Map(JSON.parse(readFileSync('src/data/graph.json', 'utf8')).nodes.map((node) => [node.id, node]))
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(DIR).filter((file) => file.endsWith('.json')).map((file) => join(DIR, file))

let failures = 0
for (const file of files) {
  const problems = []
  const fail = (message) => problems.push(`FAIL ${message}`)
  const warn = (message) => problems.push(`WARN ${message}`)
  let brief
  try {
    brief = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    fail(`not valid JSON: ${error.message}`)
  }
  if (brief !== undefined && (brief === null || typeof brief !== 'object' || Array.isArray(brief))) {
    fail('brief must be a JSON object')
    brief = undefined
  }
  if (brief !== undefined) {
    for (const key of KEYS) if (!(key in brief)) fail(`missing "${key}"`)
    for (const key of Object.keys(brief)) if (!KEYS.includes(key)) fail(`unknown key "${key}"`)
    const { slug, instrument, family, method, references = [], silhouette = '', features = [], iconFeatures = [], avoid = [], notes = '' } = brief
    const validSlug = typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    if (!validSlug) fail('slug must be a kebab-case string')
    const expectedInstrument = validSlug ? `instrument:${slug}` : 'instrument:<valid-slug>'
    if (validSlug && basename(file) !== `${slug}.json`) fail(`file name must be ${slug}.json`)
    const node = nodes.get(instrument)
    if (instrument !== expectedInstrument) fail(`instrument must be "${expectedInstrument}"`)
    else if (!node || node.type !== 'instrument') fail(`${instrument} is not an instrument in src/data/graph.json (add it with graph-edit first)`)
    else if (node.family !== family) fail(`family ${JSON.stringify(family)} ≠ graph family "${node.family}"`)
    if (!METHODS.includes(method)) fail(`method must be ${METHODS.join(' or ')}`)
    if (!Array.isArray(references) || references.length < 2) fail('at least 2 references')
    const referenceList = Array.isArray(references) ? references : []
    const urls = referenceList.map((reference) => reference?.url)
    for (const [index, reference] of referenceList.entries()) {
      if (typeof reference?.url !== 'string' || !/^https:\/\/[^\s]+$/.test(reference.url)) fail(`references[${index}].url must be https`)
      if (typeof reference?.shows !== 'string' || reference.shows.length < 15) fail(`references[${index}].shows must say what the reference shows`)
    }
    if (new Set(urls).size !== urls.length) fail('duplicate reference URLs')
    if (urls.length && urls.every((url) => typeof url === 'string' && /wikipedia\.org/.test(url))) {
      warn('every reference is Wikipedia: add a museum record, maker documentation or Wikimedia Commons photo')
    }
    if (typeof silhouette !== 'string' || silhouette.length < 30 || silhouette.length > 300) fail('silhouette must be a string of 30-300 characters')
    const list = (name, value, min, max) => {
      if (!Array.isArray(value) || value.length < min || value.length > max) fail(`${name} needs ${min}-${max} items`)
      else for (const item of value) if (typeof item !== 'string' || item.length < 8 || item.length > 160) fail(`${name} items must be 8-160 characters`)
    }
    list('features', features, 3, 8)
    list('iconFeatures', iconFeatures, 1, 3)
    list('avoid', avoid, 1, 6)
    if (typeof notes !== 'string' || notes.length < 20) fail('notes must explain the choices (≥ 20 characters)')
    const text = [silhouette, features, iconFeatures].flat().filter((item) => typeof item === 'string').join(' ')
    if (BRANDS.test(text)) fail(`asks for a brand mark (${text.match(BRANDS)[0]}): describe the hardware, never draw logos`)
    if (IMITATION.test(text)) fail('asks to copy or trace a reference: references inform anatomy only')
    if (method === 'generator' && validSlug) {
      const generator = readFileSync('scripts/artwork/generate-instrument-artwork.py', 'utf8')
      if (!new RegExp(`^ {4}'${slug}': \\(`, 'm').test(generator)) warn(`method is generator but ART has no '${slug}' master yet`)
    }
  }
  const failed = problems.some((problem) => problem.startsWith('FAIL'))
  failures += failed ? 1 : 0
  console.log(`${failed ? 'FAIL' : problems.length ? 'WARN' : 'PASS'} ${file}`)
  for (const problem of problems) console.log(`  ${problem}`)
}
process.exit(failures ? 1 : 0)
