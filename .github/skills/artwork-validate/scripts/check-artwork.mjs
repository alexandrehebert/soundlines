#!/usr/bin/env node
// Deterministic gate for the instrument artwork in public/instrument-{icons,avatars,banners,header-backgrounds}.
// Usage (repository root): node .github/skills/artwork-validate/scripts/check-artwork.mjs [slug ...] [--png-dir DIR] [--json]
// Exit code 1 when any FAIL. Rendered checks and PNG sheets need sharp (bundled with next); without it
// they are reported as one WARN and skipped.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const KINDS = {
  icons: { width: 24, height: 24, maxBytes: 2048 },
  avatars: { width: 160, height: 160, maxBytes: 20480 },
  banners: { width: 360, height: 160, maxBytes: 20480 },
  'header-backgrounds': { width: 360, height: 120, maxBytes: 20480 },
}
// The generator's wood gradient predates the theme's strings colour; both are accepted for strings.
const ACCENT_ALIASES = { strings: ['#d9a067'] }
const BACKDROP = '#0b1020'
const LIMITS = {
  headerLeftAlpha: 0.02, // mean alpha of x < 150 px, where the detail panel title sits
  headerRightAlpha: 0.05, // mean alpha of x ≥ 220 px; below this the art is invisible (WARN)
  iconCoverage: { failLow: 0.05, warnLow: 0.1, warnHigh: 0.45, failHigh: 0.6 },
  iconExtent: { fail: 12, warn: 16 }, // longest side of the inked bounding box at 24 px
}
const GENERATOR = 'scripts/artwork/generate-instrument-artwork.py'

const args = process.argv.slice(2)
const pngDir = args.includes('--png-dir') ? args[args.indexOf('--png-dir') + 1] : null
const only = args.filter((arg, index) => !arg.startsWith('--') && args[index - 1] !== '--png-dir')

if (!existsSync('src/data/graph.json')) {
  console.error('Run from the repository root.')
  process.exit(2)
}

const graph = JSON.parse(readFileSync('src/data/graph.json', 'utf8'))
const instruments = graph.nodes
  .filter((node) => node.type === 'instrument')
  .map((node) => ({ slug: node.id.slice('instrument:'.length), name: node.name, family: node.family }))
const bySlug = new Map(instruments.map((instrument) => [instrument.slug, instrument]))
const unknown = only.filter((slug) => !bySlug.has(slug))
if (unknown.length) {
  console.error(`Not instruments in src/data/graph.json: ${unknown.join(', ')}`)
  process.exit(2)
}
const selected = only.length ? only.map((slug) => bySlug.get(slug)) : instruments

const theme = readFileSync('src/theme.ts', 'utf8')
const familyColor = (family) =>
  theme.match(new RegExp(`^\\s*'?${family}'?:\\s*'(#[0-9a-fA-F]{6})'`, 'm'))?.[1].toLowerCase()

const findings = []
const report = (severity, slug, kind, check, detail, owner = 'artwork-draw') =>
  findings.push({ severity, slug, kind, check, detail, owner })

const fileFor = (kind, slug) => join('public', `instrument-${kind}`, `${encodeURIComponent(slug)}.svg`)

function wellFormed(svg) {
  const body = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
  if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(body)) return 'unescaped &'
  const stack = []
  const tag = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g
  let last = 0
  for (const match of body.matchAll(tag)) {
    if (/[<>]/.test(body.slice(last, match.index))) return `malformed markup near offset ${last}`
    last = match.index + match[0].length
    const [, closing, name, , selfClosing] = match
    if (closing) {
      if (stack.pop() !== name) return `unexpected </${name}>`
    } else if (!selfClosing) stack.push(name)
  }
  if (/[<>]/.test(body.slice(last))) return 'malformed markup at end'
  return stack.length ? `unclosed <${stack.at(-1)}>` : null
}

