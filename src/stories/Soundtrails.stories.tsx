import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { useExplorer } from '../ExplorerContext.ts'
import { Soundtrails } from '../design-system/home/Soundtrails.tsx'
import { availableSoundtrails } from '../graph/soundtrails.ts'
import '../design-system/home/Home.css'

function SoundtrailsExample() {
  const { index } = useExplorer()
  return <div className="discovery" style={{ minHeight: 0 }}><Soundtrails trails={availableSoundtrails(index)} /></div>
}

const meta = {
  title: 'Playback/Soundtrails',
  component: Soundtrails,
  tags: ['autodocs'],
  decorators: [withExplorer],
  args: { trails: [] },
  render: () => <SoundtrailsExample />,
} satisfies Meta<typeof Soundtrails>

export default meta
type Story = StoryObj<typeof meta>

export const GuidedTrail: Story = {
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: /From soul to techno/ }))
    expect(await within(canvasElement.ownerDocument.body).findByRole('heading', { name: 'Soul' })).toBeVisible()
  },
}
