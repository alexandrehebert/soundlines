/**
 * URL of a file in `public/`. The app serves it from the site root; the published
 * Storybook lives under a subpath and sets `STORYBOOK_ASSET_BASE` at build time.
 */
export function publicAsset(path: string) {
  return `${process.env.STORYBOOK_ASSET_BASE ?? ''}${path}`
}
