// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExplorerStoryProvider } from '../../stories/ExplorerStoryProvider.tsx'
import { catalogueFor } from '../../i18n/catalogue.ts'
import { ContributionPage } from './ContributionPage.tsx'
import { DatasetGraph } from './DatasetGraph.tsx'
import { OpenDataChangelog } from './OpenDataChangelog.tsx'
import { OpenDataPage } from './OpenDataPage.tsx'
import { OpenDataQuery } from './OpenDataQuery.tsx'

const messages = catalogueFor('en')
const changelog = messages.openData.changelog

function renderOpenData(element: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ExplorerStoryProvider>{element}</ExplorerStoryProvider>
    </NextIntlClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('Open Data interactions', () => {
  it('uses the shared page layout and exposes the active contribution section', () => {
    const { title, contribute } = messages.openData
    renderOpenData(
      <PathnameContext.Provider value="/en/data/contribute">
        <OpenDataPage locale="en"><ContributionPage locale="en" /></OpenDataPage>
      </PathnameContext.Provider>,
    )

    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { name: title, level: 1 })).toBeInTheDocument()
    const sections = within(main).getByRole('navigation', { name: title })
    expect(within(sections).getByRole('link', { name: contribute.title, current: 'page' })).toHaveAttribute('href', '/en/data/contribute')
    expect(within(main).getByRole('link', { name: contribute.findEntry })).toHaveAttribute('href', '/en')
    expect(within(main).getByRole('link', { name: messages.feedback.add })).toHaveAttribute('target', '_blank')
  })

  it('switches the graph example and updates its links', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    const user = userEvent.setup()
    renderOpenData(<DatasetGraph />)

    expect(screen.getByRole('button', { name: 'House' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: /Frankie Knuckles/ })).toBeInTheDocument()

    const jazz = screen.getByRole('button', { name: 'Jazz' })
    await user.click(jazz)
    expect(jazz).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'House' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('link', { name: /New Orleans/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Frankie Knuckles/ })).not.toBeInTheDocument()
  })

  it('shows the MCP JSON schema on demand', async () => {
    const user = userEvent.setup()
    renderOpenData(<OpenDataQuery locale="en" />)

    const heading = screen.getByRole('heading', { name: 'query_graph' })
    const tool = heading.closest('li')!
    const summary = within(tool).getByText(messages.openData.query.schema)
    expect(summary.parentElement).not.toHaveAttribute('open')
    await user.click(summary)
    expect(summary.parentElement).toHaveAttribute('open')
    expect(within(tool).getByText(/"properties"/)).toBeVisible()
  })

  it('resets pagination when filtering changelog entries by category and name', async () => {
    const summary = {
      names: [{ id: 'genre:jazz', name: 'Jazz' }, { id: 'instrument:tr-909', name: 'TR-909' }],
      entries: Array.from({ length: 12 }, (_, index) => ({
        commit: index.toString(16).padStart(8, '0'),
        date: '2026-10-01',
        subject: index === 11 ? 'Revise drum machine artwork' : 'Update Jazz',
        merge: false,
        entities: index === 11
          ? [{ category: 'artwork', items: [4] }]
          : [{ category: 'graph', items: [1] }],
      })),
    }
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(summary)))
    const user = userEvent.setup()
    renderOpenData(<OpenDataChangelog locale="en" />)
    expect(screen.getByRole('status')).toHaveTextContent(changelog.loading)

    const next = await screen.findByRole('button', { name: changelog.next })
    expect(screen.queryByRole('link', { name: /TR-909/ })).not.toBeInTheDocument()
    await user.click(next)
    expect(screen.getByRole('link', { name: /TR-909/ })).toHaveAttribute('href', '/en/instruments/tr-909')
    expect(next).toBeDisabled()

    await user.selectOptions(screen.getByRole('combobox', { name: changelog.category }), 'graph')
    expect(screen.getByRole('button', { name: changelog.previous })).toBeDisabled()
    expect(screen.queryByRole('link', { name: /TR-909/ })).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: changelog.search }), 'bebop')
    expect(screen.getByRole('status')).toHaveTextContent(changelog.empty)
  })
})
