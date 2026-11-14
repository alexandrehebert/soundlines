import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { GenreDisplaySelect } from '../components/ExplorerControls.tsx'

const meta = {
  title: 'Controls/Genre layout',
  component: GenreDisplaySelect,
  decorators: [
    withExplorer,
    (Story) => <div className="inline-flex"><Story /></div>,
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof GenreDisplaySelect>

export default meta
type Story = StoryObj<typeof meta>

export const Bars: Story = {}

export const Bubbles: Story = {
  parameters: { explorer: { initialGenreDisplay: 'bubbles' } },
}

export const SwitchingLayouts: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Bubbles' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'Bubbles' })).toHaveAttribute('aria-pressed', 'true')
      await expect(canvas.getByRole('button', { name: 'Bars' })).toHaveAttribute('aria-pressed', 'false')
    })
  },
}
