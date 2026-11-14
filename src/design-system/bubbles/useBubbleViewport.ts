import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { DEFAULT_BUBBLE_ZOOM } from '../../theme.ts'
import { zoomBubbleViewport, type BubblePoint, type BubbleViewportState } from './bubbleViewport.ts'

type BubblePointerEvent = Pick<PointerEvent<HTMLDivElement>,
  'button' | 'clientX' | 'clientY' | 'currentTarget' | 'pointerId' | 'pointerType' | 'target'>

interface Pinch {
  viewport: BubbleViewportState
  anchor: BubblePoint
  distance: number
}

function isGestureEvent(event: Event): event is Event & { scale: number; clientX: number; clientY: number } {
  return 'scale' in event && typeof event.scale === 'number' && event.scale > 0
    && 'clientX' in event && typeof event.clientX === 'number'
    && 'clientY' in event && typeof event.clientY === 'number'
}

export function useBubbleViewport(width: number, height: number) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<BubbleViewportState | null>(null)
  const zoom = viewport?.zoom ?? DEFAULT_BUBBLE_ZOOM
  const committedZoom = useRef(DEFAULT_BUBBLE_ZOOM)
  const pending = useRef<BubbleViewportState | null>(null)
  const pointers = useRef(new Map<number, BubblePoint>())
  const pinch = useRef<Pinch | null>(null)
  const drag = useRef<{
    pointerId: number
    viewport: BubbleViewportState
    anchor: BubblePoint
    moved: boolean
  } | null>(null)
  const suppressClick = useRef(false)
  const webkitPinch = useRef<{ viewport: BubbleViewportState; anchor: BubblePoint } | null>(null)

  useLayoutEffect(() => {
    const element = surfaceRef.current
    if (!element) return
    element.scrollLeft = viewport?.left ?? (width * zoom - element.clientWidth) / 2
    element.scrollTop = viewport?.top ?? (height * zoom - element.clientHeight) / 2
    committedZoom.current = zoom
    if (pending.current === viewport) pending.current = null
  }, [viewport, zoom, width, height])

  const readViewport = useCallback((): BubbleViewportState => ({
    zoom: pending.current?.zoom ?? committedZoom.current,
    left: pending.current?.left ?? surfaceRef.current?.scrollLeft ?? 0,
    top: pending.current?.top ?? surfaceRef.current?.scrollTop ?? 0,
  }), [])

  const zoomTo = useCallback((
    requestedZoom: number,
    anchor?: BubblePoint,
    target = anchor,
    initial?: BubbleViewportState,
  ) => {
    const element = surfaceRef.current
    if (!element) return
    const current = readViewport()
    const center = { x: element.clientWidth / 2, y: element.clientHeight / 2 }
    const next = zoomBubbleViewport(
      { width, height }, { width: element.clientWidth, height: element.clientHeight },
      initial ?? current, requestedZoom, anchor ?? center, target ?? center,
    )
    if (next.zoom === committedZoom.current && !pending.current) {
      element.scrollLeft = next.left
      element.scrollTop = next.top
    } else {
      // Compose input bursts against the pending viewport, before React paints.
      pending.current = next
      setViewport(next)
    }
  }, [width, height, readViewport])

  useEffect(() => {
    const element = surfaceRef.current
    if (!element) return
    const point = (event: { clientX: number; clientY: number }) => {
      const rect = element.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      if (webkitPinch.current) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1
      zoomTo(readViewport().zoom * Math.exp(-event.deltaY * unit * 0.005), point(event))
    }
    const onGestureStart = (event: Event) => {
      if (!isGestureEvent(event)) return
      event.preventDefault()
      if (pointers.current.size >= 2) return
      webkitPinch.current = { viewport: readViewport(), anchor: point(event) }
    }
    const onGestureChange = (event: Event) => {
      if (!isGestureEvent(event)) return
      event.preventDefault()
      const gesture = webkitPinch.current
      if (gesture && pointers.current.size < 2) {
        zoomTo(gesture.viewport.zoom * event.scale, gesture.anchor, point(event), gesture.viewport)
      }
    }
    const onGestureEnd = (event: Event) => {
      event.preventDefault()
      webkitPinch.current = null
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('gesturestart', onGestureStart, { passive: false })
    element.addEventListener('gesturechange', onGestureChange, { passive: false })
    element.addEventListener('gestureend', onGestureEnd, { passive: false })
    return () => {
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('gesturestart', onGestureStart)
      element.removeEventListener('gesturechange', onGestureChange)
      element.removeEventListener('gestureend', onGestureEnd)
    }
  }, [readViewport, zoomTo])

  const point = (event: BubblePointerEvent): BubblePoint => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const startPinch = () => {
    const [first, second] = [...pointers.current.values()]
    pinch.current = {
      viewport: readViewport(),
      anchor: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
      distance: Math.hypot(second.x - first.x, second.y - first.y),
    }
    drag.current = null
    suppressClick.current = true
  }

  const onPointerDown = (event: BubblePointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (!pointers.current.size) suppressClick.current = false
    if (event.pointerType === 'mouse' && event.target instanceof Element && event.target.closest('button')) return
    if (event.target instanceof Element) event.target.setPointerCapture(event.pointerId)
    if (event.pointerType !== 'mouse') pointers.current.set(event.pointerId, point(event))
    if (pointers.current.size >= 2) {
      for (const id of pointers.current.keys()) event.currentTarget.setPointerCapture(id)
      startPinch()
    } else {
      drag.current = { pointerId: event.pointerId, viewport: readViewport(), anchor: point(event), moved: false }
    }
  }

  const onPointerMove = (event: BubblePointerEvent) => {
    if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, point(event))
    const gesture = pinch.current
    if (gesture && pointers.current.size >= 2) {
      const [first, second] = [...pointers.current.values()]
      const distance = Math.hypot(second.x - first.x, second.y - first.y)
      if (gesture.distance > 0 && distance > 0) {
        zoomTo(gesture.viewport.zoom * distance / gesture.distance, gesture.anchor,
          { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }, gesture.viewport)
      }
      return
    }
    const pan = drag.current
    if (!pan || pan.pointerId !== event.pointerId) return
    const target = point(event)
    if (!pan.moved && Math.hypot(target.x - pan.anchor.x, target.y - pan.anchor.y) <= 8) return
    pan.moved = true
    suppressClick.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    zoomTo(pan.viewport.zoom, pan.anchor, target, pan.viewport)
  }

  const endPointer = (event: BubblePointerEvent) => {
    pointers.current.delete(event.pointerId)
    pinch.current = null
    if (pointers.current.size >= 2) {
      startPinch()
    } else if (pointers.current.size === 1) {
      const [id, anchor] = [...pointers.current.entries()][0]
      drag.current = { pointerId: id, anchor, viewport: readViewport(), moved: true }
    } else {
      drag.current = null
    }
  }

  return {
    surfaceRef, zoom,
    zoomBy: (delta: number) => zoomTo(readViewport().zoom + delta),
    handlers: {
      onPointerDown, onPointerMove, onPointerUp: endPointer, onPointerCancel: endPointer,
      onClickCapture: (event: Pick<MouseEvent, 'detail' | 'preventDefault' | 'stopPropagation'>) => {
        if (suppressClick.current && event.detail !== 0) {
          event.preventDefault()
          event.stopPropagation()
        }
      },
    },
  }
}
