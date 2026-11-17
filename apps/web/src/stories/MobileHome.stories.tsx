import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { FeedSkeleton } from '../../../mobile-web/src/design-system/CatalogueSkeleton.tsx'
import { App } from '../../../mobile-web/src/App.tsx'
import mobileStyles from '../../../mobile-web/src/styles.css?inline'

const meta = {
  title: 'Screens/Mobile Home',
  component: App,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <><style>{mobileStyles}</style><Story /></>],
} satisfies Meta<typeof App>

export default meta

export const ReturnToFirstEntry: StoryObj<typeof meta> = {
  play: async ({ canvas }) => {
    const feed = canvas.getByRole('region', { name: 'Discover feed' })
    const firstEntry = within(feed).getByRole('article')
    const home = within(canvas.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Home' })

    feed.focus()
    await userEvent.keyboard('{PageDown}')
    await waitFor(() => expect(firstEntry).toHaveAttribute('inert'))
    await userEvent.click(home)
    await waitFor(() => {
      expect(feed.scrollTop).toBe(0)
      expect(firstEntry).not.toHaveAttribute('inert')
    })
  },
}

export const LoadingMoreCards: StoryObj<typeof meta> = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => (
    <div className="experience">
      <div />
      <main className="screen">
        <div className="feed-card feed-card--node"><FeedSkeleton /></div>
      </main>
    </div>
  ),
}
