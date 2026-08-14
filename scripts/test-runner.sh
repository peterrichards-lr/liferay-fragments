#!/bin/bash
# scripts/test-runner.sh
# Automates the setup, testing, and teardown of Liferay Fragments using LDM and Playwright.

set -e

# State Coordinator Initialization
PROGRESS_SIGNAL_FILE="$(pwd)/.progress-signal"
TESTS_PASSED=false
EXIT_HANDLED=false

SCRIPT_START_TIME=$(date +%s)
SCRIPT_START_DATE=$(date)

# Ensure scripts directory and System32 are in PATH
export PATH="$(pwd)/scripts:$(pwd)/node_modules/.bin:$PATH"
export PATH="$PATH:/c/Windows/System32"
export PATH="$PATH:/c/Users/prichards/AppData/Local/Microsoft/WinGet/Packages/jqlang.jq_Microsoft.Winget.Source_8wekyb3d8bbwe"
export PATH="$PATH:/c/Users/prichards/AppData/Local/Microsoft/WinGet/Links"

# Compute target node. Empty means local; anything else is a remote LDM node
# registered via `ldm target add`. Set by --node.
NODE_TARGET=""

# Wrapper function to enforce clean, color-free plain-text outputs for all LDM commands.
# Forwards --node so every LDM invocation acts on the intended compute node.
ldm() {
    if [ -n "$NODE_TARGET" ]; then
        command ldm --node "$NODE_TARGET" "$@"
    else
        command ldm "$@"
    fi
}



# ─── Remote node support (Issue #225) ────────────────────────────────────────
# Populated by resolve_node_target() when --node names a remote LDM target.
NODE_HOST=""
NODE_USER=""
NODE_KEY=""
SSH_TUNNEL_PID=""

# Read host/user/key for the requested target from LDM's own configuration.
# `ldm target ls` renders a box-drawing table, and parsing that positionally is
# what previously caused a silent failure (Issue #213), so read the structured
# config instead.
resolve_node_target() {
    [ -z "$NODE_TARGET" ] && return 0
    if [ "$NODE_TARGET" = "local" ]; then
        NODE_TARGET=""
        return 0
    fi

    local parsed
    parsed=$(command ldm config 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' \
        | grep '^  targets' | python3 -c "
import sys, ast
raw = sys.stdin.read()
if not raw.strip():
    raise SystemExit(1)
targets = ast.literal_eval(raw.split('=', 1)[1].strip())
t = targets.get('$NODE_TARGET')
if not t:
    raise SystemExit(2)
print(t.get('host', ''))
print(t.get('user', ''))
print(t.get('key_path', ''))
" 2>/dev/null)

    case $? in
        1) echo "[ERROR] Could not read target configuration from 'ldm config'."; exit 1 ;;
        2) echo "[ERROR] Unknown LDM target node '$NODE_TARGET'. Run 'ldm target ls'."; exit 1 ;;
    esac

    NODE_HOST=$(echo "$parsed" | sed -n '1p')
    NODE_USER=$(echo "$parsed" | sed -n '2p')
    NODE_KEY=$(echo "$parsed" | sed -n '3p')

    if [ -z "$NODE_HOST" ] || [ -z "$NODE_USER" ]; then
        echo "[ERROR] Target '$NODE_TARGET' has no host/user recorded in LDM config."
        exit 1
    fi
    echo "  -> Remote node '$NODE_TARGET': ${NODE_USER}@${NODE_HOST}"
}

node_ssh_opts() {
    local opts="-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"
    [ -n "$NODE_KEY" ] && opts="$opts -i $NODE_KEY"
    echo "$opts"
}

node_ssh() {
    # shellcheck disable=SC2046
    ssh $(node_ssh_opts) "${NODE_USER}@${NODE_HOST}" "$@"
}

# Resolve the directory the container actually mounts at /mnt/liferay/deploy.
#
# Deliberately asks the container rather than assuming a path. LDM currently
# writes the orchestrating host's paths into a remote project's compose file, so
# the deploy directory on the node is not where a remote project directory would
# suggest. Reading the live mount is correct both now and once that is fixed.
resolve_remote_deploy_dir() {
    local dir
    dir=$(node_ssh "docker inspect $PROJECT_NAME --format '{{range .Mounts}}{{if eq .Destination \"/mnt/liferay/deploy\"}}{{.Source}}{{end}}{{end}}'" 2>/dev/null | tr -d '\r')
    if [ -z "$dir" ]; then
        echo "[ERROR] Could not resolve the deploy mount for '$PROJECT_NAME' on '$NODE_TARGET'." >&2
        echo "        Is the container running there? Try: ldm --node $NODE_TARGET list" >&2
        exit 1
    fi
    echo "$dir"
}

# Place one artefact where Liferay's auto-deploy scanner will consume it, on
# whichever host the container runs. Staged as .tmp then renamed so the scanner
# never observes a partial file.
deploy_artifact() {
    local src="$1" name="$2"
    if [ -n "$NODE_TARGET" ]; then
        # shellcheck disable=SC2046
        scp $(node_ssh_opts) -q "$src" "${NODE_USER}@${NODE_HOST}:${REMOTE_DEPLOY_DIR}/${name}.tmp"
        node_ssh "mv '${REMOTE_DEPLOY_DIR}/${name}.tmp' '${REMOTE_DEPLOY_DIR}/${name}'"
    else
        cp "$src" "$PROJECT_PATH/deploy/${name}.tmp"
        mv "$PROJECT_PATH/deploy/${name}.tmp" "$PROJECT_PATH/deploy/${name}"
    fi
}

# Forward the container's port to this machine so Playwright can drive Liferay at
# the host it believes it is serving. Liferay's virtual host is configured for
# localhost, so reaching it by public IP invites redirect and CSRF mismatches;
# tunnelling also keeps the web port closed in the security group.
# Local end of the tunnel. Deliberately not reused from $PORT: another tunnel,
# a local Liferay, or a published container port may already hold it, in which
# case `ssh -L` fails to bind while still backgrounding — and BASE_URL would then
# point at whatever else is listening. Testing the wrong instance is worse than
# not running, so bind a port we know is free and address that.
TUNNEL_LOCAL_PORT=""

find_free_local_port() {
    local candidate=$1
    local limit=$((candidate + 50))
    while [ "$candidate" -lt "$limit" ]; do
        if ! lsof -nP -iTCP:"$candidate" -sTCP:LISTEN > /dev/null 2>&1; then
            echo "$candidate"
            return 0
        fi
        candidate=$((candidate + 1))
    done
    return 1
}

