import english from '../i18n/locales/en.json'
import type { EdgeType, EventCategory, LaneFamily, NodeType, Prominence } from '@soundlines/catalogue/types'

export * from '@soundlines/catalogue/types'

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = english.graphLabels.eventCategories

export const PROMINENCE_LABELS: Record<Prominence, string> = english.legend.prominence

const ARTIST_PROMINENCE_LABELS: Record<Prominence, string> = english.detail.prominenceLabels.artist

const INSTRUMENT_PROMINENCE_LABELS: Record<Prominence, string> = english.detail.prominenceLabels.instrument

export function prominenceLabels(type: NodeType): Record<Prominence, string> {
  if (type === 'artist') return ARTIST_PROMINENCE_LABELS
  if (type === 'instrument') return INSTRUMENT_PROMINENCE_LABELS
  return PROMINENCE_LABELS
}

export const FAMILY_LABELS: Record<LaneFamily, string> = english.graphLabels.families

export const NODE_TYPE_LABELS: Record<NodeType, string> = english.graphLabels.nodeTypes

/** Phrasing when the focused node is the edge's `from` side. */
export const EDGE_TYPE_LABELS: Record<EdgeType, string> = english.graphLabels.edges
