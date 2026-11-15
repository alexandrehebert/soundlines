export function afterSvgLayout(element: SVGGraphicsElement, measure: () => void): (() => void) | undefined {
  // SVG text APIs cannot measure characters inside a display:none preview.
  if (element.getClientRects().length) {
    measure()
    return
  }

  const observer = new ResizeObserver(() => {
    if (!element.getClientRects().length) return
    observer.disconnect()
    measure()
  })
  observer.observe(element)
  return () => observer.disconnect()
}