start_node_tunnel() {
    [ -z "$NODE_TARGET" ] && return 0

    TUNNEL_LOCAL_PORT=$(find_free_local_port "$PORT") || {
        echo "[ERROR] No free local port found in ${PORT}-$((PORT + 50)) for the SSH tunnel."
        exit 1
    }
    if [ "$TUNNEL_LOCAL_PORT" != "$PORT" ]; then
        echo "  -> Local port ${PORT} is in use; tunnelling on ${TUNNEL_LOCAL_PORT} instead."
    fi

    # shellcheck disable=SC2046
    ssh $(node_ssh_opts) -f -N -L "${TUNNEL_LOCAL_PORT}:localhost:${PORT}" "${NODE_USER}@${NODE_HOST}" || {
        echo "[ERROR] Could not open SSH tunnel to ${NODE_USER}@${NODE_HOST}:${PORT}."
        exit 1
    }
    SSH_TUNNEL_PID=$(pgrep -f "ssh.*-L ${TUNNEL_LOCAL_PORT}:localhost:${PORT}.*${NODE_HOST}" | head -1)

    # Confirm the forward actually carries traffic before trusting it.
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "http://localhost:${TUNNEL_LOCAL_PORT}/" || echo 000)
    case "$code" in
        200|302)
            echo "  -> SSH tunnel verified: localhost:${TUNNEL_LOCAL_PORT} -> ${NODE_HOST}:${PORT} (HTTP ${code}, pid ${SSH_TUNNEL_PID:-unknown})"
            ;;
        *)
            echo "[ERROR] SSH tunnel opened but Liferay did not answer through it (HTTP ${code})."
            stop_node_tunnel
            exit 1
            ;;
    esac
}

stop_node_tunnel() {
    if [ -n "$SSH_TUNNEL_PID" ]; then
        kill "$SSH_TUNNEL_PID" 2>/dev/null && echo "  -> Closed SSH tunnel (pid $SSH_TUNNEL_PID)"
        SSH_TUNNEL_PID=""
    fi
}

# Estimate variables (ballpark seconds)
EST_BUILD_EXISTING_SKIP_DEPLOY=5
EST_BUILD_EXISTING_DEPLOY=45
EST_BUILD_NEW_SKIP_DEPLOY=180
EST_BUILD_NEW_DEPLOY=220

EST_WAITING_HEALTHY_DEPLOY=100
EST_WAITING_HEALTHY_SKIP_DEPLOY=0

EST_TESTING=3600

write_signal() {
    local status="$1"
    local remaining_seconds="$2"
    
    local est_time=""
    if [ -n "$remaining_seconds" ] && [ "$remaining_seconds" -gt 0 ]; then
        est_time=$(date -d "+${remaining_seconds} seconds" "+%Y-%m-%dT%H:%M:%S%z" 2>/dev/null || \
                   date -v+${remaining_seconds}s "+%Y-%m-%dT%H:%M:%S%z" 2>/dev/null || \
                   date)
    fi
    
    local temp_file="${PROGRESS_SIGNAL_FILE}.tmp"
    echo "$status" > "$temp_file"
    if [ -n "$remaining_seconds" ]; then
        echo "ESTIMATED_REMAINING_SECONDS=$remaining_seconds" >> "$temp_file"
    fi
    if [ -n "$est_time" ]; then
        echo "ESTIMATED_COMPLETION_TIME=$est_time" >> "$temp_file"
    fi
    
    # Calculate percentage based on status
    local percent=0
    case "$status" in
        "BUILDING")
            percent=10
            ;;
        "WAITING_HEALTHY")
            percent=40
            ;;
        "TESTING")
            percent=70
            ;;
        "SUCCESS"|"FAILED")
            percent=100
            ;;
    esac
    echo "PROGRESS_PERCENT=$percent" >> "$temp_file"
    
    mv "$temp_file" "$PROGRESS_SIGNAL_FILE"
}

# Initial write (generic BUILDING phase)
write_signal "BUILDING" 500

# Watchdog Timer
watchdog_timer() {
    # The watchdog runs in the background and terminates the main process if a phase exceeds its deadline.
    while true; do
        sleep 60
        if [ -f "$PROGRESS_SIGNAL_FILE" ]; then
            local state=$(head -n 1 "$PROGRESS_SIGNAL_FILE" | tr -d '\r')
            if [ "$state" = "SUCCESS" ] || [ "$state" = "FAILED" ]; then
                exit 0
            fi
            
            # Read ESTIMATED_REMAINING_SECONDS
            local remaining=$(grep "ESTIMATED_REMAINING_SECONDS" "$PROGRESS_SIGNAL_FILE" | cut -d'=' -f2 | tr -d '\r')
            if [ -n "$remaining" ]; then
                # Check modification time
                local modified
                modified=$(stat -c %Y "$PROGRESS_SIGNAL_FILE" 2>/dev/null || stat -f %m "$PROGRESS_SIGNAL_FILE" 2>/dev/null || echo 0)
                local now
                now=$(date +%s)
                local elapsed=$((now - modified))
                
                # Buffer of 15 minutes (900 seconds) beyond the estimated remaining time
                local max_wait=$((remaining + 900))
                
                if [ "$elapsed" -gt "$max_wait" ]; then
                    echo ""
                    echo "[WATCHDOG] CRITICAL: Phase '$state' has hung for $elapsed seconds (exceeded estimate + buffer of $max_wait). Terminating test runner!"
                    if [ "$state" = "WAITING_HEALTHY" ]; then
                        echo "[WATCHDOG] Dumping LDM logs for project $PROJECT_NAME before termination:"
                        ldm logs "$PROJECT_NAME" || true
                    fi
                    kill -TERM $$ 2>/dev/null
                    exit 1
                fi
            fi
        fi
    done
}
watchdog_timer &
WATCHDOG_PID=$!

# Logging Helpers
log_command() {
    if [ "$VERBOSE" = true ]; then
        echo -e "\033[0;34m[CMD]\033[0m $@"
    fi
}

matches_filter() {
    local text="$1"
    if [ -z "$FILTER_PATTERN" ]; then
        return 0
    fi
    echo "$text" | grep -iqE "$FILTER_PATTERN"
    return $?
}

# Cleanup and Exit Traps
cleanup() {
    echo ""
    echo "======================================================"
    if [ "$KEEP_ALIVE" = true ]; then
        stop_node_tunnel
        echo " [KEEP ALIVE] Skipping environment teardown."
        echo " Liferay is still running at $BASE_URL"
        if [ -n "$PROJECT_PATH" ]; then
            echo " Project directory: $PROJECT_PATH"
        fi
    else
        echo " Tearing down Liferay Docker Manager project..."
        log_command "ldm rm \"$PROJECT_NAME\" -y --delete"
        ldm rm "$PROJECT_NAME" -y --delete > /dev/null 2>&1 || true
        echo " Cleanup complete."
    fi
    echo "======================================================"
}

