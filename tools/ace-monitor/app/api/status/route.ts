import { snapshot } from '../../../lib/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(await snapshot(), { headers: { 'Cache-Control': 'no-store' } })
}
