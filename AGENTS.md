<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project documentation

Use the [documentation index](./docs/README.md) to find the guide, skill, and
validation command for your task.

## Webapp UI changes

- Before changing webapp UI, read the [design system guide](./docs/DESIGN_SYSTEM.md)
  and check Storybook for an existing component to reuse.
- Use components and tokens from `src/design-system`. Add a component or
  extend its API there when the catalogue lacks the required behavior.
- Update the Storybook story and relevant behavior tests in the same change as
  any UI addition or change. Run `npm test` and `npm run build-storybook`.

## Local browser verification

- Before starting a server, check `docker compose ps` and whether the app at
  `http://localhost:5173` or Storybook at its configured host port (default
  `http://localhost:6008`) responds. Reuse a healthy running Compose service
  for browser testing.
- A browser-tool failure does not by itself mean the server is down. Check
  browser connectivity separately before starting another server; start one
  only when necessary, and stop only servers you started.

See [Docker Compose](./docs/DEVELOPMENT.md#docker-compose) for local testing details.
