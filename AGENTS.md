<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Local browser verification

- Before starting a server, check `docker compose ps` and whether the app at
  `http://localhost:5173` or Storybook at its configured host port (default
  `http://localhost:6008`) responds. Reuse a healthy running Compose service
  for browser testing.
- A browser-tool failure does not by itself mean the server is down. Check
  browser connectivity separately before starting another server; start one
  only when necessary, and stop only servers you started.

See [Docker Compose](./README.md#docker-compose) for local testing details.