handle_exit() {
    local exit_code=$?
    if [ "$EXIT_HANDLED" = true ]; then
        return
    fi
    EXIT_HANDLED=true
    
    EXIT_CODE=$exit_code
    
    # Kill the background watchdog
    if [ -n "$WATCHDOG_PID" ]; then
        kill -9 "$WATCHDOG_PID" 2>/dev/null || true
    fi
    
    cleanup
    
    SCRIPT_END_TIME=$(date +%s)
    SCRIPT_END_DATE=$(date)
    DURATION=$((SCRIPT_END_TIME - SCRIPT_START_TIME))
    MINS=$((DURATION / 60))
    SECS=$((DURATION % 60))
    echo "======================================================"
    echo " Script Finished at: $SCRIPT_END_DATE"
    echo " Total Execution Time: ${MINS}m ${SECS}s"
    echo "======================================================"

    if [ "$TESTS_PASSED" = true ]; then
        # Clean up transient logs and reports on successful execution
        rm -rf ldm_startup.log e2e-tests/playwright_output.log state.json \
               playwright-report/ test-results/ e2e-tests/playwright-report/ e2e-tests/test-results/ \
               e2e-tests/playwright-results.json
               
        write_signal "SUCCESS" 0
        echo "State Coordinator: SUCCESS"
        exit 0
    else
        write_signal "FAILED" 0
        echo "State Coordinator: FAILED (Exit Code: $EXIT_CODE)"
        if [ $EXIT_CODE -eq 0 ]; then
            exit 1
        else
            exit $EXIT_CODE
        fi
    fi
}
trap handle_exit EXIT INT TERM ERR

MIN_LDM_VERSION="2.8.0"
LIFERAY_TAG="2026.q1"
PROJECT_NAME="e2e-test-env"
PORT="${PORT:-8080}"
VERBOSE=false
KEEP_ALIVE=false
EXISTING_PROJECT=false
SKIP_DEPLOY=false
LDM_VERBOSE=""
FILTER_PATTERN=""
FEATURES=("LPD-35443" "LPS-178052")

# Parse Arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -v|--verbose) 
            VERBOSE=true 
            LDM_VERBOSE="-v"
            ;;
        -k|--keep-alive)
            KEEP_ALIVE=true
            ;;
        -p|--project)
            PROJECT_NAME="$2"
            EXISTING_PROJECT=true
            KEEP_ALIVE=true
            shift
            ;;
        -s|--skip-deploy)
            SKIP_DEPLOY=true
            ;;
        -n|--node)
            NODE_TARGET="$2"
            shift
            ;;
        -f|--filter)
            FILTER_PATTERN="$2"
            shift
            ;;
        --feature)
            # Support space-separated values within one argument, or multiple --feature args
            IFS=' ' read -r -a array <<< "$2"
            FEATURES+=("${array[@]}")
            shift
            ;;
        -h|--help)
            echo "Usage: ./test-runner.sh [options] [liferay-tag]"
            echo "Options:"
            echo "  -v, --verbose          Enable verbose output"
            echo "  -k, --keep-alive       Do not tear down environment on exit/completion"
            echo "  -p, --project <name>   Use an existing LDM project"
            echo "  -s, --skip-deploy      Skip fragment ZIP compilation and deployment"
            echo "  -n, --node <target>    Run against a remote LDM compute node (see 'ldm target ls')."
            echo "                         Fragment ZIPs are copied to the node over SSH and the"
            echo "                         Liferay port is tunnelled to localhost for Playwright."
            echo "  -f, --filter <pattern> Filter tests and page creation to matching fragments/collections"
            echo "  --feature <flags>      Additional feature flags to enable (space-separated)"
            echo "  -h, --help             Show this help screen"
            exit 0
            ;;
        *) 
            LIFERAY_TAG="$1" 
            ;;
    esac
    shift
done

# Resolve the requested compute node before anything talks to LDM or Docker.
resolve_node_target

# Recalculate building estimate based on actual parameters
if [ "$EXISTING_PROJECT" = true ]; then
    if [ "$SKIP_DEPLOY" = true ]; then
        BUILD_REMAINING=$((EST_BUILD_EXISTING_SKIP_DEPLOY + EST_WAITING_HEALTHY_SKIP_DEPLOY + EST_TESTING))
    else
        BUILD_REMAINING=$((EST_BUILD_EXISTING_DEPLOY + EST_WAITING_HEALTHY_DEPLOY + EST_TESTING))
    fi
else
    if [ "$SKIP_DEPLOY" = true ]; then
        BUILD_REMAINING=$((EST_BUILD_NEW_SKIP_DEPLOY + EST_WAITING_HEALTHY_SKIP_DEPLOY + EST_TESTING))
    else
        BUILD_REMAINING=$((EST_BUILD_NEW_DEPLOY + EST_WAITING_HEALTHY_DEPLOY + EST_TESTING))
    fi
fi
write_signal "BUILDING" "$BUILD_REMAINING"

if [ "$VERBOSE" = true ]; then
    set -x
fi

echo "======================================================"
echo " Starting Liferay Fragments Automated Test Runner "
echo " Started at: $SCRIPT_START_DATE"
echo " Target Liferay Tag/Prefix: $LIFERAY_TAG"
if [ -n "$FILTER_PATTERN" ]; then echo " Test Filter: $FILTER_PATTERN"; fi
if [ "$VERBOSE" = true ]; then echo " Verbose Mode: Enabled"; fi
echo " (Press Ctrl+C to safely abort and cleanup at any time)"
echo "======================================================"

# nvm self-bootstrap: silently source nvm if npm is not already on PATH.
# This is a no-op in CI (node/npm are pre-installed globally) and in
# interactive shells (nvm already sourced by .zshrc/.bashrc). It fixes
# the "Required dependency 'npm' is not installed" failure when the script
# is invoked from a non-interactive agent or cron context on macOS with nvm.
if ! command -v npm &> /dev/null && [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
    # shellcheck source=/dev/null
    source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    # If a .nvmrc exists in the project root, honour it; otherwise use the
    # current default nvm version.
    if [ -f "$(git rev-parse --show-toplevel 2>/dev/null)/.nvmrc" ]; then
        nvm use --silent 2>/dev/null || true
    fi
fi

# 1. Dependency Validation (Fail Fast)
echo "[1/5] Validating dependencies..."

check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        echo "Error: Required dependency '$1' is not installed."
        echo "Hint: Please install $1 and ensure it is in your PATH."
        exit 1
    fi
}

for cmd in ldm jq curl node npm docker; do
    check_dependency "$cmd"
done

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "Error: Docker daemon is not running."
    echo "Hint: Please start Docker Desktop or the Docker daemon and try again."
    exit 1
