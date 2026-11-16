import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROJECT_SITE_URL, companionBaseUrl } from '@soundlines/project-config'
import { mediaDirectory } from '@soundlines/media/source'
import mobileConfig, { mobileCataloguePlugin } from '../../mobile-web/vite.config.ts'
import { mergeConfig } from 'vite'

// `pnpm build-storybook:public` publishes a browse-only catalogue with the
// companion site, under /soundlines/storybook/.
const isPublic = process.env.STORYBOOK_PUBLIC === '1'
const publicBase = `${new URL(PROJECT_SITE_URL).pathname.replace(/\/$/, '')}/storybook`

const appAssets = ['open-data-changelog.json', 'social-card.png', 'social-card.svg']
  .map((file) => ({ from: `../../web/public/${file}`, to: `/${file}` }))
const artworkFixture = { from: '../../web/src/stories/fixtures/instrument-artwork-v1', to: '/instrument-artwork-v1' }

// Resolve presets from this workspace, where pnpm links the dependencies.
const presetPath = (name: string) => dirname(fileURLToPath(import.meta.resolve(`${name}/package.json`)))

const config: StorybookConfig = {
  stories: [
    '../../web/src/stories/Overview.mdx',
    '../../web/src/**/*.stories.@(ts|tsx)',
    '../../../packages/ui-web/src/**/*.stories.@(ts|tsx)',
  ],
  addons: [presetPath('@storybook/addon-docs'), presetPath('@storybook/addon-a11y')],
  features: {
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
  core: {
    allowedHosts: ['localhost'],
    disableWhatsNewNotifications: true,
  },
  framework: {
    name: presetPath('@storybook/react-vite'),
    options: {},
  },
  staticDirs: [mediaDirectory, ...appAssets, artworkFixture],
  managerHead: (head) => (isPublic ? `${head}\n<script>globalThis.SOUNDLINES_PUBLIC_STORYBOOK = true</script>` : head),
  viteFinal: (config) => {
    const viteConfig = mergeConfig(config, {
      plugins: [tailwindcss(), mobileCataloguePlugin],
      resolve: { alias: mobileConfig.resolve?.alias },
    })
    viteConfig.define = {
      ...viteConfig.define,
      ...mobileConfig.define,
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
