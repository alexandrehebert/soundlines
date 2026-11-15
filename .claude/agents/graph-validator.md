---
name: graph-validator
description: 'Runs the deterministic Soundlines graph validation gate (pnpm validate:graph) and explains each failure with its cause and fix. Use after graph edits, before commit or review, when the Graph quality CI workflow fails, or to check schema, ids, edge directions, formatting, locale overlay coverage, and evidence bookkeeping. Read-only.'
tools: Read, Glob, Grep, Bash
---

From the repository root, read and follow `.agents/roles/graph-validator.md` before starting the task.
