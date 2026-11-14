<p align="center">
  <img src="./public/favicon.svg" width="96" height="96" alt="Soundlines multicolored waveform logo" />
</p>

<h1 align="center">Soundlines</h1>

<p align="center">
  <strong>Music history, connected.</strong><br />
  A chronological map of music and the lineages that connect it.
</p>

<p align="center">
  <a href="https://soundlines.hebert.app/">Open Soundlines</a> ·
  <a href="#explore-music-history">Features</a> ·
  <a href="#getting-started">Get started</a> ·
  <a href="#query-the-graph-with-mcp">MCP</a> ·
  <a href="#contributing">Contributing</a> ·
  <a href="#documentation">Docs</a> ·
  <a href="https://alexandrehebert.github.io/soundlines/">Project guide</a> ·
  <a href="#credits">Credits</a> ·
  <a href="#license">License</a>
</p>

Soundlines is an interactive atlas of music history and lineages.

Built with Next.js App Router, React 19, TypeScript, Tailwind CSS 4, and Motion.
Tested with Vitest, linted with oxlint, and deployable to Vercel.

## Explore music history

- Browse **Genres**, **Artists**, and **Instruments** on interactive timelines,
  or explore genre lineages in the bubble map.
- Discover curated events in the **History** view.
- Search the catalogue, follow relationships, and inspect sources in detail panels.
- Share a view or selection through its URL.
- Listen to genre previews and play or scratch the landing-page vinyl loop.
- Switch between English, French, German, Italian and Spanish, and dark and light themes.

The catalogue is curated, not exhaustive. Dates, relationships, and prominence
phases include sourced editorial judgments; they are not popularity rankings.

## Getting started

For tool installation, agent/skill setup, and optional artwork and audio
environments, see the [installation guide](./docs/INSTALLATION.md).

Use Node.js 26, as specified in [package.json](./package.json).

```bash
npm ci
npm run dev
```

Open the local URL printed by Next.js. For Docker Compose, Storybook and
the companion site, see the [development guide](./docs/DEVELOPMENT.md#docker-compose).

For the optional standalone ACE-Step rendering dashboard, see
[ACE Monitor](./tools/ace-monitor/README.md). It runs in its own Compose stack at
`http://localhost:5180`, without changing the Soundlines app or ACE server.

## Query the graph with MCP

Connect ChatGPT or another Model Context Protocol (MCP) client to the public,
read-only Soundlines server. It uses Streamable HTTP and requires no authentication.

```text
https://soundlines.hebert.app/api/mcp
```

Search for artists, genres, instruments, and other entries, or follow documented
relationships and cite their sources. For example, ask: “Use Soundlines to find
French Touch artists who signed with a record label and are also key artists in
another genre. Cite the sources for each connection.”

See the [MCP setup and tool reference](https://soundlines.hebert.app/en/data/query).

## Contributing

- **Suggest a correction.** Open the entry in [Soundlines](https://soundlines.hebert.app/)
  and choose **Suggest an edit** below its description. The issue draft includes
  the entry name and a direct link. Describe what should change and share sources
  for factual corrections.
- **Propose an addition.** Tell us which artist, genre, instrument, or connection
  is missing. Include related entries and any sources that support the addition.
  [Suggest an addition](https://github.com/alexandrehebert/soundlines/issues/new?template=graph-contribution.yml)
- **Give app feedback.** Tell us what worked well or what could improve. For a
  bug, include the page and steps to reproduce it when possible.
  [Give feedback](https://github.com/alexandrehebert/soundlines/issues/new?title=Soundlines+app+feedback&body=%23%23%23+What+would+you+like+to+share%3F%0A%0A%0A%23%23%23+Page+or+steps+to+reproduce%2C+if+relevant%0A)

Submissions go to the public GitHub issue tracker and require a GitHub account.
If you’re editing the dataset directly, see the
[graph contribution workflow](./docs/DATA.md#graph-contribution-workflow).

## Workflows

The repository’s agents and skills guide graph research, artwork, and audio
production. See the [graph contribution guide](./docs/DATA.md#graph-contribution-workflow),
[instrument artwork guide](./docs/DATA.md#instrument-artwork), and
[audio guide](./docs/AUDIO.md). The [project companion](https://alexandrehebert.github.io/soundlines/)
shows the workflows with diagrams and examples.

## Documentation

Find guides by task in the [documentation index](./docs/README.md).

The [project companion](https://alexandrehebert.github.io/soundlines/) explains,
with visual workflows and real examples, how Soundlines' facts, instrument
drawings and audio were sourced, produced and checked, and how the app is built, in
[English](https://alexandrehebert.github.io/soundlines/en/),
[French](https://alexandrehebert.github.io/soundlines/fr/),
[German](https://alexandrehebert.github.io/soundlines/de/),
[Italian](https://alexandrehebert.github.io/soundlines/it/), and
[Spanish](https://alexandrehebert.github.io/soundlines/es/).
It is a curated introduction; the guides below remain the detailed technical reference.
See [GitHub Pages setup](./docs/DEVELOPMENT.md#project-companion-github-pages)
for publishing and editing the companion.

The [public changelog](https://soundlines.hebert.app/en/data/changelog)
traces graph, preview, loop, artwork, application and workflow changes from Git
history, with an asset-first view, readable affected entity names and pagination.
Its [Markdown log](./CHANGELOG.md) and
[JSON history](./docs/changelog/changelog.json) are tracked in Git and updated automatically;
see [changelog maintenance](./docs/DEVELOPMENT.md#changelog).

| Guide | Contents |
|---|---|
| [Installation](./docs/INSTALLATION.md) | Required and optional tools, agent/skill setup, local development, artwork, audio, and integrations |
| [Explorer behavior](./docs/EXPLORER.md) | Views, navigation, gestures, loading transitions, dates, and prominence rendering |
| [Audio](./docs/AUDIO.md) | Landing loop provenance, genre previews, and local generation |
| [Data and contribution workflow](./docs/DATA.md) | Dataset scope, evidence, graph editing, and instrument artwork |
| [Graph schema and editing guide](./docs/GRAPH.md) | Canonical schema, validation rules, and enrichment guidance |
| [Architecture](./docs/ARCHITECTURE.md) | Routing, state, themes, localization, metadata, and rendering modules |
| [Development](./docs/DEVELOPMENT.md) | Commands, Docker Compose, Storybook, and deployment notes |

The canonical dataset is [graph.json](./src/data/graph.json); research and audits
live in [docs/graph/evidence](./docs/graph/evidence). Tooling is documented in
[docs/SCRIPTS.md](./docs/SCRIPTS.md).

## Credits

- Created by [Alexandre “Axoune” Hebert](https://github.com/alexandrehebert).
- The previous vinyl favicon was adapted from
  [Lucide's Disc 3 icon](https://lucide.dev/icons/disc-3) (ISC license); the full
  notice is in its [Storybook fixture](./src/stories/fixtures/favicon-concepts/vinyl.svg).
- The landing loop and genre previews were generated with
  [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5). See the
  [audio guide](./docs/AUDIO.md) for details.
- Music history sources are linked in the app and documented in the
  [evidence notes](./docs/graph/evidence).

## License

Unless otherwise noted, original work in this project is licensed under the
[Apache License 2.0](./LICENSE). You may reuse and modify it, including for
commercial purposes, provided you follow its terms, including retaining the
license and attribution notices and marking modified files. See [NOTICE](./NOTICE)
for the copyright holder and third-party material. Apache-2.0 does not grant
permission to use the Soundlines name or marks as a trademark; third-party assets
keep their own licenses.
