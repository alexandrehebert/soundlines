import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { Explorer } from '../App.tsx'

const meta = {
  title: 'Screens/Explorer',
  component: Explorer,
  decorators: [withExplorer],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Explorer>

export default meta
type Story = StoryObj<typeof meta>

export const Genres: Story = {}

export const Artists: Story = {
  parameters: { explorer: { initialView: 'artist' } },
}

export const BubbleMap: Story = {
  parameters: { explorer: { initialGenreDisplay: 'bubbles' } },
}

export const WithDetails: Story = {
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}

export const MobileOptions: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Timeline options and legend' }))
    await waitFor(() => expect(canvas.getByRole('dialog', { name: 'Timeline options' })).toBeVisible())
  },
}

export const MobileDetails: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}
