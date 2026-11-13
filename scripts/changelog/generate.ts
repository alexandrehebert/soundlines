import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { pathToFileURL } from 'node:url'
import { REPOSITORY_URL } from '../../src/projectLinks.ts'

const generated = new Set(['CHANGELOG.md', 'docs/changelog.json'])
const graphPath = 'src/data/graph.json'
const categories = ['graph', 'previews', 'loops', 'artwork', 'app', 'site', 'workflow', 'docs', 'other'] as const
type Category = (typeof categories)[number]
type Entity = { id: string; name?: string; from?: string; to?: string }
type Graph = { nodes: Entity[]; edges: Entity[] }
type Delta = { added: string[]; updated: string[]; removed: string[] }
type FileChange = { status: string; path: string }
type AssetCategory = 'graph' | 'previews' | 'loops' | 'artwork'
export const changeStatuses = ['added', 'updated', 'removed'] as const
type ChangeStatus = (typeof changeStatuses)[number]
type NamedEntity = { id: string; name: string; status: ChangeStatus }
type AffectedEntities = { category: AssetCategory; items: NamedEntity[] }[]
export type Entry = {
  commit: string
  parent: string | null
  date: string
  subject: string
  merge: boolean
  groups: { category: Category; files: FileChange[] }[]
  entities: AffectedEntities
  graph?: { nodes: Delta; edges: Delta }
}

