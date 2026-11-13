import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from './components/App.tsx'
import { favicon } from './components/assets.ts'
import { copy } from './content.ts'
import { matchRoute } from './routes.ts'
import './styles.css'

const route = matchRoute(location.pathname, import.meta.env.BASE_URL)
const app = (
  <StrictMode>
    <App {...route} />
  </StrictMode>
)
const container = document.getElementById('root')!

// Prerendered pages contain markup; the dev server only has the template's placeholder comment.
if (container.firstElementChild) {
  hydrateRoot(container, app)
} else {
  // Dev server: pages are not prerendered, so render on the client and set the metadata it would have had.
  document.documentElement.lang = route.locale
  document.title = `${copy[route.locale].pages[route.slug].label}${route.page ? ` · ${route.page}` : ''} · Soundlines`
  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!icon) {
    icon = document.createElement('link')
    icon.rel = 'icon'
    document.head.append(icon)
  }
  icon.type = 'image/svg+xml'
  icon.href = favicon
  createRoot(container).render(app)
}
