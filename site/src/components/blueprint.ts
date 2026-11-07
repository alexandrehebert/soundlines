const number = String.raw`([-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?)`
const separator = String.raw`(?:\s*,\s*|\s+|(?=[+-]))`
const firstCubic = new RegExp(
  `^\\s*M\\s*${number}${separator}${number}\\s*C\\s*${Array(6).fill(number).join(separator)}`,
)

/** Read the generated icon's canvas and first cubic curve for the master sketch. */
export function readIconBlueprint(svg: string) {
  const viewBoxText = svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1]
  const path = svg.match(/<path\b[^>]*\bd\s*=\s*["']([^"']+)["']/i)?.[1]
  if (!viewBoxText || !path) throw new Error('Artwork blueprint requires an SVG viewBox and path')

  const values = viewBoxText.trim().split(/[\s,]+/).map(Number)
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value)) || values[2] <= 0 || values[3] <= 0) {
    throw new Error('Artwork blueprint requires a valid SVG viewBox')
  }
  const curve = path.match(firstCubic)?.slice(1).map(Number)
  if (!curve || curve.length !== 8 || curve.some((value) => !Number.isFinite(value))) {
    throw new Error('Artwork blueprint requires an initial absolute move and cubic curve')
  }

  const [x, y, width, height] = values
  const [startX, startY, control1X, control1Y, control2X, control2Y, endX, endY] = curve
  return {
    path,
    viewBox: { x, y, width, height },
    curve: {
      start: [startX, startY] as const,
      control1: [control1X, control1Y] as const,
      control2: [control2X, control2Y] as const,
      end: [endX, endY] as const,
    },
  }
}
