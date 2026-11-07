// Deterministic lint for loop briefs (scripts/loops/briefs/<slug>.json).
//   node .github/skills/loop-brief/scripts/check-brief.mjs [brief.json ...]   (default: every brief)
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const folder = join(root, 'scripts/loops/briefs')
const graph = JSON.parse(readFileSync(join(root, 'src/data/graph.json'), 'utf8'))
const genres = new Set(graph.nodes.filter((n) => n.type === 'genre').map((n) => n.id))
// Whole-word, case-sensitive names of real artists and recordings: prompts must not imitate them.
const protectedNames = graph.nodes
  .filter((n) => (n.type === 'artist' || n.type === 'track') && n.name.length >= 4)
  .map((n) => n.name)
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(folder).filter((f) => f.endsWith('.json') && !f.endsWith('.selection.json')).map((f) => join(folder, f))

let failures = 0
for (const file of files) {
  const problems = []
  const b = JSON.parse(readFileSync(file, 'utf8'))
  const need = (ok, message) => ok || problems.push(message)
  need(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.slug ?? ''), 'slug must be kebab-case')
  need(basename(file) === `${b.slug}.json`, 'file name must be <slug>.json')
  need(genres.has(b.genre), `genre ${b.genre} is not a genre id in graph.json`)
  need(b.asset === undefined || /^public\/loops\/[a-z0-9-]+\.wav$/.test(b.asset), 'asset must be a public/loops/<name>.wav path')
  need(Number.isInteger(b.bpm) && b.bpm >= 60 && b.bpm <= 180, 'bpm must be an integer 60-180 (felt beat; beat tracking is unreliable outside)')
  need([2, 3, 4, 6].includes(b.meter), 'meter must be one of ACE-Step time signatures 2, 3, 4, 6')
  need([2, 4, 8].includes(b.bars), 'bars must be 2, 4 or 8')
  need(/^[A-G][#b]? (major|minor)$/.test(b.key ?? ''), 'key must look like "D minor" or "Bb major"')
  const loopSeconds = ((b.bars * b.meter) * 60) / b.bpm
  need(Number.isInteger(b.duration) && b.duration >= loopSeconds + 14 && b.duration <= 60,
    `duration must be an integer in [${Math.ceil(loopSeconds + 14)}, 60] so several loop starts fit between the 3 s head and 5 s tail`)
  need(Array.isArray(b.seeds) && b.seeds.length >= 3 && b.seeds.length <= 8 && new Set(b.seeds).size === b.seeds.length &&
    b.seeds.every((s) => Number.isInteger(s) && s > 0), 'seeds must be 3-8 unique positive integers')
  const p = b.prompt ?? ''
  need(p.length >= 400 && p.length <= 1600, `prompt must be 400-1600 characters (is ${p.length})`)
  need(p.includes(`${b.bpm} BPM`), `prompt must state "${b.bpm} BPM"`)
  need(p.includes(b.key), `prompt must state the key "${b.key}"`)
  for (const [pattern, label] of [
    [/\binstrumental\b/i, '"instrumental"'],
    [/\bno intro\b/i, '"no intro"'],
    [/\bno fade/i, '"no fade-out"'],
    [/\bno breakdown\b/i, '"no breakdown"'],
    [/\bno singing\b|\bno vocals?\b/i, '"no singing"/"no vocals"'],
    [/\bno speech\b|\bno spoken\b/i, '"no speech"'],
    [/newly composed/i, '"newly composed"'],
  ]) need(pattern.test(p), `prompt must contain ${label}`)
  need(!/\b(in the style of|sounds like|cover of|remake of|sample of|interpolat)/i.test(p), 'prompt must not reference existing works or imitate artists')
  const named = protectedNames.filter((name) => new RegExp(`(^|[^\\p{L}])${escape(name)}([^\\p{L}]|$)`, 'u').test(p))
  need(!named.length, `prompt names real artists/tracks: ${named.join(', ')}`)
  console.log(`${problems.length ? 'FAIL' : 'PASS'} ${file}`)
  for (const problem of problems) console.log(`  - ${problem}`)
  failures += problems.length ? 1 : 0
}
process.exitCode = failures ? 1 : 0
