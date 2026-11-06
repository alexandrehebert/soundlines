import { memo, useId, useLayoutEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { layoutGenreBubbles } from '../graph/bubbles.ts'
import { FAMILY_COLORS } from '../theme.ts'
import type { BubblePoint } from './bubbleViewport.ts'

type Layout = ReturnType<typeof layoutGenreBubbles>
type Link = { id: string; x1: number; y1: number; x2: number; y2: number; color: string }

const Overview = memo(function Overview({ bubbles, links }: { bubbles: Layout['bubbles']; links: Link[] }) {
  return (
    <>
      {links.map(({ id, color, x1, y1, x2, y2 }) => (
        <line key={id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeOpacity={0.22} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
      ))}
      {bubbles.map(({ node, x, y, diameter, family }) => (
        <circle key={node.id} cx={x} cy={y} r={diameter / 2} fill={FAMILY_COLORS[family]} fillOpacity={0.65} />
      ))}
    </>
  )
})

export function BubbleMinimap({ layout, links, zoom, surfaceRef, controlsRef }: {
  layout: Layout
  links: Link[]
  zoom: number
  surfaceRef: RefObject<HTMLDivElement | null>
  controlsRef: RefObject<HTMLDivElement | null>
}) {
  const [expanded, setExpanded] = useState(true)
  const [visible, setVisible] = useState<(BubblePoint & { width: number; height: number }) | null>(null)
  const drag = useRef<{ id: number; offset: BubblePoint; moved: boolean } | null>(null)
  const id = useId()
  const { width, height, bubbles } = layout

  useLayoutEffect(() => {
    const surface = surfaceRef.current
    if (!expanded || !surface) return
    const sync = () => {
      setVisible({
        x: surface.scrollLeft / zoom,
        y: surface.scrollTop / zoom,
        width: Math.min(width, surface.clientWidth / zoom),
        height: Math.min(height, surface.clientHeight / zoom),
      })
    }
    sync()
    surface.addEventListener('scroll', sync, { passive: true })
    const observer = new ResizeObserver(sync)
    observer.observe(surface)
    return () => {
      surface.removeEventListener('scroll', sync)
      observer.disconnect()
    }
  }, [expanded, height, surfaceRef, width, zoom])

  const mapPoint = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * width / bounds.width,
      y: (event.clientY - bounds.top) * height / bounds.height,
    }
  }

  const centerOn = ({ x, y }: BubblePoint) => {
    const surface = surfaceRef.current
    if (!surface) return
    surface.scrollLeft = x * zoom - surface.clientWidth / 2
    surface.scrollTop = y * zoom - surface.clientHeight / 2
  }

  return (
    <div ref={controlsRef} className="absolute left-3 top-3 z-10 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 text-slate-300 shadow-lg">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => {
          drag.current = null
          setExpanded(!expanded)
        }}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-xs font-medium hover:bg-slate-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-400"
      >
        Minimap <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
      <div id={id} hidden={!expanded} className="border-t border-slate-800">
        {expanded && (
          <svg
            role="group"
            aria-label="Graph minimap"
            aria-description="Click or drag to move the graph, or use the arrow keys."
            tabIndex={0}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            style={{ width: `min(34vw, 10rem, ${96 * width / height}px)`, aspectRatio: width / height }}
            className="block touch-none cursor-grab select-none active:cursor-grabbing focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-400"
            onPointerDown={(event) => {
              if (event.button !== 0 || !event.isPrimary || !visible) return
              const point = mapPoint(event)
              const inside = point.x >= visible.x && point.x <= visible.x + visible.width
                && point.y >= visible.y && point.y <= visible.y + visible.height
              const offset = inside
                ? { x: visible.x + visible.width / 2 - point.x, y: visible.y + visible.height / 2 - point.y }
                : { x: 0, y: 0 }
              drag.current = { id: event.pointerId, offset, moved: !inside }
              event.currentTarget.setPointerCapture(event.pointerId)
              if (!inside) centerOn(point)
            }}
            onPointerMove={(event) => {
              const gesture = drag.current
              if (!gesture || gesture.id !== event.pointerId) return
              gesture.moved = true
              const point = mapPoint(event)
              centerOn({ x: point.x + gesture.offset.x, y: point.y + gesture.offset.y })
            }}
            onPointerUp={(event) => {
              if (drag.current?.id === event.pointerId && !drag.current.moved) centerOn(mapPoint(event))
            }}
            onLostPointerCapture={(event) => {
              if (drag.current?.id === event.pointerId) drag.current = null
            }}
            onKeyDown={(event) => {
              const surface = surfaceRef.current
              if (!surface) return
              switch (event.key) {
                case 'ArrowLeft': surface.scrollLeft -= surface.clientWidth / 4; break
                case 'ArrowRight': surface.scrollLeft += surface.clientWidth / 4; break
                case 'ArrowUp': surface.scrollTop -= surface.clientHeight / 4; break
                case 'ArrowDown': surface.scrollTop += surface.clientHeight / 4; break
                default: return
              }
              event.preventDefault()
            }}
          >
            <Overview bubbles={bubbles} links={links} />
            {visible && (
              <rect {...visible} fill="#67e8f9" fillOpacity={0.1} stroke="#67e8f9"
                strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            )}
          </svg>
        )}
      </div>
    </div>
  )
}
