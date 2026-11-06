import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  core: {
    allowedHosts: ['localhost'],
  },
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: [
    '../public',
    { from: '../src/stories/fixtures/instrument-artwork-v1', to: '/instrument-artwork-v1' },
  ],
}

export default config
