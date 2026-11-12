# Data and contribution workflow

[Back to README](../README.md)

Paths in prose and commands are relative to the repository root.

## Data model

All data lives in [src/data/graph.json](../src/data/graph.json) as a single property graph:

- **Nodes** (`genre`, `artist`, `instrument`, `label`, `place`, `track`, `scene`, `event`, `festival`) with stable `type:slug` ids, optional `period` (`start`/`end`/`precision`/`estimated`/`estimateNote`), `family` lanes, descriptions, and editorial confidence in the overall entry.
- **Edges** with a type, optional `period`, `confidence` (`low`/`medium`/`high`), `note`, and source URLs. Lineage edge types (`influences`, `derived_from`, `subgenre_of`, `fusion_of`, `cross_pollination`, `revival_of`) carry an orientation so the JSON reads naturally in both directions (see `LINEAGE_ORIENTATION` in [src/graph/types.ts](../src/graph/types.ts)).
- Nodes can include `sources` URLs; the detail panel links the selected node's sources, with each source's website shown beside the link. Festival relationships also show their own citations beside the connection. Festival confidence is reassessed against evidence, not inferred from citation counts.

### Music festivals

The collection includes ancient Pythian Games and the approximately 1715 Three
Choirs Festival alongside modern institutions: 39 festivals across 25 countries and six continents,
selected for documented historical contributions and public recognition. It spans
Woodstock, Monterey Pop and Newport Folk; Bayreuth, Salzburg and Donaueschingen;
Movement, Sónar and Tomorrowland; Reggae Sunsplash, FESPAM and Sauti za Busara;
Cosquín, Viña del Mar and Rock al Parque; Sawai Gandharva, Java Jazz and Baalbeck;
and further jazz, metal and cross-cultural institutions. All festivals have at
least three references; the [source audit](./graph/evidence/audits/festival-sources-001.md)
explains source scope, conflicts and High/Medium confidence decisions. Descriptions explain
breakthrough performances, new-music platforms, regional traditions and musical
exchange rather than assigning a popularity or influence score. The
[coverage register](./graph/evidence/festivals.md) lists every festival, country,
first edition or chronology anchor and editorial caveat. This is a curated collection, not a
comprehensive worldwide directory.
Festivals are searchable and open in the detail panel within the current view.
Any entity can link to a festival through `festival_related`; the relationship note
states the connection and, when known, its edition year. Detail panels display
festival connections only when the edge has an HTTPS source, with citations visible
in both directions. These links do not affect musical lineage or timeline lanes.
Specific festival turning points also appear as separately sourced History
events, including Dylan at Newport, the complete Ring at Bayreuth, and Daft
Punk’s Coachella pyramid. All 39 festivals have a supplementary Wikipedia
[cross-check](./graph/evidence/audits/festival-wikipedia-events-002.md); conflicts
are recorded alongside the stronger primary and institutional evidence.

Festival periods normally start at the first edition; conventional chronology
anchors are marked estimated and explained. They do not claim uninterrupted annual
operation. Historically significant standalone gatherings, including the original
Woodstock and Monterey Pop festivals, have bounded periods. Existing historical festival events retain their stable IDs: an event
can describe the founding or one edition, while a festival node describes the
institution. English text, localized overlays, per-entry evidence notes, and the
review coverage register accompany this batch.

## Graph contribution workflow

See [docs/GRAPH.md](./GRAPH.md) for the full schema, validation rules, and an editing guide (also suitable as a prompt for LLM-assisted enrichment).

Graph changes follow one pipeline, with one owner per step:

| Step | Question | Skill | Agent |
|---|---|---|---|
| Research | What is missing? | — | `graph-researcher` (proposes a merge patch, edits nothing) |
| Edit | Apply the change and its coupled files | `graph-edit` | `graph-editor` (orchestrates the steps below) |
| Translate | Is every text in every locale overlay? | `graph-translate` | `graph-translator` |
| Validate | Is the data mechanically correct? | `graph-validate` | `graph-validator` (read-only) |
| Fact-check | Is each claim true and sourced? | `graph-fact-check` | `graph-fact-checker` (writes evidence) |
| Review | Is this change set ready to merge? | `graph-review` | `graph-reviewer` (read-only gate) |

Validation is deterministic: `npm run validate:graph` runs the data and graph test suites (schema,
ids, edge directions, canonical JSON formatting, overlay coverage for every locale, evidence and
coverage-tracker bookkeeping, documented counts). The [Graph quality](../.github/workflows/graph-quality.yml)
workflow runs it, plus a `review-status.json` freshness check, on every pull request touching graph data
or docs. The skills in [.github/skills](../.github/skills) bundle `lookup.mjs` (query `graph.json` by id,
name, or pending evidence) and `diff.mjs` (semantic diff of graph changes and overlays against a git ref).

### Issue-to-pull-request automation

