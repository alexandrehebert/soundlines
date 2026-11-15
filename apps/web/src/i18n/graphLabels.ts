import type { EdgeType, EventCategory, LaneFamily, NodeType } from '../graph/types.ts'
import { catalogueFor } from './catalogue.ts'
import type { Locale } from './routing.ts'

interface GraphLabels {
  nodeTypes: Record<NodeType, string>
  families: Record<LaneFamily, string>
  eventCategories: Record<EventCategory, string>
  edges: Record<EdgeType, string>
  inverseEdges: Record<EdgeType, string>
}

export function graphLabels(locale: Locale): GraphLabels {
  return catalogueFor(locale).graphLabels
}
