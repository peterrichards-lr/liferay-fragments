#!/bin/bash

# deploy-fragment-zips.sh
# Automates the deployment of generated fragment and Language CX ZIPs.

TARGET_PATH=$1
shift

if [ -z "$TARGET_PATH" ] || [ -z "$1" ]; then
    echo "Usage: $0 [TARGET_PATH] [--all | folder_name1 folder_name2 ...]"
    echo ""
    echo "Arguments:"
    echo "  TARGET_PATH    Root of a Liferay Workspace or a standalone Liferay bundle."
    echo "  --all          Deploy all ZIPs found in /zips/fragments and /zips/language."
    echo "  folder_name    Specific fragment or collection folder names to deploy."
    echo ""
    echo "Example: $0 ~/liferay-workspace --all"
    echo "Example: $0 /opt/liferay gemini-generated master-page-background-colour"
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

echo "--------------------------------------------------------"
echo "Targeting Liferay Deploy: $DEPLOY_DIR"
echo "--------------------------------------------------------"

# 2. Check for the source ZIPs
if [ ! -d "zips" ]; then
    echo "Error: 'zips' directory not found. Please run ./create-fragment-zips.sh first."
    exit 1
fi

# Helper function to deploy related ZIPs for a single name
deploy_item() {
    local NAME=$1
    local FOUND=false

    echo "Checking for assets related to '$NAME'..."

    # Check for Fragment ZIP (Individual or Collection)
    if [ -f "zips/fragments/${NAME}.zip" ]; then
        echo "  -> Deploying Fragment: ${NAME}.zip"
        cp "zips/fragments/${NAME}.zip" "$DEPLOY_DIR/"
        FOUND=true
    fi
    if [ -f "zips/fragments/${NAME}-collection.zip" ]; then
        echo "  -> Deploying Collection: ${NAME}-collection.zip"
        cp "zips/fragments/${NAME}-collection.zip" "$DEPLOY_DIR/"
        FOUND=true
    fi

    # Check for Language CX ZIP
    if [ -f "zips/language/${NAME}-language-batch-cx.zip" ]; then
        echo "  -> Deploying Language CX: ${NAME}-language-batch-cx.zip"
        cp "zips/language/${NAME}-language-batch-cx.zip" "$DEPLOY_DIR/"
        FOUND=true
    fi

    if [ "$FOUND" = false ]; then
        echo "  !! Warning: No ZIPs found in /zips for '$NAME'"
    fi
}

# 3. Execution logic
if [ "$1" == "--all" ]; then
    echo "Deploying all assets from /zips..."
    
    # Fragments/Collections
    if [ -d "zips/fragments" ]; then
        for f in zips/fragments/*.zip; do
            [ -e "$f" ] || continue
            echo "  -> Deploying $(basename "$f")"
            cp "$f" "$DEPLOY_DIR/"
        done
    fi

    # Language CX
    if [ -d "zips/language" ]; then
        for l in zips/language/*.zip; do
            [ -e "$l" ] || continue
            echo "  -> Deploying $(basename "$l")"
            cp "$l" "$DEPLOY_DIR/"
        done
    fi
else
    # Individual items
    for ITEM in "$@"; do
        deploy_item "$ITEM"
    done
fi

echo "--------------------------------------------------------"
echo "Deployment operations completed."
echo "Check your Liferay logs to verify import status."
echo "--------------------------------------------------------"
