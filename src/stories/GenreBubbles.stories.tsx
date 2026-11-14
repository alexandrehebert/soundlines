import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { GenreBubbles } from '../components/bubbles/GenreBubbles.tsx'

const meta = {
  title: 'Visualizations/Genre bubbles',
  component: GenreBubbles,
  parameters: { layout: 'fullscreen', explorer: { initialGenreDisplay: 'bubbles' } },
  decorators: [
    withExplorer,
    (Story) => (
      <div className="w-full overflow-hidden border border-slate-800 bg-slate-950"
        style={{ height: 'min(70vh, 640px)', minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GenreBubbles>

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const SelectedGenre: Story = {
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}

export const LineageOnSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const house = canvas.getByRole('button', { name: /^House · Disco & House$/ })
    const techno = canvas.getByRole('button', { name: /^Techno · Techno & Trance$/ })
    const snapshot = () => ({
      links: [...canvasElement.querySelectorAll('[data-bubble-link]')]
        .map((link) => link.getAttribute('data-bubble-link')).sort(),
      opacity: [...canvasElement.querySelectorAll<HTMLButtonElement>('[data-bubble-id]')]
        .map((bubble) => bubble.style.opacity),
    })
    const overview = snapshot()
    expect(overview.links).toHaveLength(0)
    expect(overview.opacity.every((opacity) => opacity === '1')).toBe(true)

    await userEvent.hover(house)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(snapshot()).toEqual(overview)

    await userEvent.click(house)
    await waitFor(() => expect(house).toHaveAttribute('aria-pressed', 'true'))
    const selected = snapshot()
    expect(selected.links.length).toBeGreaterThan(0)
    expect(selected.opacity).toContain('0.2')

    await userEvent.hover(techno)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(snapshot()).toEqual(selected)
    expect(house).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(techno)
    await waitFor(() => expect(techno).toHaveAttribute('aria-pressed', 'true'))
    expect(snapshot().links).not.toEqual(selected.links)
  },
}