Graph contributions can be submitted with the
[Graph contribution issue form](../.github/ISSUE_TEMPLATE/graph-contribution.yml). A maintainer
starts the cloud-agent workflow by applying the `graph:approved` issue label. The workflow launches
the `graph-editor` custom agent to verify and implement the proposal, then asks it to open a pull
request. The `graph:agent-started` label prevents the same issue from starting another task. Pull
requests still require CI and human review; the agent does not merge them.
The workflow also recognizes an existing Copilot bot assignment, including GitHub's `Copilot`
REST login, so retrying a run that failed after assignment does not start another task. It adds
the started label after either a verified new assignment or an already-started guard result.
Copilot cloud currently does not support the custom agent's web-search tool, so
the issue should include source links; the agent must leave out claims it cannot
independently verify with the tools and source material available to it.
New genres also need at least three sourced key-artist relationships; a genre's origin source
alone is not sufficient for a complete addition.
The agent does not render audio or artwork: a new genre is listed in `PENDING_GENRE_PREVIEWS`
([genrePreviews.ts](../src/data/genrePreviews.ts)), which hides its player until a maintainer renders
and reviews its preview locally with the preview pipeline. New instruments likewise wait for the
local artwork pipeline.
To keep runs cheap and short, the agent follows the "Cost and time budget" in the
[graph-edit skill](../.github/skills/graph-edit/SKILL.md): it limits the change to the request,
uses one authoritative source per claim, avoids subagents for small changes, runs targeted tests
while iterating, and stops with a gap report instead of searching at length.
The [Copilot setup workflow](../.github/workflows/copilot-setup-steps.yml) installs Node.js 26
and the project dependencies for agent sessions running on GitHub Actions; it does not apply to
cloud sandbox sessions.

To enable this for the repository:

1. Enable GitHub Copilot cloud agent and Actions for the repository.
2. Create the `graph:approved` and `graph:agent-started` issue labels in repository settings.
3. Add a `COPILOT_AGENT_TOKEN` repository Actions secret containing a fine-grained personal access
   token with read access to metadata and read/write access to **Actions, Contents, Issues, and Pull
   requests** for this repository. The token must belong to an account with Copilot cloud agent
   access. Do not put it in the workflow or repository files.
4. Apply `graph:approved` to a graph contribution issue. The workflow records successful task starts
   with `graph:agent-started`; a failed run can be retried after correcting its cause.

### Source access and blocked tasks

Copilot's default firewall allows development dependencies, not arbitrary research websites.
Before starting a contribution, review its sources and add the specific trusted domains or
HTTPS paths under **Settings > Copilot > Internet access > Copilot in the cloud > Custom
allowlist**, keeping the firewall enabled. For the Soca example, these source paths are:

- `https://www.britannica.com/art/soca-music`
- `https://daily.redbullmusicacademy.com/2016/06/ras-shorty-i-the-soul-of-calypso/`

Additional artist sources and redirect destinations may need their own reviewed rules.
Allowlisting does not bypass a publisher's login, paywall or anti-bot restrictions.
See [GitHub's firewall documentation](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-the-firewall).

A green assignment workflow means Copilot was assigned, not that graph editing succeeded.
Check the agent session and PR for blocked-source warnings and completed validation.
If an existing PR is blocked, fix access and ask `@copilot` in that PR to continue the graph
workflow; rerunning the assignment workflow will not resume an already-started task.
Do not merge an empty or blocked PR.

The workflow uses the built-in Actions token only to read and label the triggering issue. The
separate agent token is only used to assign the issue to Copilot. This issue-assignment API is in
public preview; review
[GitHub's Copilot API guide](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api)
for current requirements before enabling the automation.

## Dataset scope and editorial caveats

The expanded starter dataset connects at least three key artists to every genre
and adds seven cited tracks. Artist pages document the people and groups;
genre pages are cited on artist-to-genre relationships. These are curated
representative examples, not exhaustive discographies or a popularity ranking.

The historical expansion adds **27 genre/era nodes**: seven Western classical
traditions (Medieval through minimalism), blues, eight jazz styles (early jazz,
swing, bebop, cool jazz, hard bop, modal jazz, free jazz, and fusion), and eleven
rock branches (rock and roll through grunge). Each has at least three cited
representative artists. Classical-era succession uses influence and qualified
continuity/derivation links, not subgenre claims; jazz fusion has
multiple parents. Blues, jazz harmony, and krautrock connect the new branches to
the original catalogue. Origins and era boundaries are approximate and overlapping,
not exact invention dates or popularity measurements. New nodes deliberately have
neutral bars rather than invented prominence histories.

The [connectivity register](./graph/evidence/disconnected-entries.md) explicitly
records sourced standalone events and unresolved track attributions. Stable IDs
are retained without inventing relationships; tests enforce this exact exception
set as well as the live-edge evidence tracker and generated review-status index.

Composer dates describe approximate creative/professional activity, not birth
years. Some new band periods span documented breaks and reunion appearances;
their descriptions identify this career-envelope limitation. They are not
claims of uninterrupted activity.

The UI never touches the JSON directly: all queries (neighbors, lineage traversal, period filtering, search) go through [src/graph/graph.ts](../src/graph/graph.ts). Migrating to a graph database later (e.g. Neo4j: nodes → labeled vertices, edges → typed relationships, other fields → properties) only requires reimplementing that one module.

[src/data/graph.test.ts](../src/data/graph.test.ts) enforces dataset integrity: unique ids, no dangling edge endpoints, known types only, sane periods, and no orphan nodes.

## Instrument artwork

Every instrument has four SVGs (icon, banner, avatar, and detail-panel header
background) in `public/instrument-*`. New or redrawn artwork follows one pipeline:
a sourced visual brief (`artwork-briefer`), the drawing (`artwork-illustrator`,
preferably as a master in [the generator](../scripts/artwork/generate-instrument-artwork.py)),
a deterministic gate (`artwork-validator`), and a ship review (`artwork-reviewer`)
with a final human check in Storybook. The style guide and scripts are in
[.github/skills/artwork-draw](../.github/skills/artwork-draw) and
[.github/skills/artwork-validate](../.github/skills/artwork-validate).
