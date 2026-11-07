#!/usr/bin/env node
// Query src/data/graph.json without loading the 2 MB file into an agent context.
//
//   node .github/skills/graph-edit/scripts/lookup.mjs <id>              node or edge, its edges, evidence, locale overlays
//   node .github/skills/graph-edit/scripts/lookup.mjs --search <text>   nodes whose id or name contains text
//   node .github/skills/graph-edit/scripts/lookup.mjs --pending [type]  live entries whose evidence is missing or pending
//   node .github/skills/graph-edit/scripts/lookup.mjs --stats           node and edge counts by type
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const graph = JSON.parse(readFileSync(join(ROOT, 'src/data/graph.json'), 'utf8'))
const overlays = readdirSync(join(ROOT, 'src/data'))
  .flatMap((file) => {
    const locale = /^graph\.([a-z-]+)\.json$/i.exec(file)?.[1]
    return locale ? [[locale, JSON.parse(readFileSync(join(ROOT, 'src/data', file), 'utf8'))]] : []
  })
const coverage = new Map(
  readFileSync(join(ROOT, 'docs/evidence/audits/graph-edge-coverage.csv'), 'utf8')
    .trim().split(/\r?\n/).slice(1).map((line) => line.split(','))
    .map(([id, , , note]) => [id, note]),
)

const nodes = new Map(graph.nodes.map((node) => [node.id, node]))
const edges = new Map(graph.edges.map((edge) => [edge.id, edge]))

function evidencePath(entry) {
  if (nodes.has(entry.id)) return `docs/evidence/nodes/${entry.type}/${entry.id.slice(entry.type.length + 1)}.md`
  return coverage.get(entry.id) ?? `docs/evidence/edges/${entry.id.replace(':', '__')}.md`
}

function evidenceStatus(entry) {
  const path = evidencePath(entry)
  if (!existsSync(join(ROOT, path))) return { path, status: 'missing' }
  const text = readFileSync(join(ROOT, path), 'utf8')
  const status = text.includes('Pending source review')
    ? 'pending'
    : /^\*\*Reviewed\*\*|^\*\*Review status\*\*/m.test(text) ? 'reviewed' : 'unstamped'
  return { path, status }
}

function edgeLine(edge) {
  const sources = edge.sources?.length ?? 0
  return `  ${edge.id}  [${edge.type}]  ${edge.from} → ${edge.to}  confidence=${edge.confidence ?? '-'} sources=${sources}`
}

function countByType(items) {
  const counts = {}
  for (const item of items) counts[item.type] = (counts[item.type] ?? 0) + 1
  return Object.entries(counts).map(([type, count]) => `${type}=${count}`).join(' ')
}

const [command, arg] = process.argv.slice(2)

if (!command) {
  console.error('Usage: lookup.mjs <id> | --search <text> | --pending [type] | --stats')
  process.exit(1)
} else if (command === '--search') {
  const needle = (arg ?? '').toLowerCase()
  for (const node of graph.nodes) {
    if (node.id.includes(needle) || node.name.toLowerCase().includes(needle)) {
      console.log(`${node.id}  ${node.name}  ${node.period ? `${node.period.start}–${node.period.end ?? ''}` : 'undated'}`)
    }
  }
} else if (command === '--pending') {
  for (const entry of [...graph.nodes, ...graph.edges]) {
    if (arg && entry.type !== arg) continue
    const { path, status } = evidenceStatus(entry)
    if (status !== 'reviewed') console.log(`${status}\t${entry.id}\t${path}`)
  }
} else if (command === '--stats') {
  console.log(`nodes ${graph.nodes.length}: ${countByType(graph.nodes)}`)
  console.log(`edges ${graph.edges.length}: ${countByType(graph.edges)}`)
} else {
  const entry = nodes.get(command) ?? edges.get(command)
  if (!entry) {
    console.error(`No node or edge with id ${command}. Try --search.`)
    process.exit(1)
  }
  console.log(JSON.stringify(entry, null, 2))
  const evidence = evidenceStatus(entry)
  console.log(`\nEvidence: ${evidence.path} (${evidence.status})`)
  for (const [locale, translation] of overlays) {
    const overlay = nodes.has(entry.id) ? translation.nodes[entry.id] : translation.edges[entry.id]
    console.log(`Overlay ${locale}: ${overlay ? Object.keys(overlay).join(', ') : 'none'}`)
  }
  if (nodes.has(entry.id)) {
    const touching = graph.edges.filter((edge) => edge.from === entry.id || edge.to === entry.id)
    console.log(`\nEdges (${touching.length}):`)
    for (const edge of touching) console.log(edgeLine(edge))
  }
}
