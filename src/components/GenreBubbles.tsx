import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useExplorer } from '../ExplorerContext.ts'
import { layoutGenreBubbles } from '../graph/bubbles.ts'
import { lineageHighlight, lineageSource, lineageTarget } from '../graph/graph.ts'
import { FAMILY_LABELS, FAMILY_ORDER } from '../graph/types.ts'
import { DEFAULT_BUBBLE_ZOOM, FAMILY_COLORS, SELECTION_BORDER, SELECTION_OUTLINE } from '../theme.ts'
import { bubbleScrollOffset } from './bubbleViewport.ts'

export function GenreBubbles() {
  const { model, selectedId, selectNode } = useExplorer()
  const layout = useMemo(() => layoutGenreBubbles(model.index), [model])
  const bubbleById = useMemo(() => new Map(layout.bubbles.map((bubble) => [bubble.node.id, bubble])), [layout])
  // A hover only applies to the selection it started with.
  const hoverScope = useMemo(() => ({ selectedId }), [selectedId])
  const [hovered, setHovered] = useState<{ id: string; scope: typeof hoverScope } | null>(null)
  const hoveredId = hovered?.scope === hoverScope ? hovered.id : null
  const focusId = hoveredId ?? selectedId
  const highlight = useMemo(
    () => lineageHighlight(model.index, focusId, model.orientation), [focusId, model],
  )
  const surface = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(DEFAULT_BUBBLE_ZOOM)
  const previousZoom = useRef<number | null>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const element = surface.current
    if (!element) return
    const ratio = previousZoom.current === null ? null : zoom / previousZoom.current
    element.scrollLeft = ratio === null
      ? (layout.width * zoom - element.clientWidth) / 2
      : (element.scrollLeft + element.clientWidth / 2) * ratio - element.clientWidth / 2
    element.scrollTop = ratio === null
      ? (layout.height * zoom - element.clientHeight) / 2
      : (element.scrollTop + element.clientHeight / 2) * ratio - element.clientHeight / 2
    previousZoom.current = zoom
  }, [zoom, layout])

  useEffect(() => {
    const element = surface.current
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
      )
      element.scrollLeft += offset.x
      element.scrollTop += offset.y
    }
    revealSelection()
    const observer = new ResizeObserver(revealSelection)
    observer.observe(element)
    return () => observer.disconnect()
  }, [selectedId])

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0
      || (event.target instanceof Element && event.target.closest('button'))) return
    setHovered(null)
    drag.current = {
      x: event.clientX, y: event.clientY,
      left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <section className="flex h-full flex-col" aria-label="Genre bubbles">
      <div className="shrink-0 border-b border-slate-800/60 px-4 py-3 md:px-8 md:py-4">
        <h2 className="text-xl font-bold text-white">A world of influence</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Size and brightness show catalogue influence, not popularity. Connected genres tend to be nearby.
        </p>
        <div className="mt-3 hidden flex-wrap gap-x-4 gap-y-2 md:flex" aria-label="Genre families">
          {FAMILY_ORDER.map((family) => (
            <span key={family} className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FAMILY_COLORS[family] }} />
              {FAMILY_LABELS[family]}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 md:mt-3">
          <div className="flex items-center gap-2" role="group" aria-label="Bubble zoom">
            <button type="button" aria-label="Zoom out bubbles" disabled={zoom <= 0.25}
              onClick={() => setZoom((value) => Math.max(0.25, value - 0.1))}
              className="h-11 w-11 rounded-full border border-slate-700 text-lg disabled:opacity-30 md:h-9 md:w-9">−</button>
            <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in bubbles" disabled={zoom >= 1.5}
              onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}
              className="h-11 w-11 rounded-full border border-slate-700 text-lg disabled:opacity-30 md:h-9 md:w-9">+</button>
          </div>
          <span>Drag the background or scroll to explore</span>
        </div>
      </div>
      <div
        ref={surface}
        role="region"
        aria-label="Influence map"
        tabIndex={0}
        className="min-h-0 flex-1 cursor-grab overflow-auto overscroll-contain active:cursor-grabbing"
        onPointerDown={startDrag}
        onPointerMove={(event) => {
          if (!drag.current) return
          event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x)
          event.currentTarget.scrollTop = drag.current.top - (event.clientY - drag.current.y)
        }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
      >
        <div className="grid min-h-full min-w-full place-items-center" style={{ width: layout.width * zoom, height: layout.height * zoom }}>
          <div className="relative" style={{ width: layout.width * zoom, height: layout.height * zoom }}>
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}>
              {highlight && (
                <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
                  {model.index.graph.edges.filter((edge) => highlight.edges.has(edge.id)).map((edge) => {
                    const sourceId = lineageSource(edge, model.orientation)
                    const targetId = lineageTarget(edge, model.orientation)
                    const source = sourceId ? bubbleById.get(sourceId) : undefined
                    const target = targetId ? bubbleById.get(targetId) : undefined
                    if (!source || !target || source === target) return null
                    const dx = target.x - source.x
                    const dy = target.y - source.y
                    const distance = Math.hypot(dx, dy)
                    const x1 = source.x + dx / distance * source.diameter / 2
                    const y1 = source.y + dy / distance * source.diameter / 2
                    const x2 = target.x - dx / distance * target.diameter / 2
                    const y2 = target.y - dy / distance * target.diameter / 2
                    return (
                      <line
                        key={edge.id}
                        data-bubble-link={edge.id}
                        data-source={sourceId}
                        data-target={targetId}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={model.edgeColors[edge.type] ?? '#64748b'}
                        strokeWidth={2}
                        opacity={0.9}
                      />
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
                    onPointerEnter={(event) => {
                      if (event.pointerType !== 'mouse') setHovered(null)
                    }}
                    onPointerMove={(event) => {
                      if (event.pointerType === 'mouse') {
                        setHovered((current) => current?.id === node.id && current.scope === hoverScope
                          ? current : { id: node.id, scope: hoverScope })
                      }
                    }}
                    onPointerLeave={(event) => {
                      if (event.pointerType === 'mouse') setHovered(null)
                    }}
                    onClick={() => {
                      setHovered(null)
                      selectNode(node.id)
                    }}
                    className="genre-bubble absolute flex select-none items-center justify-center rounded-full border p-3 text-center transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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
    </section>
  )
}
