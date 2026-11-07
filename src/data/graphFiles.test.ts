import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { MusicGraph } from '../graph/types.ts'

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

  it('documents the current graph size in docs/GRAPH.md', () => {
    const graph = JSON.parse(readFileSync(join(DATA_DIR, 'graph.json'), 'utf8')) as MusicGraph
    const guide = readFileSync(join(ROOT, 'docs/GRAPH.md'), 'utf8')
    const line = /^Current size: (\d+) nodes \(([^)]*)\) and (\d+) edges/m.exec(guide)
    expect(line, 'docs/GRAPH.md §1 must contain a "Current size: N nodes (…) and M edges" line').not.toBeNull()
    const [, nodeTotal, breakdown, edgeTotal] = line!

    const counts = new Map<string, number>()
    for (const node of graph.nodes) counts.set(node.type, (counts.get(node.type) ?? 0) + 1)
    const documented = new Map(breakdown.split(', ').map((part) => {
      const [count, label] = part.split(' ')
      return [label.replace(/s$/, ''), Number(count)] as const
    }))

    expect({ nodes: Number(nodeTotal), edges: Number(edgeTotal), byType: Object.fromEntries(documented) })
      .toEqual({ nodes: graph.nodes.length, edges: graph.edges.length, byType: Object.fromEntries(counts) })
  })
})
