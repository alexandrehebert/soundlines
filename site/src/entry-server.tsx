import { StrictMode } from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { App, Head } from './components/App.tsx'
import type { Route } from './routes.ts'

export { routeFile, routes } from './routes.ts'
export { siteUrl, locales } from './content.ts'

export function render(route: Route) {
  return {
    head: renderToStaticMarkup(<Head {...route} />),
    html: renderToString(
      <StrictMode>
        <App {...route} />
      </StrictMode>,
    ),
  }
}
