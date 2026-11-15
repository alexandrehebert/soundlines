# Development

[Back to README](../README.md)

Paths in prose and commands are relative to the repository root.

For prerequisites and installation steps, including agent/skill, artwork and
audio tooling, see the [installation guide](./INSTALLATION.md).

## Commands

```bash
pnpm dev              # Next.js defaults to http://localhost:3000
pnpm test
pnpm lint
pnpm typecheck
pnpm build            # builds web, companion, and Storybook through Turborepo
pnpm build:web        # builds the Next.js app only
pnpm start
pnpm storybook
pnpm build-storybook
```

For Vercel, set **Root Directory** to `apps/web` and enable **Include source
files outside of the Root Directory** so the build can read workspace packages
and the source assets. Set `ENABLE_EXPERIMENTAL_COREPACK=1` in the build settings
to use the pnpm version pinned in the root package manifest. The [Vercel configuration](../apps/web/vercel.json)
selects the Next.js preset. Validate the change on a preview project with this
root before switching the production project. Check a localized atlas route,
`/api/mcp`, a public asset URL, and a legacy locale redirect.

Put local Next.js environment variables in `apps/web/.env.local`. If you
already have a root `.env.local`, move the Next.js settings into the app's file.

Edit artwork and audio in `apps/web/public/`. Next.js serves that directory
directly at the site's base URL.

## Git hooks

The repository ships Git hooks in [`.githooks`](../.githooks). From the
repository root, check `git config --show-origin --get core.hooksPath` for an
existing hooks path before changing it. To activate Soundlines' hooks, set the
hook path once in each clone:

```bash
git config --local core.hooksPath .githooks
```

- **Before committing**, `pre-commit` runs `git diff --cached --check` to catch
  newly introduced whitespace errors and conflict markers in staged changes.
  It uses host Git, including when the app runs in Compose. Run the command
  manually after staging if the hook is inactive.
- **Before pushing**, `pnpm check:push` runs the app TypeScript check and
  `pnpm test`. Run it manually from the repository root, or run
  `SOUNDLINES_PRE_PUSH=1 git push` from a POSIX shell with the hooks enabled.
  An ordinary push skips this check. It uses the current checkout, including
  any uncommitted edits, and requires host Node.js 26 and dependencies from `pnpm install --frozen-lockfile`.

GitHub Actions checks the committed changes. Use the validation commands in
the [documentation index](./README.md) for the parts of the project you changed.

## Docker Compose

To run the app, Storybook and the companion site with Docker Compose:

```bash
docker compose up -d           # app, Storybook and companion site
docker compose up -d storybook # Storybook only
docker compose up -d site      # companion site only
```

Compose serves the app at `http://localhost:5173`, Storybook at
`http://localhost:6008` and the live-reloading companion site at
`http://localhost:5174/soundlines/` on the local machine. Set `STORYBOOK_PORT`
or `SITE_PORT` to change those host ports, for example
`STORYBOOK_PORT=6010 docker compose up -d`. The services use
Node 26 and container-only dependency volumes. The dependency service installs
dependencies. Run Git-based graph tooling and Python artwork checks on the host.
Compose also uses these host ports for the links between the explorer, companion
and Storybook. Recreate the
services with `docker compose up -d` after changing either port. The
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
the Next.js explorer. It explains, for curious non-specialists, how the content
was produced: where graph facts come from and how sources are fetched and
checked, how instrument artwork and audio are made, and how the app and its
AI-assisted workflow are built. Each process is drawn as a workflow diagram whose
steps are tagged by who performs them (person, AI assistant, AI model, code or
automatic check), with real documented examples. Each page's legend includes
only the actors used in its workflows. It is available in English, French, German, Italian and Spanish
and links to the full repository guides rather than rendering the Markdown
documentation.

The companion is a small React 19 + TypeScript app built with Vite and styled
with Tailwind CSS v4, the same toolchain as the explorer's Storybook. Every page
is prerendered to static HTML at build time, so it reads and indexes without
JavaScript; the client bundle then hydrates the page for small interactions
such as the audio player. The language switcher keeps the current page and
provides links without JavaScript; the app link opens the selected language.

