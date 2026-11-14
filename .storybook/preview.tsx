import type { Preview } from '@storybook/react-vite'
import { NextIntlClientProvider } from 'next-intl'
import { MotionConfig } from 'motion/react'
import { catalogueFor } from '../src/i18n/catalogue.ts'
import { DEFAULT_LOCALE } from '../src/i18n/routing.ts'
import '../src/index.css'

const preview: Preview = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={catalogueFor(DEFAULT_LOCALE)}>
        <MotionConfig reducedMotion="user">
          <Story />
        </MotionConfig>
      </NextIntlClientProvider>
    ),
  ],
  parameters: {
    backgrounds: {
      options: {
        soundlines: { name: 'Soundlines', value: '#020617' },
        slate: { name: 'Slate', value: '#0f172a' },
      },
    },
    controls: { expanded: true },
    options: {
      storySort: { order: ['Overview', 'Foundations', 'Controls', 'Overlays', 'Visualizations', 'Playback', 'Screens'] },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'soundlines' },
  },
}

export default preview
