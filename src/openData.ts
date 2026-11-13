import { stripLocalePrefix } from './i18n/routing.ts'

export const OPEN_DATA_SECTIONS = ['dataset', 'graph', 'query', 'changelog', 'contribute'] as const
export type OpenDataSection = (typeof OPEN_DATA_SECTIONS)[number]

export function openDataPath(section: OpenDataSection) {
  return `/data/${section}`
}

export function isOpenDataPath(pathname: string | null) {
  if (!pathname) return false
  const path = stripLocalePrefix(pathname)
  return path === '/data' || path.startsWith('/data/')
}
