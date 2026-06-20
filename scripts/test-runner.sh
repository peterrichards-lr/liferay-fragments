#!/bin/bash
# scripts/test-runner.sh
# Automates the setup, testing, and teardown of Liferay Fragments using LDM and Playwright.

set -e

# State Coordinator Initialization
PROGRESS_SIGNAL_FILE="$(pwd)/.progress-signal"
TESTS_PASSED=false
EXIT_HANDLED=false

# Ensure scripts directory and System32 are in PATH
export PATH="$(pwd)/scripts:$(pwd)/node_modules/.bin:$PATH"
export PATH="$PATH:/c/Windows/System32"
export PATH="$PATH:/c/Users/prichards/AppData/Local/Microsoft/WinGet/Packages/jqlang.jq_Microsoft.Winget.Source_8wekyb3d8bbwe"
export PATH="$PATH:/c/Users/prichards/AppData/Local/Microsoft/WinGet/Links"


# Estimate variables (ballpark seconds)
EST_BUILD_EXISTING_SKIP_DEPLOY=5
EST_BUILD_EXISTING_DEPLOY=45
EST_BUILD_NEW_SKIP_DEPLOY=180
EST_BUILD_NEW_DEPLOY=220

EST_WAITING_HEALTHY_DEPLOY=100
EST_WAITING_HEALTHY_SKIP_DEPLOY=0

EST_TESTING=350

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
    if [ "$EXIT_HANDLED" = true ]; then
        return
    fi
    EXIT_HANDLED=true
    
    EXIT_CODE=$?
    
    cleanup
    
    if [ "$TESTS_PASSED" = true ]; then
        # Clean up transient logs and reports on successful execution
        rm -rf ldm_startup.log e2e-tests/playwright_output.log state.json \
               playwright-report/ test-results/ e2e-tests/playwright-report/ e2e-tests/test-results/
               
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
PORT=8090
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
echo " Target Liferay Tag/Prefix: $LIFERAY_TAG"
if [ -n "$FILTER_PATTERN" ]; then echo " Test Filter: $FILTER_PATTERN"; fi
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
if ! playwright test --version &> /dev/null; then
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

# 4. Environment Provisioning
echo ""
echo "[4/5] Provisioning Liferay environment via LDM..."

if [ "$EXISTING_PROJECT" = true ]; then
    echo "  -> Skipping LDM run (using existing project $PROJECT_NAME)..."
