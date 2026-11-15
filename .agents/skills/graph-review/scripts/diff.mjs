#!/usr/bin/env node
// Semantic diff of the canonical graph (and every graph.<locale>.json overlay) between a git ref and the working tree.
//
//   node .agents/skills/graph-review/scripts/diff.mjs [ref]   (default ref: HEAD; e.g. origin/main)
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalogueDataPath, cataloguePathAt, graphPath } from '../../../../scripts/graph/cataloguePaths.mjs'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const ref = process.argv[2] ?? 'HEAD'

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })

function load(file) {
  const current = JSON.parse(readFileSync(join(ROOT, catalogueDataPath, file), 'utf8'))
  const path = cataloguePathAt(git, ref, file)
  return { base: path ? JSON.parse(git('show', `${ref}:${path}`)) : null, current }
}

function compare(label, baseItems, currentItems) {
  const before = new Map(baseItems.map((item) => [item.id, item]))
  const after = new Map(currentItems.map((item) => [item.id, item]))
  const added = [...after.keys()].filter((id) => !before.has(id))
  const removed = [...before.keys()].filter((id) => !after.has(id))
  const changed = [...after.keys()].filter((id) => before.has(id) && JSON.stringify(before.get(id)) !== JSON.stringify(after.get(id)))
  console.log(`\n## ${label}: +${added.length} -${removed.length} ~${changed.length}`)
  for (const id of added) {
    const item = after.get(id)
    console.log(`+ ${id}${item.from ? `  [${item.type}] ${item.from} → ${item.to}` : item.name ? `  ${item.name}` : ''}`)
  }
  for (const id of removed) console.log(`- ${id}`)
  for (const id of changed) {
    const a = before.get(id)
    const b = after.get(id)
    const fields = [...new Set([...Object.keys(a), ...Object.keys(b)])]
      .filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
    console.log(`~ ${id}`)
    for (const key of fields) {
      console.log(`    ${key}: ${JSON.stringify(a[key]) ?? '∅'}\n      → ${JSON.stringify(b[key]) ?? '∅'}`)
    }
  }
}

const graph = load('graph.json')
if (!graph.base) {
  console.error(`Cannot read ${graphPath} at ${ref}`)
  process.exit(1)
}
console.log(`# graph.json: ${ref} → working tree`)
compare('Nodes', graph.base.nodes, graph.current.nodes)
compare('Edges', graph.base.edges, graph.current.edges)

const entries = (overlay) => [
  ...Object.entries(overlay?.nodes ?? {}).map(([id, value]) => ({ id, ...value })),
  ...Object.entries(overlay?.edges ?? {}).map(([id, value]) => ({ id, ...value })),
]
for (const file of readdirSync(join(ROOT, catalogueDataPath))) {
  const locale = /^graph\.([a-z-]+)\.json$/i.exec(file)?.[1]
  if (!locale) continue
  const overlay = load(file)
  compare(`Overlay ${locale}${overlay.base ? '' : ' (new file)'}`, entries(overlay.base), entries(overlay.current))
}
