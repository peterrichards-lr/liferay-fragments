#!/bin/bash

# deploy-fragment-zips.sh
# Automates the deployment of generated fragment and Language CX ZIPs.

TARGET_PATH=$1
shift

if [ -z "$TARGET_PATH" ] || [ -z "$1" ]; then
    echo "Usage: $0 [TARGET_PATH] [--legacy] [--debug] [--all | --showcase | folder_name1 folder_name2 ...]"
    echo ""
    echo "Arguments:"
    echo "  TARGET_PATH    Root of a Liferay Workspace or a standalone Liferay bundle."
    echo "  --legacy       Deploy pre-2025.Q3 legacy versions of fragments."
    echo "  --debug        Deploy unminified '-debug.zip' versions instead of '-min.zip'."
    echo "  --all          Deploy all ZIPs found in /zips and all showcase resources."
    echo "  --showcase     Shortcut to deploy all showcase resources under other-resources/showcase-data/."
    echo "  folder_name    Specific fragment, collection, or resource folder names."
    echo ""
    echo "Example: $0 ~/liferay-workspace --all"
    echo "Example: $0 /opt/liferay --debug --all"
    echo "Example: $0 /opt/liferay --legacy --showcase"
    echo "Example: $0 /opt/liferay gemini-generated loan-calculator"
    exit 1
fi

# 1. Resolve the actual Liferay 'deploy' directory
DEPLOY_DIR=""
if [ -d "$TARGET_PATH/bundles/deploy" ]; then
    DEPLOY_DIR="$TARGET_PATH/bundles/deploy"
elif [ -d "$TARGET_PATH/deploy" ]; then
    DEPLOY_DIR="$TARGET_PATH/deploy"
else
    echo "Error: Could not find a 'deploy' folder in $TARGET_PATH."
    echo "Ensure the path is a valid Liferay bundle or Workspace root."
    exit 1
fi

# 2. Resolve the OSGi client-extensions directory
CX_DIR=""
if [ -d "$TARGET_PATH/bundles/osgi/client-extensions" ]; then
    CX_DIR="$TARGET_PATH/bundles/osgi/client-extensions"
elif [ -d "$TARGET_PATH/osgi/client-extensions" ]; then
    CX_DIR="$TARGET_PATH/osgi/client-extensions"
else
    echo "Error: Could not find an 'osgi/client-extensions' folder in $TARGET_PATH."
    exit 1
fi

# 3. Process Flags
LEGACY_MODE="false"
DEBUG_MODE="false"
DEPLOY_ALL="false"
DEPLOY_SHOWCASE="false"
ITEMS=()

for arg in "$@"; do
    if [ "$arg" == "--legacy" ]; then
        LEGACY_MODE="true"
    elif [ "$arg" == "--debug" ]; then
        DEBUG_MODE="true"
    elif [ "$arg" == "--all" ]; then
        DEPLOY_ALL="true"
    elif [ "$arg" == "--showcase" ]; then
        DEPLOY_SHOWCASE="true"
    else
        ITEMS+=("$arg")
    fi
done

BUILD_SUFFIX="-min"
[[ "$DEBUG_MODE" == "true" ]] && BUILD_SUFFIX="-debug"

LEGACY_SUFFIX=""
[[ "$LEGACY_MODE" == "true" ]] && LEGACY_SUFFIX="-pre2025q3"

echo "--------------------------------------------------------"
echo "Targeting Liferay Deploy: $DEPLOY_DIR"
echo "Targeting Client Extensions: $CX_DIR"
echo "Build Mode: ${BUILD_SUFFIX/-}"
echo "Legacy Mode: $LEGACY_MODE"
echo "--------------------------------------------------------"

# 4. Check for the source ZIPs
if [ ! -d "zips" ]; then
    echo "Error: 'zips' directory not found. Please run ./create-fragment-zips.sh first."
    exit 1
fi

