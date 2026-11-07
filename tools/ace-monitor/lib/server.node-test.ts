import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import { proxyAudio } from './ace.ts'
import { discoverTasks, readLog, snapshot } from './server.ts'

function setEnvironment(values: Record<string, string | undefined>): () => void {
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]))
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off('listening', onListening)
      reject(error)
    }
    const onListening = () => {
      server.off('error', onError)
      resolve()
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, '127.0.0.1')
  })
}

async function close(server: Server): Promise<void> {
  if (!server.listening) return
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
}

async function listenAdjacent(first: Server, second: Server): Promise<number> {
  for (let attempt = 0; attempt < 20; attempt++) {
    await listen(first, 0)
    const address = first.address()
    assert.ok(address && typeof address !== 'string')
    if (address.port < 65535) {
      try {
        await listen(second, address.port + 1)
        return address.port
      } catch (error) {
        if (!(error instanceof Error) || !('code' in error) || error.code !== 'EADDRINUSE') throw error
      }
    }
    await close(first)
  }
  throw new Error('Could not reserve adjacent test ports')
}

test('discovers recent unexpired task IDs read-only, including WAL updates', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ace-monitor-'))
  const path = join(directory, 'cache.db')
  const db = new DatabaseSync(path)
  try {
    db.exec('PRAGMA journal_mode=WAL; CREATE TABLE Cache (key TEXT, store_time REAL, expire_time REAL)')
    const insert = db.prepare('INSERT INTO Cache VALUES (?, ?, ?)')
    insert.run('ace_step_v1.5_old', 1, null)
    insert.run('ace_step_v1.5_new', 2, Date.now() / 1000 + 1000)
    insert.run('ace_step_v1.5_expired', 3, 1)
    insert.run('another_key', 4, null)
    const before = await readFile(path)
    assert.deepEqual(discoverTasks(path), ['new', 'old'])
    assert.deepEqual(discoverTasks(path, 1), ['new'])
    assert.deepEqual(await readFile(path), before)
    insert.run('ace_step_v1.5_live', 5, null)
    assert.deepEqual(discoverTasks(path), ['live', 'new', 'old'])
  } finally {
    db.close()
    await rm(directory, { recursive: true })
  }
})

test('bounds log tail and omits polling noise while retaining diffusion progress', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ace-monitor-log-'))
  try {
    const path = join(directory, 'server.log')
    await writeFile(path, 'old\n'.repeat(30_000) +
      'INFO: "POST /query_result HTTP/1.1" 200 OK\nMLX DiT: 12/80\rMLX DiT: 13/80\n')
    const log = await readLog(path)
    assert.ok(log.length < 64 * 1024)
    assert.ok(log.includes('MLX DiT: 13/80'))
    assert.ok(!log.includes('/query_result'))
    assert.ok(log.split('\n').length <= 150)
  } finally {
    await rm(directory, { recursive: true })
  }
})

test('snapshot returns explicit partial errors when ACE is offline', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(503).end('Offline')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const restore = setEnvironment({
    ACE_API_URL: `http://127.0.0.1:${address.port}`,
    ACE_API_PORT_COUNT: '1',
  })
  try {
    const data = await snapshot()
    assert.deepEqual(data.servers, [])
    assert.ok(data.errors.some(error => error.includes(`Port ${address.port}: ACE /health: HTTP 503`)))
    assert.ok(data.errors.some(error => error.includes('No ACE servers found')))
  } finally {
    restore()
    await close(server)
  }
})

