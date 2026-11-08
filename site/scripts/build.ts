// Builds the project companion for GitHub Pages: client bundle + SSR bundle, then one static,
// hydratable HTML file per locale and page, a sitemap and a language-aware entry page.
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { base } from '../vite.config.ts'

const configFile = fileURLToPath(new URL('../vite.config.ts', import.meta.url))
const outDir = fileURLToPath(new URL('../../_site', import.meta.url))

type Route = { locale: string; slug: string }
type ServerEntry = {
  render: (route: Route) => { head: string; html: string }
  routes: Route[]
  routeFile: (route: Route) => string
  siteUrl: string
  locales: string[]
}

await build({ configFile, logLevel: 'warn' })
// Inside the repository so the externalised React imports resolve from node_modules.
const ssrDir = fileURLToPath(new URL('../../node_modules/.cache/soundlines-site-ssr', import.meta.url))
try {
  await build({ configFile, logLevel: 'warn', build: { ssr: 'src/entry-server.tsx', outDir: ssrDir, emptyOutDir: true } })
  const server: ServerEntry = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href)
  const template = await readFile(join(outDir, 'index.html'), 'utf8')

  for (const route of server.routes) {
    const { head, html } = server.render(route)
    const file = join(outDir, server.routeFile(route))
    await mkdir(dirname(file), { recursive: true })
    await writeFile(
      file,
      template.replace('<!--app-lang-->', route.locale).replace('<!--app-head-->', head).replace('<!--app-html-->', html),
    )
  }

  // Entry page follows the first supported browser language, falling back to English.
  await writeFile(
    join(outDir, 'index.html'),
    `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Soundlines</title>
<link rel="canonical" href="${server.siteUrl}/en/">
<script>location.replace('${base}' + ((navigator.languages || [navigator.language]).map(language => language.toLowerCase().split('-')[0]).find(language => ${JSON.stringify(server.locales)}.includes(language)) || 'en') + '/')</script>
<noscript><meta http-equiv="refresh" content="0;url=${base}en/"></noscript></head>
<body><a href="${base}en/">English</a> · <a href="${base}fr/" lang="fr">Français</a> · <a href="${base}de/" lang="de">Deutsch</a> · <a href="${base}it/" lang="it">Italiano</a> · <a href="${base}es/" lang="es">Español</a></body></html>
`,
  )
  await writeFile(join(outDir, '404.html'), await readFile(join(outDir, 'en/index.html'), 'utf8'))
  await writeFile(join(outDir, '.nojekyll'), '')
  await writeFile(
    join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${server.routes
      .map((route) => `<url><loc>${server.siteUrl}/${server.routeFile(route).replace(/index\.html$/, '')}</loc></url>`)
      .join('')}</urlset>\n`,
  )

  await checkLinks(server.routes.map(server.routeFile))
  console.log(`Built ${server.routes.length} pages into _site/`)
} finally {
  await rm(ssrDir, { recursive: true, force: true })
}

/** Fails the build when a page links to a missing file or anchor under the site base. */
async function checkLinks(files: string[]) {
  const broken: string[] = []
  for (const file of files) {
    const html = await readFile(join(outDir, file), 'utf8')
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^https?:/.test(url)) continue
      const target = new URL(url, `https://site${base}${file}`)
      if (!target.pathname.startsWith(base)) {
        broken.push(`${file}: ${url} (outside ${base})`)
        continue
      }
      const local = join(outDir, target.pathname.slice(base.length) + (target.pathname.endsWith('/') ? 'index.html' : ''))
      try {
        await access(local)
        if (target.hash && !(await readFile(local, 'utf8')).includes(`id="${target.hash.slice(1)}"`)) {
          broken.push(`${file}: ${url} (missing anchor)`)
        }
      } catch {
        broken.push(`${file}: ${url}`)
      }
    }
  }
  if (broken.length) throw new Error(`Broken links:\n${broken.join('\n')}`)
}
