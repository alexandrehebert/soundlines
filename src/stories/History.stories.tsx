import type { Meta, StoryObj } from '@storybook/react-vite'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { History } from '../design-system/timeline/History.tsx'

const meta = {
  title: 'Visualizations/History',
  component: History,
  tags: ['autodocs'],
  decorators: [
    withExplorer,
    (Story) => <div className="h-[70vh] overflow-hidden"><Story /></div>,
  ],
  parameters: { layout: 'fullscreen', explorer: { initialView: 'history' } },
} satisfies Meta<typeof History>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
