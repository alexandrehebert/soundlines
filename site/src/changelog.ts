const summary = __CHANGELOG__
/** Must match `changeStatuses` in scripts/changelog/generate.ts, which packs entity references. */
export const statuses = ['added', 'updated', 'removed'] as const
export type ChangeStatus = (typeof statuses)[number]

export const entries = summary.entries.map((entry) => ({
  ...entry,
  entities: entry.entities.map((group) => ({
    ...group,
    items: group.items
      .map((packed) => ({ ...summary.names[Math.floor(packed / statuses.length)], status: statuses[packed % statuses.length] }))
      .sort((a, b) => statuses.indexOf(a.status) - statuses.indexOf(b.status) || a.name.localeCompare(b.name, 'en')),
  })),
}))
export const pageSize = 10
const assetCategories = new Set(['graph', 'previews', 'loops', 'artwork'])

export function entitiesFor(entry: (typeof entries)[number], category: string) {
  return assetCategories.has(category) ? entry.entities.filter((group) => group.category === category) : entry.entities
}

export function filterChanges(query: string, category = 'assets') {
  const search = query.trim().toLowerCase()
  return entries.filter((entry) => {
    const entities = entitiesFor(entry, category)
    const matchesCategory = category === 'assets' || assetCategories.has(category) ? entities.length > 0
      : !category || entry.groups.some((group) => group.category === category)
    const names = entities.flatMap(({ items }) => items.map(({ id, name }) => `${id} ${name}`)).join(' ')
    return matchesCategory && (!search || `${entry.subject} ${entry.commit} ${names}`.toLowerCase().includes(search))
  })
}

export function paginateChanges(query: string, category: string, requestedPage: number) {
  const matching = filterChanges(query, category)
  const pages = Math.max(1, Math.ceil(matching.length / pageSize))
  const page = Math.min(Math.max(1, requestedPage), pages)
  return { items: matching.slice((page - 1) * pageSize, page * pageSize), page, pages, total: matching.length }
}

export const assetPageCount = Math.max(1, Math.ceil(filterChanges('').length / pageSize))
