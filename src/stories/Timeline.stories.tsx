import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { Timeline } from '../components/Timeline.tsx'

const meta = {
  title: 'Visualizations/Timeline',
  component: Timeline,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withExplorer,
    (Story) => (
      <div className="w-full overflow-hidden border border-slate-800 bg-slate-950"
        style={{ height: 'min(70vh, 640px)', minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Timeline>

export default meta
type Story = StoryObj<typeof meta>

export const FamilyGroups: Story = {}

export const OldestFirst: Story = {
  parameters: { explorer: { initialOrder: 'oldest-first' } },
}

export const Artists: Story = {
  parameters: { explorer: { initialView: 'artist' } },
}

export const ArtistsOldestFirst: Story = {
  parameters: { explorer: { initialView: 'artist', initialOrder: 'oldest-first' } },
}

export const ArtistOffscreenNavigation: Story = {
  parameters: { explorer: { initialView: 'artist', initialOrder: 'oldest-first' } },
  play: async ({ canvasElement }) => {
    const bar = await within(canvasElement).findByRole('button', {
      name: 'Hildegard of Bingen · off-screen to the left; activate to reveal',
    })
    const indicator = bar.querySelector('[data-offscreen-indicator] > rect')
    if (!indicator) throw new Error('Artist off-screen indicator not found')
    await userEvent.click(indicator)
    await waitFor(() => expect(bar).toHaveAttribute('aria-pressed', 'true'))
    await waitFor(() => expect(bar.querySelector('[data-offscreen-indicator]')).not.toBeInTheDocument())
  },
}

export const Instruments: Story = {
  parameters: { explorer: { initialView: 'instrument' } },
}

export const ZoomedOutBceLabels: Story = {
  play: async ({ canvasElement }) => {
    const axis = await waitFor(() => {
      const svg = canvasElement.querySelector<SVGSVGElement>('[data-timeline-axis] svg')
      if (!svg) throw new Error('Timeline axis is missing')
      return svg
    })
    const bounds = axis.getBoundingClientRect()
    for (let step = 0; step < 20; step++) {
      fireEvent.wheel(axis, {
        ctrlKey: true,
        deltaY: 100,
        clientX: bounds.left + bounds.width / 2,
        clientY: bounds.top + bounds.height / 2,
      })
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      const labels = [...axis.querySelectorAll<SVGTextElement>('[data-year-tick] text')]
      for (let i = 1; i < labels.length; i++) {
        const previous = labels[i - 1].getBoundingClientRect()
        const current = labels[i].getBoundingClientRect()
        expect(current.left - previous.right).toBeGreaterThanOrEqual(4)
      }
    }
    const labels = [...axis.querySelectorAll<SVGTextElement>('[data-year-tick] text')]
    expect(labels.length).toBeGreaterThan(1)
    expect(labels.some((label) => label.textContent?.includes('BCE'))).toBe(true)
  },
}

export const InstrumentsOldestFirst: Story = {
  parameters: { explorer: { initialView: 'instrument', initialOrder: 'oldest-first' } },
}

export const SelectedInstrument: Story = {
  parameters: { explorer: { initialView: 'instrument', initialSelectedId: 'instrument:tr-808' } },
}

export const SelectedGenre: Story = {
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}

export const LineageOnSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const house = canvas.getByRole('button', { name: 'House' })
    const techno = canvas.getByRole('button', { name: 'Techno' })
    const snapshot = () => ({
      links: [...canvasElement.querySelectorAll('[data-timeline-link]')]
        .map((link) => [link.getAttribute('data-timeline-link'), link.getAttribute('opacity')]),
      opacity: [...canvasElement.querySelectorAll('[data-timeline-bar]')]
        .map((bar) => bar.getAttribute('opacity')),
    })
    const overview = snapshot()
    expect(overview.opacity.every((opacity) => opacity === '1')).toBe(true)

    await userEvent.hover(house)
    expect(snapshot()).toEqual(overview)

    await userEvent.click(house)
    await waitFor(() => expect(house).toHaveAttribute('aria-pressed', 'true'))
    const selected = snapshot()
    expect(selected.opacity).toContain('0.2')
    expect(selected.links.some(([, opacity]) => opacity === '0.9')).toBe(true)

    await userEvent.hover(techno)
    expect(snapshot()).toEqual(selected)
    expect(house).toHaveAttribute('aria-pressed', 'true')

    await userEvent.unhover(techno)
    expect(snapshot()).toEqual(selected)
  },
}
