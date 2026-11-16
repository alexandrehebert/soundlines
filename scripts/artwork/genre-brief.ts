import { readdirSync, readFileSync } from 'node:fs'
import sharp from 'sharp'
import type { MusicGraph } from '@soundlines/catalogue/types'

const graph = JSON.parse(readFileSync(new URL('../../packages/catalogue/data/graph.json', import.meta.url), 'utf8')) as MusicGraph
const briefs = new URL('../../docs/artwork/genre-briefs/', import.meta.url)
const covers = new URL('../../packages/media/public/genre-artwork/', import.meta.url)
const genres = new Map(graph.nodes.filter(({ type }) => type === 'genre').map((node) => [node.id, node]))

interface ArtDirection {
  genre: string
  generator: string
  prompt: string
}

const directions = new Map<string, ArtDirection>()
for (const file of readdirSync(briefs).filter((name) => name.endsWith('.json'))) {
  const direction = JSON.parse(readFileSync(new URL(file, briefs), 'utf8')) as ArtDirection
  const id = `genre:${file.slice(0, -'.json'.length)}`
  if (direction.genre !== id || !genres.has(id) || !direction.generator?.trim() || !direction.prompt?.trim()) {
    throw new Error(`Invalid genre art direction: ${file}`)
  }
  directions.set(id, direction)
}

function createBrief(id: string) {
  const genre = genres.get(id)
  if (!genre?.description?.trim() || !genre.family) throw new Error(`Missing catalogue context for ${id}.`)
  const direction = directions.get(id)
  return {
    genre: id,
    name: genre.name,
    family: genre.family,
    period: genre.period ?? null,
    context: genre.description,
    sources: genre.sources ?? [],
    artDirection: direction ? 'saved' : 'draft',
    generator: direction?.generator ?? null,
    format: { aspectRatio: '1:1', format: 'webp' },
    prompt: direction?.prompt ?? [
      `Create one square original editorial genre cover for ${genre.name}.`,
      `Use this catalogue context to choose a single visual subject: ${genre.description}`,
      'Use only settings, performance practices, and objects supported by the context or cited sources.',
      'Compose for a phone-sized card, with a clear focal subject and no text, logos, recognizable portraits, or imitation of an existing cover.',
      'Treat the image as editorial illustration. Avoid recreating or implying a documented event.',
    ].join(' '),
  }
}

const selector = process.argv[2]
if (selector === '--check') {
  for (const id of genres.keys()) createBrief(id)
  const files = readdirSync(covers).filter((name) => !name.startsWith('.'))
  for (const file of files) {
    const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.webp$/.exec(file)
    if (!match || !directions.has(`genre:${match[1]}`)) throw new Error(`Cover needs a saved genre art direction: ${file}`)
    const path = new URL(file, covers)
    const { format, width, height } = await sharp(readFileSync(path)).metadata()
    if (format !== 'webp' || width !== height || width < 640 || width > 1200) {
      throw new Error(`Cover must be a square 640–1200px WebP: ${file}`)
    }
  }
  console.log(`${genres.size} genre briefs available, ${files.length} covers validated.`)
} else if (selector === '--all') {
  console.log(JSON.stringify([...genres.keys()].map(createBrief), null, 2))
} else if (selector) {
  const id = selector.startsWith('genre:') ? selector : `genre:${selector}`
  console.log(JSON.stringify(createBrief(id), null, 2))
} else {
  throw new Error('Usage: pnpm artwork:genres <genre-slug|--all|--check>')
}