fi

# Check Playwright Browsers
if ! npx playwright test --version &> /dev/null; then
    echo "Error: Playwright is not initialized."
    echo "Hint: Run 'npm install' to install dependencies."
    exit 1
fi

# LDM Version check
LDM_VERSION=$(ldm --version | awk '{print $2}')
if [ -z "$LDM_VERSION" ]; then
    echo "Error: Could not determine LDM version."
    echo "Hint: Run 'ldm --version' manually to check your installation."
    exit 1
fi

if ! awk -v v1="$LDM_VERSION" -v v2="$MIN_LDM_VERSION" 'BEGIN {
    split(v1, a, "."); split(v2, b, ".");
    for (i=1; i<=3; i++) {
        if (a[i] < b[i]) exit 1;
        if (a[i] > b[i]) exit 0;
    }
    exit 0;
}'; then
    echo "Error: LDM version $LDM_VERSION is lower than the minimum required version $MIN_LDM_VERSION."
    echo "Hint: Update LDM to version $MIN_LDM_VERSION or higher."
    exit 1
fi

echo "  -> All dependencies met. LDM version: $LDM_VERSION"

# 1.1 Pre-Run Cleanup
echo ""
echo "Cleaning up previous test artifacts..."
echo "  -> Purging old visual snapshots..."
rm -rf e2e-tests/snapshots/ e2e-tests/playwright-report/ e2e-tests/playwright_output.log \
       playwright-report/ test-results/ state.json ldm_startup.log \
       e2e-tests/playwright-results.json \
       e2e-tests/generated-test-pages.json \
       e2e-tests/visual-analysis.json \
       e2e-tests/state.json \
       docs/test-results/playwright-results.json
# Clean up any orphaned Docker containers to prevent port or naming conflicts
if [ "$EXISTING_PROJECT" = false ]; then
    # Issue #140: Fully delete any pre-existing LDM project with the same name to ensure
    # a completely fresh database on every run. Without this, `ldm run` reuses the
    # existing project's PostgreSQL volume from the previous CI run, causing stale
    # fragment data to persist and producing 252 consistent test failures.
    if ldm list --no-color --no-unicode 2>/dev/null | grep -q "$PROJECT_NAME"; then
        echo "  -> Found existing LDM project '$PROJECT_NAME'. Deleting to ensure a clean environment..."
        ldm rm "$PROJECT_NAME" --delete -y > /dev/null 2>&1 || true
        echo "  -> Existing LDM project deleted."
    fi
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        echo "  -> Cleaning up orphaned Docker containers..."
        docker rm -f "${PROJECT_NAME}" "${PROJECT_NAME}-db" > /dev/null 2>&1 || true
    fi
fi
echo "  -> Old logs and reports cleared."

# 2. Port & Tag Logic
echo ""
echo "[2/5] Configuring Environment Parameters..."

if [ "$EXISTING_PROJECT" = true ]; then
    echo "  -> Using Existing Project: $PROJECT_NAME"
    # Resolve URL and Path for existing project
    # Use grep to extract the actual HTTP URL, ignoring any ANSI color codes
    BASE_URL=$(ldm list | sed 's/\x1b\[[0-9;]*m//g' | grep "[│|] $PROJECT_NAME [│|]" | grep -Eo "https?://[a-zA-Z0-9.:-]+" | head -n 1)
    if [ -z "$BASE_URL" ]; then
        echo "Error: Could not find URL for existing project '$PROJECT_NAME'. Is it running?"
        exit 1
    fi
    echo "  -> Resolved URL: $BASE_URL"
    export BASE_URL
else
    # Determine Tag vs Prefix
    TAG_FLAG="--tag"
    # If tag only contains 2 parts (e.g. 2026.q1), use --tag-prefix
    if [[ "$LIFERAY_TAG" =~ ^[0-9]{4}\.[a-zA-Z0-9]+$ ]]; then
        TAG_FLAG="--tag-prefix"
        echo "  -> Using Tag Prefix: $LIFERAY_TAG (will fetch latest update)"
    else
        echo "  -> Using Specific Tag: $LIFERAY_TAG"
    fi

    # Check Port Availability
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "  -> Port $PORT is busy. Attempting to use port 8090..."
        PORT=8090
        if lsof -i :$PORT > /dev/null 2>&1; then
            echo "Error: Both ports 8080 and 8090 are busy."
            echo "Hint: Please stop any running Liferay instances or free up these ports."
            exit 1
        fi
    fi
    echo "  -> Using Port: $PORT"
    export BASE_URL="http://localhost:$PORT"
fi

# 3. LDM Prerequisite Configuration
echo ""
echo "[3/5] Configuring LDM Prerequisites..."

