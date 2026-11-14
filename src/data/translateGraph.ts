import rawEnglishGraph from './graph.json'
import type { GraphEdge, GraphNode, MusicGraph } from '../graph/types.ts'
import type { Locale } from '../i18n/routing.ts'

interface NodeTranslation {
  name?: string
  description?: string
  phaseNote?: string
  estimateNote?: string
  phaseNotes?: Record<string, string>
}

interface EdgeTranslation {
  note?: string
  estimateNote?: string
}

export interface GraphTranslation {
  nodes: Record<string, NodeTranslation>
  edges: Record<string, EdgeTranslation>
}

/** Locales whose graph text comes from an overlay; English is the source graph itself. */
export type OverlayLocale = Exclude<Locale, 'en'>

export const englishGraph = rawEnglishGraph as MusicGraph
const nodeTranslationFields = new Set(['name', 'description', 'phaseNote', 'estimateNote', 'phaseNotes'])
const edgeTranslationFields = new Set(['note', 'estimateNote'])

function assertKnownTextFields(
  translations: Record<string, object>,
  allowedFields: ReadonlySet<string>,
  label: string,
) {
  for (const [id, translation] of Object.entries(translations)) {
    for (const field of Object.keys(translation)) {
      if (!allowedFields.has(field)) throw new Error(`Unknown ${label} translation field ${id}.${field}`)
    }
  }
}

function translatedText(value: string | undefined, id: string, field: string): string | undefined {
  if (value === undefined) return undefined
  if (!value.trim()) throw new Error(`Empty graph translation for ${id}.${field}`)
  return value
}

export function translateGraph(graph: MusicGraph, translations: GraphTranslation): MusicGraph {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
  const edgeById = new Map(graph.edges.map((edge) => [edge.id, edge]))
  assertKnownTextFields(translations.nodes, nodeTranslationFields, 'node')
  assertKnownTextFields(translations.edges, edgeTranslationFields, 'edge')

  for (const id of Object.keys(translations.nodes)) {
    const node = nodeById.get(id)
    if (!node) throw new Error(`Graph translation references unknown node ${id}`)
    const translation = translations.nodes[id]
    if (translation.estimateNote !== undefined && !node.period) {
      throw new Error(`Estimate-note translation references node without a period ${id}`)
    }
    for (const phaseStart of Object.keys(translation.phaseNotes ?? {})) {
      if (!node.phases?.some((phase) => String(phase.start) === phaseStart)) {
        throw new Error(`Phase-note translation references unknown phase ${id}.${phaseStart}`)
      }
    }
  }
  for (const id of Object.keys(translations.edges)) {
    const edge = edgeById.get(id)
    if (!edge) throw new Error(`Graph translation references unknown edge ${id}`)
    if (translations.edges[id].estimateNote !== undefined && !edge.period) {
      throw new Error(`Estimate-note translation references edge without a period ${id}`)
    }
  }

  const nodes = graph.nodes.map((node): GraphNode => {
    const translation = translations.nodes[node.id]
    if (!translation) return node
    const period = translation.estimateNote === undefined || !node.period
      ? node.period
      : { ...node.period, estimateNote: translatedText(translation.estimateNote, node.id, 'estimateNote') }
    const phases = translation.phaseNotes
      ? node.phases?.map((phase) => {
        const note = translatedText(translation.phaseNotes?.[String(phase.start)], node.id, `phaseNotes.${phase.start}`)
        return note === undefined ? phase : { ...phase, note }
      })
      : node.phases

    return {
      ...node,
      name: translatedText(translation.name, node.id, 'name') ?? node.name,
      description: translatedText(translation.description, node.id, 'description') ?? node.description,
      phaseNote: translatedText(translation.phaseNote, node.id, 'phaseNote') ?? node.phaseNote,
      period,
      phases,
    }
  })

  const edges = graph.edges.map((edge): GraphEdge => {
    const translation = translations.edges[edge.id]
    if (!translation) return edge
    const note = translatedText(translation.note, edge.id, 'note')
    const period = translation.estimateNote === undefined || !edge.period
      ? edge.period
      : { ...edge.period, estimateNote: translatedText(translation.estimateNote, edge.id, 'estimateNote') }
    return {
      ...edge,
      ...(note === undefined ? {} : { note }),
      ...(period === edge.period ? {} : { period }),
    }
  })

  return { ...graph, nodes, edges }
}
