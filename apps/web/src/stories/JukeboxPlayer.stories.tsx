import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { withExplorer } from './withExplorer.tsx'
import { JukeboxPlayer } from '../design-system/playback/Jukebox.tsx'
import '../design-system/home/Home.css'

const meta = {
  title: 'Playback/Jukebox player',
  component: JukeboxPlayer,
  tags: ['autodocs'],
  decorators: [
    withExplorer,
    (Story) => <div className="discovery" style={{ minHeight: 0 }}><Story /></div>,
  ],
  args: { embedded: true },
} satisfies Meta<typeof JukeboxPlayer>

export default meta
type Story = StoryObj<typeof meta>

export const Embedded: Story = {}

export const EmptySearch: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole('searchbox'), 'no matching genre')
    expect(canvas.getByText('No genres match your search.')).toBeVisible()
    expect(canvas.getByRole('button', { name: 'Eject' })).toBeDisabled()
  },
}
