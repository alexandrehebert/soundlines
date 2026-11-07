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