const FORBIDDEN = [
  [/<script\b/i, '<script>'],
  [/<foreignObject\b/i, '<foreignObject>'],
  [/<image\b/i, 'raster or embedded <image>'],
  [/\son[a-z]+\s*=/i, 'event handler attribute'],
  [/(?:href\s*=\s*["']|url\(\s*["']?)(?:https?:|data:|\/\/)/i, 'external or data reference'],
  [/@import/i, '@import'],
  [/<style\b/i, '<style> (use presentation attributes)'],
]

function staticChecks({ slug, family }) {
  const accent = familyColor(family)
  if (!accent) report('FAIL', slug, '-', 'family', `family "${family}" has no colour in src/theme.ts`, 'graph-edit')
  for (const [kind, spec] of Object.entries(KINDS)) {
    const file = fileFor(kind, slug)
    if (!existsSync(file)) {
      report('FAIL', slug, kind, 'missing', file)
      continue
    }
    const svg = readFileSync(file, 'utf8')
    const bytes = statSync(file).size
    if (bytes > spec.maxBytes) report('FAIL', slug, kind, 'size', `${bytes} B > ${spec.maxBytes} B`)
    const parseError = wellFormed(svg)
    if (parseError) report('FAIL', slug, kind, 'xml', parseError)
    const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? ''
    if (!root.includes('xmlns="http://www.w3.org/2000/svg"')) report('FAIL', slug, kind, 'root', 'missing SVG xmlns')
    const viewBox = root.match(/viewBox="([^"]*)"/)?.[1]
    if (viewBox !== `0 0 ${spec.width} ${spec.height}`) {
      report('FAIL', slug, kind, 'viewBox', `${viewBox} ≠ 0 0 ${spec.width} ${spec.height}`)
    }
    for (const [pattern, label] of FORBIDDEN) if (pattern.test(svg)) report('FAIL', slug, kind, 'forbidden', label)
    const ids = [...svg.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1])
    const duplicate = ids.find((id, index) => ids.indexOf(id) !== index)
    if (duplicate) report('FAIL', slug, kind, 'ids', `duplicate id "${duplicate}"`)
    const missingRefs = [...new Set([...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]))].filter((id) => !ids.includes(id))
    if (missingRefs.length) report('FAIL', slug, kind, 'refs', `url(#${missingRefs.join('), url(#')}) not defined`)

    if (kind === 'icons') {
      if (!/\swidth="24"/.test(root) || !/\sheight="24"/.test(root)) report('FAIL', slug, kind, 'root', 'icons need width="24" height="24"')
      if (/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(svg)) report('FAIL', slug, kind, 'monochrome', 'colours in an icon (it is a CSS mask: use currentColor)')
      if (/<(?:defs|linearGradient|radialGradient|mask|pattern|text|filter)\b/.test(svg)) {
        report('FAIL', slug, kind, 'monochrome', 'gradients, masks, patterns, filters or text in an icon')
      }
      if (/opacity="(?!1")/.test(svg)) report('WARN', slug, kind, 'monochrome', 'partial opacity becomes a faint mask')
      if (!/stroke="currentColor"/.test(svg)) report('FAIL', slug, kind, 'stroke', 'icon is not stroked with currentColor')
      const widths = [...svg.matchAll(/stroke-width="([\d.]+)"/g)].map((m) => Number(m[1]))
      if (widths.some((width) => width < 1.5 || width > 2)) report('WARN', slug, kind, 'stroke', `stroke-width ${widths.join('/')} outside 1.5–2`)
      continue
    }
    const hexes = new Set([...svg.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase()))
    const accents = [accent, ...(ACCENT_ALIASES[family] ?? [])]
    if (accent && !accents.some((hex) => hexes.has(hex))) report('FAIL', slug, kind, 'palette', `family accent ${accents.join(' or ')} not used`)
    if (kind === 'header-backgrounds') {
      if (hexes.has(BACKDROP)) report('FAIL', slug, kind, 'backdrop', `${BACKDROP} backdrop in a header (it must stay transparent)`)
      if (!/mask="url\(#[^)]+\)"/.test(svg)) report('FAIL', slug, kind, 'reveal', 'no left-to-right reveal mask')
    } else if (!hexes.has(BACKDROP)) report('FAIL', slug, kind, 'backdrop', `missing the ${BACKDROP} backdrop`)
    if (/<text\b/.test(svg) && family !== 'electronic') report('WARN', slug, kind, 'text', 'text outside electronic hardware panels')
  }
}

function orphanChecks() {
  for (const kind of Object.keys(KINDS)) {
    for (const file of readdirSync(join('public', `instrument-${kind}`))) {
      const slug = decodeURIComponent(file.replace(/\.svg$/, ''))
      if (!file.endsWith('.svg') || !bySlug.has(slug)) {
        report('FAIL', slug, kind, 'orphan', `public/instrument-${kind}/${file} has no instrument node`, 'artwork-draw (delete) or graph-edit')
      }
    }
  }
}

