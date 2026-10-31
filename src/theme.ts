import type { EdgeType, GenreFamily, NodeType, Period } from './graph/types.ts'

export const FAMILY_COLORS: Record<GenreFamily, string> = {
  roots: '#f59e0b',
  'electronic-pioneers': '#a78bfa',
  house: '#f472b6',
  techno: '#22d3ee',
  'uk-continuum': '#a3e635',
}

export const LINEAGE_EDGE_COLORS: Partial<Record<EdgeType, string>> = {
  influences: '#a78bfa',
  derived_from: '#22d3ee',
  subgenre_of: '#38bdf8',
  fusion_of: '#f472b6',
  cross_pollination: '#fbbf24',
  revival_of: '#4ade80',
}

export const ARTIST_EDGE_COLORS: Partial<Record<EdgeType, string>> = {
  influences: '#a78bfa',
  member_of: '#22d3ee',
  collaborated_with: '#fbbf24',
}

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  genre: '#a78bfa',
  artist: '#67e8f9',
  label: '#fbbf24',
  place: '#4ade80',
  track: '#f472b6',
  scene: '#fb923c',
}

export function formatPeriod(period: Period | undefined): string | null {
  if (!period) return null
  const prefix = period.precision === 'circa' ? 'c. ' : ''
  const { start, end } = period
  if (end === start) return `${prefix}${start}`
  if (end == null) return `${prefix}${start} – now`
  return `${prefix}${start} – ${end}`
}
