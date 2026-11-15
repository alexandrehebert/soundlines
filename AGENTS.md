# Soundlines

For the Next.js app, see the [app instructions](./apps/web/AGENTS.md).

## Project documentation

Use the [documentation index](./docs/README.md) to find the guide, skill, and
validation command for your task. Read the matching `SKILL.md` under
[`.agents/skills/`](./.agents/skills/) before starting a documented workflow.

## Git hooks

- Before committing, run `git diff --cached --check` if the repository's
  [pre-commit hook](./docs/DEVELOPMENT.md#git-hooks) is inactive.
- Before pushing app changes, run `pnpm check:push` if type checking and
  app tests have yet to pass for those changes. The automatic pre-push check
  is opt-in. Follow the documented validation commands for the files you changed.

## Webapp UI changes

- Before changing webapp UI, read the [design system guide](./docs/DESIGN_SYSTEM.md)
  and check Storybook for an existing component to reuse.
- Use components from `packages/ui-web` and tokens from `packages/design-tokens`.
  Keep atlas-specific UI in `apps/web/src/design-system`. Extend the relevant
  package when the catalogue lacks a reusable component or token.
- Update the Storybook story and relevant behavior tests in the same change as
  any UI addition or change. Run `pnpm test` and `pnpm build-storybook`.

## Local browser verification

- Before starting a server, check `docker compose ps` and whether the app at
  `http://localhost:5173` or Storybook at its configured host port (default
  `http://localhost:6008`) responds. Reuse a healthy running Compose service
  for browser testing.
- A browser-tool failure does not by itself mean the server is down. Check
  browser connectivity separately before starting another server; start one
  only when necessary, and stop only servers you started.

See [Docker Compose](./docs/DEVELOPMENT.md#docker-compose) for local testing details.