else
    echo "  -> Starting LDM project '$PROJECT_NAME' with $TAG_FLAG $LIFERAY_TAG on port $PORT..."
    FEATURE_ARGS=""
    if [ ${#FEATURES[@]} -gt 0 ]; then
        FEATURE_ARGS="--feature ${FEATURES[*]}"
    fi
    # Increase CodeCache and Memory to prevent JIT stalls. 
    log_command "ldm run \"$PROJECT_NAME\" \"$TAG_FLAG\" \"$LIFERAY_TAG\" --port \"$PORT\" --non-interactive --no-captcha --fast-login --sidecar --db postgresql $LDM_VERBOSE $FEATURE_ARGS --env \"LIFERAY_JVM_OPTS=-Xms2g -Xmx4g -XX:ReservedCodeCacheSize=512m\""
    if ! ldm run "$PROJECT_NAME" "$TAG_FLAG" "$LIFERAY_TAG" --port "$PORT" --non-interactive --no-captcha --fast-login --sidecar --db postgresql $LDM_VERBOSE $FEATURE_ARGS --env "LIFERAY_JVM_OPTS=-Xms2g -Xmx4g -XX:ReservedCodeCacheSize=512m" > ldm_startup.log 2>&1; then
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
            [ -f "$coll_dir/collection.json" ] || continue
            
            COLL_NAME=$(jq -r '.name // empty' "$coll_dir/collection.json" 2>/dev/null || echo "")
            if matches_filter "$coll_dir" || matches_filter "$COLL_NAME"; then
                DEPLOY_LIST+=("$coll_dir")
                continue
            fi
            
            # Check fragments inside collection
            MATCHED=false
            if [ -d "$coll_dir/fragments" ]; then
                for frag_dir in "$coll_dir/fragments"/*; do
                    [ -d "$frag_dir" ] || continue
                    [ -f "$frag_dir/fragment.json" ] || continue
                    FRAG_FOLDER=$(basename "$frag_dir")
                    FRAG_NAME=$(jq -r '.name // empty' "$frag_dir/fragment.json" 2>/dev/null || echo "")
                    FRAG_KEY=$(jq -r '.key // empty' "$frag_dir/fragment.json" 2>/dev/null || echo "")
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
            [ -f "$frag_dir/fragment.json" ] || continue
            
            FRAG_NAME=$(jq -r '.name // empty' "$frag_dir/fragment.json" 2>/dev/null || echo "")
            FRAG_KEY=$(jq -r '.key // empty' "$frag_dir/fragment.json" 2>/dev/null || echo "")
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

    # Clean up pre-existing fragment resource files from the database to prevent duplicate (1).css, (2).css creation by auto-deploy scanner
    if [ "$(docker ps -q -f name=fragments-test-env-db)" ]; then
        echo "  -> Purging duplicate/stale fragment resource database entries..."
        docker exec -i fragments-test-env-db psql -U lportal -d lportal -c "
          DELETE FROM dlfileentrymetadata WHERE fileentryid IN (SELECT fileentryid FROM dlfileentry WHERE folderid IN (SELECT folderid FROM dlfolder WHERE parentfolderid = (SELECT folderid FROM dlfolder WHERE name = 'com_liferay_fragment_web_portlet_FragmentPortlet')));
          DELETE FROM dlfileversion WHERE fileentryid IN (SELECT fileentryid FROM dlfileentry WHERE folderid IN (SELECT folderid FROM dlfolder WHERE parentfolderid = (SELECT folderid FROM dlfolder WHERE name = 'com_liferay_fragment_web_portlet_FragmentPortlet')));
          DELETE FROM dlfileentry WHERE folderid IN (SELECT folderid FROM dlfolder WHERE parentfolderid = (SELECT folderid FROM dlfolder WHERE name = 'com_liferay_fragment_web_portlet_FragmentPortlet'));
        " > /dev/null 2>&1 || true
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
        cp "$DEPLOY_ZIP" "$PROJECT_PATH/deploy/${ZIP_NAME}.tmp"
        mv "$PROJECT_PATH/deploy/${ZIP_NAME}.tmp" "$PROJECT_PATH/deploy/${ZIP_NAME}"
        sleep 2 # Throttle deployment to reduce DB contention
    done

    # Deploy root fragments (non-collection)
    for zip_file in zips/fragments/*-min.zip; do
        [ -f "$zip_file" ] || continue
        [[ "$zip_file" == *"-collection-min.zip" ]] && continue
        [[ "$zip_file" == *"-pre20"* ]] && continue
        
        FRAG_ZIP_NAME=$(basename "$zip_file")
        echo "     Deploying Root Fragment: $FRAG_ZIP_NAME..."
        cp "$zip_file" "$PROJECT_PATH/deploy/${FRAG_ZIP_NAME}.tmp"
        mv "$PROJECT_PATH/deploy/${FRAG_ZIP_NAME}.tmp" "$PROJECT_PATH/deploy/${FRAG_ZIP_NAME}"
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
            cp "$cx_zip" "$PROJECT_PATH/deploy/${CX_ZIP_NAME}.tmp"
            mv "$PROJECT_PATH/deploy/${CX_ZIP_NAME}.tmp" "$PROJECT_PATH/deploy/${CX_ZIP_NAME}"
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
write_signal "TESTING" "$EST_TESTING"
set +e
cd e2e-tests
if [ -n "$FILTER_PATTERN" ]; then
    log_command "LIFERAY_VERSION=\"$REALISED_VERSION\" PW_TEST_SCREENSHOT_NO_FONTS_READY=1 playwright test --grep \"$FILTER_PATTERN\""
    LIFERAY_VERSION="$REALISED_VERSION" PW_TEST_SCREENSHOT_NO_FONTS_READY=1 TEST_FILTER="$FILTER_PATTERN" playwright test --grep "$FILTER_PATTERN" > playwright_output.log 2>&1
else
    log_command "LIFERAY_VERSION=\"$REALISED_VERSION\" PW_TEST_SCREENSHOT_NO_FONTS_READY=1 playwright test"
    LIFERAY_VERSION="$REALISED_VERSION" PW_TEST_SCREENSHOT_NO_FONTS_READY=1 playwright test > playwright_output.log 2>&1
fi
TEST_EXIT_CODE=$?
cd ..
set -e

echo "  -> Verifying visual rendering and checking regressions..."
node scripts/verify-snapshots.js

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
fi

echo ""
echo "Test run complete. Report: $RESULTS_FILE"
