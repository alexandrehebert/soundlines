import { readFileSync } from 'node:fs'
import { changeStatuses, type Entry } from '../../scripts/changelog/generate.ts'

/**
 * Only summaries reach the client bundle; the full audit is a separate downloadable asset.
 * Each entity is packed as `nameIndex * 3 + statusIndex` against a shared name dictionary.
 */
export function changelogSummary() {
  const { entries } = JSON.parse(readFileSync(new URL('../../docs/changelog.json', import.meta.url), 'utf8')) as { entries: Entry[] }
  const names: { id: string; name: string }[] = []
  const indexes = new Map<string, number>()
  const summary = entries.map(({ commit, date, subject, merge, groups, graph, entities }) => ({
    commit, date, subject, merge,
    entities: entities.map(({ category, items }) => ({
      category,
      items: items.map(({ id, name, status }) => {
        const key = `${id}\0${name}`
        let index = indexes.get(key)
        if (index === undefined) {
          index = names.length
          names.push({ id, name })
          indexes.set(key, index)
        }
        return index * changeStatuses.length + changeStatuses.indexOf(status)
      }),
    })),
    groups: groups.map(({ category, files }) => ({ category, count: files.length })),
    graph: graph && {
      nodes: { added: graph.nodes.added.length, updated: graph.nodes.updated.length, removed: graph.nodes.removed.length },
      edges: { added: graph.edges.added.length, updated: graph.edges.updated.length, removed: graph.edges.removed.length },
    },
  }))
  return { names, entries: summary }
}

export type ChangelogSummary = ReturnType<typeof changelogSummary>
