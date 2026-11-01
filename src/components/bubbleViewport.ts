import { MOBILE_DETAIL_COLLAPSED_OFFSET, MOBILE_DETAIL_HEIGHT } from './mobileDetailSheet.ts'

type Bounds = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>

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
) {
  const sheetTop = viewportHeight * (1 - MOBILE_DETAIL_HEIGHT * (1 - MOBILE_DETAIL_COLLAPSED_OFFSET))
  const visibleBottom = mobile ? Math.max(surface.top, Math.min(surface.bottom, sheetTop)) : surface.bottom
  return {
    x: nearestOffset(bubble.left, bubble.right, surface.left, surface.right),
    y: nearestOffset(bubble.top, bubble.bottom, surface.top, visibleBottom),
  }
}
