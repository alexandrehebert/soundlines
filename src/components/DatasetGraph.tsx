'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowUp, ArrowUpRight, Network } from 'lucide-react'
import type { NeighborEntry } from '../graph/graph.ts'
import { neighbors } from '../graph/graph.ts'
import type { GraphNode } from '../graph/types.ts'
import { useExplorer } from '../ExplorerContext.ts'
import { graphLabels } from '../i18n/graphLabels.ts'
import { NODE_TYPE_COLORS } from '../theme.ts'
import { GraphCardHeader } from './GraphCardHeader.tsx'
import { EntryLink } from './HomeLinks.tsx'

const examples = [
  ['genre:house', 'key:frankie-knuckles-house', 'lineage:house-disco', 'featured:juno-106-house'],
  ['genre:jazz', 'lineage:blues-jazz', 'origin:genre-jazz-new-orleans', 'lineage:bebop-jazz'],
  ['genre:detroit-techno', 'influence:kraftwerk-detroit-techno', 'influence:detroit-techno-trance', 'featured:tr-909-detroit-techno'],
  ['artist:miles-davis', 'plays:miles-davis-trumpet', 'recorded:bitches-brew-miles-davis', 'signed:miles-davis-columbia-records'],
  ['instrument:tr-909', 'plays:frankie-knuckles-tr-909', 'featured:tr-909-detroit-techno', 'lineage:tr-909-tr-808'],
] as const

function GraphNodeCard({ node }: { node: GraphNode }) {
  const { locale } = useExplorer()
  return (
    <EntryLink node={node} className="group relative flex h-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-1.5 py-3 text-center hover:border-cyan-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:px-7">
      <span className="text-xs font-medium" style={{ color: NODE_TYPE_COLORS[node.type] }}>{graphLabels(locale).nodeTypes[node.type]}</span>
      <span className="max-w-full break-words text-sm font-semibold text-slate-100 sm:text-base">{node.name}</span>
      <ArrowUpRight aria-hidden="true" size={14} className="absolute top-2 right-2 hidden text-slate-400 group-hover:text-cyan-300 sm:block" />
    </EntryLink>
  )
}

export function DatasetGraph() {
  const { index, locale } = useExplorer()
  const t = useTranslations('openData.graph')
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
  if (!current) return null
  const labels = graphLabels(locale)

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
        <div className="mx-auto max-w-3xl max-sm:w-[90%] max-sm:[zoom:0.9]">
          <div className="mx-auto w-fit min-w-36">
            <GraphNodeCard node={current.node} />
          </div>
          <div aria-hidden="true" className="mx-auto h-5 w-px bg-slate-500" />
          <ul className="grid grid-cols-3">
            {current.branches.map(({ edge, node, direction }, i) => {
              const pointsOut = direction === 'out'
              const Arrow = pointsOut ? ArrowDown : ArrowUp
              const relation = labels.edges[edge.type]
              return (
                <li key={edge.id} className="relative grid grid-rows-[auto_1fr] px-0.5 sm:px-2">
                  <div aria-hidden="true" className={`absolute top-0 h-px bg-slate-500 ${i === 0 ? 'right-0 left-1/2' : i === 2 ? 'right-1/2 left-0' : 'inset-x-0'}`} />
                  <div className="relative flex min-h-20 flex-col items-center justify-center px-0.5 py-5 text-center">
                    <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-slate-500" />
                    <Arrow aria-hidden="true" size={15} className={`absolute left-1/2 -translate-x-1/2 bg-slate-950 text-slate-300 ${pointsOut ? 'bottom-0' : 'top-0'}`} />
                    <span className="sr-only">{pointsOut ? current.node.name : node.name} → {pointsOut ? node.name : current.node.name}: </span>
                    <span className="relative rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-xs leading-tight text-slate-200 sm:px-2">{relation}</span>
                  </div>
                  <GraphNodeCard node={node} />
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
