#!/bin/bash
# scripts/test-runner.sh
# Automates the setup, testing, and teardown of Liferay Fragments using LDM and Playwright.

set -e

MIN_LDM_VERSION="2.5.0"
LIFERAY_TAG="2026.q1"
PROJECT_NAME="fragments-test-env"
PORT=8080
VERBOSE=false
KEEP_ALIVE=false
EXISTING_PROJECT=false
SKIP_DEPLOY=false
LDM_VERBOSE=""

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
        *) 
            LIFERAY_TAG="$1" 
            ;;
    esac
    shift
done

if [ "$VERBOSE" = true ]; then
    set -x
fi

# Logging Helpers
log_command() {
    if [ "$VERBOSE" = true ]; then
        echo -e "\033[0;34m[CMD]\033[0m $@"
    fi
}

echo "======================================================"
echo " Starting Liferay Fragments Automated Test Runner "
echo " Target Liferay Tag/Prefix: $LIFERAY_TAG"
if [ "$VERBOSE" = true ]; then echo " Verbose Mode: Enabled"; fi
echo " (Press Ctrl+C to safely abort and cleanup at any time)"
echo "======================================================"

# 0. CI Safeguard
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "Notice: This script is intended for local execution only due to high computational load."
    echo "Skipping execution in CI/GitHub Actions."
    exit 0
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
rm -rf e2e-tests/snapshots/ e2e-tests/playwright-report/ e2e-tests/playwright_output.log \
       playwright-report/ test-results/ state.json ldm_startup.log
echo "  -> Old logs and reports cleared."

# 2. Port & Tag Logic
echo ""
echo "[2/5] Configuring Environment Parameters..."

if [ "$EXISTING_PROJECT" = true ]; then
    echo "  -> Using Existing Project: $PROJECT_NAME"
    # Resolve URL and Path for existing project
    # Use grep to extract the actual HTTP URL, ignoring any ANSI color codes
    BASE_URL=$(ldm list | grep "$PROJECT_NAME" | grep -Eo "https?://[a-zA-Z0-9.:]+" | head -n 1)
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

echo "  -> Initializing LDM common assets..."
log_command "ldm init-common -y"
ldm init-common -y > /dev/null 2>&1

