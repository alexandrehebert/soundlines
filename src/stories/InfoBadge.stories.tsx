import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { InfoBadge } from '../components/InfoBadge.tsx'

const meta = {
  title: 'Controls/Info badge',
  component: InfoBadge,
  tags: ['autodocs'],
  args: {
    label: 'About this audio preview',
    children: 'ACE-Step preview · 10 seconds',
  },
  decorators: [(Story) => <div className="min-h-20"><Story /></div>],
} satisfies Meta<typeof InfoBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.hover(canvas.getByLabelText('About this audio preview'))
    await expect(canvas.getByText('ACE-Step preview · 10 seconds')).toBeVisible()
  },
}
