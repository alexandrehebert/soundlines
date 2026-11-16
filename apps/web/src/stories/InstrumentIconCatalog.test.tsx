// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { InstrumentIconCatalog } from './InstrumentIconCatalog.tsx'

it('filters instrument names without case or accents and restores the catalog when cleared', async () => {
  const user = userEvent.setup()
  render(<InstrumentIconCatalog />)
  const search = screen.getByRole('searchbox', { name: 'Filter by instrument name' })
  const catalog = within(screen.getByRole('list', { name: 'Instrument icons' }))

  await user.type(search, 'CUICA')
  expect(catalog.getByRole('listitem')).toHaveTextContent('Cuíca')

  await user.clear(search)
  await user.type(search, 'no-such-instrument')
  expect(screen.getByRole('status')).toHaveTextContent('No instruments match your search.')
  expect(screen.queryByRole('listitem')).toBeNull()

  await user.clear(search)
  expect(screen.getByText('Cuíca')).toBeVisible()
  expect(screen.getByText('Koto')).toBeVisible()
})

it('filters by instrument family and combines it with the name search', async () => {
  const user = userEvent.setup()
  render(<InstrumentIconCatalog />)
  const family = screen.getByRole('combobox', { name: 'Instrument family' })
  const search = screen.getByRole('searchbox', { name: 'Filter by instrument name' })
  const status = screen.getByRole('status')
  const total = status.textContent

  await user.selectOptions(family, 'percussion')
  expect(screen.getByText('Cuíca')).toBeVisible()
  expect(screen.queryByText('Koto')).not.toBeInTheDocument()
  expect(status.textContent).not.toBe(total)

  await user.type(search, 'koto')
  expect(status).toHaveTextContent('No instruments match your search.')

  await user.selectOptions(family, '')
  expect(screen.getByRole('listitem')).toHaveTextContent('Koto')
  expect(status).toHaveTextContent(/^1 of /)

  await user.clear(search)
  expect(status.textContent).toBe(total)
})
