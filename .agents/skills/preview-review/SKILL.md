---
name: preview-review
description: "Validate and score catalogue previews, compare staged retakes and report replacement decisions."
---

# Review previews and select retakes

Review every output in a completed batch. Decode AAC and check exactly ten seconds, two channels, finite samples, non-silence, clipping and interior dropouts, excluding deliberate edge fades. Interpret pauses in genre context. Verify catalogue coverage and playable paths.

Reproduce the historical automated review with a locally available Audiobox Aesthetics scorer: record production quality (PQ), content enjoyment (CE), content usefulness (CU), production complexity (PC), technical flags, scorer version and configuration per clip. Discover or implement the scorer from its installed API; the historical scoring scripts lived outside the repository and are not bundled. If unavailable, report scoring as incomplete rather than invent scores. Scores are heuristics, not listening or genre-authenticity judgments.

Use approved Rock and Funk as calibration references (historical PQ approximately 8.37 and 8.41). Historical retake candidates had PQ below 8.1 or technical defects. This is a calibrated triage cutoff, not a universal quality guarantee. Request targeted brief revisions and one staged second generation per flagged genre; do not rerender the entire catalogue.

Compare both versions with the same scorer. Historical replacement policy: fix technical defects without introducing new ones; otherwise require PQ gain >= 0.1 or crossing from PQ < 8.1 to PQ >= 8.1, with CE decline no greater than 0.5. Record both scores, flags, selected version and reason. Preserve original files for comparison, keep stronger originals when retakes fail, and disclose remaining flags. Historical outcome was 11 retakes and six replacements; these counts are evidence, not targets.

Report a concrete selection manifest before installing selected replacements when installation is outside the user's authorization. Preserve approved Rock and Funk byte-for-byte unless explicitly asked to replace them. After authorized installation, verify all catalogue assets decode and are served, run relevant existing checks and test detail-panel playback on desktop and mobile using repository browser instructions. Never claim human listening or genre fidelity from metrics. Provide a listening checklist for artifacts, natural performance and genre fit; do not apply seamless-loop thresholds.
