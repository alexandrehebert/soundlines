// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { expect, it, vi } from 'vitest'
import { ExplorerStoryProvider } from '../../stories/ExplorerStoryProvider.tsx'
import { catalogueFor } from '../../i18n/catalogue.ts'
import { DiscoveryFooter, DiscoveryHeader } from './DiscoveryChrome.tsx'

vi.mock('next/navigation', () => ({ usePathname: () => '/en/data/query' }))

it('renders the brand link and switches languages without losing the current data page', () => {
  render(
    <NextIntlClientProvider locale="en" messages={catalogueFor('en')}>
      <ExplorerStoryProvider>
        <DiscoveryHeader current="data" />
        <DiscoveryFooter current="data" />
      </ExplorerStoryProvider>
    </NextIntlClientProvider>,
  )

  const brand = within(screen.getByRole('banner')).getByRole('link', { name: 'Soundlines' })
  expect(brand).toHaveAttribute('href', '/en')
  expect(brand).not.toHaveAttribute('aria-current')

  const languages = within(screen.getByRole('navigation', { name: 'Language' }))
  expect(languages.getByRole('link', { name: 'English', current: 'page' })).toHaveAttribute('href', '/en/data/query')
  expect(languages.getByRole('link', { name: 'Français' })).toHaveAttribute('href', '/fr/data/query')

  const pages = within(screen.getByRole('navigation', { name: 'Pages' }))
  expect(pages.getByRole('link', { current: 'page' })).toHaveAttribute('href', '/en/data')
})