echo "  -> Verifying Liferay DXP activation key..."
if ! ls ~/.ldm/common/*.xml 1> /dev/null 2>&1; then
    echo "Error: No activation key (.xml) found in ~/.ldm/common."
    echo "Hint: Please place a valid Liferay DXP activation key in ~/.ldm/common/ before running this script."
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

# Cleanup Trap
cleanup() {
    echo ""
    echo "======================================================"
    if [ "$KEEP_ALIVE" = true ]; then
        echo " [KEEP ALIVE] Skipping environment teardown."
        echo " Liferay is still running at $BASE_URL"
        echo " Project directory: $PROJECT_PATH"
    else
        echo " Tearing down Liferay Docker Manager project..."
        log_command "ldm rm \"$PROJECT_NAME\" -y --delete"
        ldm rm "$PROJECT_NAME" -y --delete > /dev/null 2>&1 || true
        echo " Cleanup complete."
    fi
    echo "======================================================"
}
trap cleanup EXIT

# 4. Environment Provisioning
echo ""
echo "[4/5] Provisioning Liferay environment via LDM..."

if [ "$EXISTING_PROJECT" = true ]; then
    echo "  -> Skipping LDM run (using existing project $PROJECT_NAME)..."
else
    echo "  -> Starting LDM project '$PROJECT_NAME' with $TAG_FLAG $LIFERAY_TAG on port $PORT..."
    log_command "ldm run \"$PROJECT_NAME\" \"$TAG_FLAG\" \"$LIFERAY_TAG\" --port \"$PORT\" --non-interactive --no-captcha --sidecar --db postgresql $LDM_VERBOSE"
    if ! ldm run "$PROJECT_NAME" "$TAG_FLAG" "$LIFERAY_TAG" --port "$PORT" --non-interactive --no-captcha --sidecar --db postgresql $LDM_VERBOSE > ldm_startup.log 2>&1; then
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

echo "  -> Waiting for Liferay to become ready..."
MAX_RETRIES=60
RETRY_COUNT=0
until curl -s -f -o /dev/null "$BASE_URL/c/portal/login" || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo -n "."
    sleep 5
    ((RETRY_COUNT++))
done

echo ""
if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Error: Liferay did not start within the expected time."
    exit 1
fi
echo "  -> Liferay is up and running at $BASE_URL!"

# 4.1 Extract Realised Version
REALISED_VERSION=$(ldm list | grep "$PROJECT_NAME" | awk '{print $2}' | xargs)
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
else
    echo ""
    echo "[5/5] Building and Deploying Fragments..."
    echo "  -> Building ZIPs (Scoped to liferay.com / Guest)..."
    log_command "COMPANY_WEB_ID=\"liferay.com\" GROUP_KEY=\"Guest\" ./create-fragment-zips.sh --all"
    COMPANY_WEB_ID="liferay.com" GROUP_KEY="Guest" ./create-fragment-zips.sh --all > /dev/null

    echo "  -> Deploying ZIPs to LDM project directory..."
    log_command "find zips/fragments -type f -name \"*.zip\" ! -name \"*pre2025q3*.zip\" -exec cp {} \"$PROJECT_PATH/deploy/\" \\;"
    find zips/fragments -type f -name "*.zip" ! -name "*pre2025q3*.zip" -exec cp {} "$PROJECT_PATH/deploy/" \;
    log_command "cp -r zips/language/. \"$PROJECT_PATH/osgi/client-extensions/\""
    cp -r zips/language/. "$PROJECT_PATH/osgi/client-extensions/"
    log_command "cp -r zips/showcase/. \"$PROJECT_PATH/osgi/client-extensions/\""
    cp -r zips/showcase/. "$PROJECT_PATH/osgi/client-extensions/"

    # 5.1 Wait for Fragments and Showcase Data
    echo ""
    EXPECTED_ARTIFACTS=$(find zips/fragments -type f -name "*.zip" ! -name "*pre2025q3*.zip" | wc -l | xargs)
    MAX_WAIT_FRAGMENTS=180
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt $MAX_WAIT_FRAGMENTS ]; do
        # Match the pattern provided by the user: "Deployed ... successfully"
        # We use wc -l to ensure we always get a single clean integer, and xargs to trim whitespace
        ACTUAL_ARTIFACTS=$(ldm logs -n 1000 "$PROJECT_NAME" liferay | grep -iE "Deployed .* successfully" | wc -l | xargs || echo 0)
        
        echo -ne "\r  -> Waiting for Fragments to be deployed... [$ACTUAL_ARTIFACTS/$EXPECTED_ARTIFACTS] "
        
        if [ "$ACTUAL_ARTIFACTS" -ge "$EXPECTED_ARTIFACTS" ]; then
            echo -e "\n  -> All $ACTUAL_ARTIFACTS Fragment artifacts deployed successfully."
            break
        fi
        sleep 5
        ((WAIT_COUNT+=5))
    done

    echo ""
    echo "  -> Waiting for Showcase Data (Batch CX deployments)..."
    MAX_WAIT_CX=120
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt $MAX_WAIT_CX ]; do
        if ldm logs -n 500 "$PROJECT_NAME" liferay | grep -q "STARTED.*showcase.*batch-cx"; then
            echo "  -> Showcase data detected."
            break
        fi
        echo -n "."
        sleep 5
        ((WAIT_COUNT+=5))
    done
    echo ""
    # Final buffer to ensure database records are committed
    sleep 30
fi

# 6. Execute Tests
echo ""
echo "Executing Playwright Test Suite..."
set +e
cd e2e-tests
log_command "npx playwright test"
npx playwright test > playwright_output.log 2>&1
TEST_EXIT_CODE=$?
cd ..
set -e

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "  -> All tests passed."
    sed -i.bak "s/- \*\*Status\*\*: Running.../- \*\*Status\*\*: Completed/" "$RESULTS_FILE" && rm "${RESULTS_FILE}.bak"
    echo "## Summary" >> "$RESULTS_FILE"
    echo "All tests passed successfully." >> "$RESULTS_FILE"
else
    echo "  -> Some tests failed. Check e2e-tests/playwright_output.log"
    sed -i.bak "s/- \*\*Status\*\*: Running.../- \*\*Status\*\*: Failed/" "$RESULTS_FILE" && rm "${RESULTS_FILE}.bak"
    echo "## Summary" >> "$RESULTS_FILE"
    echo "Some Playwright tests failed." >> "$RESULTS_FILE"
fi

echo ""
echo "Test run complete. Report: $RESULTS_FILE"
