import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useExplorer } from '../../ExplorerContext.ts'
import { panYearRange, revealEraRange, TIMELINE_PADDING, xToYear, zoomYearRange } from '../../graph/layout.ts'

export function useTimelineViewport() {
  const { viewRange, setViewRange, selectNode } = useExplorer()
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const suppressClick = useRef(false)
  const drag = useRef<{
    x: number; y: number; range: [number, number]; scrollTop: number; moved: boolean
  } | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      const rect = element.querySelector('svg')?.getBoundingClientRect()
      if (!rect?.width) return
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        const focusYear = xToYear(
          { start: viewRange[0], end: viewRange[1], width: rect.width, padding: TIMELINE_PADDING },
          event.clientX - rect.left,
        )
        setViewRange(zoomYearRange(viewRange, focusYear, event.deltaY > 0 ? 1.12 : 0.89))
      } else if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault()
        setViewRange(panYearRange(viewRange, event.deltaX / (rect.width - 2 * TIMELINE_PADDING)))
      }
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [viewRange, setViewRange])

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || !event.isPrimary) return
    suppressClick.current = false
    drag.current = {
      x: event.clientX, y: event.clientY, range: viewRange,
      scrollTop: containerRef.current?.scrollTop ?? 0, moved: false,
    }
    if (event.target instanceof Element) event.target.setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !width) return
    const dx = event.clientX - drag.current.x
    const dy = event.clientY - drag.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true
    if (!drag.current.moved) return
    setViewRange(panYearRange(drag.current.range, -dx / (width - 2 * TIMELINE_PADDING)))
    if (containerRef.current) containerRef.current.scrollTop = drag.current.scrollTop - dy
  }

  const endDrag = () => {
    suppressClick.current = drag.current?.moved ?? false
    drag.current = null
  }

  const select = (id: string | null, revealYear?: number) => {
    if (!suppressClick.current) {
      selectNode(id)
      if (revealYear !== undefined) setViewRange(revealEraRange(viewRange, revealYear))
    }
  }

  return {
    containerRef, width, select,
    handlers: {
      onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag,
      onClick: () => select(null),
    },
  }
}