| Path | Purpose |
| --- | --- |
| [apps/companion/src/content.ts](../apps/companion/src/content.ts) | Page, workflow and example types; resolves `{figure}` placeholders |
| [apps/companion/src/locales/](../apps/companion/src/locales/) | English, French, German, Italian and Spanish page content and interface text |
| [apps/companion/scripts/stats.ts](../apps/companion/scripts/stats.ts) | Figures shown on the companion, computed at build time from the graph, evidence, assets, agents and skills |
| [apps/companion/src/components/](../apps/companion/src/components/) | Page layout, workflow diagrams, examples and the artwork and loop samples taken from `apps/web/public/` |
| [apps/companion/src/components/Previews.tsx](../apps/companion/src/components/Previews.tsx) | Small preview of what each workflow step produces, ending with the real result (app screenshot, artwork, loop) |
| [apps/companion/src/components/blueprint.ts](../apps/companion/src/components/blueprint.ts) | Extracts the saxophone's generated outline, canvas and curve handles for the vector sketch |
| [apps/companion/src/assets/screens/](../apps/companion/src/assets/screens/) | App screenshots per locale used as final results; retake them when the explorer UI changes noticeably |
| [apps/companion/scripts/waveform.ts](../apps/companion/scripts/waveform.ts) | Reads the shipped loop at build time to draw its real waveform |
| [apps/companion/src/components/playback.ts](../apps/companion/src/components/playback.ts) | Keeps the waveform cursor and played color aligned with the audio element's media clock, including seeks, pauses and loop restarts |
| [apps/companion/src/routes.ts](../apps/companion/src/routes.ts) | Locale and page URLs (`/soundlines/<locale>/<page>/`) |
| [apps/companion/src/entry-client.tsx](../apps/companion/src/entry-client.tsx), [apps/companion/src/entry-server.tsx](../apps/companion/src/entry-server.tsx) | Hydration and prerendering entries |
| [apps/companion/scripts/build.ts](../apps/companion/scripts/build.ts) | Client + SSR build, page prerendering, sitemap, language-aware entry page and internal link check |
| [apps/companion/src/site.test.tsx](../apps/companion/src/site.test.tsx) | Locale parity, repository links, routes and rendered pages |

Raw takes are not stored in the repository, so the complete-take waveform in
the audio selection preview is schematic. The highlighted section and the
retained waveform use the shipped loop; their timing comes from its selection
report. The final player's waveform is also read from that same WAV; its cursor
and played color follow `currentTime / duration`, not an independent animation timer.
The artwork sketch uses the generated saxophone icon's shared outline and
first curve; its dimensions are SVG drawing units, not the instrument's physical size.

Update all five locales when changing localized content. Types and tests check that workflow
steps, actors, output kinds, preview kinds and return paths match across locales. Write
counts as placeholders such as `{connections}` instead of literal numbers, so
they follow the data. Keep workflow claims and examples aligned with the
technical guides; documentation changes are not automatically imported.

```bash
pnpm dev:site       # native companion at the URL Vite prints, under /soundlines/
pnpm test:site      # type-check and tests
pnpm build:site     # prerendered site in apps/companion/dist/
pnpm preview:site   # serve the site at http://localhost:4173/soundlines/
```

The build fails if a page links to a missing page, asset or anchor. Only the
logo, selected instrument examples and the landing hip-hop loop are bundled,
not the full graph, audio library, or Next.js build; the graph contributes only
its computed figures.

To enable publication once, open the repository's **Settings → Pages** and set
**Build and deployment → Source** to **GitHub Actions**. Merge the changes to
`main`, then run the **Project companion site** workflow manually if needed.
The [workflow](../.github/workflows/project-pages.yml) validates and builds on
relevant pull requests, and deploys on every `main` push or manual runs
from `main`. The `github-pages` environment may require approval depending on
repository settings. The public URL becomes available only after deployment.

The app's source and companion URLs are in
[packages/project-config/src/index.ts](../packages/project-config/src/index.ts), which the companion also uses for
its links and its `/soundlines/` base path. If moving the repository or site,
update that file, the README links, and this guide.

## Changelog

The app displays asset history under `/<locale>/data/changelog`.

The generator produces [CHANGELOG.md](../CHANGELOG.md),
[docs/changelog/changelog.json](./changelog/changelog.json), and
[apps/web/public/open-data-changelog.json](../apps/web/public/open-data-changelog.json).

```bash
pnpm changelog             # regenerate all outputs from committed history
pnpm changelog --check  # verify the tracked outputs against committed history
pnpm test:changelog        # test the generator with fixture repositories
```

The [generator](../scripts/changelog/generate.ts) traverses all commits reachable
from `HEAD`, newest first in Git topological order, and compares each tree with
its parent (or the empty tree for the initial commit). Merge commits are
compared with every parent and only keep files, graph IDs and entities that
differ from all of them (for example a conflict resolution); clean merges are
omitted because their branch commits are already listed. Every changed file
is categorized: graph/evidence/locales, previews, loops, artwork, explorer,
companion, workflow/tooling, documentation or other. Audio's former
`public/audio/` path is classified as previews. File moves appear as removal plus
addition. Graph snapshots yield added, updated and removed node and edge IDs;
object-key or entity-list reordering does not count as an entity edit.
Exact field changes and binary changes remain available through commit links.
The Markdown log keeps readable category and graph counts; the JSON audit
retains the complete file lists, Git statuses and changed graph entity IDs.
It also records affected entity names from committed graph snapshots (including
removed entities), evidence paths, locale-overlay diffs, changed preview brief
entries and shipped asset paths. Repeated artwork variants are deduplicated by
instrument; preview/loop paths resolve to their genre. If a historical name is
not present in either graph snapshot, its slug is shown as readable words.
Each affected entity has a status: a graph node's own added/updated/removed
delta wins; relationship endpoints, evidence and overlay edits are updates;
preview brief entries follow their key; asset and brief files follow their Git
status (A/M/D), and mixed signals within one commit read as an update.
The client uses a deduplicated name dictionary, packing each entity reference
with its status, rather than repeating names for every commit or embedding full file audits.
Each change is therefore attributed to one entry. Dates use the recorded commit
timestamp, not the generation time.

