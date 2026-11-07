"""Phase 1 of a final render: plan audio codes per seed with the ACE-Step 4B 5Hz LM (MLX).

Run with the ACE-Step venv Python while NO ACE-Step server is running (the 4B LM and the XL DiT
do not fit in 25 GB of unified memory together):

    $ACESTEP_HOME/.venv/bin/python plan-codes.py <brief.json> <stage-dir> [seed ...]
"""
import hashlib
import json
import os
import socket
import sys
from pathlib import Path

from acestep.llm_inference import LLMHandler

brief_path, stage = Path(sys.argv[1]), Path(sys.argv[2])
brief = json.loads(brief_path.read_text())
seeds = [int(seed) for seed in sys.argv[3:]] or brief["seeds"]
home = Path(os.environ["ACESTEP_HOME"])
port = int(os.environ.get("ACESTEP_API_PORT", "8020"))

with socket.socket() as probe:
    if probe.connect_ex(("127.0.0.1", port)) == 0:
        raise SystemExit(f"An ACE-Step server is running on :{port}; stop it before planning (memory).")

# Must match planningHash() in brief.mjs.
planned = {k: brief[k] for k in ("prompt", "bpm", "meter", "key", "duration")}
digest = hashlib.sha256(json.dumps(planned, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
codes_dir = stage / "codes"
codes_dir.mkdir(parents=True, exist_ok=True)
hash_file = codes_dir / "brief.sha256"
if hash_file.exists() and hash_file.read_text().strip() != digest:
    for stale in codes_dir.glob("*.codes.txt"):
        stale.unlink()
hash_file.write_text(digest)

handler = LLMHandler()
status, ok = handler.initialize(
    checkpoint_dir=str(home / "checkpoints"),
    lm_model_path="acestep-5Hz-lm-4B",
    backend="mlx",
)
if not ok:
    raise SystemExit(status)

for seed in seeds:
    target = codes_dir / f"{seed}.codes.txt"
    if target.exists():
        print(f"seed {seed}: already planned", flush=True)
        continue
    result = handler.generate_with_stop_condition(
        caption=brief["prompt"],
        lyrics="[Instrumental]",
        infer_type="llm_dit",
        temperature=0.8,
        cfg_scale=2.5,
        top_p=0.9,
        target_duration=brief["duration"],
        user_metadata={
            "bpm": brief["bpm"],
            "keyscale": brief["key"],
            "timesignature": str(brief["meter"]),
            "duration": brief["duration"],
        },
        use_cot_caption=False,
        use_cot_language=False,
        use_cot_metas=False,
        batch_size=1,
        seeds=[seed],
    )
    if not result.get("success"):
        raise SystemExit(f"LM failed for seed {seed}: {result.get('error')}")
    codes = result["audio_codes"]
    target.write_text(codes)
    print(f"seed {seed}: {codes.count('<|audio_code_')} codes", flush=True)
