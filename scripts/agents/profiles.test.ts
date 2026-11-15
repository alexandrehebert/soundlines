import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const roleNames = readdirSync('.agents/roles')
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.slice(0, -'.md'.length))
  .sort()

describe('Soundlines agent profiles', () => {
  it.each([
    ['.github/agents', '.agent.md'],
    ['.claude/agents', '.md'],
    ['.codex/agents', '.toml'],
  ])('exposes every shared role in %s', (directory, extension) => {
    expect(roleNames.length).toBeGreaterThan(0)
    const files = readdirSync(directory).filter((file) => file.endsWith(extension)).sort()
    expect(files).toEqual(roleNames.map((name) => `${name}${extension}`).sort())

    for (const name of roleNames) {
      const profile = readFileSync(`${directory}/${name}${extension}`, 'utf8')
      expect(profile).toContain(`.agents/roles/${name}.md`)
    }
  })
})
