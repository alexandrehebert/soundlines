'use client'

import { useId, useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUpRight, Network } from 'lucide-react'
import type { NeighborEntry } from '../../graph/graph.ts'
import { neighbors } from '../../graph/graph.ts'
import type { GraphNode } from '../../graph/types.ts'
import { useExplorer } from '../../ExplorerContext.ts'
import { graphLabels } from '../../i18n/graphLabels.ts'
import { NODE_TYPE_COLORS } from '../../theme.ts'
import { GraphCardHeader } from './GraphCardHeader.tsx'
import { EntryLink } from '../HomeLinks.tsx'

const positions = [
  { x: 50, y: 50 },
  { x: 18, y: 83 },
  { x: 82, y: 83 },
  { x: 50, y: 12 },
] as const

// Outer links curve away from the center, leaving the direct links clear.
const outerBends: Record<string, [number, number]> = {
  '1:2': [0, 22],
  '1:3': [-30, -6],
  '2:3': [30, -6],
}

const examples = [
  ['genre:house', 'key:frankie-knuckles-house', 'lineage:french-house-house', 'lineage:house-disco'],
  ['genre:jazz', 'lineage:blues-jazz', 'origin:genre-jazz-new-orleans', 'lineage:bebop-jazz'],
  ['genre:detroit-techno', 'influence:kraftwerk-detroit-techno', 'influence:detroit-techno-trance', 'featured:tr-909-detroit-techno'],
  ['artist:miles-davis', 'plays:miles-davis-trumpet', 'recorded:bitches-brew-miles-davis', 'signed:miles-davis-columbia-records'],
  ['instrument:tr-909', 'plays:frankie-knuckles-tr-909', 'featured:tr-909-detroit-techno', 'lineage:tr-909-tr-808'],
] as const

function GraphNodeCard({ node }: { node: GraphNode }) {
  const { locale } = useExplorer()
  return (
    <EntryLink node={node} className="group relative flex h-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-1.5 py-3 text-center hover:border-cyan-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:px-4">
      <span className="text-xs font-medium" style={{ color: NODE_TYPE_COLORS[node.type] }}>{graphLabels(locale).nodeTypes[node.type]}</span>
      <span className="max-w-full break-words text-sm font-semibold text-slate-100 sm:text-base">{node.name}</span>
      <ArrowUpRight aria-hidden="true" size={14} className="absolute top-2 right-2 hidden text-slate-400 group-hover:text-cyan-300 sm:block" />
    </EntryLink>
  )
}

