/**
 * Summarizes the per-entry evidence files into src/data/review-status.json,
 * which the dataset statistics use to report source-review progress.
 *
 * Run with `npm run review-status` after editing files in src/data/evidence.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ReviewStatus {
  /** Most recent review stamp or inline review-status date for a live entry. */
  lastReviewed: string | null
  /** Graph ids whose evidence file is no longer pending source review. */
  reviewed: string[]
}

const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const EVIDENCE_DIR = join(ROOT, 'src/data/evidence')
export const STATUS_FILE = join(ROOT, 'src/data/review-status.json')
const GRAPH_FILE = join(ROOT, 'src/data/graph.json')

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return markdownFiles(path)
    return entry.name.endsWith('.md') ? [path] : []
  })
}

export function collectReviewStatus(dir = EVIDENCE_DIR): ReviewStatus {
  const graph: { nodes: { id: string }[]; edges: { id: string }[] } =
    JSON.parse(readFileSync(GRAPH_FILE, 'utf8'))
  const liveIds = new Set([...graph.nodes, ...graph.edges].map(({ id }) => id))
  const reviewed = new Set<string>()
  let lastReviewed: string | null = null
  for (const file of markdownFiles(dir)) {
    const text = readFileSync(file, 'utf8')
    const id = /^Graph ID `([^`]+)`/m.exec(text)?.[1]
    if (!id || !liveIds.has(id) || text.includes('Pending source review')) continue
    if (/^\*\*Disposition\*\*.*\bRemoved\b/im.test(text)) continue
    reviewed.add(id)
    const date = /^\*\*Reviewed\*\* · (\d{4}-\d{2}-\d{2})/m.exec(text)?.[1]
      ?? /^\*\*Review status\*\*[^\n]*?(\d{4}-\d{2}-\d{2})/m.exec(text)?.[1]
    if (date && (!lastReviewed || date > lastReviewed)) lastReviewed = date
  }
  return { lastReviewed, reviewed: [...reviewed].sort() }
}

export function formatReviewStatus(status: ReviewStatus) {
  return `${JSON.stringify(status, null, 2)}\n`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const status = collectReviewStatus()
  writeFileSync(STATUS_FILE, formatReviewStatus(status))
  console.log(`${status.reviewed.length} reviewed entries written to ${STATUS_FILE}`)
}
