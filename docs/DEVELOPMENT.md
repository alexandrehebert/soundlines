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

The companion is a small React 19 + TypeScript app built with Vite and styled
with Tailwind CSS v4, the same toolchain as the explorer's Storybook. Every page
is prerendered to static HTML at build time, so it reads and indexes without
JavaScript; the client bundle then hydrates the page for small interactions
such as copying commands.

| Path | Purpose |
| --- | --- |
| [site/src/content.ts](../site/src/content.ts) | Typed English and French copy for every page |
| [site/src/components/](../site/src/components/) | Page layout, sections and the artwork samples taken from `public/` |
| [site/src/routes.ts](../site/src/routes.ts) | Locale and page URLs (`/soundlines/<locale>/<page>/`) |
| [site/src/entry-client.tsx](../site/src/entry-client.tsx), [site/src/entry-server.tsx](../site/src/entry-server.tsx) | Hydration and prerendering entries |
| [site/scripts/build.ts](../site/scripts/build.ts) | Client + SSR build, page prerendering, sitemap, language-aware entry page and internal link check |
| [site/src/site.test.tsx](../site/src/site.test.tsx) | Locale parity, repository links, routes and rendered pages |

Update both languages when changing copy; the types and tests reject missing
fields. Keep workflow claims aligned with the technical guides; documentation
changes are not automatically imported.

```bash
npm run dev:site       # live-reloading companion at http://localhost:5173/soundlines/
npm run test:site      # type-check and tests
npm run build:site     # prerendered site in the ignored _site/ directory
npm run preview:site   # serve _site/ under /soundlines/ (http://localhost:4173/soundlines/)
```

The build fails if a page links to a missing page, asset or anchor. Only the
logo and selected instrument examples are bundled, not the full graph, audio
library, or Next.js build.

To enable publication once, open the repository's **Settings → Pages** and set
**Build and deployment → Source** to **GitHub Actions**. Merge the changes to
`main`, then run the **Project companion site** workflow manually if needed.
The [workflow](../.github/workflows/project-pages.yml) validates and builds on
relevant pull requests, and deploys on relevant `main` pushes or manual runs
from `main`. The `github-pages` environment may require approval depending on
repository settings. The public URL becomes available only after deployment.

The app's source and companion URLs are in
[src/projectLinks.ts](../src/projectLinks.ts), which the companion also uses for
its links and its `/soundlines/` base path. If moving the repository or site,
update that file, the README links, and this guide.

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
