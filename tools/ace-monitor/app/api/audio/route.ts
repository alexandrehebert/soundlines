import { proxyAudio } from '../../../lib/ace'
import { audioPath } from '../../../lib/tasks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const file = new URL(request.url).searchParams.get('file')
  let path: string
  try {
    if (!file) throw new Error('Missing audio file')
    path = audioPath(file)
  } catch (error) {
    console.warn('[ace-monitor] Invalid audio request', error)
    return Response.json({ error: 'Invalid ACE audio URL' }, { status: 400 })
  }
  try {
    const upstream = await proxyAudio(path, request.headers.get('range'))
    const headers = new Headers({ 'Cache-Control': 'no-store' })
    for (const name of ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Disposition']) {
      const value = upstream.headers.get(name)
      if (value) headers.set(name, value)
    }
    return new Response(upstream.body, { status: upstream.status, headers })
  } catch (error) {
    console.error('[ace-monitor] Audio proxy', error)
    return Response.json({ error: 'Cannot reach ACE audio endpoint' }, { status: 502 })
  }
}
