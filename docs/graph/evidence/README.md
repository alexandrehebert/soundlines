# Evidence and audits

This is the research trail behind Soundlines' music graph: which sources were
checked, what they support, and where a claim needed qualification, correction
or removal. It is not a blanket certification that every entry is settled.

### Start with a real example

The [Chicago house and disco evidence note](./edges/lineage__chicago-house-disco.md)
documents one connection shown in the app. The checked sources support disco as
one of Chicago house's roots, not its sole origin. The note records the
relationship type, medium confidence, the finding and the sources checked.

### What is in this folder?

| Resource | What you will find |
| --- | --- |
| [Entry notes](./nodes/) | Sources and assessments for genres, artists, instruments and other entries, grouped by type. |
| [Connection notes](./edges/) | Evidence for individual relationships, including their scope, type and editorial caveats. Historical removal notes are retained here too. |
| [Batch audits](./audits/) | Reviews of groups of claims, with findings and recommendations. An audit may propose changes without applying them to the graph. |
| [Live-edge coverage tracker](./audits/graph-edge-coverage.csv) | One row per current connection, linking its type and confidence to its evidence note. |
| [Festival coverage](./festivals.md) | The festival selection, chronology anchors and limitations. |
| [Disconnected entries](./disconnected-entries.md) | Standalone entries and unresolved attributions kept without inventing connections. |
| [Removed or retyped connections](./graph-edge-removals.md) | Reasons for historical corrections, with pointers to disposition notes. |
| [Source-fetch log](./fetch-status.jsonl) | A machine-readable record of source access attempts; successful access alone does not verify a claim. |

### How to read an evidence note

- **Graph ID** identifies the entry or connection, independently of its displayed name.
  Entry notes use `nodes/<type>/<slug>.md`; connection filenames replace `:` with `__`.
- **Reviewed** or a dated **Review status** records a source review. A note marked
  `Pending source review` is a placeholder, not a completed fact-check.
- **Finding** explains what the sources establish and what remains uncertain.
  A source about a genre or artist does not automatically prove a specific relationship.
- **Confidence** (`low`, `medium`, `high`) is an editorial assessment of evidence
  strength, not a probability or a count of citations.
- **Sources checked** lets you follow the references and assess the claim yourself.
  Older audits and removal notes are historical records; check the current
  [graph data](../../../src/data/graph.json) and linked evidence for the live state.

Automatic checks validate structure and evidence bookkeeping, not historical
truth. For the review process and source policy, see
[Data and contribution workflow](../../DATA.md); for relationship meanings and
evidence conventions, see [Graph documentation](../../GRAPH.md).
