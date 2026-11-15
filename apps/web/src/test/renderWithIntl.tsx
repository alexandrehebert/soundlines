import { render, type RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { catalogueFor } from '../i18n/catalogue.ts'
import { DEFAULT_LOCALE } from '../i18n/routing.ts'

export function renderWithIntl(element: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(element, {
    ...options,
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={catalogueFor(DEFAULT_LOCALE)} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    ),
  })
}
