import createMiddleware from 'next-intl/middleware'
import { routing } from './src/i18n/routing.ts'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_vercel|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
