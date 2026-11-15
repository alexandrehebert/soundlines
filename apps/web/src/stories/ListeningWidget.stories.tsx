import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { withExplorer } from './withExplorer.tsx'
import { ListeningWidget } from '../design-system/home/ListeningWidget.tsx'
import '../design-system/home/Home.css'

const meta = {
  title: 'Playback/Listening booth',
  component: ListeningWidget,
  tags: ['autodocs'],
  decorators: [
    withExplorer,
    (Story) => <div className="discovery" style={{ minHeight: 0, maxWidth: 480 }}><Story /></div>,
  ],
  args: { scrollReveal: undefined },
} satisfies Meta<typeof ListeningWidget>

export default meta
type Story = StoryObj<typeof meta>

export const CuratedPicks: Story = {
  play: async ({ canvas }) => {
    expect(canvas.getByRole('link', { name: 'Bossa nova' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next sound' }))
    expect(canvas.getByRole('link', { name: 'Acid jazz' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Previous' }))
    expect(canvas.getByRole('link', { name: 'Bossa nova' })).toBeVisible()
  },
}
