import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { useState, type MouseEventHandler } from 'react'
import graph from '@soundlines/catalogue/data/graph.json'
import type { MusicGraph } from '@soundlines/catalogue/types'
import { AtlasDetail, LibraryPage } from '../../../mobile-web/src/LibraryPage.tsx'
import { App } from '../../../mobile-web/src/App.tsx'
import { MobileCover } from '../../../mobile-web/src/design-system/artwork/MobileCover.tsx'
import { MobileMasthead } from '../../../mobile-web/src/design-system/navigation/MobileMasthead.tsx'
import { createFeed } from '../../../mobile-web/src/feed.ts'
import { libraryHref, mobileBackLink, pageHref, readRoute } from '../../../mobile-web/src/nodeUrl.ts'
import mobileStyles from '../../../mobile-web/src/styles.css?inline'
import { publicAsset } from '../publicAsset.ts'

const { atlas } = createFeed(graph as MusicGraph)
const entries = new Map(atlas.map((entry) => [entry.node.id, entry]))

const meta = {
  title: 'Screens/Mobile Library',
  component: LibraryPage,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <>
        <style>{mobileStyles}</style>
        <div className="experience"><Story /></div>
      </>
    ),
  ],
  args: { entries: atlas, hidden: false, loadFailed: false, headingRef: null, onNavigate: (event) => event.preventDefault() },
} satisfies Meta<typeof LibraryPage>

export default meta
type Story = StoryObj<typeof meta>

function LibraryBrowser({ initial = '?view=library', loading = false }: { initial?: string; loading?: boolean }) {
  const [route, setRoute] = useState(() => readRoute(initial))
  const { nodeId, libraryType, libraryGroup } = route
  const selection = { type: libraryType, group: libraryGroup }
  const onNavigate: MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault()
    setRoute(readRoute(event.currentTarget.search))
  }

  return (
    <>
      <MobileMasthead back={mobileBackLink(route, atlas.find((entry) =>
        entry.node.type === libraryType && entry.timelineGroup?.id === libraryGroup)?.timelineGroup?.label)} onNavigate={onNavigate} />
      <main className="screen">
        <LibraryPage key={libraryHref(selection)} entries={loading ? undefined : atlas} hidden={nodeId !== null} loadFailed={false} headingRef={null}
          selection={selection} onNavigate={onNavigate}
          renderArtwork={(node) => (
            <MobileCover accent={node.accent} kind="instrument" eager={false}
              src={publicAsset(`/instrument-avatars/${node.id.split(':')[1]}.svg`)} />
          )} />
        {nodeId && <AtlasDetail entries={loading ? undefined : entries} nodeId={nodeId} loadFailed={false} headingRef={null} onNavigate={onNavigate} />}
      </main>
    </>
  )
}

export const Categories: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => <LibraryBrowser />,
}

export const BrowseArtists: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => <LibraryBrowser />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('link', { name: /^Artists/ }))
    await expect(canvas.getByRole('heading', { name: 'Artists', level: 1 })).toBeVisible()
    await waitFor(() => expect(within(canvas.getByRole('banner')).getByRole('link', { name: 'Library' })).toBeVisible())
    await expect(canvas.getByRole('link', { name: /^Classical/ })).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: /^Jazz/ }))
    const page = canvas.getByRole('region', { name: 'Jazz' })
    await expect(within(page).getByRole('link', { name: /^Miles Davis/ })).toBeVisible()
    const rail = within(page).getByRole('navigation', { name: 'Browse by date' })
    const slider = within(rail).getByRole<HTMLInputElement>('slider')
    await fireEvent.change(slider, { target: { value: slider.max } })
    const date = slider.getAttribute('aria-valuetext')!
    await expect(within(page).getByRole('heading', { name: date }).getBoundingClientRect().top)
      .toBeGreaterThanOrEqual(page.getBoundingClientRect().top)
  },
}

