// Project figures quoted by the companion, computed from the repository at build time so the published figures stay current.
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (path: string) => readFileSync(`${root}${path}`, 'utf8')
const files = (path: string, extension: string) =>
  readdirSync(`${root}${path}`, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith(extension)).length

type Entry = { type?: string; sources?: string[] }

export function siteStats() {
  const graph: { nodes: Entry[]; edges: Entry[] } = JSON.parse(read('src/data/graph.json'))
  const nodeCount = (type: string) => graph.nodes.filter((node) => node.type === type).length
  const fetches = read('docs/graph/evidence/fetch-status.jsonl')
    .split('\n')
    .filter(Boolean)
    .map((line) => (JSON.parse(line) as { status: string }).status)
  return {
    entries: graph.nodes.length,
    connections: graph.edges.length,
    sources: new Set([...graph.nodes, ...graph.edges].flatMap((entry) => entry.sources ?? [])).size,
    genres: nodeCount('genre'),
    artists: nodeCount('artist'),
    instruments: nodeCount('instrument'),
    evidenceNotes: files('docs/graph/evidence/nodes', '.md') + files('docs/graph/evidence/edges', '.md'),
    fetchAttempts: fetches.length,
    fetchBlocked: fetches.filter((status) => status === 'access-failed').length,
    fetchBrowser: fetches.filter((status) => status === 'opened-in-browser').length,
    artworkFiles: ['icons', 'banners', 'avatars', 'header-backgrounds']
      .map((variant) => files(`public/instrument-${variant}`, '.svg'))
      .reduce((sum, count) => sum + count, 0),
    loops: files('public/loops', '.wav'),
    agents: readdirSync(`${root}.github/agents`).filter((file) => file.endsWith('.agent.md')).length,
    skills: files('.github/skills', 'SKILL.md'),
  }
}

export type SiteStats = ReturnType<typeof siteStats>
