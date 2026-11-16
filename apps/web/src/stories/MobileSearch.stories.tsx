import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import graph from '@soundlines/catalogue/data/graph.json'
import type { MusicGraph } from '@soundlines/catalogue/types'
import { SearchPage } from '../../../mobile-web/src/SearchPage.tsx'
import { createFeed } from '../../../mobile-web/src/feed.ts'
import mobileStyles from '../../../mobile-web/src/styles.css?inline'

const meta = {
  title: 'Screens/Mobile Search',
  component: SearchPage,
  parameters: { layout: 'fullscreen' },
  args: { catalogue: createFeed(graph as MusicGraph), hidden: false, loadFailed: false, headingRef: null },
  decorators: [(Story) => (
    <>
      <style>{mobileStyles}</style>
      <div className="experience"><main className="screen"><Story /></main></div>
    </>
  )],
} satisfies Meta<typeof SearchPage>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvas }) => {
    const page = canvas.getByRole('region', { name: 'Search' })
    const heading = within(page).getByRole('heading', { level: 1, name: 'Search' })
    await expect(heading.getBoundingClientRect().height).toBe(1)
    await expect(within(page).getByRole('searchbox')).toBeVisible()
  },
}

export const Results: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('searchbox'), 'rai')
    await expect(canvas.getByRole('link', { name: 'Raï genre' })).toBeVisible()
  },
}

export const Loading: Story = {
  args: { catalogue: undefined },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('status', { name: 'Loading the catalogue' })).toBeInTheDocument()
    await userEvent.type(canvas.getByRole('searchbox'), 'rai')
  },
}
