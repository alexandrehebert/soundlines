import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { expect, fn, userEvent, within } from 'storybook/test'
import { BubbleZoomControls } from '../components/BubbleZoomControls.tsx'
import { MAX_BUBBLE_ZOOM, MIN_BUBBLE_ZOOM } from '../components/bubbleViewport.ts'
import { DEFAULT_BUBBLE_ZOOM } from '../theme.ts'

const meta = {
  title: 'Controls/Bubble zoom buttons',
  component: BubbleZoomControls,
  tags: ['autodocs'],
  args: { zoom: DEFAULT_BUBBLE_ZOOM, onZoom: fn() },
  argTypes: {
    zoom: { control: { type: 'number', min: MIN_BUBBLE_ZOOM, max: MAX_BUBBLE_ZOOM, step: 0.1 } },
    onZoom: { control: false },
    controlsRef: { table: { disable: true } },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <div className="flex h-20 w-52 items-start justify-end p-3">
        <BubbleZoomControls {...args} onZoom={(delta) => {
          args.onZoom(delta)
          const zoom = Math.min(MAX_BUBBLE_ZOOM, Math.max(MIN_BUBBLE_ZOOM, Math.round((args.zoom + delta) * 100) / 100))
          updateArgs({ zoom })
        }} />
      </div>
    )
  },
} satisfies Meta<typeof BubbleZoomControls>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Minimum: Story = { args: { zoom: MIN_BUBBLE_ZOOM } }
export const Maximum: Story = { args: { zoom: MAX_BUBBLE_ZOOM } }

export const ZoomIn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in bubbles' }))
    await expect(await canvas.findByText('85%')).toBeInTheDocument()
  },
}
