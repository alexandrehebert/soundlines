import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCatalogue, readCatalogue } from './catalogue.ts'

test('parses the loop catalogue queue', () => {
  const catalogue = parseCatalogue({
    status: 'rendering', current: 'acid-house', updated_at: '2026-11-07T15:12:26-0500',
    jobs: [
      { slug: 'acid-house', status: 'rendering', current_seed: 470819 },
      { slug: 'techno', status: 'failed', error: 'gate failed' },
      { slug: 'trance', status: 'pending' },
    ],
    blocked: [{ slug: 'gagaku', status: 'blocked' }],
  })
  assert.equal(catalogue.current, 'acid-house')
  assert.deepEqual(catalogue.jobs[0], { slug: 'acid-house', status: 'rendering', seed: '470819', error: null })
  assert.equal(catalogue.jobs[1].error, 'gate failed')
  assert.equal(catalogue.blocked.length, 1)
  assert.throws(() => parseCatalogue({ jobs: 'nope' }), /Invalid catalogue queue/)
})

test('treats a missing queue file as no catalogue run', async () => {
  assert.equal(await readCatalogue('/nonexistent/catalogue-queue.json'), null)
})
