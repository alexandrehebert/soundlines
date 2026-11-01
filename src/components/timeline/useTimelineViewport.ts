import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useExplorer } from '../../ExplorerContext.ts'
import { panYearRange, revealEraRange, TIMELINE_PADDING, xToYear, zoomYearRange } from '../../graph/layout.ts'

type TimelinePointerEvent = Pick<
  PointerEvent<SVGSVGElement>,
  'button' | 'clientX' | 'clientY' | 'currentTarget' | 'pointerId' | 'pointerType' | 'target'
>

export function useTimelineViewport() {
  const { viewRange, setViewRange, selectNode } = useExplorer()
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const suppressClick = useRef(false)
  const activePointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{
    distance: number
    midpointX: number
    range: [number, number]
    focusYear: number
    currentRange: [number, number]
  } | null>(null)
  const drag = useRef<{
    pointerId: number
    pointerType: string
    x: number
    y: number
    range: [number, number]
    scrollTop: number
    moved: boolean
    axis: 'horizontal' | 'vertical' | 'both' | null
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
        setViewRange((current) => {
          const focusYear = xToYear(
            { start: current[0], end: current[1], width: rect.width, padding: TIMELINE_PADDING },
            event.clientX - rect.left,
          )
          return zoomYearRange(current, focusYear, event.deltaY > 0 ? 1.12 : 0.89)
        })
      } else if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault()
        setViewRange((current) => panYearRange(current, event.deltaX / (rect.width - 2 * TIMELINE_PADDING)))
      }
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [setViewRange])

  const onPointerDown = (event: TimelinePointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    suppressClick.current = false
    // Keep an ordinary click targeted at the bar until a gesture begins.
    if (event.target instanceof Element) event.target.setPointerCapture(event.pointerId)
    if (event.pointerType === 'mouse') {
      drag.current = {
        pointerId: event.pointerId,
        pointerType: 'mouse',
        x: event.clientX,
        y: event.clientY,
        range: viewRange,
        scrollTop: containerRef.current?.scrollTop ?? 0,
        moved: false,
        axis: 'both',
      }
      return
    }

    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (activePointers.current.size >= 2) {
      for (const pointerId of activePointers.current.keys()) {
        event.currentTarget.setPointerCapture(pointerId)
      }
      const points = [...activePointers.current.values()]
      const [first, second] = points
      const distance = Math.hypot(second.x - first.x, second.y - first.y)
      const midpointX = (first.x + second.x) / 2
      const rect = event.currentTarget.getBoundingClientRect()
      pinch.current = {
        distance,
        midpointX,
        range: viewRange,
        focusYear: xToYear(
          { start: viewRange[0], end: viewRange[1], width: rect.width, padding: TIMELINE_PADDING },
          midpointX - rect.left,
        ),
        currentRange: viewRange,
      }
      drag.current = null
      suppressClick.current = true
      return
    }

    drag.current = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      range: viewRange,
      scrollTop: containerRef.current?.scrollTop ?? 0,
      moved: false,
      axis: null,
    }
  }

  const onPointerMove = (event: TimelinePointerEvent) => {
    if (event.pointerType !== 'mouse' && activePointers.current.has(event.pointerId)) {
      activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pinch.current && activePointers.current.size >= 2) {
        const [first, second] = [...activePointers.current.values()]
        const distance = Math.hypot(second.x - first.x, second.y - first.y)
        if (distance > 0) {
          const rect = event.currentTarget.getBoundingClientRect()
          const midpointX = (first.x + second.x) / 2
          const zoomedRange = zoomYearRange(
            pinch.current.range,
            pinch.current.focusYear,
            pinch.current.distance / distance,
          )
          const panFraction = (midpointX - pinch.current.midpointX)
            / Math.max(1, rect.width - 2 * TIMELINE_PADDING)
          const nextRange = panYearRange(zoomedRange, -panFraction)
          pinch.current.currentRange = nextRange
          setViewRange(nextRange)
        }
        return
      }
    }

    const gesture = drag.current
    if (!gesture || gesture.pointerId !== event.pointerId || !width) return
    const dx = event.clientX - gesture.x
    const dy = event.clientY - gesture.y
    if (!gesture.moved && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      gesture.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
      if (gesture.axis === null) {
        gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      }
    }
    if (!gesture.moved) return
    suppressClick.current = true
    if (gesture.pointerType === 'mouse' || gesture.axis === 'horizontal') {
      setViewRange(panYearRange(gesture.range, -dx / Math.max(1, width - 2 * TIMELINE_PADDING)))
    }
    if (gesture.pointerType === 'mouse' && containerRef.current) {
      containerRef.current.scrollTop = gesture.scrollTop - dy
    }
  }

  const endDrag = (event: TimelinePointerEvent) => {
    if (event.pointerType === 'mouse') {
      suppressClick.current = drag.current?.moved ?? false
      drag.current = null
      return
    }

    activePointers.current.delete(event.pointerId)
    if (pinch.current) {
      const currentRange = pinch.current.currentRange
      pinch.current = null
      suppressClick.current = true
      const remaining = [...activePointers.current.entries()][0]
      if (remaining) {
        const [pointerId, point] = remaining
        drag.current = {
          pointerId,
          pointerType: event.pointerType,
          x: point.x,
          y: point.y,
          range: currentRange,
          scrollTop: containerRef.current?.scrollTop ?? 0,
          moved: false,
          axis: null,
        }
      }
      return
    }

    if (drag.current?.pointerId === event.pointerId) {
      suppressClick.current = drag.current.moved
      drag.current = null
    }
  }

  const cancelDrag = (event: TimelinePointerEvent) => {
    activePointers.current.delete(event.pointerId)
    if (drag.current?.pointerId === event.pointerId) {
      suppressClick.current ||= drag.current.moved
      drag.current = null
    }
    if (activePointers.current.size < 2) pinch.current = null
  }

  const select = (id: string | null, revealYear?: number) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    selectNode(id)
    if (revealYear !== undefined) setViewRange(revealEraRange(viewRange, revealYear))
  }

  return {
    containerRef, width, select,
    handlers: {
      onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: cancelDrag,
      onClick: () => select(null),
    },
  }
}