export function DatasetGraph() {
  const { index, locale } = useExplorer()
  const t = useTranslations('openData.graph')
  const arrowId = useId()
  const diagram = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string>(examples[0][0])
  const available = examples.flatMap(([id, ...edgeIds]) => {
    const node = index.nodeById.get(id)
    if (!node) return []
    const connections = neighbors(index, id)
    const branches = edgeIds.map((edgeId) => connections.find(({ edge }) => edge.id === edgeId))
      .filter((branch): branch is NeighborEntry => Boolean(branch))
    return branches.length === edgeIds.length ? [{ node, branches }] : []
  })
  const current = available.find(({ node }) => node.id === selectedId) ?? available[0]
  const labels = graphLabels(locale)
  const nodes = current ? [current.node, ...current.branches.map(({ node }) => node)] : []
  const nodeIds = new Set(nodes.map(({ id }) => id))
  const edges = nodes.flatMap(({ id }) =>
    (index.outEdges.get(id) ?? []).filter(({ to }) => nodeIds.has(to) && to !== id),
  ).map((edge) => {
    const fromIndex = nodes.findIndex(({ id }) => id === edge.from)
    const toIndex = nodes.findIndex(({ id }) => id === edge.to)
    const from = positions[fromIndex]
    const to = positions[toIndex]
    const route = `${Math.min(fromIndex, toIndex)}:${Math.max(fromIndex, toIndex)}`
    const bend = outerBends[route]
    const [bendX, bendY] = bend ?? [0, 0]
    const control = { x: (from.x + to.x) / 2 + bendX, y: (from.y + to.y) / 2 + bendY }
    // Split the quadratic at its midpoint so the direction marker follows the curve.
    const first = { x: (from.x + control.x) / 2, y: (from.y + control.y) / 2 }
    const second = { x: (control.x + to.x) / 2, y: (control.y + to.y) / 2 }
    const mid = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
    const path = bend ? `M ${from.x} ${from.y} Q ${first.x} ${first.y} ${mid.x} ${mid.y} T ${to.x} ${to.y}`
      : `M ${from.x} ${from.y} L ${mid.x} ${mid.y} L ${to.x} ${to.y}`
    const tangent = { x: second.x - first.x, y: second.y - first.y }
    return { edge, from: nodes[fromIndex], to: nodes[toIndex], path, mid, tangent }
  })

  useLayoutEffect(() => {
    const root = diagram.current
    if (!root) return
    const canvas = root.querySelector('svg')
    if (!canvas) return
    const cards = [...root.querySelectorAll('[data-graph-node]')]
    const paths = [...root.querySelectorAll<SVGPathElement>('[data-graph-link]')]
    const chips = [...root.querySelectorAll<HTMLElement>('[data-graph-label]')]

    const placeLabels = () => {
      const bounds = canvas.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const occupied = cards.map((card) => {
        const rect = card.getBoundingClientRect()
        return { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height }
      })
      const segments = paths.flatMap((path) => {
        const length = path.getTotalLength()
        const steps = Math.max(1, Math.ceil(length * Math.max(bounds.width, bounds.height) / 200))
        const points = Array.from({ length: steps + 1 }, (_, i) => {
          const point = path.getPointAtLength(length * i / steps)
          return { x: point.x * bounds.width / 100, y: point.y * bounds.height / 100 }
        })
        return points.slice(1).map((point, i) => ({
          x: Math.min(point.x, points[i].x), y: Math.min(point.y, points[i].y),
          width: Math.abs(point.x - points[i].x), height: Math.abs(point.y - points[i].y),
        }))
      })
      const overlaps = (a: typeof occupied[number], b: typeof occupied[number], gap: number) =>
        a.x < b.x + b.width + gap && a.x + a.width + gap > b.x
        && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y
      const arrowheads = chips.map(({ dataset }) => ({
        x: Number(dataset.x) * bounds.width / 100 - 8,
        y: Number(dataset.y) * bounds.height / 100 - 8,
        width: 16,
        height: 16,
      }))

      // The vertical link has a narrow opening between two cards. Reserve that space first.
      const placementOrder = chips.toSorted((a, b) =>
        Math.abs(Number(a.dataset.tangentX)) - Math.abs(Number(b.dataset.tangentX)),
      )
      for (const chip of placementOrder) {
        const { width, height } = chip.getBoundingClientRect()
        const anchorX = Number(chip.dataset.x) * bounds.width / 100
        const anchorY = Number(chip.dataset.y) * bounds.height / 100
        const tangentX = Number(chip.dataset.tangentX) * bounds.width
        const tangentY = Number(chip.dataset.tangentY) * bounds.height
        const tangentLength = Math.hypot(tangentX, tangentY)
        const maxGap = tangentX === 0 ? 84 : 65
        let best: typeof occupied[number] | undefined
        let bestDistance = Infinity
        for (let y = 2; y + height <= bounds.height - 2; y += 4) {
          for (let x = 2; x + width <= bounds.width - 2; x += 4) {
            const gapX = Math.max(x - anchorX, anchorX - x - width, 0)
            const gapY = Math.max(y - anchorY, anchorY - y - height, 0)
            const gap = Math.hypot(gapX, gapY)
            const centerX = x + width / 2 - anchorX
            const centerY = y + height / 2 - anchorY
            // Keep the label across from the arrowhead, close to the path and preferably above it.
            const alongLink = Math.abs(centerX * tangentX + centerY * tangentY) / tangentLength
            const belowPenalty = centerY > 2 ? 12 : 0
            const distance = gap + 0.65 * alongLink + belowPenalty
            if (distance >= bestDistance || gap > maxGap) continue
            const candidate = { x, y, width, height }
            if (occupied.some((box) => overlaps(candidate, box, 8))
              || arrowheads.some((box) => overlaps(candidate, box, 3))
              || segments.some((box) => overlaps(candidate, box, 5))) continue
            best = candidate
            bestDistance = distance
          }
        }

        // When there is no clear spot nearby, keep the relationship in the list below.
        chip.style.position = best ? 'absolute' : ''
        chip.style.left = best ? `${best.x}px` : ''
        chip.style.top = best ? `${best.y}px` : ''
        chip.dataset.placed = best ? 'true' : 'false'
        if (best) occupied.push(best)
      }
    }

    placeLabels()
    const observer = new ResizeObserver(placeLabels)
    for (const element of [canvas, ...cards, ...chips]) observer.observe(element)
    return () => observer.disconnect()
  }, [current, locale])

  if (!current) return null

  return (
    <section aria-labelledby="dataset-graph-title" className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
      <div className="p-5 sm:p-6">
        <GraphCardHeader id="dataset-graph-title" icon={<Network size={18} />}
          title={t('diagramTitle')} description={t('diagramDescription')} />
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('diagramExamples')}>
          {available.map(({ node }) => (
            <button key={node.id} type="button" aria-pressed={current.node.id === node.id}
              onClick={() => setSelectedId(node.id)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:border-cyan-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 aria-pressed:border-cyan-400/60 aria-pressed:bg-cyan-400/10 aria-pressed:text-cyan-100">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: NODE_TYPE_COLORS[node.type] }} />
              {node.name}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-800 bg-slate-950/60 px-2.5 py-6 sm:px-8"
        style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div ref={diagram} className="relative mx-auto max-w-xl">
          <div className="relative h-80 sm:h-96">
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible text-slate-500"
              viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <marker id={arrowId} viewBox="0 0 5 5" markerWidth="2.75" markerHeight="2.75"
                  refX="2.5" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
                  <path d="M 1 0.75 L 4 2.5 L 1 4.25" fill="none" stroke="currentColor"
                    className="text-slate-300" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </marker>
              </defs>
              {edges.map(({ edge, path }) => (
                <path key={edge.id} data-graph-link d={path} fill="none" stroke="currentColor" strokeWidth="1"
                  strokeDasharray="3 3" strokeLinecap="round" vectorEffect="non-scaling-stroke" markerMid={`url(#${arrowId})`} />
              ))}
            </svg>
            {nodes.map((node, i) => (
              <div key={node.id} data-graph-node className="absolute w-[29%] -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}>
                <GraphNodeCard node={node} />
              </div>
            ))}
          </div>
          <ul className="m-0 flex list-none flex-wrap justify-center gap-2 has-[li[data-placed=false]]:pt-3">
            {edges.map(({ edge, from, to, mid, tangent }) => (
              <li key={edge.id} data-graph-label data-placed="false" data-x={mid.x} data-y={mid.y}
                data-tangent-x={tangent.x} data-tangent-y={tangent.y} title={`${from.name} → ${to.name}`}
                className="w-max max-w-[29%] rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-center text-[11px] leading-tight text-slate-200 [overflow-wrap:anywhere] sm:max-w-[30%] sm:px-2 sm:text-xs">
                <span className="sr-only">{from.name} → {to.name}: </span>
                {labels.edges[edge.type]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