export const InstrumentAlbum: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => <LibraryBrowser initial="?view=library&type=instrument&group=strings" />,
  play: async ({ canvas }) => {
    const page = canvas.getByRole('region', { name: 'Strings' })
    const rail = within(page).getByRole('navigation', { name: 'Browse by date' })
    const slider = within(rail).getByRole<HTMLInputElement>('slider')
    const track = rail.querySelector('.chronology-rail')!
    const marker = track.querySelector('span')!
    const readout = rail.querySelector('.chronology-readout')!
    const markerTop = marker.getBoundingClientRect().top
    const cardBounds = rail.getBoundingClientRect()
    const readoutBounds = readout.getBoundingClientRect()
    const trackBounds = track.getBoundingClientRect()
    await expect(trackBounds.left).toBeCloseTo(cardBounds.left)
    await expect(trackBounds.top).toBeCloseTo(cardBounds.top)
    await expect(trackBounds.bottom).toBeCloseTo(cardBounds.bottom)
    await expect(readoutBounds.left + readoutBounds.width / 2).toBeCloseTo(cardBounds.left + cardBounds.width / 2)
    await expect(readoutBounds.height).toBeCloseTo(parseFloat(getComputedStyle(readout).lineHeight), 0)
    await expect(readout.scrollWidth).toBeLessThanOrEqual(readout.clientWidth)
    await expect(marker.getBoundingClientRect().left).toBeCloseTo(track.getBoundingClientRect().right - 1)
    await expect(getComputedStyle(readout).textAlign).toBe('center')
    await expect(marker.getBoundingClientRect().height).toBeLessThanOrEqual(12)
    await expect(getComputedStyle(marker).backgroundColor).toBe(getComputedStyle(track).backgroundColor)
    await expect(slider).toHaveAttribute('aria-valuetext', '1900–1999')
    await expect(readout).toHaveTextContent(/^1900$/)
    slider.focus()
    await fireEvent.change(slider, { target: { value: slider.max } })
    const oldest = within(page).getByRole('heading', { name: 'Before 1 CE' })
    await expect(readout).toHaveTextContent(/^Before 1 CE$/)
    await expect(getComputedStyle(oldest).textAlign).toBe('center')
    await waitFor(async () => {
      const top = oldest.getBoundingClientRect().top - page.getBoundingClientRect().top
      await expect(top).toBeGreaterThanOrEqual(0)
      await expect(top).toBeLessThan(32)
      await expect(slider).toHaveAttribute('aria-valuetext', 'Before 1 CE')
      await expect(marker.getBoundingClientRect().top).toBeCloseTo(markerTop)
    })
    await fireEvent.change(slider, { target: { value: slider.min } })
    await expect(slider).toHaveAttribute('aria-valuetext', '1900–1999')
    await expect(readout).toHaveTextContent(/^1900$/)
    await expect(slider).toHaveFocus()
    await expect(getComputedStyle(readout).textDecorationLine).toBe('none')
  },
}

export const ElectronicInstruments: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => <LibraryBrowser initial="?view=library&type=instrument&group=electronic" />,
  play: async ({ canvas }) => {
    const page = canvas.getByRole('region', { name: 'Electronic & Studio' })
    const slider = within(page).getByRole<HTMLInputElement>('slider', { name: 'Jump to date' })
    await expect(slider).toHaveAttribute('aria-valuetext', '1990–1999')
    await fireEvent.change(slider, { target: { value: slider.max } })
    await expect(slider).toHaveAttribute('aria-valuetext', '1920–1929')
    const oldest = within(page).getByRole('heading', { name: '1920–1929' })
    const top = oldest.getBoundingClientRect().top - page.getBoundingClientRect().top
    await expect(top).toBeGreaterThanOrEqual(0)
    await expect(top).toBeLessThan(32)
  },
}

export const Places: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => <LibraryBrowser initial="?view=library&type=place" />,
}

