---
name: graph-validator
description: 'Runs the deterministic Soundlines graph validation gate (pnpm validate:graph) and explains each failure with its cause and fix. Use after graph edits, before commit or review, when the Graph quality CI workflow fails, or to check schema, ids, edge directions, formatting, locale overlay coverage, and evidence bookkeeping. Read-only.'
argument-hint: 'Optional: a failing test name or CI log'
tools: [read, search, execute]
handoffs:
  - label: Fix validation failures
    agent: graph-editor
    prompt: Fix the validation failures reported above, then rerun pnpm validate:graph.
---

From the repository root, read and follow `.agents/roles/graph-validator.md` before starting the task.
