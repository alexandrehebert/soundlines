---
name: graph-review
description: 'Gate a change to the Soundlines music graph (src/data/graph.json, graph.<locale>.json overlays, docs/evidence) before commit or merge. Use when reviewing a graph PR or diff, an enrichment batch, a merge patch, or agent-made data edits to decide if it is ready: validation result, wrong edge direction or type, unjustified confidence, missing or mismatched evidence, stale overlays, removed ids, and editorial problems.'
argument-hint: 'Git ref to compare against (default HEAD), or a merge patch'
---

# Review graph changes

Review answers one question: **is this change set ready to merge?** The unit is the diff. It composes
the other checks rather than redoing them:

| Concern | Owner | Review's job |
|---|---|---|
| Mechanical correctness (schema, ids, directions, formatting, coverage, counts) | `graph-validate` | run it; any failure is blocking; do not re-check by hand |
| Truth of claims and source support | `graph-fact-check` | have consequential claims verified, then judge the verdicts |
| Judgement tests cannot make (semantics, completeness, editorial quality, overlay freshness) | **review** | the checklist below |

Rules come from [docs/GRAPH.md](../../../docs/GRAPH.md). Review is read-only: report, don't fix.

## 1. Collect the change set

```sh
node .github/skills/graph-review/scripts/diff.mjs [ref]     # added/removed/changed ids and fields, per overlay
git --no-pager diff --stat [ref] -- src/data docs src/graph
node .github/skills/graph-edit/scripts/lookup.mjs <id>      # context for any id in the diff
```

For a merge patch (GRAPH.md §7) review the patch JSON directly and treat each operation as a change.

## 2. Run the validation gate

```sh
npm run validate:graph
```

Report failures as blocking, mapped to fixes with the `graph-validate` table. Do not run
`npm run review-status` (it writes); the freshness test already covers it.

## 3. Get claims verified

Pick the claims that matter: every new or retyped lineage edge (`derived_from`, `influences`,
`fusion_of`, `subgenre_of`, `revival_of`, `shaped`), raised confidence, new genres, changed periods,
and anything surprising. Verify them with the `graph-fact-check` procedure in **verify-for-review**
mode (or delegate to the `graph-fact-checker` agent for large batches). For the remaining low-risk
claims, opening one cited source each is enough.

- `contradicted` / `unsupported` → blocking; `partially supported` or confidence above the recommendation → should fix.

## 4. Judge what tests cannot

Semantics:
- [ ] Most precise edge type: `shaped` only for direct effects, else `context_for`; `influences` not used
      for shared genre; festival bills are not collaborations
- [ ] No near-duplicate of an existing entity (`lookup.mjs --search` on new names and spellings)
- [ ] Genre family assignment is sensible; new genres have real lineage or a justified root
- [ ] `phases` reflect a defensible prominence history, not an invented curve
- [ ] Descriptions are original wording, 1–3 factual sentences, no empty superlatives

Completeness and consistency:
- [ ] Removed or renamed ids: blocking unless a `removed__…` disposition note and removals-log bullet
      exist (ids are permanent; v1 entities can never go)
- [ ] Each changed id's evidence note describes **this** change (new sources, new verdict, dated stamp);
      confidence changes are explained, not justified by URL count alone
- [ ] **Overlay freshness**: for each changed English text field, every `graph.<locale>.json` entry also
      changed in the diff (tests only check presence, not staleness)
- [ ] Translation quality spot-check against `graph-translate/references/<locale>.md`
- [ ] Festival changes: register, source-audit JSON/MD and Wikipedia ledger tell the same story
- [ ] Standalone entries are genuinely unlinkable, not under-researched
- [ ] GRAPH.md §2/§6 counts and priorities still read correctly (§1 is tested)

## 5. Report

Group findings by severity, each with the id, the problem, the evidence (rule section, URL, verdict
or test name) and a concrete fix:

- **Blocking**: validation failures, removed ids, wrong direction/type, contradicted or unsupported
  claims, invented or irrelevant sources, evidence that does not match the change
- **Should fix**: partial support, confidence above evidence, stale overlays, bookkeeping gaps
- **Consider**: wording, better sources, coverage opportunities

Report only real problems. End with one verdict: **ready**, **ready after fixes**, or **not ready**.
Hand fixes to the `graph-edit` procedure.