function generatorCheck() {
  const generated = [...readFileSync(GENERATOR, 'utf8').matchAll(/^ {4}'([a-z0-9-]+)': \(/gm)].map((m) => m[1])
  const slugs = only.filter((slug) => generated.includes(slug))
  if (only.length && !slugs.length) return generated
  try {
    execFileSync('python3', [GENERATOR, '--check', ...slugs], { encoding: 'utf8', stdio: 'pipe' })
  } catch (error) {
    const stdout = `${error.stdout ?? ''}`
    for (const line of stdout.split('\n').filter((l) => l.startsWith('DRIFT'))) {
      const [, kind, file] = line.match(/instrument-([\w-]+)\/(.+)\.svg/) ?? []
      report('FAIL', decodeURIComponent(file ?? '?'), kind ?? '-', 'generator',
        'differs from the generator (hand edit or stale run): edit the master in the generator and regenerate')
    }
    if (!stdout.includes('DRIFT')) report('FAIL', '-', '-', 'generator', `${error.stderr || error.message}`.trim().split('\n').at(-1))
  }
  return generated
}

async function loadSharp() {
  try {
    return (await import('sharp')).default
  } catch {
    report('WARN', '-', '-', 'render', 'sharp is not installed: rendered checks and PNG sheets skipped (npm i --no-save sharp)')
    return null
  }
}

const tint = (svg, color) => Buffer.from(svg.replaceAll('currentColor', color))

async function raster(sharp, kind, slug, width, height, color) {
  const file = fileFor(kind, slug)
  if (!existsSync(file)) return null
  const input = color ? tint(readFileSync(file, 'utf8'), color) : file
  return sharp(input, { density: 72 * Math.max(1, width / KINDS[kind].width) }).resize(width, height)
}

async function renderedChecks(sharp, { slug }) {
  const pixels = async (kind, width, height, color) => {
    try {
      return await (await raster(sharp, kind, slug, width, height, color))?.ensureAlpha().raw().toBuffer()
    } catch (error) {
      report('FAIL', slug, kind, 'render', error.message.split('\n')[0])
      return null
    }
  }
  const header = await pixels('header-backgrounds', 360, 120)
  if (header) {
    let left = 0
    let right = 0
    for (let y = 0; y < 120; y++) {
      for (let x = 0; x < 360; x++) {
        const alpha = header[(y * 360 + x) * 4 + 3] / 255
        if (x < 150) left += alpha
        else if (x >= 220) right += alpha
      }
    }
    left /= 150 * 120
    right /= 140 * 120
    if (left > LIMITS.headerLeftAlpha) {
      report('FAIL', slug, 'header-backgrounds', 'legibility', `left alpha ${left.toFixed(3)} > ${LIMITS.headerLeftAlpha} (title area must stay clear)`)
    }
    if (right < LIMITS.headerRightAlpha) {
      report('WARN', slug, 'header-backgrounds', 'presence', `right alpha ${right.toFixed(3)} < ${LIMITS.headerRightAlpha} (art barely visible)`)
    }
  }
  for (const kind of ['banners', 'avatars']) {
    const data = await pixels(kind, KINDS[kind].width, KINDS[kind].height)
    if (data?.some((value, index) => index % 4 === 3 && value < 255)) {
      report('FAIL', slug, kind, 'opaque', 'transparent pixels (the backdrop must cover the canvas)')
    }
  }
  const icon = await pixels('icons', 24, 24, '#ffffff')
  if (icon) {
    let coverage = 0
    let [x0, y0, x1, y1] = [24, 24, -1, -1]
    for (let y = 0; y < 24; y++) {
      for (let x = 0; x < 24; x++) {
        const alpha = icon[(y * 24 + x) * 4 + 3] / 255
        coverage += alpha
        if (alpha > 0.25) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)]
      }
    }
    coverage /= 576
    const extent = Math.max(x1 - x0 + 1, y1 - y0 + 1, 0)
    const c = LIMITS.iconCoverage
    if (coverage < c.failLow || coverage > c.failHigh) {
      report('FAIL', slug, 'icons', 'coverage', `${coverage.toFixed(3)} outside ${c.failLow}–${c.failHigh}`)
    } else if (coverage < c.warnLow || coverage > c.warnHigh) {
      report('WARN', slug, 'icons', 'coverage', `${coverage.toFixed(3)} outside ${c.warnLow}–${c.warnHigh} (too thin or too heavy at 24 px)`)
    }
    if (extent < LIMITS.iconExtent.fail) report('FAIL', slug, 'icons', 'extent', `${extent} px < ${LIMITS.iconExtent.fail} px of 24`)
    else if (extent < LIMITS.iconExtent.warn) {
      report('WARN', slug, 'icons', 'extent', `${extent} px < ${LIMITS.iconExtent.warn} px of 24 (reads small next to the set)`)
    }
  }
}

const escapeXml = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const label = (x, y, text, size = 14, fill = '#94a3b8', weight = 400) =>
  `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(text)}</text>`

