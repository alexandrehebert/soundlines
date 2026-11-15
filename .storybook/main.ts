import type { StorybookConfig } from '@storybook/react-vite'
import { PROJECT_SITE_URL, companionBaseUrl } from '../src/projectLinks.ts'

// `npm run build-storybook:public` publishes a browse-only catalogue with the
// companion site, under /soundlines/storybook/.
const isPublic = process.env.STORYBOOK_PUBLIC === '1'
const publicBase = `${new URL(PROJECT_SITE_URL).pathname.replace(/\/$/, '')}/storybook`

const artworkFixture = { from: '../src/stories/fixtures/instrument-artwork-v1', to: '/instrument-artwork-v1' }

const config: StorybookConfig = {
  stories: ['../src/stories/Overview.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  features: {
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
  core: {
    allowedHosts: ['localhost'],
    disableWhatsNewNotifications: true,
  },
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public', artworkFixture],
  managerHead: (head) => (isPublic ? `${head}\n<script>globalThis.SOUNDLINES_PUBLIC_STORYBOOK = true</script>` : head),
  viteFinal: (viteConfig) => {
    viteConfig.define = {
      ...viteConfig.define,
      'process.env.NEXT_PUBLIC_SOUNDLINES_COMPANION_URL': JSON.stringify(isPublic ? PROJECT_SITE_URL : companionBaseUrl()),
    }
    if (isPublic) {
      // Storybook copies public/ through staticDirs.
      viteConfig.publicDir = false
      viteConfig.define['process.env.STORYBOOK_ASSET_BASE'] = JSON.stringify(publicBase)
    }
    return viteConfig
  },
}

export default config
