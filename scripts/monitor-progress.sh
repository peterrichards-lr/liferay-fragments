#!/bin/bash
# scripts/monitor-progress.sh
# Thin wrapper around check-progress.js to satisfy docs/automated-testing.md E2E State Coordinator monitoring.

# Resolve scripts directory absolute path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run Node progress checker
node "$SCRIPT_DIR/check-progress.js" "$@"
