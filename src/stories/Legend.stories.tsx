import type { Meta, StoryObj } from '@storybook/react-vite'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { Legend } from '../components/Legend.tsx'

const meta = {
  title: 'Components/Legend',
  component: Legend,
  decorators: [withExplorer],
  tags: ['autodocs'],
} satisfies Meta<typeof Legend>

export default meta
type Story = StoryObj<typeof meta>

export const Genres: Story = {}
export const Artists: Story = {
  parameters: { explorer: { initialView: 'artist' } },
}
