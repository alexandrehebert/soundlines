import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { buildSite, escapeHtml, renderPage } from './build.mjs'
import { copy, repository, siteUrl } from './content.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))

test('escapes text and attribute values', () => {
  assert.equal(escapeHtml(`<&>"'`), '&lt;&amp;&gt;&quot;&#39;')
})

test('English and French cover the same pages and production stages', () => {
  assert.deepEqual(Object.keys(copy.fr.pages), Object.keys(copy.en.pages))
  for (const slug of Object.keys(copy.en.pages)) {
    const en = copy.en.pages[slug]
    const fr = copy.fr.pages[slug]
    assert.equal(fr.sections.length, en.sections.length, slug)
    assert.equal(fr.steps?.length, en.steps?.length, slug)
    assert.deepEqual(fr.resources.map(([path]) => path), en.resources.map(([path]) => path))
  }
})

test('builds ten complete, linked pages that work beneath the repository subpath', async () => {
  const output = await mkdtemp(join(tmpdir(), 'soundlines-site-'))
  try {
    await buildSite(output)
    await access(join(output, '.nojekyll'))
    const sitemap = await readFile(join(output, 'sitemap.xml'), 'utf8')
    assert.equal((sitemap.match(/<loc>/g) ?? []).length, 10)
    for (const [locale, c] of Object.entries(copy)) {
      for (const [slug, page] of Object.entries(c.pages)) {
        const path = join(output, locale, `${slug}.html`)
        const html = await readFile(path, 'utf8')
        assert.equal(html, renderPage(locale, slug))
        assert.ok(html.includes(`<html lang="${locale}">`))
        assert.ok(html.includes(escapeHtml(page.title)))
        assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
        assert.ok(html.includes('href="#main"'))
        assert.ok(html.includes('id="main"'))
        assert.ok(!html.includes('<script'))
        assert.ok(html.includes(`href="../${locale === 'en' ? 'fr' : 'en'}/${slug}.html"`))
        assert.ok(html.includes(`href="${siteUrl}/${locale}/`))
        assert.ok(html.includes(`href="${repository}"`))
        for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
          if (url.startsWith('https:')) continue
          const target = new URL(url, `file://${path}`)
          let local = fileURLToPath(target)
          if (local.endsWith('/')) local += 'index.html'
          await access(local)
          if (target.hash) {
            const text = await readFile(local, 'utf8')
            assert.ok(text.includes(`id="${target.hash.slice(1)}"`), `${path}: ${url}`)
          }
        }
        for (const [resource] of page.resources) {
          await access(join(root, resource.split('#')[0]))
        }
      }
    }
    const entry = await readFile(join(output, 'index.html'), 'utf8')
    assert.ok(entry.includes('0;url=./en/index.html'))
    assert.ok(entry.includes('href="./fr/index.html"'))
  } finally {
    await rm(output, { recursive: true })
  }
})