export const ClassicalGenres: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => <LibraryBrowser initial="?view=library&type=genre&group=classical" />,
  play: async ({ canvas }) => {
    const item = canvas.getByRole('link', { name: /^Minimalism/ })
    const period = within(item).getByText(/1960.*Present/)
    await expect(getComputedStyle(period).textAlign).toBe('end')
    await expect(period.getBoundingClientRect().left).toBeGreaterThan(item.querySelector('strong')!.getBoundingClientRect().right)
    const rail = within(canvas.getByRole('navigation', { name: 'Browse by date' }))
    const slider = rail.getByRole<HTMLInputElement>('slider')
    const dates = canvas.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    await fireEvent.change(slider, { target: { value: String(dates.indexOf('1600')) } })
    await expect(slider).toHaveAttribute('aria-valuetext', '1600')
    const near = rail.getByText('1960')
    const passing = rail.getByText('1500')
    const far = rail.getByText('1000')
    await waitFor(async () => {
      await expect(Number(getComputedStyle(near).opacity)).toBeGreaterThan(Number(getComputedStyle(far).opacity))
      await expect(Number(getComputedStyle(passing).opacity)).toBeGreaterThan(0)
      await expect(Number(getComputedStyle(passing).opacity)).toBeLessThan(Number(getComputedStyle(near).opacity))
      const minorTicks = slider.closest('nav')!.querySelectorAll('.chronology-minor-tick')
      await expect([...minorTicks].some((tick) => Number(getComputedStyle(tick).opacity) > .5)).toBe(true)
    })
  },
}

export const MastheadTransition: Story = {
  render: () => <LibraryBrowser initial="?view=library&type=artist&group=jazz" />,
  play: async ({ canvas, userEvent }) => {
    const header = within(canvas.getByRole('banner'))
    const start = header.getByRole('link', { name: 'Artists' }).getBoundingClientRect().left
    await userEvent.click(canvas.getByRole('link', { name: /^Miles Davis/ }))
    const back = header.getByRole('link', { name: 'Jazz' })
    await expect(header.queryByText('Soundlines')).toBeNull()
    await waitFor(() => expect(back).toBeVisible())
    await userEvent.click(back)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Jazz' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Artists' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Artists' }).getBoundingClientRect().left).toBeCloseTo(start)
  },
}

export const Entry: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(within(canvas.getByRole('banner')).getByRole('link', { name: 'Library' }))
      .toHaveAttribute('href', '?view=library')
    const entryPage = canvas.getByRole('region', { name: 'Disco' })
    const paddedBottom = () => entryPage.getBoundingClientRect().bottom - parseFloat(getComputedStyle(entryPage).paddingBottom)
    const explore = within(canvas.getByRole('region', { name: 'Explore more' }))
    const tracks = explore.getByText('Tracks')
    const track = canvas.getByRole('link', { name: /I Feel Love.*anthems/i })
    await expect(track).toBeVisible()
    await userEvent.click(tracks)
    await expect(track).not.toBeVisible()
    tracks.scrollIntoView({ block: 'end' })
    await userEvent.click(tracks)
    await waitFor(() => expect(track.getBoundingClientRect().bottom)
      .toBeLessThanOrEqual(paddedBottom() + 1))
    const references = within(canvas.getByLabelText('Entry references'))
    const sources = references.getByText('Sources')
    await expect(sources.closest('details')).not.toHaveAttribute('open')
    await userEvent.click(sources)
    await waitFor(() => expect(sources.closest('details')!.getBoundingClientRect().bottom)
      .toBeLessThanOrEqual(paddedBottom() + 1))
    await userEvent.click(sources)
  },
  render: ({ onNavigate }) => (
    <>
      <MobileMasthead back={{ href: pageHref('library'), label: 'Library' }} onNavigate={onNavigate} />
      <main className="screen">
        <AtlasDetail entries={entries} nodeId="genre:disco" loadFailed={false} headingRef={null} onNavigate={onNavigate} />
      </main>
    </>
  ),
}

