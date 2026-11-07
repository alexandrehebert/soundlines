import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { copy, repository, siteUrl } from './content.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const instruments = [
  { slug: 'theremin', name: 'Theremin', fr: 'Thérémine' },
  { slug: 'tr-808', name: 'TR-808', fr: 'TR-808' },
  { slug: 'timbales', name: 'Timbales', fr: 'Timbales' },
]
export const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])
const pagePath = (slug) => `./${slug}.html`

export function renderPage(locale, slug) {
  const c = copy[locale]
  const page = c.pages[slug]
  const file = slug === 'index' ? '' : `${slug}.html`
  const localFile = `${slug}.html`
  const canonical = `${siteUrl}/${locale}/${file}`
  const navigation = Object.entries(c.pages).map(([key, value]) =>
    `<a href="${pagePath(key)}"${key === slug ? ' aria-current="page"' : ''}>${escapeHtml(value.label)}</a>`).join('')
  const cards = slug === 'index' ? `<section aria-labelledby="inside"><h2 id="inside">${c.next}</h2><div class="cards">${Object.entries(c.pages)
    .filter(([key]) => key !== 'index').map(([key, value], i) =>
      `<a class="card" href="${pagePath(key)}"><span class="number">0${i + 1}</span><h3>${escapeHtml(value.label)}</h3><p>${escapeHtml(value.intro)}</p><span aria-hidden="true">↗</span></a>`).join('')}</div></section>` : ''
  const showcase = page.showcase ? `<div class="samples">${instruments.map((instrument) =>
    `<figure><img src="../assets/${instrument.slug}.svg" width="640" height="160" alt="${escapeHtml(locale === 'fr' ? instrument.fr : instrument.name)}" loading="lazy"><figcaption><img src="../assets/${instrument.slug}-icon.svg" width="24" height="24" alt="">${escapeHtml(locale === 'fr' ? instrument.fr : instrument.name)}</figcaption></figure>`).join('')}</div>` : ''
  const steps = page.steps ? `<section class="workflow" aria-labelledby="workflow"><h2 id="workflow">${c.workflow}</h2><ol>${page.steps.map(([title, description]) =>
    `<li><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></li>`).join('')}</ol></section>` : ''
  const resources = page.resources.map(([path, title]) => {
    const kind = path.split('#')[0].split('/').at(-1).includes('.') ? 'blob' : 'tree'
    return `<li><a href="${repository}/${kind}/main/${path}">${escapeHtml(title)} <span aria-hidden="true">↗</span></a></li>`
  }).join('')
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.label)} · Soundlines</title>
  <meta name="description" content="${escapeHtml(page.intro)}">
  <meta name="theme-color" content="#11101c">
  <meta property="og:title" content="${escapeHtml(page.label)} · Soundlines">
  <meta property="og:description" content="${escapeHtml(page.intro)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${siteUrl}/en/${file}">
  <link rel="alternate" hreflang="fr" href="${siteUrl}/fr/${file}">
  <link rel="alternate" hreflang="x-default" href="${siteUrl}/en/${file}">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
  <a class="skip" href="#main">${c.skip}</a>
  <header class="site-header">
    <a class="brand" href="./index.html"><img src="../assets/favicon.svg" width="34" height="34" alt="">Soundlines<span class="brand-note">${c.navigation}</span></a>
    <nav class="languages" aria-label="${c.language}"><a href="../en/${localFile}" lang="en" hreflang="en"${locale === 'en' ? ' aria-current="page"' : ''}>EN</a><a href="../fr/${localFile}" lang="fr" hreflang="fr"${locale === 'fr' ? ' aria-current="page"' : ''}>FR</a></nav>
    <a class="source" href="${repository}">GitHub <span aria-hidden="true">↗</span></a>
  </header>
  <nav class="page-nav" aria-label="${c.navigation}">${navigation}</nav>
  <main id="main">
    <section class="hero${slug === 'index' ? ' hero-home' : ''}" aria-labelledby="title">
      <div><p class="eyebrow">${slug === 'index' ? c.eyebrow : escapeHtml(page.label)}</p><h1 id="title">${escapeHtml(page.title)}</h1><p class="intro">${escapeHtml(page.intro)}</p>
      ${slug === 'index' ? `<a class="button" href="${repository}">${c.source} <span aria-hidden="true">↗</span></a>` : ''}</div>
      ${slug === 'index' ? '<div class="record" aria-hidden="true"><div class="record-label">SOUNDLINES<br><span>SIDE A / FACE A</span></div></div>' : ''}
    </section>
    ${cards}
    <div class="prose">${page.sections.map(([title, text], i) =>
      `<section aria-labelledby="section-${i}"><h2 id="section-${i}">${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p></section>`).join('')}</div>
    ${showcase}${steps}
    ${page.command ? `<pre><code>${escapeHtml(page.command)}</code></pre>` : ''}
    <aside class="resources" aria-labelledby="resources"><h2 id="resources">${c.resources}</h2><ul>${resources}</ul><p>${c.docsNote}</p></aside>
    <nav class="bottom-nav" aria-label="${c.navigation}">${navigation}</nav>
  </main>
  <footer><a class="brand" href="./index.html">Soundlines</a><p>${c.footer}</p><a href="${repository}">GitHub ↗</a></footer>
</body>
</html>
`
}

export async function buildSite(output = resolve(root, '_site')) {
  await mkdir(resolve(output, 'assets'), { recursive: true })
  await copyFile(resolve(root, 'site/style.css'), resolve(output, 'assets/style.css'))
  await copyFile(resolve(root, 'public/favicon.svg'), resolve(output, 'assets/favicon.svg'))
  for (const instrument of instruments) {
    await copyFile(resolve(root, `public/instrument-banners/${instrument.slug}.svg`), resolve(output, `assets/${instrument.slug}.svg`))
    await copyFile(resolve(root, `public/instrument-icons/${instrument.slug}.svg`), resolve(output, `assets/${instrument.slug}-icon.svg`))
  }
  for (const locale of Object.keys(copy)) {
    await mkdir(resolve(output, locale), { recursive: true })
    for (const slug of Object.keys(copy[locale].pages)) {
      await writeFile(resolve(output, locale, `${slug}.html`), renderPage(locale, slug))
    }
  }
  await writeFile(resolve(output, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0;url=./en/index.html"><title>Soundlines</title><link rel="canonical" href="${siteUrl}/en/"></head><body><a href="./en/index.html">English</a> · <a href="./fr/index.html" lang="fr">Français</a></body></html>\n`)
  await writeFile(resolve(output, '.nojekyll'), '')
  const urls = Object.entries(copy).flatMap(([locale, c]) =>
    Object.keys(c.pages).map((slug) => `${siteUrl}/${locale}/${slug === 'index' ? '' : `${slug}.html`}`))
  await writeFile(resolve(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildSite()
  console.log('Built bilingual project companion in _site/')
}
