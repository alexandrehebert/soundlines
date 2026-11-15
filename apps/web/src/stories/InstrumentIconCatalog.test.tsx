// @vitest-environment jsdom
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
