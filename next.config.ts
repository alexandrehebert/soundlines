import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl({
  typescript: {
    tsconfigPath: 'tsconfig.build.json',
  },
  async redirects() {
    return [{ source: '/en-US/:path*', destination: '/en/:path*', permanent: true }]
  },
})
