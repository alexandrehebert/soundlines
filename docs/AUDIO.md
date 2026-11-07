# Audio

[Back to README](../README.md)

Paths in prose and commands are relative to the repository root.

## Landing-page loop

The [hip-hop loop](../public/loops/turntable-hip-hop.wav) played by the landing turntable was generated locally
with ACE-Step 1.5's highest-quality pairing: the `acestep-v15-xl-sft` (4B) DiT at
80 diffusion steps, guidance 7 with ADG, and the largest `acestep-5Hz-lm-4B`
planner. Because both models do not fit in 25 GB of unified memory together, the
planner's audio codes were generated first, then rendered by the XL DiT.
Five original 36-second instrumental boom-bap takes in D minor at 92 BPM used
seeds 73192, 18409, 60217, 41126, and 52880. Four-bar excerpts on a
regression-fitted beat grid were compared for seam similarity, bar-to-bar
consistency, and level stability. The selected seed is 41126, from 11.668 s:
exactly 16 beats at 92.0 BPM (10.435 s), stereo 48 kHz PCM16, normalized to
-1 dBFS peak with an 8 ms wrap crossfade. WAV avoids lossy encoder padding at
the loop boundary.
The deployed app serves this static asset; it does not require a running ACE-Step API.
Its brief and selection report are in [docs/loops/briefs](./loops/briefs). Loops for other
genres follow the same pipeline through the `loop-briefer`, `loop-producer`, `loop-validator` and
`loop-reviewer` agents; the bundled scripts and the verified ACE-Step configuration are in
[.github/skills/loop-produce](../.github/skills/loop-produce).

### Theme-linked arrangements

The landing turntable uses hip-hop on dark theme (side A) and
[the trap arrangement](../public/loops/turntable-trap.wav) on light theme (side B).
Theme changes crossfade for 80 ms at the current sample position and scratch speed;
they never restart the phrase or start paused playback. Genre previews are unaffected.

The trap version was generated locally from repeated original hip-hop audio using
ACE-Step's source-conditioned `cover` task: XL SFT, 80 steps, guidance 7, ADG,
shift 1 and conditioning strength 0.75. Cover tasks bypass LM planning, so this
arrangement does not claim 4B-planned-code provenance. Both 36-second takes
(seeds 82613 and 94721) passed screening. The selected seed is 94721, cut from
the second source-aligned cycle at 10.435458 s, not an independently selected
downbeat. Both assets contain exactly 500,902 stereo frames at 48 kHz PCM16:
16 beats at 91.994043 BPM. Extraction preserves the original phrase position,
removes DC, applies the 8 ms wrap crossfade and normalizes to -1 dBFS.

The [brief](./loops/briefs/turntable-trap.json) and generated
[selection report](./loops/briefs/turntable-trap.selection.json) record
the source checksum, conditioning and candidate comparison. The mechanical gate
passes, including exact source frame count and sample rate. Browser verification
confirmed preserved playback phase in both directions of theme change and no
autoplay on paused theme changes. Comparative human listening was approved on
2026-11-07: "Approve — melody and transition work."

To reproduce an original-source arrangement, add the brief's `arrangement` field,
prepare conditioning with `.github/skills/loop-produce/scripts/arrange-loop.py prepare`,
render with `render-takes.mjs <brief> <stage> arrangement <seed ...>`, screen takes,
then extract with `arrange-loop.py extract`. See the
[production skill](../.github/skills/loop-produce/SKILL.md) for full commands.
Text-to-music loops retain the existing 4B planner requirement. Neither profile
permits draft assets or skips mechanical validation and comparative listening.

## Genre previews

ACE-Step previews live in `public/genre-previews`. The renderer takes the
middle ten seconds of a 32-second performance and uses the genre briefs in
`docs/previews/briefs/*.json`. With the local ACE-Step API on port 8020 and its
planner enabled, set `ACESTEP_PYTHON` to the ACE-Step environment's Python
executable and `ACESTEP_PREVIEW_STATE` to a writable progress file, then run
`node .github/skills/preview-produce/scripts/render-ace-previews.mjs`. Reuse the progress file to skip
completed clips, or pass genre slugs to render a subset.

Detroit techno uses the higher-quality loop pipeline instead: standalone 4B planning,
XL SFT at 80 steps, guidance 7 and ADG. Its brief uses 24-second source takes
and initially renders two seeds to reduce generation time. The selected four-bar WAV
is retained in `public/loops/detroit-techno.wav`; its genre preview is encoded from
that loop at 256 kbps AAC. The brief and selection report are in
`docs/loops/briefs/detroit-techno*`. Human listening review remains required.

Dedicated catalogue agents are `preview-briefer`, `preview-producer` and `preview-reviewer`;
their procedures live in `.github/skills/preview-{brief,produce,review}/SKILL.md`.
They preserve the Turbo/eight-step/1.7B-planner preview workflow and stage retakes separately.
Review includes decoding and defect checks, Audiobox Aesthetics scoring calibrated against
approved Rock and Funk, and recorded first/second-take selection. The historical scorer
was external to the repository; the review skill requires discovering or implementing it
and reporting incomplete scoring if unavailable. These agents do not use the seamless-loop pipeline.
