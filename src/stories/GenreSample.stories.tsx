import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { GenreSample } from '../design-system/playback/GenreSample.tsx'

const meta = {
  title: 'Playback/Genre sample',
  component: GenreSample,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-fit px-16 py-8"><Story /></div>],
  args: { id: 'genre:jazz', name: 'Jazz' },
} satisfies Meta<typeof GenreSample>

export default meta
type Story = StoryObj<typeof meta>

export const Jazz: Story = {}

export const Attribution: Story = {
  play: async ({ canvas }) => {
    const badge = canvas.getByRole('button', { name: 'About this audio preview' })
    await userEvent.click(badge)
    expect(canvas.getByRole('link', { name: 'ACE-Step' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    expect(badge).toHaveFocus()
    expect(canvas.queryByRole('link', { name: 'ACE-Step' })).not.toBeInTheDocument()
  },
}
