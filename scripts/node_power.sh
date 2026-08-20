#!/bin/bash
# Standalone Target Node Power & Cost Control Wrapper
# Usage:
#   ./scripts/node_power.sh wake aws-1 [2h]
#   ./scripts/node_power.sh sleep aws-1
#   ./scripts/node_power.sh status
#   ./scripts/node_power.sh enforce

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="python3"

if [ -d "$SCRIPT_DIR/../.venv" ]; then
    PYTHON_BIN="$SCRIPT_DIR/../.venv/bin/python3"
fi

COMMAND="$1"

if [ -z "$COMMAND" ]; then
    "$PYTHON_BIN" "$SCRIPT_DIR/manage_target_nodes.py" status
    exit 0
fi

case "$COMMAND" in
    wake)
        NODE="$2"
        TTL="${3:-2h}"
        if [ -z "$NODE" ]; then
            echo "❌ Usage: ./scripts/node_power.sh wake <node> [ttl]"
            exit 1
        fi
        "$PYTHON_BIN" "$SCRIPT_DIR/manage_target_nodes.py" wake "$NODE" --ttl "$TTL"
        ;;
    sleep|stop)
        NODE="$2"
        if [ -z "$NODE" ]; then
            echo "❌ Usage: ./scripts/node_power.sh sleep <node>"
            exit 1
        fi
        "$PYTHON_BIN" "$SCRIPT_DIR/manage_target_nodes.py" sleep "$NODE"
        ;;
    enforce)
        "$PYTHON_BIN" "$SCRIPT_DIR/manage_target_nodes.py" enforce
        ;;
    status|ls|list)
        "$PYTHON_BIN" "$SCRIPT_DIR/manage_target_nodes.py" status
        ;;
    *)
        "$PYTHON_BIN" "$SCRIPT_DIR/manage_target_nodes.py" "$@"
        ;;
esac

# markdownlint-disable MD049
# ---
# *Last Updated: 2026-08-20* | *Last Reviewed: 2026-08-20*
