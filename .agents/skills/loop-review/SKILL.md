---
name: loop-review
description: 'Gate a Soundlines genre loop before it ships: judges genre authenticity against the brief, musical quality, hidden vocals or artefacts from spectrograms, originality and imitation risk, loop feel and provenance consistency, on top of the loop-validate result, then requests a human listening sign-off. Use when a loop asset or loop PR is ready for approval, when comparing candidate takes, or when deciding whether to retake, revise the brief or ship.'
argument-hint: 'Brief slug, and the stage folder with takes and PNGs'
---

# Review a loop

The review answers: **should this loop ship as the sound of this genre?** It composes the deterministic
gate (`loop-validate`) with judgement. It never edits briefs, renders or re-extracts; it routes each
finding to the owner.

## Inputs

`docs/loops/briefs/<slug>.json`, `<slug>.selection.json`, the asset, `$STAGE/png/*.png` and
`$STAGE/takes/*.request.json`.

## Procedure

1. **Gate.** Run `loop-validate` (brief lint + loop mode). Any FAIL is blocking; do not continue judging.
2. **Provenance.** `selection.json` names a take that exists in `$STAGE/takes`, `profile` is `final`
   or `arrangement`, and that take's `request.json` shows `acestep-v15-xl-sft`, 80 steps, guidance 7,
   ADG, `thinking` false and the brief's prompt verbatim. `final` requires a non-empty
   `audio_code_string`. `arrangement` instead requires `task_type: cover`, the original source
   checksum and exact frame count, source conditioning strength and phrase-aligned extraction.
   Compare source and arrangement at the same position and require human confirmation of melody
   preservation; tempo, key or chroma similarity alone is insufficient. A mismatch is blocking.
   Ignore `result.json.lm_model` (it shows the server's unloaded default, e.g. 0.6B, on final takes).
3. **Spectrograms.** Open the loop PNG and the selected take PNG:
   - harmonic panel: wavy, gliding formant stacks = sung or spoken voice (blocking); dense noisy
     smears at hit points = scratch/FX artefacts; a hard vertical change at the seam = section change.
   - mel panel: identical texture on both sides of the seam; no band that appears or disappears.
4. **Musical judgement** against the brief: tempo feel and groove placement (backbeat, offbeats, swing),
   the named signature instruments audible, one coherent motif, space left as the brief asks, mix
   balance (WARN metrics from the gate are judged here), nothing that sounds like a recognisable song.
5. **Originality.** Brief names no artists or works; if the motif evokes a specific record, block and
   send it to `loop-brief` with a description of what to change.
6. **Human ear.** Agents cannot hear. End with a sign-off request that lists exactly what to listen for
   (seam at the loop point repeated 4×, vocals, groove, mix on phone and headphones). A loop ships only
   after a human confirms.

## Verdict

`SHIP`, `RETAKE` (render more seeds or pick another candidate → `loop-produce`), `REVISE BRIEF`
(→ `loop-brief`, with one concrete prompt change per finding) or `BLOCK` (gate/provenance failure).
Findings: blocking | should-fix, each with evidence (metric, PNG region and time, request field) and
owner. No style nits; do not restate passing checks.
