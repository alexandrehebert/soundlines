import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { buildChangelog, categoryFor, packAssetChangelog } from './generate.ts'

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'soundlines-changelog-'))
  directories.push(cwd)
  const git = (...args: string[]) => execFileSync('git', args, {
    cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE: '2026-01-02T03:04:05Z', GIT_COMMITTER_DATE: '2026-01-02T03:04:05Z' },
  }).trim()
  git('init', '-b', 'main')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'Changelog test')
  git('config', 'commit.gpgsign', 'false')
  const write = (path: string, value: unknown) => {
    mkdirSync(join(cwd, path, '..'), { recursive: true })
    writeFileSync(join(cwd, path), typeof value === 'string' ? value : JSON.stringify(value))
  }
  const commit = (subject: string) => {
    git('add', '.')
    git('commit', '-m', subject)
    return git('rev-parse', 'HEAD')
  }
  return { cwd, git, write, commit }
}

describe('deterministic changelog', () => {
  it('backfills root history, semantic graph changes, assets, deletions and ignores generated-only commits', () => {
    const { cwd, write, commit, git } = fixture()
    write('src/data/graph.json', { nodes: [{ id: 'genre:a', name: 'A' }, { id: 'genre:b' }], edges: [{ id: 'edge:a' }] })
    write('public/audio/genre-a.mp3', 'first take')
    const first = commit('Initial graph <test>')
    write('src/data/graph.json', { nodes: [{ id: 'genre:a', name: 'Revised' }, { id: 'genre:c' }], edges: [] })
    git('rm', 'public/audio/genre-a.mp3')
    write('public/loops/genre-a.wav', 'replacement')
    const second = commit('Revise graph and audio')
    write('CHANGELOG.md', 'generated')
    write('docs/changelog.json', '{}')
    commit('Update changelog at old path')
    git('rm', 'docs/changelog.json')
    write('docs/changelog/changelog.json', '{}')
    commit('Move generated changelog')
    write('public/loops/uncommitted.wav', 'not shipped')
    const result = buildChangelog(cwd)
    expect(result.data.entries.map(({ commit }) => commit)).toEqual([second, first])
    expect(result.data.entries[0].graph).toEqual({
      nodes: { added: ['genre:c'], updated: ['genre:a'], removed: ['genre:b'] },
      edges: { added: [], updated: [], removed: ['edge:a'] },
    })
    expect(result.data.entries[1].graph?.nodes.added).toEqual(['genre:a', 'genre:b'])
    expect(result.data.entries[0].groups.map(({ category }) => category)).toEqual(['graph', 'previews', 'loops'])
    expect(result.data.entries[0].parent).toBe(first)
    expect(result.data.entries[0].groups[1].files).toEqual([{ status: 'D', path: 'public/audio/genre-a.mp3' }])
    expect(result.markdown).toContain('[full JSON audit](./docs/changelog/changelog.json)')
    expect(result.markdown).toContain('&lt;test>')
    expect(result.json).not.toContain('uncommitted')
    const compact = JSON.parse(result.assetJson) as ReturnType<typeof packAssetChangelog>
    expect(compact.entries.map(({ commit }) => commit)).toEqual([second, first])
    expect(compact.entries[0].entities.map(({ category }) => category)).toEqual(['graph', 'previews', 'loops'])
    expect(compact.entries[1].entities.map(({ category }) => category)).toEqual(['graph', 'previews'])
    expect(compact.entries.flatMap(({ entities }) => entities.flatMap(({ items }) => items))
      .every((packed) => Math.floor(packed / 3) < compact.names.length)).toBe(true)
    expect(buildChangelog(cwd)).toEqual(result)
  })

  it('does not count object-key order or entity-array reordering as graph edits', () => {
    const { cwd, write, commit } = fixture()
    write('src/data/graph.json', { nodes: [{ id: 'a', name: 'A' }, { id: 'b' }], edges: [] })
    commit('Initial')
    write('src/data/graph.json', { nodes: [{ id: 'b' }, { name: 'A', id: 'a' }], edges: [] })
    commit('Reorder')
    expect(buildChangelog(cwd).data.entries[0].graph?.nodes).toEqual({ added: [], updated: [], removed: [] })
  })

  it('names changed assets from historical entities, deduplicates variants and includes both old and new relationship endpoints', () => {
    const { cwd, write, commit } = fixture()
    const nodes = [
      { id: 'genre:acid-house', name: 'Acid House' },
      { id: 'genre:techno', name: 'Techno' },
      { id: 'genre:hip-hop', name: 'Hip-hop' },
      { id: 'instrument:saxophone', name: 'Saxophone' },
      { id: 'artist:a', name: 'Original Artist' },
      { id: 'genre:removed', name: 'Forgotten Genre' },
    ]
    write('src/data/graph.json', { nodes, edges: [{ id: 'link:a', from: 'artist:a', to: 'genre:acid-house' }] })
    write('docs/previews/briefs/electric.json', { 'acid-house': { bpm: 120 }, techno: { bpm: 130 } })
    commit('Initial assets')
    write('src/data/graph.json', {
      nodes: [
        ...nodes.filter(({ id }) => id !== 'genre:removed').map((node) => node.id === 'artist:a' ? { ...node, name: 'Renamed Artist' } : node),
        { id: 'genre:new', name: 'New Genre' },
      ],
      edges: [{ id: 'link:a', from: 'artist:a', to: 'genre:techno' }],
    })
    write('public/genre-previews/acid-house.m4a', 'take')
    write('public/loops/turntable-hip-hop.wav', 'loop')
    write('public/instrument-icons/saxophone.svg', '<svg/>')
    write('public/instrument-banners/saxophone.svg', '<svg/>')
    write('docs/artwork/briefs/saxophone.json', { slug: 'saxophone' })
    write('docs/graph/evidence/nodes/genre/acid-house.md', 'sources')
    write('docs/graph/evidence/nodes/genre/new.md', 'sources')
    write('docs/previews/briefs/electric.json', { 'acid-house': { bpm: 125 }, techno: { bpm: 130 } })
    write('src/data/graph.fr.json', { nodes: { 'genre:techno': { name: 'Techno' } } })
    commit('Revise named assets')
    write('src/data/graph.fr.json', { nodes: { 'genre:techno': { name: 'Techno', description: 'Traduction' } } })
    commit('Translate one entity')
    write('scripts/previews/render-ace-previews.mjs', 'production tooling')
    commit('Tooling only')
    const [tooling, translation, assets] = buildChangelog(cwd).data.entries
    expect(tooling.entities).toEqual([])
    expect(translation.entities).toEqual([{ category: 'graph', items: [{ id: 'genre:techno', name: 'Techno', status: 'updated' }] }])
    expect(assets.entities).toEqual([
      { category: 'graph', items: [
        { id: 'artist:a', name: 'Renamed Artist', status: 'updated' },
        { id: 'genre:acid-house', name: 'Acid House', status: 'updated' },
        { id: 'genre:new', name: 'New Genre', status: 'added' },
        { id: 'genre:removed', name: 'Forgotten Genre', status: 'removed' },
        { id: 'genre:techno', name: 'Techno', status: 'updated' },
      ] },
      { category: 'previews', items: [{ id: 'genre:acid-house', name: 'Acid House', status: 'updated' }] },
      { category: 'loops', items: [{ id: 'genre:hip-hop', name: 'Hip-hop', status: 'added' }] },
      { category: 'artwork', items: [{ id: 'instrument:saxophone', name: 'Saxophone', status: 'added' }] },
    ])
  })

  it('does not depend on local Git diff ordering or metadata display configuration', () => {
    const { cwd, write, commit, git } = fixture()
    write('docs/a.md', 'a')
    write('docs/b.md', 'b')
    commit('Docs')
    const before = buildChangelog(cwd)
    write('.git/order', 'docs/b.md\ndocs/a.md\n')
    git('config', 'diff.orderFile', join(cwd, '.git/order'))
    git('config', 'log.showSignature', 'true')
    git('config', 'notes.displayRef', 'refs/notes/commits')
    git('notes', 'add', '-m', 'Not part of the commit message')
    expect(buildChangelog(cwd)).toEqual(before)
  })

  it('omits clean merges, whose branch commits are already listed, without repeating their changes', () => {
    const { cwd, write, commit, git } = fixture()
    write('README.md', 'root')
    commit('Root')
    git('checkout', '-b', 'preview')
    write('public/audio/a.mp3', 'take')
    const branch = commit('Preview')
    git('checkout', 'main')
    write('docs/guide.md', 'guide')
    commit('Guide')
    git('merge', '--no-ff', 'preview', '-m', 'Integrate preview')
    const entries = buildChangelog(cwd).data.entries
    expect(entries.map(({ subject }) => subject).sort()).toEqual(['Guide', 'Preview', 'Root'])
    expect(entries.some(({ merge }) => merge)).toBe(false)
    expect(entries.filter(({ groups }) => groups.some(({ category }) => category === 'previews')).map(({ commit }) => commit)).toEqual([branch])
  })

  it('keeps only what a merge introduced itself, such as a conflict resolution', () => {
    const { cwd, write, commit, git } = fixture()
    const node = (id: string, name: string) => ({ id: `genre:${id}`, name })
    write('src/data/graph.json', { nodes: [node('a', 'A')], edges: [] })
    commit('Root')
    git('checkout', '-b', 'branch')
    write('src/data/graph.json', { nodes: [node('a', 'A'), node('b', 'B')], edges: [] })
    commit('Add B')
    git('checkout', 'main')
    write('src/data/graph.json', { nodes: [node('a', 'A'), node('c', 'C')], edges: [] })
    write('docs/guide.md', 'guide')
    commit('Add C')
    expect(() => git('merge', '--no-ff', 'branch', '-m', 'Merge branch')).toThrow()
    write('src/data/graph.json', { nodes: [node('a', 'A renamed'), node('b', 'B'), node('c', 'C'), node('d', 'D')], edges: [] })
    git('add', '.')
    git('commit', '--no-edit')
    const [merge] = buildChangelog(cwd).data.entries
    expect(merge.merge).toBe(true)
    expect(merge.groups).toEqual([{ category: 'graph', files: [{ status: 'M', path: 'src/data/graph.json' }] }])
    expect(merge.graph?.nodes).toEqual({ added: ['genre:d'], updated: ['genre:a'], removed: [] })
    expect(merge.entities).toEqual([{ category: 'graph', items: [
      { id: 'genre:a', name: 'A renamed', status: 'updated' },
      { id: 'genre:d', name: 'D', status: 'added' },
    ] }])
  })

  it('rejects shallow history instead of silently publishing an incomplete backfill', () => {
    const { cwd, write, commit, git } = fixture()
    write('README.md', 'root')
    commit('Root')
    write('README.md', 'next')
    commit('Next')
    const shallow = mkdtempSync(join(tmpdir(), 'soundlines-shallow-'))
    directories.push(shallow)
    git('clone', '--depth=1', `file://${cwd}`, shallow)
    expect(() => buildChangelog(shallow)).toThrow('complete history')
  })

  it('writes and checks generated changelogs, fails on drift and remains stable after a generated-only commit', () => {
    const { cwd, write, commit } = fixture()
    write('docs/guide.md', 'guide')
    commit('Document workflow')
    const script = fileURLToPath(new URL('./generate.ts', import.meta.url))
    const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' })
    expect(run().status).toBe(0)
    expect(run('--check').status).toBe(0)
    write('public/open-data-changelog.json', 'stale')
    const assetCheck = run('--check')
    expect(assetCheck.status).not.toBe(0)
    expect(assetCheck.stderr).toContain('public/open-data-changelog.json is stale')
    expect(run().status).toBe(0)
    expect(run('--check').status).toBe(0)
    commit('Update generated changelog')
    expect(run('--check').status).toBe(0)
    write('CHANGELOG.md', 'stale')
    const check = run('--check')
    expect(check.status).not.toBe(0)
    expect(check.stderr).toContain('CHANGELOG.md is stale')
    expect(run('--surprise').status).not.toBe(0)
  })

  it.each([
    ['docs/graph/evidence/nodes/a.md', 'graph'],
    ['src/data/graph.fr.json', 'graph'],
    ['docs/previews/briefs/a.json', 'previews'],
    ['scripts/previews/render-ace-previews.mjs', 'previews'],
    ['public/genre-previews/acid-house.m4a', 'previews'],
    ['.github/skills/preview-produce/SKILL.md', 'previews'],
    ['docs/loops/briefs/a.selection.json', 'loops'],
    ['.github/skills/loop-produce/SKILL.md', 'loops'],
    ['public/instrument-icons/a.svg', 'artwork'],
    ['.github/instructions/instrument-artwork.instructions.md', 'artwork'],
    ['site/src/locales/en.ts', 'site'],
    ['.github/workflows/graph-quality.yml', 'workflow'],
    ['docs/DEVELOPMENT.md', 'docs'],
    ['src/components/timeline/Timeline.tsx', 'app'],
    ['LICENSE', 'other'],
  ])('classifies %s as %s', (path, category) => {
    expect(categoryFor(path)).toBe(category)
  })
})
