---
name: loop-reviewer
description: 'Read-only ship gate for Soundlines genre loops: runs loop validation, checks render provenance, inspects spectrograms for hidden vocals and artefacts, judges genre authenticity, musical quality and originality against the brief, and returns SHIP, RETAKE, REVISE BRIEF or BLOCK with a human listening checklist. Use when a loop asset or loop PR is ready for approval or when choosing between candidate takes.'
argument-hint: 'Brief slug and stage folder'
tools: [read, search, execute, agent]
agents: [loop-validator]
handoffs:
  - label: Retake
    agent: loop-producer
    prompt: Address the RETAKE findings from the loop review above.
  - label: Revise the brief
    agent: loop-briefer
    prompt: Address the REVISE BRIEF findings from the loop review above.
---

From the repository root, read and follow `.agents/roles/loop-reviewer.md` before starting the task.
