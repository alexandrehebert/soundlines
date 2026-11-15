export const catalogueDataPath = 'packages/catalogue/data'
const legacyDataPath = 'src/data'
export const graphPath = `${catalogueDataPath}/graph.json`

/** @param {string} path */
export function catalogueFileName(path) {
  for (const directory of [catalogueDataPath, legacyDataPath]) {
    if (path.startsWith(`${directory}/`)) return path.slice(directory.length + 1)
  }
}

/**
 * @param {(...args: string[]) => string} git
 * @param {string | null} ref
 * @param {string} [file]
 */
export function cataloguePathAt(git, ref, file = 'graph.json') {
  if (!ref) return undefined
  const current = `${catalogueDataPath}/${file}`
  const legacy = `${legacyDataPath}/${file}`
  const paths = git('ls-tree', '-r', '--name-only', ref, '--', current, legacy).trim().split('\n')
  if (paths.includes(current)) return current
  if (paths.includes(legacy)) return legacy
}