async function sheet(sharp, { slug, name, family }) {
  const accent = familyColor(family) ?? '#ffffff'
  const parts = []
  const add = async (kind, width, height, left, top, color) => {
    const image = await raster(sharp, kind, slug, width, height, color)
    if (image) parts.push({ input: await image.png().toBuffer(), left, top })
  }
  await add('banners', 720, 320, 20, 40)
  await add('header-backgrounds', 720, 240, 20, 400)
  await add('avatars', 320, 320, 20, 680)
  await add('icons', 96, 96, 384, 700, accent)
  await add('icons', 48, 48, 500, 724, accent)
  await add('icons', 24, 24, 572, 736, accent)
  await add('icons', 16, 16, 620, 740, accent)
  await add('icons', 24, 24, 572, 790, '#e2e8f0')
  await add('icons', 16, 16, 620, 794, '#e2e8f0')
  const base = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="1030">
    <rect width="760" height="1030" fill="#020617"/>
    ${label(20, 26, `${name} · ${slug} · ${family}`, 16, '#e2e8f0', 700)}
    ${label(20, 384, 'Banner 360×160 @2×')}
    <rect x="20" y="400" width="720" height="240" fill="#020617" stroke="#1e293b"/>
    ${label(44, 470, name, 34, '#f8fafc', 700)}
    ${label(44, 506, 'Mock detail-panel title over the header', 18, '#cbd5e1')}
    ${label(20, 664, 'Header background 360×120 @2× (left side must stay clear)')}
    ${label(20, 1020, 'Avatar 160×160 @2×')}
    <rect x="370" y="690" width="370" height="140" fill="#0f172a" rx="8"/>
    ${label(380, 860, 'Icon mask at 96 / 48 / 24 / 16 px: family colour, then slate-200')}
  </svg>`
  mkdirSync(pngDir, { recursive: true })
  await sharp(Buffer.from(base)).composite(parts).png().toFile(join(pngDir, `${slug}.png`))
  return join(pngDir, `${slug}.png`)
}

async function iconSheet(sharp) {
  const columns = 8
  const cell = 120
  const parts = []
  let labels = ''
  for (const [index, { slug, family }] of instruments.entries()) {
    const x = (index % columns) * cell
    const y = Math.floor(index / columns) * cell
    const color = familyColor(family) ?? '#ffffff'
    for (const [size, left, top] of [[48, x + 16, y + 16], [24, x + 80, y + 28]]) {
      const image = await raster(sharp, 'icons', slug, size, size, color)
      if (image) parts.push({ input: await image.png().toBuffer(), left, top })
    }
    labels += label(x + 8, y + 92, slug, 11)
  }
  const height = Math.ceil(instruments.length / columns) * cell
  const base = `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * cell}" height="${height}"><rect width="100%" height="100%" fill="#0f172a"/>${labels}</svg>`
  mkdirSync(pngDir, { recursive: true })
  await sharp(Buffer.from(base)).composite(parts).png().toFile(join(pngDir, 'icons.png'))
  return join(pngDir, 'icons.png')
}

for (const instrument of selected) staticChecks(instrument)
if (!only.length) orphanChecks()
const generated = generatorCheck()
const sharp = await loadSharp()
const sheets = []
if (sharp) {
  for (const instrument of selected) {
    await renderedChecks(sharp, instrument)
    if (pngDir) sheets.push(await sheet(sharp, instrument))
  }
  if (pngDir) sheets.push(await iconSheet(sharp))
}

const fails = findings.filter((f) => f.severity === 'FAIL')
const warns = findings.filter((f) => f.severity === 'WARN')
if (args.includes('--json')) {
  console.log(JSON.stringify({ checked: selected.map((i) => i.slug), generated, findings, sheets }, null, 2))
} else {
  for (const { slug } of selected) {
    const own = findings.filter((f) => f.slug === slug)
    const failCount = own.filter((f) => f.severity === 'FAIL').length
    const status = failCount ? `FAIL (${failCount})` : own.length ? `WARN (${own.length})` : 'PASS'
    if (own.length || selected.length <= 12) console.log(`${status.padEnd(9)} ${slug}${generated.includes(slug) ? ' [generator]' : ''}`)
    for (const f of own) console.log(`  ${f.severity} ${f.kind} ${f.check}: ${f.detail} → ${f.owner}`)
  }
  for (const f of findings.filter((f) => !selected.some((s) => s.slug === f.slug))) {
    console.log(`${f.severity} ${f.slug} ${f.kind} ${f.check}: ${f.detail} → ${f.owner}`)
  }
  if (sheets.length) console.log(`Sheets: ${sheets.length > 3 ? `${pngDir}/<slug>.png (${sheets.length - 1}), ${pngDir}/icons.png` : sheets.join(', ')}`)
  console.log(`${selected.length} instruments, ${fails.length} FAIL, ${warns.length} WARN`)
}
process.exit(fails.length ? 1 : 0)
