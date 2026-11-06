import { useEffect, useId, useMemo, useRef } from 'react'
import { useExplorer } from '../ExplorerContext.ts'
import { layoutGenreBubbles } from '../graph/bubbles.ts'
import { lineageHighlight, lineageSource, lineageTarget } from '../graph/graph.ts'
import { FAMILY_LABELS, FAMILY_ORDER } from '../graph/types.ts'
import { FAMILY_COLORS, SELECTION_BORDER, SELECTION_OUTLINE } from '../theme.ts'
import { bubbleScrollOffset } from './bubbleViewport.ts'
import { BubbleMinimap } from './BubbleMinimap.tsx'
import { BubbleZoomControls } from './BubbleZoomControls.tsx'
import { useBubbleViewport } from './useBubbleViewport.ts'

export function GenreBubbles() {
  const { model, selectedId, selectNode } = useExplorer()
  const layout = useMemo(() => layoutGenreBubbles(model.index), [model])
  const links = useMemo(() => {
    const bubbleById = new Map(layout.bubbles.map((bubble) => [bubble.node.id, bubble]))
    return model.index.graph.edges.flatMap((edge) => {
      const sourceId = lineageSource(edge, model.orientation)
      const targetId = lineageTarget(edge, model.orientation)
      const source = sourceId ? bubbleById.get(sourceId) : undefined
      const target = targetId ? bubbleById.get(targetId) : undefined
      if (!source || !target || source === target) return []
      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.hypot(dx, dy)
      if (!distance) return []
      return [{
        id: edge.id, sourceId, targetId,
        x1: source.x + dx / distance * source.diameter / 2,
        y1: source.y + dy / distance * source.diameter / 2,
        x2: target.x - dx / distance * target.diameter / 2,
        y2: target.y - dy / distance * target.diameter / 2,
        color: model.edgeColors[edge.type] ?? '#64748b',
      }]
    })
  }, [layout, model])
  const gradientPrefix = useId()
  const highlight = useMemo(
    () => lineageHighlight(model.index, selectedId, model.orientation), [selectedId, model],
  )
  const { surfaceRef, zoom, zoomBy, handlers } = useBubbleViewport(layout.width, layout.height)
  const zoomControls = useRef<HTMLDivElement>(null)
  const minimap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = surfaceRef.current
    if (!selectedId || !element) return
    const revealSelection = () => {
      const selected = element.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
      if (!selected) return
      const bounds = selected.getBoundingClientRect()
      // The button's bounding box includes the map's zoom; outline widths do not.
      const outset = (SELECTION_OUTLINE.outlineWidth + SELECTION_OUTLINE.outlineOffset) * bounds.width / selected.offsetWidth
      const offset = bubbleScrollOffset(
        element.getBoundingClientRect(),
        {
          left: bounds.left - outset, right: bounds.right + outset,
          top: bounds.top - outset, bottom: bounds.bottom + outset,
        },
        window.innerHeight,
        !window.matchMedia('(min-width: 48rem)').matches,
        zoomControls.current?.getBoundingClientRect(),
        minimap.current?.getBoundingClientRect(),
      )
      element.scrollLeft += offset.x
      element.scrollTop += offset.y
    }
    revealSelection()
    const observer = new ResizeObserver(revealSelection)
    observer.observe(element)
    return () => observer.disconnect()
  }, [selectedId, surfaceRef])

  return (
    <section className="flex h-full flex-col" aria-label="Genre bubbles">
      <div className="hidden shrink-0 flex-wrap gap-x-4 gap-y-1 border-b border-slate-800/60 bg-slate-950/70 px-5 py-1.5 lg:flex"
        aria-label="Genre families">
        {FAMILY_ORDER.map((family) => (
          <span key={family} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FAMILY_COLORS[family] }} />
            {FAMILY_LABELS[family]}
          </span>
        ))}
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          ref={surfaceRef}
          role="region"
          aria-label="Influence map"
          tabIndex={0}
          aria-description="Drag or scroll to move. Pinch or Cmd/Ctrl+scroll to zoom."
          className="h-full touch-none cursor-grab select-none overflow-auto overscroll-contain scroll-p-3 scroll-pt-20 active:cursor-grabbing"
          {...handlers}
        >
          <div className="grid min-h-full min-w-full place-items-center" style={{ width: layout.width * zoom, height: layout.height * zoom }}>
            <div className="relative" style={{ width: layout.width * zoom, height: layout.height * zoom }}>
              <div className="absolute left-0 top-0 origin-top-left" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}>
                {highlight && (
                  <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
                    {links.filter((link) => highlight.edges.has(link.id)).map(({ id, sourceId, targetId, color, ...coordinates }, index) => {
                      const gradient = `${gradientPrefix}-${index}`
                      return (
                        <g key={id}>
                          <defs><linearGradient id={gradient} gradientUnits="userSpaceOnUse" {...coordinates}>
                            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                          </linearGradient></defs>
                          <line
                            data-bubble-link={id}
                            data-source={sourceId}
                            data-target={targetId}
                            {...coordinates}
                            stroke={`url(#${gradient})`}
                            strokeWidth={2}
                          />
                        </g>
                      )
                    })}
                  </svg>
                )}
                {layout.bubbles.map(({ node, family, intensity, diameter, x, y }) => {
                  const color = FAMILY_COLORS[family]
                  const selected = selectedId === node.id
                  const dimmed = highlight !== null && !highlight.nodes.has(node.id)
                  const description = `${node.name} · ${FAMILY_LABELS[family]}`
                  return (
                    <button
                      key={node.id}
                      data-bubble-id={node.id}
                      type="button"
                      aria-label={description}
                      aria-pressed={selected}
                      title={description}
                      onClick={() => selectNode(node.id)}
                      className="visualization-item genre-bubble absolute flex select-none items-center justify-center rounded-full border p-3 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      style={{
                        left: x - diameter / 2,
                        top: y - diameter / 2,
                        width: diameter,
                        height: diameter,
                        ...(selected
                          ? { ...SELECTION_BORDER, ...SELECTION_OUTLINE }
                          : { borderColor: color, borderWidth: 1 }),
                        opacity: dimmed ? 0.2 : 1,
                        background: `radial-gradient(circle at 35% 25%, color-mix(in srgb, ${color} ${selected ? 55 + intensity * 40 : 30 + intensity * 65}%, #0f172a), color-mix(in srgb, ${color} ${selected ? 30 + intensity * 20 : 12 + intensity * 38}%, #020617))`,
                        boxShadow: `inset 0 1px 0 ${color}50`,
                        fontSize: `${11 + intensity * 5}px`,
                      }}
                    >
                      <span className="max-w-full break-words font-bold leading-tight text-white">{node.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        {layout.bubbles.length > 0 && (
          <BubbleMinimap layout={layout} links={links} zoom={zoom} surfaceRef={surfaceRef} controlsRef={minimap} />
        )}
        <BubbleZoomControls controlsRef={zoomControls} zoom={zoom} onZoom={zoomBy} />
      </div>
    </section>
  )
}
