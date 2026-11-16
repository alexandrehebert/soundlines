import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { SoundlinesMark } from '@soundlines/ui-web/SoundlinesMark'
import { useRef } from 'react'
import { MobileMasthead } from '../../../mobile-web/src/design-system/navigation/MobileMasthead.tsx'
import { scrollToFeedStart } from '../../../mobile-web/src/scrollToFeedStart.ts'
import { withExplorer } from './withExplorer.tsx'
import { BrandLink } from '../design-system/navigation/BrandLink.tsx'
import { DiscoveryFooter, DiscoveryHeader } from '../design-system/navigation/DiscoveryChrome.tsx'
import { EntryLink, ViewLink } from '../design-system/navigation/ExplorerLinks.tsx'
import { useExplorer } from '../ExplorerContext.ts'

const meta = {
  title: 'Navigation/Discovery',
  decorators: [withExplorer],
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Header: Story = {
  render: () => <div className="discovery"><DiscoveryHeader current="home" /></div>,
}

export const Footer: Story = {
  render: () => <div className="discovery"><DiscoveryFooter current="data" /></div>,
}

export const Brand: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-6 text-slate-200">
      <SoundlinesMark className="size-10" />
      <BrandLink className="inline-flex items-center gap-2 font-bold" href="/" onClick={(event) => event.preventDefault()}>
        Soundlines
      </BrandLink>
    </div>
  ),
}

function ScrollingBrandExample() {
  const feed = useRef<HTMLDivElement>(null)
  return (
    <div className="mx-auto max-w-sm p-4">
      <MobileMasthead onNavigate={(event) => {
        event.preventDefault()
        const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (feed.current) scrollToFeedStart(feed.current, animate)
      }} />
      <div ref={feed} aria-label="Discover feed" role="region" tabIndex={0}
        className="mt-4 h-64 snap-y snap-mandatory overflow-y-auto">
        <article className="grid h-full snap-start place-items-center">
          <div role="region" aria-label="Soundtrail steps" tabIndex={0} className="flex w-full snap-x snap-mandatory overflow-x-auto">
            <div className="w-full shrink-0 snap-start text-center">First step</div>
            <div className="w-full shrink-0 snap-start text-center">Second step</div>
          </div>
        </article>
        <article className="grid h-full snap-start place-items-center">Second card</article>
      </div>
    </div>
  )
}

export const ScrollingBrand: Story = {
  render: () => <ScrollingBrandExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const path = canvasElement.querySelector('[data-soundlines-mark] path')
    if (!path) throw new Error('The Soundlines mark is missing a wave path')
    const resting = path.getAttribute('d')
    const feed = canvas.getByRole('region', { name: 'Discover feed' })
    const trail = canvas.getByRole('region', { name: 'Soundtrail steps' })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const scroll of [() => { trail.scrollLeft = trail.clientWidth }, () => { feed.scrollTop = feed.clientHeight }]) {
      scroll()
      if (!reduced) await waitFor(() => expect(path.getAttribute('d')).not.toBe(resting))
      await waitFor(() => expect(path.getAttribute('d')).toBe(resting), { timeout: 5000 })
    }
    await expect(feed.scrollTop).toBeGreaterThan(0)
    await userEvent.click(canvas.getByRole('link', { name: 'Soundlines home' }))
    await waitFor(() => expect(feed.scrollTop).toBe(0))
  },
}

function ExplorerLinksExample() {
  const { index, selectedId, view } = useExplorer()
  const house = index.nodeById.get('genre:house')
  if (!house) throw new Error('House is missing from the graph fixture')
  return (
    <div className="space-y-2 p-6 text-slate-200">
      <div className="flex gap-4">
        <ViewLink className="underline" view="artist">Artists</ViewLink>
        <EntryLink className="underline" node={house}>House</EntryLink>
      </div>
      <output aria-label="Current explorer selection">{selectedId ?? view}</output>
    </div>
  )
}

export const ExplorerLinks: Story = {
  render: () => <ExplorerLinksExample />,
  play: async ({ canvas, userEvent }) => {
    const house = canvas.getByRole('link', { name: 'House' })
    await expect(house).toHaveAttribute('href', '/en/genres/house')
    await userEvent.click(house)
    await expect(canvas.getByRole('status', { name: 'Current explorer selection' })).toHaveTextContent('genre:house')
  },
}
