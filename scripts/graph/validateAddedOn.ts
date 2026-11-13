import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const graphPath = 'src/data/graph.json'
const git = (args: string[]) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
type Graph = { nodes: { id: string; addedOn?: unknown }[] }

function localBase() {
  try {
    return git(['merge-base', 'HEAD', 'refs/remotes/origin/main']).trim()
  } catch {
    return 'HEAD'
  }
}

const base = process.env.GRAPH_BASE_REF || localBase()
const previous: Graph = JSON.parse(git(['show', `${base}:${graphPath}`]))
const current: Graph = JSON.parse(readFileSync(graphPath, 'utf8'))
const previousById = new Map(previous.nodes.map((node) => [node.id, node]))
const today = new Date().toISOString().slice(0, 10)
const failures: string[] = []

for (const { id, addedOn } of current.nodes) {
  const old = previousById.get(id)
  if (addedOn === undefined) {
    if (!old || old.addedOn !== undefined) failures.push(`${id}: missing addedOn`)
    continue
  }

  if (typeof addedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(addedOn)) {
    failures.push(`${id}: addedOn must use YYYY-MM-DD`)
    continue
  }

  const date = new Date(addedOn)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== addedOn) {
    failures.push(`${id}: addedOn is not a valid calendar date (${addedOn})`)
  } else if (addedOn > today) {
    failures.push(`${id}: addedOn is in the future (${addedOn})`)
  } else if (old?.addedOn !== undefined && old.addedOn !== addedOn) {
    failures.push(`${id}: preserve the existing addedOn date (${old.addedOn})`)
  }
}

if (failures.length) {
  console.error(`Catalogue addition dates failed validation against ${base}:\n${failures.join('\n')}`)
  process.exitCode = 1
}