# Helper function to deploy related ZIPs for a single name
deploy_item() {
    local NAME=$1
    local FOUND=false

    echo "Checking for assets related to '$NAME'..."

    # Determine primary and secondary suffixes for fallback
    local ALT_SUFFIX="-debug"
    [[ "$BUILD_SUFFIX" == "-debug" ]] && ALT_SUFFIX="-min"

    # Check for Fragment ZIP (Individual or Collection)
    # Pattern: name[-pre2025q3][-min|-debug].zip
    for sfx in "$BUILD_SUFFIX" "$ALT_SUFFIX"; do
        if [ -f "zips/fragments/${NAME}${LEGACY_SUFFIX}${sfx}.zip" ]; then
            echo "  -> Deploying Fragment: ${NAME}${LEGACY_SUFFIX}${sfx}.zip"
            cp "zips/fragments/${NAME}${LEGACY_SUFFIX}${sfx}.zip" "$DEPLOY_DIR/"
            FOUND=true
            break
        fi
        
        if [ -f "zips/fragments/${NAME}-collection${sfx}.zip" ]; then
            echo "  -> Deploying Collection: ${NAME}-collection${sfx}.zip"
            cp "zips/fragments/${NAME}-collection${sfx}.zip" "$DEPLOY_DIR/"
            FOUND=true
            break
        fi
    done

    # Check for Language CX ZIP
    if [ -f "zips/language/${NAME}-language-batch-cx.zip" ]; then
        echo "  -> Deploying Language CX: ${NAME}-language-batch-cx.zip"
        cp "zips/language/${NAME}-language-batch-cx.zip" "$CX_DIR/"
        FOUND=true
    fi

    # Check for Special Resource ZIP (in zips/showcase/)
    if [ -f "zips/showcase/${NAME}-batch-cx.zip" ]; then
        echo "  -> Deploying Showcase Resource: ${NAME}-batch-cx.zip"
        cp "zips/showcase/${NAME}-batch-cx.zip" "$CX_DIR/"
        FOUND=true
    fi

    if [ "$FOUND" = false ]; then
        echo "  !! Warning: No ZIPs found for '$NAME' (Legacy: $LEGACY_MODE, Mode: $BUILD_SUFFIX)"
    fi
}

# 5. Execution logic
if [ "$DEPLOY_ALL" == "true" ]; then
    echo "Deploying all assets..."
    
    # Fragments/Collections
    if [ -d "zips/fragments" ]; then
        for f in zips/fragments/*${BUILD_SUFFIX}.zip; do
            [ -e "$f" ] || continue
            FILENAME=$(basename "$f")
            
            # Filter by legacy suffix if applicable
            if [[ "$LEGACY_MODE" == "true" ]]; then
                if [[ "$FILENAME" == *"${LEGACY_SUFFIX}${BUILD_SUFFIX}.zip" ]]; then
                    echo "  -> Deploying Legacy Fragment $FILENAME to deploy/"
                    cp "$f" "$DEPLOY_DIR/"
                fi
            else
                # Non-legacy: MUST NOT have the legacy suffix but MUST have the build suffix
                if [[ "$FILENAME" != *"-pre2025q3"* ]]; then
                    echo "  -> Deploying Fragment $FILENAME to deploy/"
                    cp "$f" "$DEPLOY_DIR/"
                fi
            fi
        done
    fi

    # Language CX
    if [ -d "zips/language" ]; then
        for l in zips/language/*.zip; do
            [ -e "$l" ] || continue
            echo "  -> Deploying Language CX $(basename "$l") to osgi/client-extensions/"
            cp "$l" "$CX_DIR/"
        done
    fi
    
    # Enable showcase deployment if --all is used
    DEPLOY_SHOWCASE="true"
fi

if [ "$DEPLOY_SHOWCASE" == "true" ]; then
    # Deploy all Showcase Resources
    if [ -d "zips/showcase" ]; then
        echo "Deploying all showcase resources from zips/showcase/..."
        for sz in zips/showcase/*.zip; do
            [ -e "$sz" ] || continue
            echo "  -> Deploying Showcase Resource $(basename "$sz") to osgi/client-extensions/"
            cp "$sz" "$CX_DIR/"
        done
    else
        echo "Warning: zips/showcase/ directory not found. Skipping showcase deployment."
    fi
fi

# Deploy specific items
for ITEM in "${ITEMS[@]}"; do
    deploy_item "$ITEM"
done

echo "--------------------------------------------------------"
echo "Deployment operations completed."
echo "Check your Liferay logs to verify import status."
echo "--------------------------------------------------------"
