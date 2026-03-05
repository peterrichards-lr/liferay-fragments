#!/bin/bash

# deploy-fragment-zips.sh
# Automates the deployment of generated fragment and Language CX ZIPs.

TARGET_PATH=$1
shift

if [ -z "$TARGET_PATH" ] || [ -z "$1" ]; then
    echo "Usage: $0 [TARGET_PATH] [--legacy] [--all | --showcase | folder_name1 folder_name2 ...]"
    echo ""
    echo "Arguments:"
    echo "  TARGET_PATH    Root of a Liferay Workspace or a standalone Liferay bundle."
    echo "  --legacy       Deploy pre-2025.Q3 legacy versions of fragments."
    echo "  --all          Deploy all ZIPs found in /zips and all showcase resources."
    echo "  --showcase     Shortcut to deploy all showcase resources under other-resources/showcase-data/."
    echo "  folder_name    Specific fragment, collection, or resource folder names."
    echo ""
    echo "Example: $0 ~/liferay-workspace --all"
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
REM_ARGS=()

for arg in "$@"; do
    if [ "$arg" == "--legacy" ]; then
        LEGACY_MODE="true"
    else
        REM_ARGS+=("$arg")
    fi
done

echo "--------------------------------------------------------"
echo "Targeting Liferay Deploy: $DEPLOY_DIR"
echo "Targeting Client Extensions: $CX_DIR"
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
    local SUFFIX=""
    [[ "$LEGACY_MODE" == "true" ]] && SUFFIX="-pre2025q3"

    echo "Checking for assets related to '$NAME'..."

    # Check for Fragment ZIP (Individual or Collection)
    if [ -f "zips/fragments/${NAME}${SUFFIX}.zip" ]; then
        echo "  -> Deploying Fragment to deploy/: ${NAME}${SUFFIX}.zip"
        cp "zips/fragments/${NAME}${SUFFIX}.zip" "$DEPLOY_DIR/"
        FOUND=true
    fi
    if [ -f "zips/fragments/${NAME}-collection${SUFFIX}.zip" ]; then
        echo "  -> Deploying Collection to deploy/: ${NAME}-collection${SUFFIX}.zip"
        cp "zips/fragments/${NAME}-collection${SUFFIX}.zip" "$DEPLOY_DIR/"
        FOUND=true
    fi

    # Check for Language CX ZIP
    if [ -f "zips/language/${NAME}-language-batch-cx.zip" ]; then
        echo "  -> Deploying Language CX to osgi/client-extensions/: ${NAME}-language-batch-cx.zip"
        cp "zips/language/${NAME}-language-batch-cx.zip" "$CX_DIR/"
        FOUND=true
    fi

    # Check for Special Resource ZIP (in other-resources/showcase-data/)
    if [ -f "other-resources/showcase-data/${NAME}/dist/${NAME}-batch-cx.zip" ]; then
        echo "  -> Deploying Special Resource to osgi/client-extensions/: ${NAME}-batch-cx.zip"
        cp "other-resources/showcase-data/${NAME}/dist/${NAME}-batch-cx.zip" "$CX_DIR/"
        FOUND=true
    fi

    if [ "$FOUND" = false ]; then
        echo "  !! Warning: No ZIPs found for '$NAME' (Legacy: $LEGACY_MODE)"
    fi
}

# 5. Execution logic
# We use the filtered arguments from REM_ARGS
if [ "${REM_ARGS[0]}" == "--all" ] || [ "${REM_ARGS[0]}" == "--showcase" ]; then
    if [ "${REM_ARGS[0]}" == "--all" ]; then
        echo "Deploying all assets..."
        
        # Fragments/Collections
        if [ -d "zips/fragments" ]; then
            for f in zips/fragments/*.zip; do
                [ -e "$f" ] || continue
                FILENAME=$(basename "$f")
                
                if [[ "$LEGACY_MODE" == "true" ]]; then
                    if [[ "$FILENAME" == *"-pre2025q3.zip" ]]; then
                        echo "  -> Deploying Legacy Fragment $FILENAME to deploy/"
                        cp "$f" "$DEPLOY_DIR/"
                    fi
                else
                    if [[ "$FILENAME" != *"-pre2025q3.zip" ]]; then
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
    fi

    # Deploy all Showcase Resources
    echo "Deploying all showcase resources..."
    SHOWCASE_ZIPS=$(find other-resources/showcase-data -name "*-batch-cx.zip")
    for sz in $SHOWCASE_ZIPS; do
        echo "  -> Deploying Showcase Resource $(basename "$sz") to osgi/client-extensions/"
        cp "$sz" "$CX_DIR/"
    done
else
    # Individual items or flags
    for ITEM in "${REM_ARGS[@]}"; do
        deploy_item "$ITEM"
    done
fi

echo "--------------------------------------------------------"
echo "Deployment operations completed."
echo "Check your Liferay logs to verify import status."
echo "--------------------------------------------------------"
