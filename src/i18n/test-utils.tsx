import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { catalogueFor } from './catalogue.ts'
import { DEFAULT_LOCALE, type Locale } from './routing.ts'

export function renderWithIntl(element: ReactNode, locale: Locale = DEFAULT_LOCALE): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={catalogueFor(locale)}>
      {element}
    </NextIntlClientProvider>,
  )
}
