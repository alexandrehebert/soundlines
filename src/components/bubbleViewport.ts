import { MOBILE_DETAIL_COLLAPSED_OFFSET, MOBILE_DETAIL_HEIGHT } from './mobileDetailSheet.ts'

type Bounds = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>

export const MIN_BUBBLE_ZOOM = 0.25
export const MAX_BUBBLE_ZOOM = 1.5

export interface BubbleViewportState {
  zoom: number
  left: number
  top: number
}

export interface BubblePoint {
  x: number
  y: number
}

export function zoomBubbleViewport(
  map: { width: number; height: number },
  surface: { width: number; height: number },
  current: BubbleViewportState,
  requestedZoom: number,
  anchor: BubblePoint,
  target = anchor,
): BubbleViewportState {
  const zoom = Math.min(MAX_BUBBLE_ZOOM, Math.max(MIN_BUBBLE_ZOOM, requestedZoom))
  const offset = (size: number, viewport: number, scroll: number, from: number, to: number) => {
    const inset = Math.max(0, (viewport - size * current.zoom) / 2)
    const nextInset = Math.max(0, (viewport - size * zoom) / 2)
    const point = (scroll + from - inset) / current.zoom
    return Math.max(0, Math.min(size * zoom - viewport, nextInset + point * zoom - to))
  }
  return {
    zoom,
    left: offset(map.width, surface.width, current.left, anchor.x, target.x),
    top: offset(map.height, surface.height, current.top, anchor.y, target.y),
  }
}

function nearestOffset(start: number, end: number, visibleStart: number, visibleEnd: number) {
  if (visibleEnd <= visibleStart) return 0
  const before = start < visibleStart
  const after = end > visibleEnd
  if (before && after) return 0
  // Align an oversized bubble without scrolling past its far edge.
  const oversized = end - start > visibleEnd - visibleStart
  if (before) return oversized ? end - visibleEnd : start - visibleStart
  if (after) return oversized ? start - visibleStart : end - visibleEnd
  return 0
}

export function bubbleScrollOffset(
  surface: Bounds,
  bubble: Bounds,
  viewportHeight: number,
  mobile: boolean,
  controls?: Bounds,
) {
  const sheetTop = viewportHeight * (1 - MOBILE_DETAIL_HEIGHT * (1 - MOBILE_DETAIL_COLLAPSED_OFFSET))
  const visibleBottom = mobile ? Math.max(surface.top, Math.min(surface.bottom, sheetTop)) : surface.bottom
  const x = nearestOffset(bubble.left, bubble.right, surface.left, surface.right)
  let y = nearestOffset(bubble.top, bubble.bottom, surface.top, visibleBottom)
  if (controls && bubble.left - x < controls.right && bubble.right - x > controls.left
    && bubble.top - y < controls.bottom && bubble.bottom - y > controls.top) {
    y = nearestOffset(bubble.top, bubble.bottom, Math.max(surface.top, controls.bottom + 8), visibleBottom)
  }
  return { x, y }
}
