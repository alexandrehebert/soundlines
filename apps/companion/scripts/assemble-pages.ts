import { accessSync, cpSync, rmSync } from 'node:fs'

const site = new URL('../dist/', import.meta.url)
const storybook = new URL('../../storybook/dist/public/', import.meta.url)
const media = new URL('../../../packages/media/dist/', import.meta.url)
const pages = new URL('../dist-pages/', import.meta.url)

accessSync(new URL('index.html', site))
accessSync(new URL('index.html', storybook))
accessSync(new URL('media-manifest.json', media))
rmSync(pages, { recursive: true, force: true })
cpSync(site, pages, { recursive: true })
cpSync(storybook, new URL('storybook/', pages), { recursive: true })
cpSync(media, new URL('media/', pages), { recursive: true })