# Locate LDM common directory dynamically (checking for DXP activation keys)
LDM_COMMON_DIR="$HOME/.ldm/common"
if [ ! -d "$LDM_COMMON_DIR" ] || ! ls "$LDM_COMMON_DIR"/*.xml 1> /dev/null 2>&1; then
    # Try typical WSL/MSYS mount paths for Windows user profiles where activation keys are stored
    WINDOWS_USER=$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r' || whoami)
    if [ -d "/mnt/c/Users/$WINDOWS_USER/.ldm/common" ] && ls "/mnt/c/Users/$WINDOWS_USER/.ldm/common"/*.xml 1> /dev/null 2>&1; then
        LDM_COMMON_DIR="/mnt/c/Users/$WINDOWS_USER/.ldm/common"
    elif [ -d "/c/Users/$WINDOWS_USER/.ldm/common" ] && ls "/c/Users/$WINDOWS_USER/.ldm/common"/*.xml 1> /dev/null 2>&1; then
        LDM_COMMON_DIR="/c/Users/$WINDOWS_USER/.ldm/common"
    fi
fi

echo "  -> Initializing LDM common assets..."
log_command "ldm init-common -y"
ldm init-common -y > /dev/null 2>&1

echo "  -> Enabling modern Headless API feature flags in common properties..."
# Ensure properties file and parent directories exist to prevent grep errors
mkdir -p "$LDM_COMMON_DIR"
touch "$LDM_COMMON_DIR/portal-ext.properties"
# Ensure file ends with newline before appending
[ -f "$LDM_COMMON_DIR/portal-ext.properties" ] && sed -i '' -e '$a\' "$LDM_COMMON_DIR/portal-ext.properties" 2>/dev/null || true

# Disable Terms of Use to prevent modal from blocking E2E screenshots
if ! grep -q "terms.of.use.required=false" "$LDM_COMMON_DIR/portal-ext.properties"; then
    echo "terms.of.use.required=false" >> "$LDM_COMMON_DIR/portal-ext.properties"
fi

# LPD-35443: Page Management API
if ! grep -q "feature.flag.LPD-35443=true" "$LDM_COMMON_DIR/portal-ext.properties"; then
    echo "feature.flag.LPD-35443=true" >> "$LDM_COMMON_DIR/portal-ext.properties"
fi

# LPS-178052: Headless Site Pages
if ! grep -q "feature.flag.LPS-178052=true" "$LDM_COMMON_DIR/portal-ext.properties"; then
    echo "feature.flag.LPS-178052=true" >> "$LDM_COMMON_DIR/portal-ext.properties"
fi

# Disable OSGi file locking for SanDisk / external drive compatibility.
# -Dosgi.locking=none JVM arg is present but ignored by Equinox in this Liferay version.
# module.framework.properties.osgi.locking=none injects the property directly into the
# OSGi framework launcher before StorageManager.open() is called.
if ! grep -q "module.framework.properties.osgi.locking=none" "$LDM_COMMON_DIR/portal-ext.properties"; then
    echo "module.framework.properties.osgi.locking=none" >> "$LDM_COMMON_DIR/portal-ext.properties"
fi

echo "  -> Verifying Liferay DXP activation key..."
if ! ls "$LDM_COMMON_DIR"/*.xml 1> /dev/null 2>&1; then
    echo "Error: No activation key (.xml) found in $LDM_COMMON_DIR."
    echo "Hint: Please place a valid Liferay DXP activation key in $LDM_COMMON_DIR/ before running this script."
    exit 1
fi
echo "  -> Activation key found."

# Initialize results file
RESULTS_FILE="docs/test-results/results-${LIFERAY_TAG}.md"
mkdir -p docs/test-results
cat <<EOF > "$RESULTS_FILE"
# Liferay Fragments Test Results

- **Liferay Tag/Prefix**: $LIFERAY_TAG
- **Port**: $PORT
- **Date**: $(date)
- **Status**: Running...

EOF

# 4. Environment Provisioning
echo ""
echo "[4/5] Provisioning Liferay environment via LDM..."

if [ "$EXISTING_PROJECT" = true ]; then
    echo "  -> Checking status of existing project $PROJECT_NAME..."
    # `ldm list` renders: │ Project │ Version │ Target │ Status │ URL │
    # The leading delimiter yields an empty $1, so Status is $5 (not $4, which
    # is Target and would always read "local" for a local project).
    STATUS=$(ldm list | sed 's/\x1b\[[0-9;]*m//g' | grep "[│|] $PROJECT_NAME [│|]" | awk -F'[|?│]' '{print $5}' | xargs)
    if [ "$STATUS" != "Running" ]; then
        echo "  -> Project '$PROJECT_NAME' is $STATUS. Starting it..."
        log_command "ldm up \"$PROJECT_NAME\" -y"
        # Do not let a non-zero exit abort the run under `set -e`; an
        # "already running" project is a success case for our purposes.
        LDM_UP_OUTPUT=$(ldm up "$PROJECT_NAME" -y 2>&1) || {
            if echo "$LDM_UP_OUTPUT" | grep -qi "already running"; then
                echo "  -> Project '$PROJECT_NAME' was already running. Continuing."
            else
                echo "Error: Failed to start existing project '$PROJECT_NAME'."
                echo "$LDM_UP_OUTPUT" | tail -20
                exit 1
            fi
        }
        BASE_URL=$(ldm list | sed 's/\x1b\[[0-9;]*m//g' | grep "[│|] $PROJECT_NAME [│|]" | grep -Eo "https?://[a-zA-Z0-9.:-]+" | head -n 1)
        if [ -z "$BASE_URL" ]; then
            echo "Error: Could not find URL for project '$PROJECT_NAME' after starting."
            exit 1
        fi
        echo "  -> Re-resolved URL after start: $BASE_URL"
        export BASE_URL
    else
        echo "  -> Project '$PROJECT_NAME' is $STATUS."
    fi
    echo "  -> Skipping LDM run (using existing project $PROJECT_NAME)..."
else
    echo "  -> Starting LDM project '$PROJECT_NAME' with $TAG_FLAG $LIFERAY_TAG on port $PORT..."
    FEATURE_ARGS=""
    if [ ${#FEATURES[@]} -gt 0 ]; then
        FEATURE_ARGS="--feature ${FEATURES[*]}"
    fi
    # Increase CodeCache and Memory to prevent JIT stalls.
    # --clean-state: wipe OSGi state volume before boot to prevent stale lock files.
    # --internal-state: use anonymous Docker volume for OSGi state.
    # --fix-permissions: fix root:root ownership on bind-mount dirs. Requires LDM >= 2.15.22-pre.25.
    log_command "ldm run \"$PROJECT_NAME\" \"$TAG_FLAG\" \"$LIFERAY_TAG\" --port \"$PORT\" --non-interactive --no-captcha --fast-login --sidecar --db postgresql --clean-state --internal-state --fix-permissions $LDM_VERBOSE $FEATURE_ARGS --jvm-args \"-Xms2g -Xmx4g -XX:ReservedCodeCacheSize=512m\""
    if ! ldm run "$PROJECT_NAME" "$TAG_FLAG" "$LIFERAY_TAG" --port "$PORT" --non-interactive --no-captcha --fast-login --sidecar --db postgresql --clean-state --internal-state --fix-permissions $LDM_VERBOSE $FEATURE_ARGS --jvm-args "-Xms2g -Xmx4g -XX:ReservedCodeCacheSize=512m" > ldm_startup.log 2>&1; then
        echo "Error: LDM failed to start the environment."
        echo "Hint: Check ldm_startup.log or run 'ldm logs $PROJECT_NAME' for more details."
        cat <<EOF >> "$RESULTS_FILE"
## Environment Failure
The test runner failed to start the Liferay environment. 
Log snippet:
\`\`\`
$(tail -n 5 ldm_startup.log)
\`\`\`
EOF
        exit 1
    fi
fi

# Resolve project path for deployment
log_command "ldm list -v"
PROJECT_PATH=$(ldm list -v | grep -A 1 "$PROJECT_NAME" | grep "Path:" | awk '{print $2}')
if [ -z "$PROJECT_PATH" ]; then
    echo "Error: Could not resolve project path for '$PROJECT_NAME'."
    exit 1
fi
echo "  -> LDM Project Path: $PROJECT_PATH"

# Fragment ZIPs are deployed by copying them into "$PROJECT_PATH/deploy" for
# Liferay's auto-deploy scanner to consume, which assumes that directory is on
# this machine. If it is not, the copy either fails or writes into a stray local
# directory the container never reads: fragments never deploy, no collections are
# found, and every fragment test then fails with "Fragment ... was not found on
# the page" — indistinguishable from a genuine rendering fault (see #187).
#
# Fail loudly here rather than produce a full run of misleading results.
#
# 'ldm list' reports Target 'local' even for a project whose containers run on a
# remote node, so the registry cannot be trusted for this. Container visibility
# to the local Docker daemon is reliable: LDM creates a local project directory
# either way, but the container itself only appears here when it is local.
if [ -z "$NODE_TARGET" ] && [ "$SKIP_DEPLOY" != true ] && ! docker inspect "$PROJECT_NAME" > /dev/null 2>&1; then
    echo ""
    echo "[ERROR] Container '$PROJECT_NAME' is not visible to the local Docker"
    echo "        daemon, so it is running on a remote LDM node."
    echo ""
    echo "        Fragment deployment copies ZIPs into '$PROJECT_PATH/deploy' for"
    echo "        Liferay's auto-deploy scanner. LDM creates that directory"
    echo "        locally even for a remote project, but the container mounts the"
    echo "        remote host's copy — so the ZIPs would land somewhere nothing"
    echo "        reads. Fragments never deploy, no collections are found, and"
    echo "        every fragment test fails with 'Fragment ... was not found on"
    echo "        the page', which is indistinguishable from a real rendering"
    echo "        fault (see #187)."
    echo ""
    echo "        Remote nodes are not supported yet (Issue #225). To use one,"
    echo "        place the ZIPs in the deploy directory bind-mounted into the"
    echo "        container on that host, then re-run with --skip-deploy."
    exit 1
fi

if [ -n "$NODE_TARGET" ]; then
    REMOTE_DEPLOY_DIR=$(resolve_remote_deploy_dir)
    echo "  -> Remote deploy directory: ${NODE_TARGET}:${REMOTE_DEPLOY_DIR}"
elif [ ! -d "$PROJECT_PATH/deploy" ]; then
    echo ""
    echo "[ERROR] '$PROJECT_PATH/deploy' is not a directory on this machine, so"
    echo "        fragment ZIPs cannot be placed where Liferay will find them."
    exit 1
fi

echo "  -> Waiting for Liferay to become ready..."
log_command "ldm wait \"$PROJECT_NAME\" -d --stream-status"
if curl -s -I "$BASE_URL" &> /dev/null; then
    echo "  -> Liferay is already up and responsive!"
elif ! ldm wait "$PROJECT_NAME" -d --stream-status; then
    echo "Error: Liferay did not start within the expected time or failed readiness checks."
    exit 1
fi
echo "  -> Liferay is up and running at $BASE_URL!"

# 4.1 Extract Realised Version
echo "  -> Resolving portal version..."
REALISED_VERSION=$(ldm list | grep "$PROJECT_NAME" | awk -F'[|?│]' '{print $3}' | xargs || echo "")
REALISED_VERSION=$(echo "$REALISED_VERSION" | sed 's/\x1b\[[0-9;]*m//g')

if [[ ! "$REALISED_VERSION" =~ ^[0-9]{4}\.[a-zA-Z0-9] ]]; then
    echo "  -> LDM version '$REALISED_VERSION' is not in Year.Quarter format, checking JSON WS..."
    LIFERAY_USER="${LIFERAY_USER:-test@liferay.com}"
    LIFERAY_PASSWORD="${LIFERAY_PASSWORD:-test}"
    API_VERSION=$(curl -s -u "$LIFERAY_USER:$LIFERAY_PASSWORD" "$BASE_URL/api/jsonws/portal/get-version" | tr -d '"' | xargs || echo "")
    if [ -n "$API_VERSION" ]; then
        REALISED_VERSION="$API_VERSION"
    fi
fi
echo "  -> Realised Liferay Version: $REALISED_VERSION"

# Rename the results file to be version-specific
NEW_RESULTS_FILE="docs/test-results/results-${REALISED_VERSION}.md"
mv "$RESULTS_FILE" "$NEW_RESULTS_FILE"
RESULTS_FILE="$NEW_RESULTS_FILE"

# Update results file with realised version
sed -i.bak "s/- \*\*Liferay Tag\/Prefix\*\*: .*/&\n- \*\*Realised Version\*\*: $REALISED_VERSION/" "$RESULTS_FILE" && rm "${RESULTS_FILE}.bak"

