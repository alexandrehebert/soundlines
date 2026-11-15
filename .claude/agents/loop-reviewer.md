---
name: loop-reviewer
description: 'Read-only ship gate for Soundlines genre loops: runs loop validation, checks render provenance, inspects spectrograms for hidden vocals and artefacts, judges genre authenticity, musical quality and originality against the brief, and returns SHIP, RETAKE, REVISE BRIEF or BLOCK with a human listening checklist. Use when a loop asset or loop PR is ready for approval or when choosing between candidate takes.'
tools: Read, Glob, Grep, Bash, Agent(loop-validator)
---

From the repository root, read and follow `.agents/roles/loop-reviewer.md` before starting the task.
