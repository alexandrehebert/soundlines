# Soundlines documentation

Use the guide for your task. Run commands from the repository root unless the linked guide specifies a different directory.

| Task | Read first | Workflow or check |
| --- | --- | --- |
| Research graph additions | [Research backlog](./graph/RESEARCH.md), [editorial guidelines](./GRAPH.md#6-editorial-guidelines) | [Graph researcher](../.github/agents/graph-researcher.agent.md) and the [lookup tool](../.github/skills/graph-edit/scripts/lookup.mjs) |
| Edit the graph | [Contribution workflow](./DATA.md#graph-contribution-workflow), [schema](./GRAPH.md), [evidence index](./graph/evidence/README.md) | [Graph editing skill](../.github/skills/graph-edit/SKILL.md), [graph validation skill](../.github/skills/graph-validate/SKILL.md), and `npm run validate:graph` |
| Translate graph entries | [Locale overlays](./GRAPH.md#1-top-level-shape) | [Graph translation skill](../.github/skills/graph-translate/SKILL.md) and `npm run validate:graph` |
| Fact-check or review graph changes | [Editorial guidelines](./GRAPH.md#6-editorial-guidelines), [evidence index](./graph/evidence/README.md) | [Fact-checking skill](../.github/skills/graph-fact-check/SKILL.md) and [graph review skill](../.github/skills/graph-review/SKILL.md) |
| Change the explorer or companion | [Architecture](./ARCHITECTURE.md), [Explorer behavior](./EXPLORER.md), [companion guide](./DEVELOPMENT.md#project-companion-github-pages) | `npm test` for the app and `npm run test:site` for the companion |
| Create or revise instrument artwork | [Artwork guide](./artwork/README.md), [visual briefs](./artwork/briefs/) | [Drawing skill](../.github/skills/artwork-draw/SKILL.md), [validation skill](../.github/skills/artwork-validate/SKILL.md) |
| Produce seamless loops | [Audio guide](./AUDIO.md), [loop catalogue](./loops/CATALOGUE.md), [loop briefs](./loops/briefs/) | [Production skill](../.github/skills/loop-produce/SKILL.md), [validation skill](../.github/skills/loop-validate/SKILL.md) |
| Produce listening previews | [Genre previews](./AUDIO.md#genre-previews), [preview briefs](./previews/briefs/) | [Preview production skill](../.github/skills/preview-produce/SKILL.md), [preview review skill](../.github/skills/preview-review/SKILL.md) |
| Set up tools or run local services | [Installation](./INSTALLATION.md), [Development](./DEVELOPMENT.md) | [Script index](./SCRIPTS.md) |
| Maintain changelog outputs | [Changelog maintenance](./DEVELOPMENT.md#changelog) | `npm run test:changelog` |