export function categoryFor(path: string): Category {
  if (/^(src\/(data|graph)\/|docs\/graph\/|docs\/(GRAPH|DATA)\.md$|scripts\/graph\/)/.test(path)) return 'graph'
  if (/(^|[/.-])previews?(\/|[.-])|render-ace-previews/.test(path) || path.startsWith('public/audio/')) return 'previews'
  if (/(^|\/)loops?(\/|[.-])/.test(path)) return 'loops'
  if (/^public\/instrument-|(^|\/)artwork(\/|[.-])|instrument-artwork/.test(path)) return 'artwork'
  if (/^site\//.test(path)) return 'site'
  if (/^\.github\/|^scripts\/|^compose\.|^Dockerfile|^AGENTS\.md$/.test(path)) return 'workflow'
  if (/^docs\/|\.md$/.test(path)) return 'docs'
  if (/^(src|public|app)\/|\.(json|[cm]?ts)$/.test(path)) return 'app'
  return 'other'
}

function delta(before: Entity[], after: Entity[]): Delta {
  const previous = new Map(before.map((entity) => [entity.id, entity]))
  const current = new Map(after.map((entity) => [entity.id, entity]))
  return {
    added: [...current.keys()].filter((id) => !previous.has(id)).sort(),
    updated: [...current.keys()].filter((id) => previous.has(id) && !isDeepStrictEqual(previous.get(id), current.get(id))).sort(),
    removed: [...previous.keys()].filter((id) => !current.has(id)).sort(),
  }
}

const humanize = (id: string) => id.replace(/^[^:]+:/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function affectedEntities(
  files: FileChange[], before: Graph, after: Graph, graph: Entry['graph'],
  readChange: (file: FileChange) => [Record<string, unknown>, Record<string, unknown>],
): AffectedEntities {
  const nodes = new Map([...before.nodes, ...after.nodes].map((node) => [node.id, node]))
  const previousEdges = new Map(before.edges.map((edge) => [edge.id, edge]))
  const currentEdges = new Map(after.edges.map((edge) => [edge.id, edge]))
  const groups = new Map<AssetCategory, Map<string, Set<ChangeStatus>>>()
  // A node's own graph delta wins over statuses inferred from its evidence, overlays or relationships.
  const nodeStatus = new Map<string, ChangeStatus>()
  const add = (category: AssetCategory, id: string, status: ChangeStatus = 'updated') => {
    let group = groups.get(category)
    if (!group) {
      group = new Map()
      groups.set(category, group)
    }
    const statuses = group.get(id) ?? new Set()
    statuses.add(status)
    group.set(id, statuses)
  }
  const fileStatus = ({ status }: FileChange): ChangeStatus => status === 'A' ? 'added' : status === 'D' ? 'removed' : 'updated'
  const addEdge = (id: string) => {
    for (const edge of [previousEdges.get(id), currentEdges.get(id)]) {
      if (edge?.from) add('graph', edge.from)
      if (edge?.to) add('graph', edge.to)
    }
  }
  if (graph) {
    for (const action of ['added', 'updated', 'removed'] as const) {
      for (const id of graph.nodes[action]) {
        nodeStatus.set(id, action)
        add('graph', id, action)
      }
      for (const id of graph.edges[action]) addEdge(id)
    }
  }
  for (const file of files) {
    const node = file.path.match(/^docs\/graph\/evidence\/nodes\/([^/]+)\/(.+)\.md$/)
    const edge = file.path.match(/^docs\/graph\/evidence\/edges\/(.+)\.md$/)
    if (node) add('graph', `${node[1]}:${node[2]}`)
    if (edge) addEdge(edge[1].replace('__', ':'))
    if (/^src\/data\/graph\.[^.]+\.json$/.test(file.path)) {
      const [old, current] = readChange(file)
      for (const kind of ['nodes', 'edges'] as const) {
        const previous = (old[kind] ?? {}) as Record<string, unknown>
        const next = (current[kind] ?? {}) as Record<string, unknown>
        for (const id of new Set([...Object.keys(previous), ...Object.keys(next)])) {
          if (!isDeepStrictEqual(previous[id], next[id])) {
            if (kind === 'nodes') add('graph', id)
            else addEdge(id)
          }
        }
      }
    }
    if (/^(docs|scripts)\/previews\/briefs\/.+\.json$/.test(file.path)) {
      const [old, current] = readChange(file)
      for (const slug of new Set([...Object.keys(old), ...Object.keys(current)])) {
        if (!isDeepStrictEqual(old[slug], current[slug])) {
          add('previews', `genre:${slug}`, !(slug in old) ? 'added' : !(slug in current) ? 'removed' : 'updated')
        }
      }
    }
    const asset = file.path.match(/^public\/(genre-previews|audio|loops|instrument-[^/]+)\/(.+)\.[^.]+$/)
    const brief = file.path.match(/^(?:docs|scripts)\/(loops|artwork)\/briefs\/(.+?)(?:\.selection)?\.json$/)
    const matched = asset ?? brief
    if (matched) {
      const [, kind, slug] = matched
      const category = kind.startsWith('instrument-') || kind === 'artwork' ? 'artwork' : kind === 'loops' ? 'loops' : 'previews'
      const prefix = category === 'artwork' ? 'instrument' : 'genre'
      const id = `${prefix}:${slug}`
      const landingId = category === 'loops' && slug === 'turntable-hip-hop' ? 'genre:hip-hop' : id
      add(category, nodes.has(id) ? id : landingId, fileStatus(file))
    }
  }
  return (['graph', 'previews', 'loops', 'artwork'] as const).flatMap((category) => {
    const group = groups.get(category)
    if (!group) return []
    const items = [...group].map(([id, statuses]): NamedEntity => ({
      id,
      name: nodes.get(id)?.name || humanize(id),
      // Mixed signals, such as new audio for an existing brief, read as an update.
      status: (category === 'graph' && nodeStatus.get(id)) || (statuses.size === 1 ? [...statuses][0] : 'updated'),
    }))
    return [{ category, items: items.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) }]
  })
}

export function buildChangelog(cwd = process.cwd()) {
  const git = (...args: string[]) => execFileSync('git', args, {
    cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  })
  if (git('rev-parse', '--is-shallow-repository').trim() !== 'false') {
    throw new Error('Changelog requires complete history. Run git fetch --unshallow first.')
  }
  const root = git('rev-parse', '--show-toplevel').trim()
  const entries: Entry[] = []
  const commits = git('rev-list', '--topo-order', 'HEAD').trim().split('\n')
  const graphAt = (commit: string | null): Graph => commit && git('ls-tree', '--name-only', commit, '--', graphPath).trim()
    ? JSON.parse(git('show', `${commit}:${graphPath}`)) as Graph
    : { nodes: [], edges: [] }
  for (const commit of commits) {
    const [date, subject, parents] = git('show', '-s', '--no-show-signature', '--no-notes', '--format=%cI%x00%s%x00%P', commit).trimEnd().split('\0')
    const parentList = parents ? parents.split(' ').filter(Boolean) : []
    const parent = parentList[0] ?? null
    const against = (base: string | null) => {
      // No rename detection: moves are explicitly represented as a deletion and an addition.
      const parts = git('diff-tree', '--root', '--no-commit-id', '-r', '--no-renames', '--name-status', '-z',
        ...(base ? [base, commit] : [commit])).split('\0')
      const files: FileChange[] = []
      for (let i = 0; i < parts.length - 1; i += 2) {
        if (!generated.has(parts[i + 1])) files.push({ status: parts[i], path: parts[i + 1] })
      }
      return files
    }
    // A merge only records what it introduced itself: files (and then entities) changed against every parent.
    // Branch commits are listed separately, so comparing with the first parent alone would repeat them.
    const perParent = (parentList.length ? parentList : [null]).map((base) => ({ base, files: against(base) }))
    const own = perParent.slice(1).reduce((paths, { files }) => new Set(files.map(({ path }) => path).filter((path) => paths.has(path))),
      new Set(perParent[0].files.map(({ path }) => path)))
    const files = perParent[0].files.filter(({ path }) => own.has(path))
    files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
    if (!files.length) continue
    const entry: Entry = {
      commit, parent, date, subject, merge: parentList.length > 1, entities: [],
      groups: categories.flatMap((category) => {
        const matching = files.filter(({ path }) => categoryFor(path) === category)
        return matching.length ? [{ category, files: matching }] : []
      }),
    }
    if (files.some(({ path }) => /^(src\/data\/graph(?:\.[^.]+)?\.json$|docs\/graph\/evidence\/(?:nodes|edges)\/|public\/(?:genre-previews|audio|loops|instrument-)|(?:docs|scripts)\/(?:previews|loops|artwork)\/briefs\/)/.test(path))) {
      const after = graphAt(commit)
      const changes = perParent.map(({ base, files: baseFiles }) => {
        const scoped = baseFiles.filter(({ path }) => own.has(path))
        const before = graphAt(base)
        const graph = scoped.some(({ path }) => path === graphPath)
          ? { nodes: delta(before.nodes, after.nodes), edges: delta(before.edges, after.edges) }
          : undefined
        const entities = affectedEntities(scoped, before, after, graph, (file) => [
          !base || file.status === 'A' ? {} : JSON.parse(git('show', `${base}:${file.path}`)) as Record<string, unknown>,
          file.status === 'D' ? {} : JSON.parse(git('show', `${commit}:${file.path}`)) as Record<string, unknown>,
        ])
        return { graph, entities }
      })
      const [first, ...others] = changes
      const changedIds = (graph: Entry['graph'], kind: 'nodes' | 'edges') =>
        new Set(graph ? [...graph[kind].added, ...graph[kind].updated, ...graph[kind].removed] : [])
      const keep = (kind: 'nodes' | 'edges', id: string) => others.every(({ graph }) => changedIds(graph, kind).has(id))
      if (first.graph) {
        entry.graph = {
          nodes: { added: first.graph.nodes.added.filter((id) => keep('nodes', id)), updated: first.graph.nodes.updated.filter((id) => keep('nodes', id)), removed: first.graph.nodes.removed.filter((id) => keep('nodes', id)) },
          edges: { added: first.graph.edges.added.filter((id) => keep('edges', id)), updated: first.graph.edges.updated.filter((id) => keep('edges', id)), removed: first.graph.edges.removed.filter((id) => keep('edges', id)) },
        }
      }
      entry.entities = first.entities.flatMap(({ category, items }) => {
        const kept = items.filter(({ id }) => others.every(({ entities }) =>
          entities.some((group) => group.category === category && group.items.some((item) => item.id === id))))
        return kept.length ? [{ category, items: kept }] : []
      })
    }
    entries.push(entry)
  }
  const data = { version: 4, entries }
  return { root, data, json: `${JSON.stringify(data, null, 2)}\n`, markdown: renderMarkdown(entries) }
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/([\\`*_[\]])/g, '\\$1')
function renderMarkdown(entries: Entry[]) {
  const lines = [
    '# Changelog', '',
    'Generated from committed Git history by `npm run changelog`. Do not edit by hand.', '',
    'Commits with file changes reachable from HEAD are listed in Git topological order (newest first).',
    'Each commit is compared with its parent. Merge commits only list files changed against every parent (such as conflict resolutions);',
    'clean merges are omitted because their branch commits are already listed.',
    'Moves appear as a deletion and an addition. Generated-changelog-only commits and uncommitted changes are excluded.',
    'Dates are commit timestamps. Commit messages and file paths are historical records, not editorial release notes.', '',
    'Graph summaries count added, updated and removed entities; follow the commit link for exact field and binary changes.',
    'The [full JSON audit](./docs/changelog.json) records every changed file, its Git status and all changed graph entity IDs.',
    'Preview/loop entries document committed assets and production records, not untracked raw renders or listening approval.', '',
  ]
  for (const entry of entries) {
    lines.push(`## ${entry.date.slice(0, 10)} — ${escape(entry.subject)}`, '',
      `[${entry.commit.slice(0, 8)}](${REPOSITORY_URL}/commit/${entry.commit})${entry.merge ? ' (merge)' : ''}`, '')
    if (entry.graph) {
      for (const kind of ['nodes', 'edges'] as const) {
        const change = entry.graph[kind]
        lines.push(`Graph ${kind}: +${change.added.length} / ~${change.updated.length} / -${change.removed.length}.`, '')
      }
    }
    for (const group of entry.groups) {
      lines.push(`- ${group.category}: ${group.files.length} changed file${group.files.length === 1 ? '' : 's'}`)
    }
    lines.push('')
  }
  return `${lines.join('\n')}\n`
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--check')) throw new Error('Usage: npm run changelog [-- --check]')
  const result = buildChangelog()
  for (const [path, content] of [['docs/changelog.json', result.json], ['CHANGELOG.md', result.markdown]]) {
    const file = resolve(result.root, path)
    if (args.includes('--check')) {
      if (readFileSync(file, 'utf8') !== content) throw new Error(`${path} is stale. Run npm run changelog.`)
    } else {
      writeFileSync(file, content)
    }
  }
  console.log(`Changelog ${args.includes('--check') ? 'verified' : 'generated'}: ${result.data.entries.length} commits.`)
}