test('discovers and queries both ports, merges shared tasks and falls back for audio', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ace-monitor-servers-'))
  const database = new DatabaseSync(join(directory, 'cache.db'))
  database.exec('CREATE TABLE Cache (key TEXT, store_time REAL, expire_time REAL)')
  database.exec("INSERT INTO Cache VALUES ('ace_step_v1.5_active', 2, NULL), ('ace_step_v1.5_done', 1, NULL)")
  database.close()
  await writeFile(join(directory, 'server.log'), 'server log\n')

  const requests: { index: number; path: string; auth: string | undefined; range: string | undefined }[] = []
  let firstIsOtherService = false
  let firstHealthStalls = false
  let secondStatsFail = false
  let secondAudioMissing = false
  function mockServer(index: number): Server {
    return createServer((request, response) => {
      const path = request.url || ''
      requests.push({ index, path, auth: request.headers.authorization, range: request.headers.range })
      request.resume()
      function json(data: unknown, status = 200) {
        response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(data))
      }
      if (path === '/health') {
        if (index === 0 && firstHealthStalls) {
          response.writeHead(200, { 'Content-Type': 'application/json' })
          response.write('{"code":')
          return
        }
        json({ code: 200, error: null, data: {
          service: index === 0 && firstIsOtherService ? 'Other service' : 'ACE-Step API',
          status: 'ok', models_initialized: true, llm_initialized: false,
          loaded_model: `model-${index}`, loaded_lm_model: null,
        } })
      } else if (path === '/v1/stats') {
        if (index === 1 && secondStatsFail) return json({ error: 'unavailable' }, 503)
        json({ code: 200, error: null, data: {
          jobs: { total: 4, queued: index + 1, running: index + 1, succeeded: 1, failed: 0 },
          queue_size: index + 1, queue_maxsize: 200, avg_job_seconds: 30,
        } })
      } else if (path === '/query_result') {
        json({ code: 200, error: null, data: [
          { task_id: 'active', status: 0, progress_text: `Server ${index} progress`,
            result: JSON.stringify([{ stage: 'diffusion', progress: 0.4, create_time: 10 }]) },
          index === 0
            ? { task_id: 'done', status: 0, result: '[]' }
            : { task_id: 'done', status: 1,
              result: JSON.stringify([{ file: '/v1/audio?path=%2Ftmp%2Fa.wav', create_time: 9 }]) },
        ] })
      } else if (path.startsWith('/v1/audio?')) {
        if (index === 0 || secondAudioMissing) response.writeHead(404).end('Missing')
        else response.writeHead(206, { 'Content-Type': 'audio/wav', 'Content-Range': 'bytes 0-3/4' }).end('WAVE')
      } else {
        response.writeHead(404).end()
      }
    })
  }
  const first = mockServer(0)
  const second = mockServer(1)
  let restore = () => {}
  try {
    const port = await listenAdjacent(first, second)
    restore = setEnvironment({
      ACE_API_URL: `http://127.0.0.1:${port}`,
      ACE_API_PORT_COUNT: '2',
      ACE_API_KEY: 'test-key',
      ACE_CACHE_DB: join(directory, 'cache.db'),
      ACE_LOG_PATH: join(directory, 'server.log'),
    })
    const data = await snapshot()
    assert.deepEqual(data.scannedPorts, { start: port, end: port + 1 })
    assert.deepEqual(data.servers.map(server => server.port), [port, port + 1])
    assert.deepEqual(data.servers.map(server => server.stats?.jobs.running), [1, 2])
    assert.deepEqual(data.servers.map(server => server.progressText), ['Server 0 progress', 'Server 1 progress'])
    assert.deepEqual(data.tasks.map(task => [task.id, task.status]), [['active', 'active'], ['done', 'succeeded']])
    assert.equal(Object.hasOwn(data.tasks[0], 'progressText'), false)
    assert.deepEqual(data.errors, [])

    const audio = await proxyAudio('/v1/audio?path=%2Ftmp%2Fa.wav', 'bytes=0-3')
    assert.equal(audio.status, 206)
    assert.equal(audio.headers.get('content-range'), 'bytes 0-3/4')
    assert.equal(await audio.text(), 'WAVE')
    assert.ok(requests.filter(request => request.path === '/health').every(request => request.auth === undefined))
    assert.ok(requests.filter(request => request.path !== '/health').every(request => request.auth === 'Bearer test-key'))
    assert.deepEqual(requests.filter(request => request.path.startsWith('/v1/audio?'))
      .map(request => [request.index, request.range]), [[0, 'bytes=0-3'], [1, 'bytes=0-3']])

    secondAudioMissing = true
    const missing = await proxyAudio('/v1/audio?path=%2Ftmp%2Fa.wav', null)
    assert.equal(missing.status, 404)
    assert.match((await missing.json()).error, /not accessible/)
    secondAudioMissing = false

    secondStatsFail = true
    const partial = await snapshot()
    assert.equal(partial.servers[1].stats, null)
    assert.ok(partial.servers[1].errors.some(error => error.includes('HTTP 503')))
    secondStatsFail = false

    firstHealthStalls = true
    const stalled = await snapshot()
    assert.deepEqual(stalled.servers.map(server => server.port), [port + 1])
    assert.ok(stalled.errors.some(error => error.includes('Health check timed out')))
    firstHealthStalls = false

    firstIsOtherService = true
    const mixed = await snapshot()
    assert.deepEqual(mixed.servers.map(server => server.port), [port + 1])
    assert.ok(mixed.errors.some(error => error.includes('did not identify as ACE-Step API')))
    await close(first)
    const gap = await snapshot()
    assert.deepEqual(gap.servers.map(server => server.port), [port + 1])
    assert.deepEqual(gap.errors, [])
  } finally {
    restore()
    await close(first)
    await close(second)
    await rm(directory, { recursive: true })
  }
})
