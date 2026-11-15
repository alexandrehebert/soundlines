import createNextIntlPlugin from 'next-intl/plugin'
import { fileURLToPath } from 'node:url'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url))

export default withNextIntl({
  outputFileTracingRoot: workspaceRoot,
  turbopack: { root: workspaceRoot },
  typescript: {
    tsconfigPath: 'tsconfig.build.json',
  },
  async redirects() {
    return [{ source: '/en-US/:path*', destination: '/en/:path*', permanent: true }]
  },
})
