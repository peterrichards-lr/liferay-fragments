#!/bin/bash
# scripts/test-runner.sh
# Automates the setup, testing, and teardown of Liferay Fragments using LDM and Playwright.

set -e

MIN_LDM_VERSION="2.8.0"
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
       playwright-report/ test-results/ state.json ldm_startup.log
echo "  -> Old logs and reports cleared."

# 2. Port & Tag Logic
echo ""
echo "[2/5] Configuring Environment Parameters..."

if [ "$EXISTING_PROJECT" = true ]; then
    echo "  -> Using Existing Project: $PROJECT_NAME"
    # Resolve URL and Path for existing project
    # Use grep to extract the actual HTTP URL, ignoring any ANSI color codes
    BASE_URL=$(ldm list | grep "$PROJECT_NAME" | grep -Eo "https?://[a-zA-Z0-9.:-]+" | head -n 1)
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

echo "  -> Enabling modern Headless API feature flags in common properties..."
# Ensure file ends with newline before appending
[ -f ~/.ldm/common/portal-ext.properties ] && sed -i '' -e '$a\' ~/.ldm/common/portal-ext.properties 2>/dev/null || true

# Disable Terms of Use to prevent modal from blocking E2E screenshots
if ! grep -q "terms.of.use.required=false" ~/.ldm/common/portal-ext.properties; then
    echo "terms.of.use.required=false" >> ~/.ldm/common/portal-ext.properties
fi

# LPD-35443: Page Management API
if ! grep -q "feature.flag.LPD-35443=true" ~/.ldm/common/portal-ext.properties; then
    echo "feature.flag.LPD-35443=true" >> ~/.ldm/common/portal-ext.properties
fi

# LPS-178052: Headless Site Pages
if ! grep -q "feature.flag.LPS-178052=true" ~/.ldm/common/portal-ext.properties; then
    echo "feature.flag.LPS-178052=true" >> ~/.ldm/common/portal-ext.properties
fi

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
    # Increase CodeCache and Memory to prevent JIT stalls. 
    log_command "ldm run \"$PROJECT_NAME\" \"$TAG_FLAG\" \"$LIFERAY_TAG\" --port \"$PORT\" --non-interactive --no-captcha --fast-login --sidecar --db postgresql $LDM_VERBOSE --env \"LIFERAY_JVM_OPTS=-Xms2g -Xmx4g -XX:ReservedCodeCacheSize=512m\""
    if ! ldm run "$PROJECT_NAME" "$TAG_FLAG" "$LIFERAY_TAG" --port "$PORT" --non-interactive --no-captcha --fast-login --sidecar --db postgresql $LDM_VERBOSE --env "LIFERAY_JVM_OPTS=-Xms2g -Xmx4g -XX:ReservedCodeCacheSize=512m" > ldm_startup.log 2>&1; then
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
log_command "ldm wait \"$PROJECT_NAME\""
if ! ldm wait "$PROJECT_NAME"; then
    echo "Error: Liferay did not start within the expected time or failed readiness checks."
    exit 1
fi
echo "  -> Liferay is up and running at $BASE_URL!"

# 4.1 Extract Realised Version via JSON WS
echo "  -> Fetching portal version via JSON WS..."
REALISED_VERSION=$(curl -s -u "$LIFERAY_USER:$LIFERAY_PASSWORD" "$BASE_URL/api/jsonws/portal/get-version" | tr -d '"' | xargs || echo "")

if [ -z "$REALISED_VERSION" ]; then
    # Fallback to ldm list if JSON WS fails
    REALISED_VERSION=$(ldm list | grep "$PROJECT_NAME" | awk '{print $2}' | xargs)
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
else
    echo ""
    echo "[5/5] Building and Deploying Fragments..."
    echo "  -> Building ZIPs (Default Scoping: liferay.com / Guest)..."
    log_command "./create-fragment-zips.sh --all"
    ./create-fragment-zips.sh --all > /dev/null

    echo "  -> Deploying ZIPs (Zero-Race Atomic Deployments via LDM bind mount)..."
    for zip_file in zips/fragments/*.zip; do
        [[ "$zip_file" == *"-pre2025q3"* ]] && continue
        [[ "$zip_file" == *"-debug"* ]] && continue # Skip debug zips if minified exist
        
        ZIP_NAME=$(basename "$zip_file")
        echo "     Deploying $ZIP_NAME..."
        cp "$zip_file" "$PROJECT_PATH/deploy/"
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
            cp "$cx_zip" "$PROJECT_PATH/deploy/"
        done
    done

    # 5.1 Wait for Deployments and System to Settle
    echo ""
    echo "  -> Giving Liferay Auto-Deploy Scanner time to pick up files..."
    sleep 30
    
    echo "  -> Waiting for system to settle (Monitoring CPU and OSGi wiring)..."
    log_command "ldm wait \"$PROJECT_NAME\""
    if ! ldm wait "$PROJECT_NAME"; then
        echo "Error: System did not settle properly after deployment."
        exit 1
    fi
    echo "  -> System has settled."
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