export const ReturnFromExploreMore: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => <App />,
  play: async ({ canvas, userEvent }) => {
    const nav = within(canvas.getByRole('navigation', { name: 'Main navigation' }))
    await userEvent.click(nav.getByRole('link', { name: 'Search' }))
    await userEvent.type(canvas.getByRole('searchbox'), 'Disco')
    await userEvent.click(await canvas.findByRole('link', { name: 'Disco genre' }))

    const entry = await canvas.findByRole('region', { name: 'Disco' })
    const explore = within(canvas.getByRole('region', { name: 'Explore more' }))
    const track = explore.getByRole('link', { name: /I Feel Love/ })
    track.scrollIntoView({ block: 'center', behavior: 'instant' })
    const scrollTop = entry.scrollTop
    await expect(scrollTop).toBeGreaterThan(0)
    await userEvent.click(track)
    await expect(canvas.getByRole('region', { name: 'I Feel Love' }).scrollTop).toBe(0)

    const masthead = within(canvas.getAllByRole('banner')[0])
    await userEvent.click(masthead.getByRole('link', { name: 'Disco' }))
    const restored = await canvas.findByRole('region', { name: 'Disco' })
    await expect(restored.scrollTop).toBeCloseTo(scrollTop)
  },
}

const loadingViewport = { viewport: { value: 'mobile2', isRotated: false } }

export const CategoriesLoading: Story = {
  globals: loadingViewport,
  render: () => <LibraryBrowser loading />,
}

export const GroupsLoading: Story = {
  globals: loadingViewport,
  render: () => <LibraryBrowser loading initial="?view=library&type=artist" />,
}

export const TimelineLoading: Story = {
  globals: loadingViewport,
  render: () => <LibraryBrowser loading initial="?view=library&type=artist&group=jazz" />,
}

export const AlbumLoading: Story = {
  globals: loadingViewport,
  render: () => <LibraryBrowser loading initial="?view=library&type=instrument&group=strings" />,
}

export const PlacesLoading: Story = {
  globals: loadingViewport,
  render: () => <LibraryBrowser loading initial="?view=library&type=place" />,
}

export const EntryLoading: Story = {
  globals: loadingViewport,
  render: () => <LibraryBrowser loading initial="?view=library&node=genre%3Adisco" />,
}

export const InstrumentEntryLoading: Story = {
  globals: loadingViewport,
  render: () => <LibraryBrowser loading initial="?view=library&node=instrument%3Aguitar" />,
}

export const TextEntryLoading: Story = {
  globals: loadingViewport,
  render: () => <LibraryBrowser loading initial="?view=library&node=artist%3Amiles-davis" />,
}

export const EntryFromHome: Story = {
  render: ({ onNavigate }) => (
    <>
      <MobileMasthead back={{ href: pageHref('home'), label: 'Home' }} onNavigate={onNavigate} />
      <main className="screen">
        <AtlasDetail entries={entries} nodeId="genre:disco" loadFailed={false} headingRef={null} onNavigate={onNavigate} />
      </main>
    </>
  ),
  play: async ({ canvas }) => {
    const back = canvas.getByRole('link', { name: 'Home' })
    await expect(back).toHaveAttribute('href', window.location.pathname)
  },
}

export const InstrumentEntry: Story = {
  render: ({ onNavigate }) => (
    <>
      <MobileMasthead back={{ href: pageHref('library'), label: 'Library' }} onNavigate={onNavigate} />
      <main className="screen">
        <AtlasDetail entries={entries} nodeId="instrument:guitar" loadFailed={false} headingRef={null} onNavigate={onNavigate}
          renderArtwork={(node) => <MobileCover accent={node.accent} kind="instrument" src={publicAsset('/instrument-avatars/guitar.svg')} eager />}
        />
      </main>
    </>
  ),
  play: async ({ canvas }) => {
    const entry = canvas.getByRole('region', { name: 'Guitar' })
    const image = entry.querySelector<HTMLImageElement>('.atlas-artwork img')
    if (!image || !image.parentElement) throw new Error('Instrument artwork is missing')
    await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0))
    const frame = image.parentElement
    const style = getComputedStyle(image)
    const artWidth = image.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const artHeight = image.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    await expect(artWidth).toBe(frame.clientWidth)
    await expect(artHeight).toBe(frame.clientHeight)
  },
}
