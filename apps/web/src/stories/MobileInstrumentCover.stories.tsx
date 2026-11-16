import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { FAMILY_COLORS } from '@soundlines/design-tokens'
import { MobileCover } from '../../../mobile-web/src/design-system/artwork/MobileCover.tsx'
import mobileStyles from '../../../mobile-web/src/styles.css?inline'
import { publicAsset } from '../publicAsset.ts'

const meta = {
  title: 'Screens/Mobile Instrument Cover',
  component: MobileCover,
  args: {
    accent: FAMILY_COLORS.brass,
    kind: 'instrument',
    src: publicAsset('/instrument-avatars/flugelhorn.svg'),
    eager: true,
  },
} satisfies Meta<typeof MobileCover>

export default meta
type Story = StoryObj<typeof meta>

export const RectangularCards: Story = {
  parameters: {
    docs: { description: { story: 'A 12 px accent gradient frames the repeating grid in both tall and wide instrument cards.' } },
  },
  render: (args) => (
    <>
      <style>{mobileStyles}</style>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {[1.5, 0.75].map((ratio) => (
          <div className="node-panel" key={ratio} style={{ width: 'min(100%, 280px)', height: 280 * ratio, gridTemplateRows: '1fr' }}>
            <MobileCover {...args} />
          </div>
        ))}
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const images = Array.from(canvasElement.querySelectorAll('img'))
    await expect(images).toHaveLength(2)
    for (const image of images) {
      await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0))
      const frame = image.parentElement!
      const grid = getComputedStyle(frame, '::before')
      const cell = Math.min(frame.clientWidth, frame.clientHeight) / 8
      await expect(parseFloat(grid.backgroundSize)).toBeCloseTo(cell, 1)
      await expect(grid.backgroundRepeat).toBe('repeat, repeat')
      await expect(getComputedStyle(image).objectFit).toBe('contain')
    }
  },
}