# 5. Build and Deploy
if [ "$SKIP_DEPLOY" = true ]; then
    echo ""
    echo "[5/5] Skipping Build and Deploy (as requested)..."
    write_signal "WAITING_HEALTHY" "$EST_TESTING"
else
    echo ""
    echo "[5/5] Building and Deploying Fragments..."
    
    DEPLOY_LIST=()
    if [ -n "$FILTER_PATTERN" ]; then
        echo "  -> Filtering build/deployment to matching items..."
        # 1. Check collections
        for coll_dir in *; do
            [ -d "$coll_dir" ] || continue
            [ -f "$coll_dir/main/collection.json" ] || continue
            
            COLL_NAME=$(jq -r '.name // empty' "$coll_dir/main/collection.json" 2>/dev/null || echo "")
            if matches_filter "$coll_dir" || matches_filter "$COLL_NAME"; then
                DEPLOY_LIST+=("$coll_dir")
                continue
            fi
            
            # Check fragments inside collection
            MATCHED=false
            if [ -d "$coll_dir/main" ]; then
                for frag_dir in "$coll_dir/main"/*; do
                    [ -d "$frag_dir" ] || continue
                    [ -f "$frag_dir/main/fragment.json" ] || continue
                    FRAG_FOLDER=$(basename "$frag_dir")
                    FRAG_NAME=$(jq -r '.name // empty' "$frag_dir/main/fragment.json" 2>/dev/null || echo "")
                    FRAG_KEY=$(jq -r '.key // empty' "$frag_dir/main/fragment.json" 2>/dev/null || echo "")
                    if matches_filter "$FRAG_FOLDER" || matches_filter "$FRAG_NAME" || matches_filter "$FRAG_KEY"; then
                        MATCHED=true
                        break
                    fi
                done
            fi
            if [ "$MATCHED" = true ]; then
                DEPLOY_LIST+=("$coll_dir")
            fi
        done
        
        # 2. Check root fragments (not in a collection)
        for frag_dir in *; do
            [ -d "$frag_dir" ] || continue
            [ -f "$frag_dir/main/fragment.json" ] || continue
            
            FRAG_NAME=$(jq -r '.name // empty' "$frag_dir/main/fragment.json" 2>/dev/null || echo "")
            FRAG_KEY=$(jq -r '.key // empty' "$frag_dir/main/fragment.json" 2>/dev/null || echo "")
            if matches_filter "$frag_dir" || matches_filter "$FRAG_NAME" || matches_filter "$FRAG_KEY"; then
                DEPLOY_LIST+=("$frag_dir")
            fi
        done

        # 3. Check showcase data
        if [ -d "other-resources/showcase-data" ]; then
            for sc_dir in other-resources/showcase-data/*; do
                [ -d "$sc_dir" ] || continue
                SC_NAME=$(basename "$sc_dir")
                DEPLOY_LIST+=("$SC_NAME")
            done
        fi
        
        if [ ${#DEPLOY_LIST[@]} -eq 0 ]; then
            echo "  [WARN] No collections, fragments, or showcases matched the filter: $FILTER_PATTERN"
            echo "         Nothing will be built or deployed."
        else
            echo "  -> Found ${#DEPLOY_LIST[@]} matching build targets: ${DEPLOY_LIST[*]}"
        fi
    fi

    echo "  -> Building ZIPs (Default Scoping: liferay.com / Guest)..."
    if [ -n "$FILTER_PATTERN" ]; then
        if [ ${#DEPLOY_LIST[@]} -gt 0 ]; then
            log_command "./create-fragment-zips.sh --clean ${DEPLOY_LIST[*]}"
            ./create-fragment-zips.sh --clean "${DEPLOY_LIST[@]}" > /dev/null
        fi
    else
        log_command "./create-fragment-zips.sh --all"
        ./create-fragment-zips.sh --all > /dev/null
    fi

    write_signal "WAITING_HEALTHY" $((EST_WAITING_HEALTHY_DEPLOY + EST_TESTING))

    # Determine the target ZIP suffix based on Liferay version
    TARGET_ZIP_SUFFIX="-collection-min.zip"
    YEAR=$(echo "$REALISED_VERSION" | cut -d. -f1)
    QUARTER_PART=$(echo "$REALISED_VERSION" | cut -d. -f2 | tr '[:upper:]' '[:lower:]')
    QUARTER=$(echo "$QUARTER_PART" | sed 's/q//')

    if [[ "$YEAR" =~ ^[0-9]+$ ]] && [[ "$QUARTER" =~ ^[0-9]+$ ]]; then
        if [ "$YEAR" -gt 2026 ] || { [ "$YEAR" -eq 2026 ] && [ "$QUARTER" -ge 1 ]; }; then
            TARGET_ZIP_SUFFIX="-collection-min.zip"
            echo "  -> Target Liferay version: $REALISED_VERSION (2026.Q1+). Deploying standard minified ZIPs (Latest)."
        elif { [ "$YEAR" -eq 2025 ] && [ "$QUARTER" -eq 4 ]; }; then
            TARGET_ZIP_SUFFIX="-pre2026q1-min.zip"
            echo "  -> Target Liferay version: $REALISED_VERSION (pre2026q1 compatible). Deploying pre2026q1 minified ZIPs."
        else
            TARGET_ZIP_SUFFIX="-pre2025q3-min.zip"
            echo "  -> Target Liferay version: $REALISED_VERSION (pre2025q3 compatible). Deploying pre2025q3 minified ZIPs."
        fi
    else
        # Fallback patterns in case cut/sed didn't parse expected digits
        if [[ "$REALISED_VERSION" == *"2026.q"* ]] || [[ "$REALISED_VERSION" == *"2027.q"* ]]; then
            TARGET_ZIP_SUFFIX="-collection-min.zip"
            echo "  -> Target Liferay version: $REALISED_VERSION. Deploying standard minified ZIPs (Latest)."
        elif [[ "$REALISED_VERSION" == *"2025.q4"* ]]; then
            TARGET_ZIP_SUFFIX="-pre2026q1-min.zip"
            echo "  -> Target Liferay version: $REALISED_VERSION. Deploying pre2026q1 minified ZIPs."
        else
            TARGET_ZIP_SUFFIX="-pre2025q3-min.zip"
            echo "  -> Target Liferay version: $REALISED_VERSION. Deploying pre2025q3 minified ZIPs."
        fi
    fi

    echo "  -> Deploying ZIPs (Zero-Race Atomic Deployments via LDM bind mount)..."
    for zip_file in zips/fragments/*"$TARGET_ZIP_SUFFIX"; do
        [[ "$zip_file" == *"-debug"* ]] && continue # Skip debug zips if minified exist
        [ -f "$zip_file" ] || continue
        
        COLL_ZIP_NAME=$(basename "$zip_file")
        COLLECTION_NAME=${COLL_ZIP_NAME%$TARGET_ZIP_SUFFIX}
        
        DEPLOY_ZIP="$zip_file"
        ZIP_NAME=$(basename "$DEPLOY_ZIP")
        echo "     Deploying $ZIP_NAME..."
        deploy_artifact "$DEPLOY_ZIP" "${ZIP_NAME}"
        sleep 2 # Throttle deployment to reduce DB contention
    done

    # Deploy root fragments (non-collection)
    for zip_file in zips/fragments/*-min.zip; do
        [ -f "$zip_file" ] || continue
        [[ "$zip_file" == *"-collection-min.zip" ]] && continue
        [[ "$zip_file" == *"-pre20"* ]] && continue
        
        FRAG_ZIP_NAME=$(basename "$zip_file")
        echo "     Deploying Root Fragment: $FRAG_ZIP_NAME..."
        deploy_artifact "$zip_file" "${FRAG_ZIP_NAME}"
        sleep 2 # Throttle deployment to reduce DB contention
    done
    
    echo "  -> Deploying Language and Showcase extensions..."
    for cx_dir in zips/language zips/showcase; do
        [ -d "$cx_dir" ] || continue
        CX_TYPE=$(basename "$cx_dir")
        for cx_zip in "$cx_dir"/*.zip; do
            [ -f "$cx_zip" ] || continue
            CX_ZIP_NAME=$(basename "$cx_zip")
            echo "     Deploying $CX_ZIP_NAME ($CX_TYPE)..."
            deploy_artifact "$cx_zip" "${CX_ZIP_NAME}"
        done
    done

    # 5.1 Wait for Deployments and System to Settle
    echo ""
    echo "  -> Giving Liferay Auto-Deploy Scanner time to pick up files..."
    sleep 30
    
    echo "  -> Waiting for system to settle (Monitoring CPU and OSGi wiring)..."
    log_command "ldm wait \"$PROJECT_NAME\" -d --stream-status"
    if ! ldm wait "$PROJECT_NAME" -d --stream-status; then
        echo "Error: System did not settle properly after deployment."
        exit 1
    fi
    echo "  -> System has settled."
    echo "  -> Triggering search index rebuild via LDM reindex..."
    ldm reindex "$PROJECT_NAME" -y || true
fi

# 6. Execute Tests
echo ""
echo "Executing Playwright Test Suite..."
write_signal "TESTING" "$EST_TESTING"
# With a remote node, Playwright still runs here. Tunnel the port and address
# Liferay as localhost so its configured virtual host matches (Issue #225).
if [ -n "$NODE_TARGET" ]; then
    start_node_tunnel
    BASE_URL="http://localhost:${TUNNEL_LOCAL_PORT}"
    echo "  -> BASE_URL rewritten for tunnel: $BASE_URL"
fi
export BASE_URL="$BASE_URL"
export LIFERAY_VERSION="$REALISED_VERSION"
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
export KEEP_ALIVE="$KEEP_ALIVE"

echo -n "$BASE_URL" > e2e-tests/resolved_base_url.txt

# Tell global-setup how many fragment collections it should expect to find
# before it stops waiting for Liferay auto-deploy. Without this the setup phase
# waits for a hardcoded 5, which a filtered run can never satisfy, so it burns
# the entire 10-minute timeout before proceeding (Issue #211).
# Computed here at repo root so it also applies when -s/--skip-deploy is used.
if [ -n "$FILTER_PATTERN" ]; then
    MATCHED_COLLECTIONS=0
    for coll_dir in *; do
        [ -d "$coll_dir" ] || continue
        [ -f "$coll_dir/main/collection.json" ] || continue
        COLL_NAME=$(jq -r '.name // empty' "$coll_dir/main/collection.json" 2>/dev/null || echo "")
        if matches_filter "$coll_dir" || matches_filter "$COLL_NAME"; then
            MATCHED_COLLECTIONS=$((MATCHED_COLLECTIONS + 1))
            continue
        fi
        # A filter naming a single fragment still requires its parent collection.
        if [ -d "$coll_dir/main" ]; then
            for frag_dir in "$coll_dir/main"/*; do
                [ -d "$frag_dir" ] || continue
                [ -f "$frag_dir/main/fragment.json" ] || continue
                FRAG_NAME=$(jq -r '.name // empty' "$frag_dir/main/fragment.json" 2>/dev/null || echo "")
                if matches_filter "$(basename "$frag_dir")" || matches_filter "$FRAG_NAME"; then
                    MATCHED_COLLECTIONS=$((MATCHED_COLLECTIONS + 1))
                    break
                fi
            done
        fi
    done
    if [ "$MATCHED_COLLECTIONS" -gt 0 ]; then
        export EXPECTED_COLLECTIONS="$MATCHED_COLLECTIONS"
        echo "  -> Filter matches $MATCHED_COLLECTIONS collection(s); deploy gate will expect that many."
    fi
fi

set +e
cd e2e-tests

TEST_EXIT_CODE=0
if [ -n "$FILTER_PATTERN" ]; then
    export TEST_FILTER="$FILTER_PATTERN"
    GREP_PATTERN="${FILTER_PATTERN//-/[- ]}"
    log_command "npx playwright test --grep \"$GREP_PATTERN\""
    npx playwright test --grep "$GREP_PATTERN" > playwright_output.log 2>&1 || TEST_EXIT_CODE=$?
    # A filter that provisions an environment and then matches no tests is a
    # filter defect, not a test failure. Say so explicitly (Issue #212).
    if grep -q "No tests found" playwright_output.log 2>/dev/null; then
        echo ""
        echo "[ERROR] The filter '$FILTER_PATTERN' matched NO tests, after fully"
        echo "        provisioning the environment and seeding pages."
        echo "        Test titles are 'Verify: <Collection Name> (<folder>) > <Fragment Name>'."
        echo "        Check the filter against those identifiers — note that --grep is"
        echo "        case-sensitive."
    fi
else
    log_command "npx playwright test"
    npx playwright test > playwright_output.log 2>&1 || TEST_EXIT_CODE=$?
fi
cd ..
set -e

echo "  -> Verifying visual rendering and checking regressions..."
node scripts/verify-snapshots.js

# Issue #68: DXP Container Log Analysis
# Scan Liferay container logs for silent fatal exceptions that don't surface to
# Playwright. These can indicate broken permission configurations, DB constraint
# violations, or JIT stalls that allow tests to pass with broken state.
echo "  -> Analyzing Liferay container logs for silent exceptions..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
    CONTAINER_LOG_ERRORS=$(docker logs "$PROJECT_NAME" --tail 300 2>&1 | \
        grep -E "NullPointerException|ResourcePermissionException|PrincipalException|PortalException.*permission" || true)
    if [ -n "$CONTAINER_LOG_ERRORS" ]; then
        echo ""
        echo -e "\033[0;31m[ERROR] Fatal exception(s) detected in Liferay container logs:\033[0m"
        echo "$CONTAINER_LOG_ERRORS" | head -n 20
        echo ""
        echo "  -> Dumping last 60 container log lines for context..."
        docker logs "$PROJECT_NAME" --tail 60 2>&1
        echo ""
        echo -e "\033[0;31m[ERROR] Test run marked as FAILED due to container-level exceptions.\033[0m"
        TEST_EXIT_CODE=1
    else
        echo "  -> No fatal exceptions detected in container logs."
    fi
fi

# Persist playwright-results.json so the gallery can be regenerated without re-running tests.
# Copy to docs/test-results/ alongside the markdown results file.
if [ -f "e2e-tests/playwright-results.json" ]; then
    cp "e2e-tests/playwright-results.json" "docs/test-results/playwright-results.json"
    echo "  -> Playwright JSON results persisted to docs/test-results/playwright-results.json"
fi

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "  -> All tests passed."
    TESTS_PASSED=true
    sed -i.bak "s/- \*\*Status\*\*: Running.../- \*\*Status\*\*: Completed/" "$RESULTS_FILE" && rm "${RESULTS_FILE}.bak"
    echo "## Summary" >> "$RESULTS_FILE"
    echo "All tests passed successfully." >> "$RESULTS_FILE"

    echo "  -> Regenerating documentation gallery..."
    node scripts/generate-gallery.js
    echo "  -> Gallery regenerated successfully."
else
    echo "  -> Some tests failed. Check e2e-tests/playwright_output.log"
    TESTS_PASSED=false
    sed -i.bak "s/- \*\*Status\*\*: Running.../- \*\*Status\*\*: Failed/" "$RESULTS_FILE" && rm "${RESULTS_FILE}.bak"
    echo "## Summary" >> "$RESULTS_FILE"
    echo "Some Playwright tests failed." >> "$RESULTS_FILE"

    # Regenerate gallery even on failure so it reflects actual failed/passed status per fragment.
    echo "  -> Regenerating documentation gallery (with test failure statuses)..."
    node scripts/generate-gallery.js
    echo "  -> Gallery regenerated successfully."
fi

echo ""
echo "Test run complete. Report: $RESULTS_FILE"
