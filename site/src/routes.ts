import { locales, slugs, type Locale, type Slug } from './content.ts'
import { assetPageCount } from './changelog.ts'

export type Route = { locale: Locale; slug: Slug; page?: number }

export const routes: Route[] = locales.flatMap((locale) => [
  ...slugs.map((slug) => ({ locale, slug })),
  ...Array.from({ length: assetPageCount - 1 }, (_, index): Route => ({ locale, slug: 'changelog', page: index + 2 })),
])

/** Path relative to the site base, e.g. `fr/graph/`. */
export const routePath = ({ locale, slug, page }: Route) =>
  slug === 'index' ? `${locale}/` : `${locale}/${slug}/${slug === 'changelog' && page && page > 1 ? `page/${page}/` : ''}`

/** Output file relative to the build directory, e.g. `fr/graph/index.html`. */
export const routeFile = (route: Route) => `${routePath(route)}index.html`

const isLocale = (value: string | undefined): value is Locale => locales.includes(value as Locale)
const isSlug = (value: string | undefined): value is Slug => slugs.includes(value as Slug)

/** Resolves a pathname below `base`; unknown paths fall back to the English overview. */
export function matchRoute(pathname: string, base: string): Route {
  const [locale, slug, segment, number] = pathname.slice(pathname.startsWith(base) ? base.length : 0).split('/').filter(Boolean)
  const page = slug === 'changelog' && segment === 'page' && /^[1-9]\d*$/.test(number ?? '') ? Number(number) : 1
  return {
    locale: isLocale(locale) ? locale : 'en',
    slug: isSlug(slug) && slug !== 'index' ? slug : 'index',
    ...(page > 1 && page <= assetPageCount ? { page } : {}),
  }
}

/** GitHub URL for a repository path: files open as blobs, folders as trees. */
export const repositoryUrl = (repository: string, path: string) => {
  const isFile = path.split('#')[0].split('/').at(-1)?.includes('.')
  return `${repository}/${isFile ? 'blob' : 'tree'}/main/${path}`
}
