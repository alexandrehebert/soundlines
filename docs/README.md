# Soundlines documentation

Use the guide for your task. Run commands from the repository root unless the linked guide specifies a different directory.

| Task | Read first | Workflow or check |
| --- | --- | --- |
| Research graph additions | [Research backlog](./graph/RESEARCH.md), [editorial guidelines](./GRAPH.md#6-editorial-guidelines) | [Graph researcher](../.github/agents/graph-researcher.agent.md) and the [lookup tool](../.agents/skills/graph-edit/scripts/lookup.mjs) |
| Edit the graph | [Contribution workflow](./DATA.md#graph-contribution-workflow), [schema](./GRAPH.md), [evidence index](./graph/evidence/README.md) | [Graph editing skill](../.agents/skills/graph-edit/SKILL.md), [graph validation skill](../.agents/skills/graph-validate/SKILL.md), and `npm run validate:graph` |
| Translate graph entries | [Locale overlays](./GRAPH.md#1-top-level-shape) | [Graph translation skill](../.agents/skills/graph-translate/SKILL.md) and `npm run validate:graph` |
| Fact-check or review graph changes | [Editorial guidelines](./GRAPH.md#6-editorial-guidelines), [evidence index](./graph/evidence/README.md) | [Fact-checking skill](../.agents/skills/graph-fact-check/SKILL.md) and [graph review skill](../.agents/skills/graph-review/SKILL.md) |
| Change the explorer or companion | [Architecture](./ARCHITECTURE.md), [Explorer behavior](./EXPLORER.md), [companion guide](./DEVELOPMENT.md#project-companion-github-pages) | `npm test` for the app and `npm run test:site` for the companion |
| Change webapp UI | [Design system](./DESIGN_SYSTEM.md) and [Storybook](./DEVELOPMENT.md#storybook) | `npm test` and `npm run build-storybook` |
| Create or revise instrument artwork | [Artwork guide](./artwork/README.md), [visual briefs](./artwork/briefs/) | [Drawing skill](../.agents/skills/artwork-draw/SKILL.md), [validation skill](../.agents/skills/artwork-validate/SKILL.md) |
| Produce seamless loops | [Audio guide](./AUDIO.md), [loop catalogue](./loops/CATALOGUE.md), [loop briefs](./loops/briefs/) | [Production skill](../.agents/skills/loop-produce/SKILL.md), [validation skill](../.agents/skills/loop-validate/SKILL.md) |
| Produce listening previews | [Genre previews](./AUDIO.md#genre-previews), [preview briefs](./previews/briefs/) | [Preview production skill](../.agents/skills/preview-produce/SKILL.md), [preview review skill](../.agents/skills/preview-review/SKILL.md) |
| Use repository skills in a coding assistant | [Agent and skill setup](./INSTALLATION.md#4-enable-repository-agents-and-skills) | Invoke `graph-validate` to check discovery and execution |
| Set up tools or run local services | [Installation](./INSTALLATION.md), [Development](./DEVELOPMENT.md) | [Script index](./SCRIPTS.md) |
| Check a commit or push locally | [Git hook setup](./DEVELOPMENT.md#git-hooks) | `git diff --cached --check` and `npm run check:push` |
| Maintain changelog outputs | [Changelog maintenance](./DEVELOPMENT.md#changelog) | `npm run test:changelog` |
