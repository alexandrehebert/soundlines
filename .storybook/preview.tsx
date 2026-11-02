import type { Preview } from '@storybook/react-vite'
import { MotionConfig } from 'motion/react'
import '../src/index.css'

const preview: Preview = {
  decorators: [
    (Story) => (
      <MotionConfig reducedMotion="user">
        <Story />
      </MotionConfig>
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
      storySort: { order: ['Foundations', 'Controls', 'Components', 'Visualizations', 'Screens'] },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'soundlines' },
  },
}

export default preview
