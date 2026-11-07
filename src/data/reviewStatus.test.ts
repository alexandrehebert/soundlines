import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { collectReviewStatus, EVIDENCE_DIR, formatReviewStatus, STATUS_FILE } from '../../scripts/graph/reviewStatus.ts'
import graph from './graph.json'

describe('review-status.json', () => {
  it('matches the evidence files (run `npm run review-status` to refresh)', () => {
    expect(readFileSync(STATUS_FILE, 'utf8')).toBe(formatReviewStatus(collectReviewStatus()))
  })

  it('only lists ids that exist in the graph', () => {
    const ids = new Set([...graph.nodes, ...graph.edges].map((item) => item.id))
    expect(collectReviewStatus().reviewed.filter((id) => !ids.has(id))).toEqual([])
  })

  it('lists each reviewed id once', () => {
    const { reviewed } = collectReviewStatus()
    expect(reviewed.length).toBe(new Set(reviewed).size)
  })

  it('keeps a correctly identified evidence note for every live node', () => {
    for (const node of graph.nodes) {
      const file = join(EVIDENCE_DIR, 'nodes', node.type, `${node.id.slice(node.type.length + 1)}.md`)
      const text = readFileSync(file, 'utf8')
      expect(/^Graph ID `([^`]+)`/m.exec(text)?.[1], file).toBe(node.id)
    }
  })

  it('tracks every live edge with matching, reviewed evidence', () => {
    const root = resolve(EVIDENCE_DIR, '../../..')
    const rows = readFileSync(join(EVIDENCE_DIR, 'audits/graph-edge-coverage.csv'), 'utf8')
      .trim().split(/\r?\n/).slice(1).map((line) => line.split(','))
    expect(rows.map(([id]) => id).sort()).toEqual(graph.edges.map(({ id }) => id).sort())
    const reviewed = new Set(collectReviewStatus().reviewed)
    for (const edge of graph.edges) {
      const row = rows.find(([id]) => id === edge.id)!
      expect(row.length, edge.id).toBeGreaterThanOrEqual(5)
      expect(row.slice(1, 3), edge.id).toEqual([edge.type, edge.confidence ?? ''])
      const text = readFileSync(join(root, row[3]), 'utf8')
      expect(/^Graph ID `([^`]+)`/m.exec(text)?.[1], row[3]).toBe(edge.id)
      expect(text, row[3]).not.toContain('Pending source review')
      expect(text, row[3]).toMatch(/^\*\*Review status\*\*|^\*\*Reviewed\*\*/m)
      expect(reviewed.has(edge.id), edge.id).toBe(true)
    }
  })
})

describe('collectReviewStatus', () => {
  let directory: string | undefined
  afterEach(() => {
    if (directory) rmSync(directory, { recursive: true })
    directory = undefined
  })

  it('deduplicates reviews, excludes archived and pending notes, and reads inline dates', () => {
    directory = mkdtempSync(join(tmpdir(), 'soundlines-review-'))
    const id = graph.edges[0].id
    const notes = [
      `Graph ID \`${id}\`\n\n**Reviewed** · 2026-11-04`,
      `Graph ID \`${id}\`\n\n**Review status** · Source checked (2026-11-05)`,
      `Graph ID \`${graph.edges[1].id}\`\n\n**Review status** · Pending source review`,
      'Graph ID `archived:removed-edge`\n\n**Reviewed** · 2099-01-01',
      `Graph ID \`${graph.edges[2].id}\`\n\n**Disposition** · Removed (2026-11-05)`,
    ]
    for (const [index, text] of notes.entries()) {
      writeFileSync(join(directory, `${index}.md`), text)
    }
    expect(collectReviewStatus(directory)).toEqual({ lastReviewed: '2026-11-05', reviewed: [id] })
  })

  it('returns no date when there are no reviewed live entries', () => {
    directory = mkdtempSync(join(tmpdir(), 'soundlines-review-'))
    writeFileSync(join(directory, 'pending.md'), `Graph ID \`${graph.nodes[0].id}\`\n\nPending source review`)
    expect(collectReviewStatus(directory)).toEqual({ lastReviewed: null, reviewed: [] })
  })
})
