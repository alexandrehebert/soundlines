import type { EdgeType, LaneFamily, NodeType, Period } from './graph/types.ts'

export const DEFAULT_BUBBLE_ZOOM = 0.75

export const SELECTION_BORDER = {
  borderStyle: 'solid',
  borderColor: '#f8fafc',
  borderWidth: 1.5,
} as const

export const SELECTION_OUTLINE = {
  outlineStyle: 'auto',
  outlineWidth: 5,
  // Keep the automatic outline if the browser does not support this system color.
  outlineColor: '-webkit-focus-ring-color',
  outlineOffset: 4,
} as const

export const FAMILY_COLORS: Record<LaneFamily, string> = {
  classical: '#fda4af',
  'blues-soul': '#f59e0b',
  jazz: '#60a5fa',
  'country-folk': '#d6b77a',
  rock: '#fb923c',
  'alternative-punk': '#e879f9',
  metal: '#f87171',
  pop: '#fb7185',
  'hip-hop': '#c084fc',
  reggae: '#4ade80',
  latin: '#facc15',
  african: '#2dd4bf',
  electronica: '#a78bfa',
  house: '#f472b6',
  techno: '#22d3ee',
  'breakbeat-bass': '#a3e635',
  strings: '#e2a76f',
  keyboards: '#818cf8',
  winds: '#34d399',
  brass: '#fbbf24',
  percussion: '#ef4444',
  electronic: '#38bdf8',
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

export const INSTRUMENT_EDGE_COLORS: Partial<Record<EdgeType, string>> = {
  derived_from: '#22d3ee',
  influences: '#a78bfa',
}

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  genre: '#a78bfa',
  artist: '#67e8f9',
  instrument: '#fcd34d',
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
