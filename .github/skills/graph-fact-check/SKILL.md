---
name: graph-fact-check
description: 'Fact-check Soundlines graph entries against serious sources and record the verdict in docs/evidence. Use when verifying a node or edge, auditing a batch of relationships, re-checking periods/dates/descriptions/confidence, validating citations, clearing "Pending source review" notes, or deciding whether a claim should be kept, corrected, downgraded, retyped or removed.'
argument-hint: 'Ids, an edge type, or "pending" to pick unchecked entries'
---

# Fact-check graph entries

Standards come from [docs/GRAPH.md](../../../docs/GRAPH.md) §6 "Editorial guidelines" and
"Evidence files and review status". This skill is the verification procedure; applying data changes
follows the `graph-edit` skill.

Fact-checking answers one question: **is each claim true and properly supported?** The unit is the
claim, on any entry, new or old. It owns verdicts and the evidence notes that record them. It does
not judge whether a change set is complete or mergeable (`graph-review`) or mechanically valid
(`graph-validate`).

## Modes

- **Audit** (default): check existing entries, write verdicts into `docs/evidence/`, and report
  recommended data changes. Leave `graph.json` and overlays untouched unless asked to apply fixes.
- **Verify for review** (called by `graph-review` / `graph-reviewer` on a change set): report verdicts
  only and write nothing. The reviewer turns contradictions into blocking findings.
- **Apply**: only when explicitly asked. Make the corrections through the `graph-edit` procedure.

## Pick the scope

```sh
node .github/skills/graph-edit/scripts/lookup.mjs --pending [type]   # missing / pending / unstamped evidence
node .github/skills/graph-edit/scripts/lookup.mjs <id>               # entry, sources, evidence note path
```

For a batch audit, take a coherent slice (one edge type, one family, one era) and record it as a
ledger in `docs/evidence/audits/` named after the existing series (`graph-edges-NNN-<topic>.md`, next
unused number).

## Verify each claim

For each entry, list its atomic claims: existence/identity, `period` (and what it means for that type:
artist = active career, track = release year), each fact in `description`, `family`/`kind`/`category`,
phase boundaries, and for edges the relationship **type and direction** (GRAPH.md §3).

1. **Open every cited source** and find the passage supporting each claim. A URL that only mentions
   the subject, a homepage, a search-result page or a paywall stub is not support.
2. **Fill gaps with better sources**: scholarship, specialist references, museums/archives/libraries,
   halls of fame, reputable press, official label/artist archives, discographies for release facts.
   Wikipedia is a lead or supplement, never the sole support when better exists. Never invent URLs.
3. **Blocked sites**: AllMusic, Britannica and Resident Advisor often refuse automated fetches. Do not
   guess AllMusic ids; resolve them from Wikidata property P1728 via
   `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=<Q-id>&props=claims&format=json`.
   Record retrieval outcomes in `docs/evidence/fetch-status.jsonl` when doing bulk checks, and say in
   the note when a source was not directly readable.
4. **Check semantics, not just facts**:
   - sharing a genre is not influence; a festival bill is not a collaboration
   - `derived_from` vs `influences` vs `fusion_of` vs `subgenre_of` (pick the most precise supported one)
   - `shaped` requires a direct effect; otherwise `context_for`
   - `key_artist_of` means representative and influential, not merely popular
   - descriptions must be in our own words, not copied text
5. **Assign a verdict** per claim: `supported`, `supported, scope needs care`, `partially supported`,
   `unsupported`, or `contradicted`, and a confidence recommendation:
   - `high`: strong, independent sources state it directly
   - `medium`: broadly supported, boundaries approximate or sources interpretive
   - `low`: provisional or thin evidence
   Adding URLs alone never raises confidence; related operator domains are not independent.

## Record the result

- Write or update the entry's evidence note using the templates in
  [evidence-templates.md](../graph-edit/references/evidence-templates.md): `Graph ID`, a dated
  `**Reviewed** · YYYY-MM-DD` stamp (or dated `**Review status**`), `## Sources checked` with what each
  source states, `## Assessment`, `## Remaining uncertainty`. Keep earlier sections as history.
- For edges, update the `review_status` cell in `docs/evidence/audits/graph-edge-coverage.csv`.
- Then run `npm run review-status` and `npm run validate:graph` (see `graph-validate`).

## When the check fails

Do not silently keep a failed claim. Depending on scope:

- **Correctable** (wrong date, wrong type/direction, overstated confidence, weak source): apply the fix
  via the `graph-edit` procedure, including locale overlays and coverage row.
- **Unsupported/contradicted**: remove or retype the edge with a `removed__…` disposition note and a
  bullet in `graph-edge-removals.md` / `event-edge-removals.md`. Never delete or rename node ids;
  propose node-level problems to the user instead.
- In audit or verify-for-review mode, report recommended changes and leave `graph.json` untouched.

## Report

A table per entry: id, claim, verdict, recommended confidence, sources actually read, finding. End with
coverage (n of m checked), changes applied, and open follow-ups.
