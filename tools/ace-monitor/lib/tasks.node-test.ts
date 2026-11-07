import { test } from 'node:test'
import assert from 'node:assert/strict'
import { audioPath, parseTask } from './tasks.ts'

test('parses active progress, completed multi-file renders and failures', () => {
  const active = parseTask({ task_id: 'a', status: 0, progress_text: 'DiT 12/80',
    result: JSON.stringify([{ stage: 'diffusion', progress: 0.25, create_time: 123 }]) })
  assert.equal(active.status, 'active')
  assert.equal(active.progress, 0.25)
  assert.equal(active.stage, 'diffusion')
  assert.equal(active.createdAt, 123)
  const completed = parseTask({ task_id: 'b', status: 1,
    result: JSON.stringify([{ file: '/v1/audio?path=%2Ftmp%2Fa.wav', prompt: 'Techno' },
      { file: '/v1/audio?path=%2Ftmp%2Fb.wav' }]) })
  assert.equal(completed.status, 'succeeded')
  assert.equal(completed.files.length, 2)
  assert.equal(completed.prompt, 'Techno')
  const failed = parseTask({ task_id: 'c', status: 2, result: '[{"error":"Out of memory"}]' })
  assert.equal(failed.error, 'Out of memory')
  assert.equal(failed.status, 'failed')
})

test('unknown tasks are unavailable rather than falsely running', () => {
  assert.equal(parseTask({ task_id: 'a', status: 0, result: '[]' }).status, 'unavailable')
})

test('rejects malformed results and non-ACE audio URLs', () => {
  for (const file of ['https://evil.example/v1/audio?path=x', '//evil.example/v1/audio?path=x',
    '/health', '/v1/audio', '/v1/audio?path=']) {
    assert.throws(() => audioPath(file))
  }
  assert.equal(audioPath('/v1/audio?path=%2Ftmp%2Fa.wav'), '/v1/audio?path=%2Ftmp%2Fa.wav')
  assert.throws(() => parseTask({ task_id: 'a', status: 1, result: '{}' }))
  assert.throws(() => parseTask({ task_id: 'a', status: 1, result: 'invalid' }))
})
