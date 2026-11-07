import { test } from 'node:test'
import assert from 'node:assert/strict'
import { serverEndpoints } from './ace.ts'

test('builds the default and configurable consecutive port ranges', () => {
  const defaults = serverEndpoints({ ACE_API_URL: 'http://example.test:8020' })
  assert.deepEqual(defaults.map(endpoint => endpoint.port), [8020, 8021, 8022, 8023, 8024, 8025, 8026, 8027, 8028, 8029])
  const custom = serverEndpoints({ ACE_API_URL: 'https://example.test:9000', ACE_API_PORT_COUNT: '3' })
  assert.deepEqual(custom.map(endpoint => endpoint.url.href), [
    'https://example.test:9000/', 'https://example.test:9001/', 'https://example.test:9002/',
  ])
})

test('rejects invalid ranges and unsupported URLs instead of silently scanning elsewhere', () => {
  for (const count of ['0', '101', '1.5', 'ten', '']) {
    assert.throws(() => serverEndpoints({ ACE_API_URL: 'http://localhost:8020', ACE_API_PORT_COUNT: count }))
  }
  assert.throws(() => serverEndpoints({ ACE_API_URL: 'http://localhost:65535', ACE_API_PORT_COUNT: '2' }))
  assert.throws(() => serverEndpoints({ ACE_API_URL: 'ftp://localhost:8020' }))
  assert.throws(() => serverEndpoints({ ACE_API_URL: 'http://user:password@localhost:8020' }))
})
