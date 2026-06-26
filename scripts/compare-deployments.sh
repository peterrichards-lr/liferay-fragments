#!/bin/bash
# scripts/compare-deployments.sh
# Diagnostic script to compare fragment deployment across three environments:
# 1. Local Bundle (8080)
# 2. Standalone Docker (8090)
# 3. LDM Project (8900)

set -e

# Wrapper function to enforce clean, color-free plain-text outputs for all LDM commands
ldm() {
    command ldm "$@" --no-color --no-unicode
}


# Configuration (Override these via ENV if needed)
BUNDLE_PATH="${BUNDLE_PATH:-}"
DOCKER_CONTAINER="${DOCKER_CONTAINER:-liferay-standalone}"
LDM_PROJECT="${LDM_PROJECT:-fragments-test-env}"
SMALLEST_FRAG="master-page-background-colour"
ZIP_FILE="zips/fragments/${SMALLEST_FRAG}-min.zip"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[COMPARE]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. Build the target fragment
log "Building $SMALLEST_FRAG with --global targeting..."
./create-fragment-zips.sh "$SMALLEST_FRAG" --global > /dev/null

if [ ! -f "$ZIP_FILE" ]; then
    error "Failed to find $ZIP_FILE. Check build output."
    exit 1
fi

# 2. Deployment Phase
echo "--------------------------------------------------------"
echo " ENVIRONMENT DEPLOYMENT "
echo "--------------------------------------------------------"

# A. Local Bundle
if [ -d "$BUNDLE_PATH/deploy" ]; then
    log "Deploying to Local Bundle: $BUNDLE_PATH"
    cp "$ZIP_FILE" "$BUNDLE_PATH/deploy/"
else
    warn "BUNDLE_PATH not set or invalid. Skipping Local Bundle test."
    warn "Hint: export BUNDLE_PATH=/path/to/liferay-bundle"
fi

# B. Standalone Docker
# Support resolving by ID or Name
CONTAINER_ID=$(docker ps -q --filter "id=${DOCKER_CONTAINER}")
if [ -z "$CONTAINER_ID" ]; then
    CONTAINER_ID=$(docker ps -q --filter "name=^${DOCKER_CONTAINER}$")
fi

if [ -n "$CONTAINER_ID" ]; then
    log "Deploying to Standalone Docker: $DOCKER_CONTAINER ($CONTAINER_ID)"
    # Using atomic move strategy
    docker exec -u 0 "$CONTAINER_ID" mkdir -p /tmp/compare-staging
    docker cp "$ZIP_FILE" "$CONTAINER_ID:/tmp/compare-staging/"
    docker exec -u 0 "$CONTAINER_ID" mv "/tmp/compare-staging/$(basename "$ZIP_FILE")" "/opt/liferay/deploy/"
else
    warn "Standalone Docker container '$DOCKER_CONTAINER' not found. Skipping."
fi

# C. LDM Project
LDM_CONTAINER=$(docker ps --format '{{.Names}}' | grep "${LDM_PROJECT}" | grep -vE "\-db|\-elasticsearch" | head -n 1)
if [ -n "$LDM_CONTAINER" ]; then
    log "Deploying to LDM Project: $LDM_PROJECT ($LDM_CONTAINER)"
    # Using atomic move strategy
    docker exec -u 0 "$LDM_CONTAINER" mkdir -p /tmp/compare-staging
    docker cp "$ZIP_FILE" "$LDM_CONTAINER:/tmp/compare-staging/"
    docker exec -u 0 "$LDM_CONTAINER" mv "/tmp/compare-staging/$(basename "$ZIP_FILE")" "/opt/liferay/deploy/"
else
    warn "LDM Container for project '$LDM_PROJECT' not found. Skipping."
fi

# 3. Monitoring Phase
log "Waiting 20 seconds for Liferay to process deployments..."
sleep 20

echo ""
echo "--------------------------------------------------------"
echo " LOG COMPARISON "
echo "--------------------------------------------------------"

extract_logs() {
    local ENV_NAME=$1
    local SOURCE=$2
    local CMD=$3

    echo -e "${YELLOW}>>> Logs for $ENV_NAME <<<${NC}"
    if [[ "$SOURCE" == "file" ]]; then
        [ -f "$CMD" ] && grep -iE "FragmentFileInstaller|liferay-deploy-fragments.json|ERROR|Exception" "$CMD" | tail -n 10 || echo "Log file not found."
    elif [[ "$SOURCE" == "ldm" ]]; then
        ldm logs "$CMD" liferay -n 500 -g "FragmentFileInstaller|liferay-deploy-fragments.json|ERROR|Exception" --grep-i 2>&1 | tail -n 10 || echo "No relevant logs found."

    else
        docker logs "$CMD" --tail 500 2>&1 | grep -iE "FragmentFileInstaller|liferay-deploy-fragments.json|ERROR|Exception" | tail -n 10 || echo "No relevant logs found."
    fi
    echo ""
}

if [ -d "$BUNDLE_PATH" ]; then
    LATEST_LOG=$(ls -t "$BUNDLE_PATH/logs/liferay."* 2>/dev/null | head -n 1)
    extract_logs "Local Bundle" "file" "$LATEST_LOG"
fi

if [ -n "$CONTAINER_ID" ]; then
    extract_logs "Standalone Docker" "docker" "$CONTAINER_ID"
fi

if ldm list | grep -q "$LDM_PROJECT"; then
    extract_logs "LDM Project" "ldm" "$LDM_PROJECT"
fi

log "Diagnostic complete."
