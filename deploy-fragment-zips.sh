#!/bin/bash

# deploy-fragment-zips.sh
# Automates the deployment of generated fragment and Language CX ZIPs.

TARGET_PATH=$1
shift

if [ -z "$TARGET_PATH" ]; then
    echo "Usage: $0 [TARGET_PATH] [options] [item1 item2 ...]"
    echo ""
    echo "Arguments:"
    echo "  TARGET_PATH    Root of a Liferay Workspace or a standalone Liferay bundle."
    echo ""
    echo "Options:"
    echo "  --all          Deploy everything: fragments, language, and showcase."
    echo "  --fragments    Deploy only fragment and collection ZIPs."
    echo "  --language     Deploy only language batch CX ZIPs."
    echo "  --showcase     Deploy only showcase data batch CX ZIPs."
    echo "  --legacy       Deploy pre-2025.Q3 legacy versions of fragments."
    echo "  --debug        Deploy unminified '-debug.zip' versions instead of '-min.zip'."
    echo ""
    echo "Example: $0 ~/liferay-workspace --all"
    echo "Example: $0 /opt/liferay --fragments gemini-generated"
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
DEPLOY_FRAGMENTS="false"
DEPLOY_LANGUAGE="false"
DEPLOY_SHOWCASE="false"
CATEGORY_SELECTED="false"
ITEMS=()

for arg in "$@"; do
    case $arg in
        --legacy) LEGACY_MODE="true" ;;
        --debug) DEBUG_MODE="true" ;;
        --all)
            DEPLOY_FRAGMENTS="true"
            DEPLOY_LANGUAGE="true"
            DEPLOY_SHOWCASE="true"
            CATEGORY_SELECTED="true"
            ;;
        --fragments)
            DEPLOY_FRAGMENTS="true"
            CATEGORY_SELECTED="true"
            ;;
        --language)
            DEPLOY_LANGUAGE="true"
            CATEGORY_SELECTED="true"
            ;;
        --showcase)
            DEPLOY_SHOWCASE="true"
            CATEGORY_SELECTED="true"
            ;;
        *) ITEMS+=("$arg") ;;
    esac
done

# If no category selected and no items, default to help
if [ "$CATEGORY_SELECTED" == "false" ] && [ ${#ITEMS[@]} -eq 0 ]; then
    echo "Error: No deployment targets specified. Use --all, category flags, or specific item names."
    exit 1
fi

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
    if [[ "$DEPLOY_FRAGMENTS" == "true" || "$CATEGORY_SELECTED" == "false" ]]; then
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
    fi

    # Check for Language CX ZIP
    if [[ "$DEPLOY_LANGUAGE" == "true" || "$CATEGORY_SELECTED" == "false" ]]; then
        if [ -f "zips/language/${NAME}-language-batch-cx.zip" ]; then
            echo "  -> Deploying Language CX: ${NAME}-language-batch-cx.zip"
            cp "zips/language/${NAME}-language-batch-cx.zip" "$CX_DIR/"
            FOUND=true
        fi
    fi

    # Check for Special Resource ZIP (in zips/showcase/)
    if [[ "$DEPLOY_SHOWCASE" == "true" || "$CATEGORY_SELECTED" == "false" ]]; then
        if [ -f "zips/showcase/${NAME}-batch-cx.zip" ]; then
            echo "  -> Deploying Showcase Resource: ${NAME}-batch-cx.zip"
            cp "zips/showcase/${NAME}-batch-cx.zip" "$CX_DIR/"
            FOUND=true
        fi
    fi

    if [ "$FOUND" = false ]; then
        echo "  !! Warning: No matching ZIPs found for '$NAME' in selected categories."
    fi
}

# 5. Bulk Deployment Logic
if [ ${#ITEMS[@]} -eq 0 ]; then
    # Fragments/Collections
    if [ "$DEPLOY_FRAGMENTS" == "true" ] && [ -d "zips/fragments" ]; then
        echo "Deploying all fragments..."
        for f in zips/fragments/*${BUILD_SUFFIX}.zip; do
            [ -e "$f" ] || continue
            FILENAME=$(basename "$f")
            
            if [[ "$LEGACY_MODE" == "true" ]]; then
                if [[ "$FILENAME" == *"${LEGACY_SUFFIX}${BUILD_SUFFIX}.zip" ]]; then
                    echo "  -> Deploying Legacy Fragment $FILENAME"
                    cp "$f" "$DEPLOY_DIR/"
                fi
            else
                if [[ "$FILENAME" != *"-pre2025q3"* ]]; then
                    echo "  -> Deploying Fragment $FILENAME"
                    cp "$f" "$DEPLOY_DIR/"
                fi
            fi
        done
    fi

    # Language CX
    if [ "$DEPLOY_LANGUAGE" == "true" ] && [ -d "zips/language" ]; then
        echo "Deploying all language extensions..."
        for l in zips/language/*.zip; do
            [ -e "$l" ] || continue
            echo "  -> Deploying Language CX $(basename "$l")"
            cp "$l" "$CX_DIR/"
        done
    fi

    # Showcase Resources
    if [ "$DEPLOY_SHOWCASE" == "true" ] && [ -d "zips/showcase" ]; then
        echo "Deploying all showcase resources..."
        for sz in zips/showcase/*.zip; do
            [ -e "$sz" ] || continue
            echo "  -> Deploying Showcase Resource $(basename "$sz")"
            cp "$sz" "$CX_DIR/"
        done
    fi
else
    # Specific items listed
    for ITEM in "${ITEMS[@]}"; do
        deploy_item "$ITEM"
    done
fi

echo "--------------------------------------------------------"
echo "Deployment operations completed."
echo "--------------------------------------------------------"
