#!/usr/bin/env bash
# Start, stop or inspect the local ACE-Step API used for loop renders.
#   ace-server.sh start final   XL SFT DiT only (LM disabled: the 4B LM and XL DiT do not fit in 25 GB together)
#   ace-server.sh start draft   turbo DiT + 1.7B LM planner (fast brief iteration, preview quality)
#   ace-server.sh stop | status
set -euo pipefail

ACESTEP_HOME="${ACESTEP_HOME:-$HOME/Tools/ACE-Step-1.5}"
[ -x "$ACESTEP_HOME/.venv/bin/acestep-api" ] || { echo "No ACE-Step install at $ACESTEP_HOME; set ACESTEP_HOME (see docs/INSTALLATION.md)" >&2; exit 1; }
PORT="${ACESTEP_API_PORT:-8020}"
STATE="${LOOP_STAGE_ROOT:-$HOME/.cache/soundlines-loops}"
PIDFILE="$STATE/ace-server.pid"
LOG="$STATE/ace-server.log"
mkdir -p "$STATE"

health() { curl -sf -m 3 "http://127.0.0.1:$PORT/health"; }

case "${1:-}" in
  start)
    profile="${2:?Usage: ace-server.sh start final|draft}"
    if health >/dev/null; then echo "A server already answers on :$PORT; stop it first." >&2; exit 1; fi
    [ -d "$ACESTEP_HOME/checkpoints" ] || { echo "No checkpoints in $ACESTEP_HOME" >&2; exit 1; }
    case "$profile" in
      final)
        export ACESTEP_CONFIG_PATH=acestep-v15-xl-sft ACESTEP_INIT_LLM=false
        expected=acestep-v15-xl-sft ;;
      draft)
        export ACESTEP_CONFIG_PATH=acestep-v15-turbo ACESTEP_INIT_LLM=true \
          ACESTEP_LM_MODEL_PATH=acestep-5Hz-lm-1.7B ACESTEP_LM_BACKEND=mlx
        expected=acestep-v15-turbo ;;
      *) echo "Unknown profile: $profile" >&2; exit 1 ;;
    esac
    cd "$ACESTEP_HOME"
    # Upstream lazy-loads models by default; load at startup so readiness and the loaded model are verifiable.
    export ACESTEP_NO_INIT=false
    nohup .venv/bin/acestep-api --host 127.0.0.1 --port "$PORT" --download-source huggingface >"$LOG" 2>&1 &
    echo $! >"$PIDFILE"
    # Loading the 19 GB XL checkpoint plus MLX/VAE compilation takes about two minutes.
    for _ in $(seq 1 180); do
      sleep 2
      if ! kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then echo "Server exited; see $LOG" >&2; exit 1; fi
      body="$(health || true)"
      if [[ "$body" == *'"models_initialized":true'* ]]; then
        [[ "$body" == *"\"loaded_model\":\"$expected\""* ]] || { echo "Wrong model loaded: $body" >&2; exit 1; }
        echo "Ready ($profile, pid $(cat "$PIDFILE"), log $LOG)"; exit 0
      fi
    done
    echo "Timed out waiting for the server; see $LOG" >&2; exit 1 ;;
  stop)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      kill "$(cat "$PIDFILE")"
      for _ in $(seq 1 30); do kill -0 "$(cat "$PIDFILE")" 2>/dev/null || break; sleep 1; done
    fi
    rm -f "$PIDFILE"
    if health >/dev/null; then echo "Another process still serves :$PORT (not started by this script)." >&2; exit 1; fi
    echo "Stopped" ;;
  status)
    health || { echo "Not running on :$PORT"; exit 1; }; echo ;;
  *) echo "Usage: ace-server.sh start final|draft | stop | status" >&2; exit 1 ;;
esac
