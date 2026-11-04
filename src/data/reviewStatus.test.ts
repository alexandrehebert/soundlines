import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { collectReviewStatus, formatReviewStatus, STATUS_FILE } from '../../scripts/reviewStatus.ts'
import graph from './graph.json'

describe('review-status.json', () => {
  it('matches the evidence files (run `npm run review-status` to refresh)', () => {
    expect(readFileSync(STATUS_FILE, 'utf8')).toBe(formatReviewStatus(collectReviewStatus()))
  })

  it('only lists ids that exist in the graph', () => {
    const ids = new Set([...graph.nodes, ...graph.edges].map((item) => item.id))
    expect(collectReviewStatus().reviewed.filter((id) => !ids.has(id))).toEqual([])
  })
})
