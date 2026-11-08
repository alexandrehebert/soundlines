#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const root = new URL('../../../../', import.meta.url)
const locale = process.argv[2]
const requestedIds = process.argv.slice(3)
const supportedLocales = ['de', 'es', 'fr', 'it']

if (!supportedLocales.includes(locale)) {
  console.error(
    `Usage: node .github/skills/graph-translate/scripts/audit.mjs <${supportedLocales.join('|')}> [node-or-edge-id ...]`,
  )
  process.exit(2)
}

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, root), 'utf8'))
}

const graph = readJson('src/data/graph.json')
const overlay = readJson(`src/data/graph.${locale}.json`)
const requestedIdSet = new Set(requestedIds)
const entries = []

function add(id, field, source, target) {
  if (typeof source === 'string' && typeof target === 'string') {
    entries.push({ id, path: `${id}.${field}`, source, target })
  }
}

for (const node of graph.nodes) {
  const translation = overlay.nodes[node.id]
  if (!translation) continue
  for (const field of ['name', 'description', 'phaseNote']) {
    add(node.id, field, node[field], translation[field])
  }
  add(node.id, 'estimateNote', node.period?.estimateNote, translation.estimateNote)
  for (const phase of node.phases ?? []) {
    add(node.id, `phaseNotes.${phase.start}`, phase.note, translation.phaseNotes?.[String(phase.start)])
  }
}

for (const edge of graph.edges) {
  const translation = overlay.edges[edge.id]
  if (!translation) continue
  add(edge.id, 'note', edge.note, translation.note)
  add(edge.id, 'estimateNote', edge.period?.estimateNote, translation.estimateNote)
}

const scopedEntries = requestedIdSet.size
  ? entries.filter(({ id }) => requestedIdSet.has(id))
  : entries
const foundIds = new Set(scopedEntries.map(({ id }) => id))
const unknownIds = requestedIds.filter((id) => !foundIds.has(id))
if (unknownIds.length) {
  console.error(`No translated graph fields found for requested ids: ${unknownIds.join(', ')}`)
  process.exit(2)
}

const issues = []
const falseFriends = {
  de: [
    { source: /\bscholarship\b/i, target: /\bStipendium\b/i, label: '`scholarship` mistranslated as `Stipendium`' },
    { source: /\bsingles out\b/i, target: /\bSingles\b/i, label: '`singles out` confused with music releases' },
    { source: /\broots reggae\b/i, target: /\b(?:Wurzeln|Wurzel)[- ]Reggae\b/i, label: '`roots reggae` translated literally' },
    { source: /\bumbrella\b/i, target: /\bRegenschirm\b/i, label: '`umbrella term` mistranslated literally' },
  ],
  es: [
    { source: /\bsingles out\b/i, target: /\bsencillos\b/i, label: '`singles out` confused with music releases' },
    { source: /\bdowntempo\b/i, target: /\btemperatura\b/i, label: '`downtempo` confused with temperature' },
    { source: /\bunderground\b/i, target: /\bmetro de Chicago\b/i, label: '`underground` confused with the Chicago metro' },
  ],
  fr: [],
  it: [
    { source: /\bdraws on\b/i, target: /\bdisegn\p{L}*/iu, label: '`draws on` translated as drawing' },
    { source: /\bsingles out\b/i, target: /\bi singoli\b/i, label: '`singles out` confused with music releases' },
    { source: /\blabel-authored\b/i, target: /\bautorizzat\p{L}*/iu, label: '`label-authored` confused with authorized' },
    { source: /\bumbrella\b/i, target: /\ba forma di\b/i, label: '`umbrella category` translated literally' },
    { source: /\bshaped by\b/i, target: /\ba forma di\b/i, label: '`shaped by` mistranslated as `a forma di`' },
  ],
}

for (const { path, source, target } of scopedEntries) {
  for (const [, token] of source.matchAll(/`([^`]+)`/g)) {
    if (!target.includes(token)) issues.push(`${path}: missing backticked token \`${token}\``)
  }

  const sourceYears = [...new Set(source.match(/\b(?:1[0-9]|20)\d{2}\b/g) ?? [])]
  for (const year of sourceYears) {
    if (!target.includes(year)) issues.push(`${path}: source year ${year} is missing from translation`)
  }

  for (const rule of falseFriends[locale]) {
    if (rule.source.test(source) && rule.target.test(target)) issues.push(`${path}: ${rule.label}`)
  }
}

if (issues.length) {
  console.error(`Translation audit failed for ${locale} (${issues.length} issue${issues.length === 1 ? '' : 's'}):`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

const scopeSummary = requestedIdSet.size ? ` for ${requestedIds.join(', ')}` : ''
console.log(
  `Translation audit passed for ${locale}${scopeSummary}: checked ${scopedEntries.length} source/translation fields.`,
)
