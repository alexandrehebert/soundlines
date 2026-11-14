import { useExplorer } from '../../ExplorerContext.ts'
import { lineageSource, lineageTarget } from '../../graph/graph.ts'
import { yearToX, type TimeScale } from '../../graph/layout.ts'
import { graphLabels } from '../../i18n/graphLabels.ts'
import { BAR_H, snapToSpans, type BarPosition } from './geometry.ts'
import { chartColor } from '../../theme.ts'

interface TimelineLinksProps {
  barById: Map<string, BarPosition>
  scale: TimeScale
  highlightedEdges: Set<string> | null
  verticalViewport?: { top: number; bottom: number } | null
}

export function TimelineLinks({ barById, scale, highlightedEdges, verticalViewport }: TimelineLinksProps) {
  const { model, locale } = useExplorer()
  const edgeLabels = graphLabels(locale).edges
  const view = model.view
  return model.index.graph.edges.map((edge) => {
    const sourceId = lineageSource(edge, model.orientation)
    const targetId = lineageTarget(edge, model.orientation)
    const parent = sourceId ? barById.get(sourceId) : undefined
    const child = targetId ? barById.get(targetId) : undefined
    if (!parent?.visibleSpans.length || !child?.visibleSpans.length) return null
    if (verticalViewport && (Math.max(parent.yCenter, child.yCenter) + BAR_H < verticalViewport.top
      || Math.min(parent.yCenter, child.yCenter) - BAR_H > verticalViewport.bottom)) return null
    const goingDown = child.yCenter >= parent.yCenter
    const linkX = view === 'artist'
      ? yearToX(scale, edge.period?.start ?? child.node.period!.start)
      : child.x1 + 1
    const endX = snapToSpans(linkX, child.visibleSpans, view === 'artist' ? 10 : 1)
    const lead = Math.min(Math.max(Math.abs(child.yCenter - parent.yCenter) * 0.35, 30), 90)
    const anchorX = snapToSpans(endX - lead, parent.visibleSpans, 10)
    const y0 = parent.yCenter + (goingDown ? BAR_H / 2 : -BAR_H / 2)
    const y1 = view === 'artist'
      ? child.yCenter + (goingDown ? -BAR_H / 2 : BAR_H / 2)
      : child.yCenter
    const lit = highlightedEdges?.has(edge.id) ?? false
    return (
      <path
        key={edge.id}
        data-timeline-link={edge.id}
        data-source={parent.node.id}
        data-target={child.node.id}
        data-relation={edge.type}
        d={`M ${anchorX} ${y0} C ${anchorX} ${(y0 + y1) / 2}, ${(anchorX + endX) / 2} ${y1}, ${endX} ${y1}`}
        fill="none"
        stroke={chartColor(model.edgeColors[edge.type] ?? '#64748b')}
        strokeWidth={lit ? 2 : 1.2}
        opacity={highlightedEdges ? lit ? 0.9 : 0.08 : 0.3}
        pointerEvents="none"
      >
        <title>{`${model.index.nodeById.get(edge.from)?.name ?? edge.from} ${edgeLabels[edge.type]} ${model.index.nodeById.get(edge.to)?.name ?? edge.to}`}</title>
      </path>
    )
  })
}