Uncommitted files, unreachable branches, empty commits, raw untracked renders and commits
changing only the generated changelog files are excluded. Audio history proves
that assets or production records were committed, not that they passed a human
listening gate. The generator rejects shallow clones: use a full checkout or
`git fetch --unshallow`. Run regeneration **after** committing substantive
changes; the generated-only follow-up commit does not create another entry.

The [Changelog workflow](../.github/workflows/changelog.yml) tests the generator
and commits refreshed files on every `main` push, or a manual run on `main`.
Only its persistence job has write permission; pull requests run read-only
checks. Repository rules must permit `github-actions[bot]` to push these
generated-only commits to `main`; otherwise the push fails visibly and a
maintainer must regenerate and commit them through the normal PR process.
No AI credentials, external service or additional dependency is required.

## Storybook

Run `pnpm storybook` and open the local URL printed by the command (port
6006 by default). If that port is in use, run
`pnpm storybook --port 6007` instead. `pnpm build-storybook` creates a
static, shareable build in `apps/storybook/storybook-static/`.

The companion workflow also publishes the full catalogue in browse-only mode at
<https://alexandrehebert.github.io/soundlines/storybook/>, linked from the
"How it's built" page. `pnpm build-storybook:public` builds into
`apps/storybook/dist/public/` with `STORYBOOK_PUBLIC=1`.
`pnpm build:pages` assembles the companion and public Storybook into
`apps/companion/dist-pages/`. Both Storybook builds use the same stories and static assets configured
in [.storybook/main.ts](../apps/storybook/.storybook/main.ts). In the public build,
[.storybook/manager.ts](../apps/storybook/.storybook/manager.ts) hides the addon panel,
toolbar and shortcuts. Because it is served below `/soundlines/storybook/`,
components must build URLs to files in `apps/web/public/` with `publicAsset()` from
[src/publicAsset.ts](../apps/web/src/publicAsset.ts), never a bare `/path`. Preview it
with `pnpm preview:site --outDir dist-pages` and open `/soundlines/storybook/`.

The catalogue groups stories under Foundations, Navigation, Controls, Overlays, Visualizations,
Playback, and Screens. The segmented control and modal panel have standalone
examples. Explorer screen stories cover the mobile detail sheet in context. Use the Controls,
Actions, Accessibility, and viewport panels to inspect variants and interactions;
some stories also exercise keyboard and search behavior automatically.

On mobile, the shared sheet header and slide transition follow Soundtrails.
Drag the header down to dismiss Modal Panel, Timeline Options, Search, or Soundtrails. The expandable entry sheet opens with an upward swipe
and collapses or closes on a downward swipe. Its gesture and scroll behavior are
covered by **Screens / Explorer / Mobile Detail Swipes**.

The official [dark favicon](../apps/web/public/favicon.svg) and [light favicon](../apps/web/public/favicon-light.svg)
share the same still waveform frame. The app selects the favicon and header
palette for its theme; the dark asset is also used by the companion site and
Storybook. The **Foundations / Favicon** story shows both still variants and
compares animated previews with the previous vinyl icon and the Soundline concept at 16,
24, and 32 pixels and on light and dark browser tabs. The browser favicon itself
does not animate; the header logo ([SoundlinesMark](../apps/web/src/design-system/navigation/SoundlinesMark.tsx))
plays the same wave motion on hover, focus and scroll, using the shared model in
[soundlinesWave.ts](../apps/web/src/design-system/navigation/soundlinesWave.ts).
Preview animations can be paused and are disabled when reduced motion is
requested. The studies are standalone SVGs in
[apps/web/src/stories/fixtures/favicon-concepts/](../apps/web/src/stories/fixtures/favicon-concepts/).

Stories use the real music graph with an isolated, in-memory explorer provider.
Selections, search, related-node navigation, view changes, panning, and zoom
are interactive without changing the app's URL or starting its page-loading
transition. The source links in detail panels still open their actual websites.
Timeline labels wait for SVG layout before measuring text, including when an
initially hidden preview is revealed.
