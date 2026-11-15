# Evidence note templates

Evidence notes live in `docs/graph/evidence/`. Paths:

- Node: `docs/graph/evidence/nodes/<type>/<slug>.md` (slug = id without the `<type>:` prefix)
- Edge: `docs/graph/evidence/edges/<id with the first ":" replaced by "__">.md`
- Removal: `docs/graph/evidence/edges/removed__<slug>.md` (or the node equivalent), kept forever

`scripts/graph/reviewStatus.ts` parses these lines, so keep them exact:

- ``Graph ID `<id>` `` on its own line (removed entries use ``Former graph ID `<id>` ``)
- `**Reviewed** · YYYY-MM-DD` (the separator is a middle dot `·`), or a date inside a `**Review status** · …` line
- The literal text `Pending source review` marks an unchecked note and excludes it from the review count
- `**Disposition** · Removed (YYYY-MM-DD)` excludes the note from the review count

## Node note

```markdown
# <Display name>

Graph ID `<type>:<slug>`

**Review status** · Reviewed — <one-line scope, e.g. period, description and sources checked>
**Reviewed** · YYYY-MM-DD

## Sources checked
- [<Publisher>, <title>](<https URL>) — <what this source actually states that supports the entry>
- [<Publisher>, <title>](<https URL>) — <…>

## Assessment
<Which claims (period, description facts, family, kind, phases, confidence) each source supports; any correction made.>

## Remaining uncertainty
<Contested dates, single-source claims, or "None material.">
```

## Edge note

```markdown
# <From name> → <To name>

Graph ID `<edge id>`

**Review status** · Source checked (YYYY-MM-DD)

**Relationship** · <edge type> · <confidence>

## Sources checked
- [<Publisher>, <title>](<https URL>) — <the passage or fact supporting this exact relationship and direction>

## Assessment
<Why the edge type and direction are right (e.g. derived_from vs influences), and why the confidence fits.>
```

## Pending placeholder (only while work is in progress)

```markdown
# <Name>

Graph ID `<id>`

**Review status** · Pending source review
```

A pending note never satisfies the live-edge test; replace it before finishing.

## Removal / retype disposition

```markdown
# Removed edge: <From> → <To>

Former graph ID `<old id>`

**Disposition** · Removed (YYYY-MM-DD)

<What the sources show, why the claim failed, and what (if anything) replaced it.>

Sources: [<title>](<url>); [<title>](<url>).
```

Also add a bullet to `docs/graph/evidence/graph-edge-removals.md` (or `event-edge-removals.md` for event edges) describing the removal or retype.

## Coverage tracker row

`docs/graph/evidence/audits/graph-edge-coverage.csv` has exactly one row per live edge:

```csv
graph_id,type,confidence,evidence_note,review_status
signed:pixies-4ad,signed_to,medium,docs/graph/evidence/edges/signed__pixies-4ad.md,Source checked (2026-11-05)
```

- `type` and `confidence` must equal the live edge (`confidence` empty when the edge has none).
- `evidence_note` is a repo-root-relative path to a reviewed (not pending) note.
- No commas inside fields; the test splits on `,`.
- Remove the row when an edge is removed; update `type`/`confidence` when they change.
