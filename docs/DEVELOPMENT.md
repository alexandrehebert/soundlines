# Development

[Back to README](../README.md)

Paths in prose and commands are relative to the repository root.

For prerequisites and installation steps, including agent/skill, artwork and
audio tooling, see the [installation guide](./INSTALLATION.md).

## Commands

```bash
npm run dev
npm test
npm run lint
npm run build
npm run start
npm run storybook
npm run build-storybook
```

The [Vercel configuration](../vercel.json) selects the Next.js framework preset.
Do not configure a static `dist` output directory: App Router pages render on
the server.

## Docker Compose

To run the app and Storybook with Docker Compose:

```bash
docker compose up -d           # app and Storybook
docker compose up -d storybook # Storybook only
```

Compose serves the app at `http://localhost:5173` and Storybook at
`http://localhost:6008` on the local machine. Set `STORYBOOK_PORT` to change
the Storybook host port, for example
`STORYBOOK_PORT=6010 docker compose up -d storybook`. The app and Storybook use
separate dependency volumes so their installs do not interrupt one another. The
container image does not include Git, so Storybook's optional Git-based change
detection is unavailable; component hot reload still works.

Before starting another server for browser verification, check
`docker compose ps` and verify the relevant service responds, for example with
`curl -fsS -o /dev/null http://localhost:5173/fr`. Reuse the running Compose
app or Storybook when it is healthy and accessible: the services mount the
working tree and pick up source changes. A browser-tool failure alone does not
mean the service is down; check browser connectivity separately. Start another
server only when necessary, such as when no suitable service is accessible or a
test requires isolation, and stop only servers you started.

## Project companion (GitHub Pages)

The companion at <https://alexandrehebert.github.io/soundlines/> is separate from
the Next.js explorer. It presents the project and the graph, artwork, audio, and
contribution processes in English and French, with links to the full repository
guides rather than automatically rendering the Markdown documentation.

The site uses Node's built-in APIs, with no extra dependencies or client-side
JavaScript. Curated copy lives in [site/content.mjs](../site/content.mjs), the
shared HTML template and asset build in [site/build.mjs](../site/build.mjs), and
the responsive visual style in [site/style.css](../site/style.css). Update both
languages when changing copy. Keep workflow claims aligned with the technical
guides; documentation changes are not automatically imported.

```bash
npm run build:site           # produces the ignored _site/ directory
node --test site/check.mjs   # locales, generated pages, assets and link targets
```

Open `_site/en/index.html` locally, or serve `_site/` with a static HTTP server.
Links and assets are relative so they also work under GitHub's `/soundlines/`
project path. Only the logo and selected instrument examples are copied, not
the full graph, audio library, or Next.js build.

To enable publication once, open the repository's **Settings → Pages** and set
**Build and deployment → Source** to **GitHub Actions**. Merge the changes to
`main`, then run the **Project companion site** workflow manually if needed.
The [workflow](../.github/workflows/project-pages.yml) validates and builds on
relevant pull requests, and deploys on relevant `main` pushes or manual runs
from `main`. The `github-pages` environment may require approval depending on
repository settings. The public URL becomes available only after deployment.

The app's source and companion URLs are in
[src/projectLinks.ts](../src/projectLinks.ts). If moving the repository or site,
also update `repository` and `siteUrl` in the companion content, the README
links, and this guide.

## Storybook

Run `npm run storybook` and open the local URL printed by the command (port
6006 by default). If that port is in use, run
`npm run storybook -- --port 6007` instead. `npm run build-storybook` creates a
static, shareable build in `storybook-static/`.

The catalog includes the project colors, view/layout/order toggles, bubble
zoom buttons, search states, legends, detail panels, timeline bars, the timeline,
the bubble map, and desktop/mobile explorer compositions. Use the Controls,
Actions, Accessibility, and viewport panels to inspect variants and interactions;
some stories also exercise keyboard and search behavior automatically.

Stories use the real music graph with an isolated, in-memory explorer provider.
Selections, search, related-node navigation, view changes, panning, and zoom
are interactive without changing the app's URL or starting its page-loading
transition. The source links in detail panels still open their actual websites.
Timeline labels wait for SVG layout before measuring text, including when an
initially hidden preview is revealed.
