import type { StorybookConfig } from '@storybook/react-vite'
import { PROJECT_SITE_URL, companionBaseUrl } from '../src/projectLinks.ts'

// `npm run build-storybook:public` publishes a read-only, curated catalogue with the
// companion site, under /soundlines/storybook/.
const isPublic = process.env.STORYBOOK_PUBLIC === '1'
const publicBase = `${new URL(PROJECT_SITE_URL).pathname.replace(/\/$/, '')}/storybook`

const publicStories = [
  'Colors',
  'Favicon',
  'InstrumentArtwork',
  'AudioPreviewPlayer',
  'Turntable',
  'VinylRecord',
  'TurntablePlayButton',
  'TurntableSideKnob',
  'DetailPanel',
  'Timeline',
  'GenreBubbles',
  'Home',
  'Explorer',
].map((name) => `../src/stories/${name}.stories.tsx`)

const artworkFixture = { from: '../src/stories/fixtures/instrument-artwork-v1', to: '/instrument-artwork-v1' }

// Only the assets the curated stories use; the genre previews stay out except the player's sample.
const publicStaticDirs = [
  ...['instrument-icons', 'instrument-banners', 'instrument-avatars', 'instrument-header-backgrounds', 'loops'].map(
    (folder) => ({ from: `../public/${folder}`, to: `/${folder}` }),
  ),
  { from: '../public/favicon.svg', to: '/favicon.svg' },
  { from: '../public/favicon-light.svg', to: '/favicon-light.svg' },
  { from: '../public/genre-previews/jazz.m4a', to: '/genre-previews/jazz.m4a' },
  artworkFixture,
]

const config: StorybookConfig = {
  stories: isPublic ? publicStories : ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  core: {
    allowedHosts: ['localhost'],
  },
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: isPublic ? publicStaticDirs : ['../public', artworkFixture],
  managerHead: (head) => (isPublic ? `${head}\n<script>globalThis.SOUNDLINES_PUBLIC_STORYBOOK = true</script>` : head),
  viteFinal: (viteConfig) => {
    viteConfig.define = {
      ...viteConfig.define,
      'process.env.NEXT_PUBLIC_SOUNDLINES_COMPANION_URL': JSON.stringify(isPublic ? PROJECT_SITE_URL : companionBaseUrl()),
    }
    if (isPublic) {
      // Vite would otherwise copy all of public/ (genre previews included) next to staticDirs.
      viteConfig.publicDir = false
      viteConfig.define['process.env.STORYBOOK_ASSET_BASE'] = JSON.stringify(publicBase)
    }
    return viteConfig
  },
}

export default config
