#!/bin/bash

# create-fragment-zips.sh
# Automates the generation of fragment and collection ZIPs with optional minification.

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. It is required for build."
    exit 1
fi

# Variables mimicking your Gradle properties
COMPANY_WEB_ID="${COMPANY_WEB_ID:-*}"
GROUP_KEY="${GROUP_KEY:-}"

# Robust timestamp for both macOS and Linux (numeric)
TIMESTAMP=$(date +%s)000

DEBUG_MODE=false
INCLUDE_DEPRECATED=false
FORCE_CLEAN=false
BUILD_FRAGMENTS=false
BUILD_LANGUAGE=false
BUILD_SHOWCASE=false
CATEGORY_SELECTED=false
BUILD_SUFFIX="-min"
TARGET_ITEMS=()

# 1. Parse Arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --debug) 
            DEBUG_MODE=true 
            BUILD_SUFFIX="-debug"
            echo "--- DEBUG BUILD ENABLED (Suffix: $BUILD_SUFFIX) ---"
            ;;
        --include-deprecated)
            INCLUDE_DEPRECATED=true
            echo "--- INCLUDING DEPRECATED FRAGMENTS ---"
            ;;
        --clean)
            FORCE_CLEAN=true
            ;;
        --fragments)
            BUILD_FRAGMENTS=true
            CATEGORY_SELECTED=true
            ;;
        --language)
            BUILD_LANGUAGE=true
            CATEGORY_SELECTED=true
            ;;
        --showcase)
            BUILD_SHOWCASE=true
            CATEGORY_SELECTED=true
            ;;
        --help|-h)
            echo "Usage: $0 [options] [item1 item2 ...]"
            echo ""
            echo "Options:"
            echo "  --debug               Skip JS obfuscation and CSS minification. Uses '-debug.zip' suffix."
            echo "  --include-deprecated  Include fragments marked as (Deprecated) in the build."
            echo "  --clean               Force delete the contents of the zips/ directory before building."
            echo "  --fragments           Build only fragment and collection ZIPs."
            echo "  --language            Build only language batch CX ZIPs."
            echo "  --showcase            Build only showcase data batch CX ZIPs."
            echo ""
            echo "Arguments:"
            echo "  itemN                 Optional: Specific collection or fragment folder names to build."
            echo "                        If omitted, all collections and root fragments are built."
            echo ""
            echo "Example: $0 --debug --clean"
            echo "Example: $0 --fragments gemini-generated"
            exit 0
            ;;
        *) TARGET_ITEMS+=("${1%/}") ;; # Collect items and strip trailing slash
    esac
    shift
done

# If no categories selected, build everything
if [ "$CATEGORY_SELECTED" = false ]; then
    BUILD_FRAGMENTS=true
    BUILD_LANGUAGE=true
    BUILD_SHOWCASE=true
fi

# Helper to check if a fragment is deprecated
is_deprecated() {
    local FRAG_JSON="$1/fragment.json"
    if [ -f "$FRAG_JSON" ]; then
        if jq -e '.name | contains("(Deprecated)")' "$FRAG_JSON" > /dev/null; then
            return 0
        fi
    fi
    return 1
}

# Helper to handle shared logic based on fragment-build.json and collection-build.json
handle_shared_resources() {
    local FRAG_DIR=$1
    local COLLECTION_DIR=$2
    local FRAG_BUILD_FILE="$FRAG_DIR/fragment-build.json"
    local COLL_BUILD_FILE="$COLLECTION_DIR/collection-build.json"
    local SHARED_LOGIC_ROOT="shared-logic"

    local STRATEGY="generic" # Default fallback

    # 1. Resolve themeStrategy from Collection (Hierarchy Level 1)
    if [ -f "$COLL_BUILD_FILE" ]; then
        STRATEGY=$(jq -r '.themeStrategy // "generic"' "$COLL_BUILD_FILE")
    fi

    if [ -f "$FRAG_BUILD_FILE" ]; then
        local FRAG_NAME=$(basename "$FRAG_DIR")
        echo "  -> Processing build metadata for $FRAG_NAME"
        
        # 2. Resolve themeStrategy from Fragment (Hierarchy Level 2 - Override)
        STRATEGY=$(jq -r ".themeStrategy // \"$STRATEGY\"" "$FRAG_BUILD_FILE")

        # 3. Process Shared Logic (Concatenate JS, Copy others)
        local RESOURCES
        RESOURCES=$(jq -r '.sharedResources[]?' "$FRAG_BUILD_FILE")

        for RES in $RESOURCES; do
            if [ -f "$SHARED_LOGIC_ROOT/$RES" ]; then
                if [[ "$RES" == *.js ]]; then
                    echo "    + Concatenating shared logic: $RES"
                    # Prepend shared JS to index.js
                    if [ -f "$FRAG_DIR/index.js" ]; then
                        cat "$SHARED_LOGIC_ROOT/$RES" "$FRAG_DIR/index.js" > "$FRAG_DIR/index.js.tmp" && mv "$FRAG_DIR/index.js.tmp" "$FRAG_DIR/index.js"
                    else
                        cp "$SHARED_LOGIC_ROOT/$RES" "$FRAG_DIR/index.js"
                    fi
                else
                    echo "    + Including shared resource: $RES"
                    # For non-JS files, place in a resources folder
                    mkdir -p "$FRAG_DIR/resources"
                    cp "$SHARED_LOGIC_ROOT/$RES" "$FRAG_DIR/resources/$RES"
                fi
            else
                echo "    ! Warning: Shared logic not found: $SHARED_LOGIC_ROOT/$RES"
            fi
        done
        
        # Remove fragment build metadata from final ZIP
        rm "$FRAG_BUILD_FILE"
    fi

    # 4. Perform theme strategy validation
    echo "    + Theme Strategy: $STRATEGY"
    if [[ "$STRATEGY" == "generic" ]]; then
        if [ -f "$FRAG_DIR/index.css" ]; then
            if grep -qE "#[0-9a-fA-F]{3,6}" "$FRAG_DIR/index.css" | grep -qv "var("; then
                echo "    ! Warning: Generic fragment $(basename "$FRAG_DIR") contains hardcoded colors. Use safe tokens."
            fi
        fi
    fi
}

# 2. Gather all available root items, sorted alphabetically
ALL_COLLECTIONS=$(find . -type d -maxdepth 1 -exec test -e '{}'/collection.json \; -print | sed 's|^\./||' | sort)
ALL_FRAGMENTS=$(find . -type d -maxdepth 1 -exec test -e '{}'/fragment.json \; -print | sed 's|^\./||' | sort)

# 3. Filter lists based on TARGET_ITEMS if provided
COLLECTIONS=()
FRAGMENTS=()

if [ ${#TARGET_ITEMS[@]} -gt 0 ]; then
    for item in "${TARGET_ITEMS[@]}"; do
        FOUND=false
        # Check if it's a collection
        for c in $ALL_COLLECTIONS; do
            if [[ "$c" == "$item" ]]; then
                COLLECTIONS+=("$c")
                FOUND=true
                break
            fi
        done
        # Check if it's a root fragment
        if [ "$FOUND" = false ]; then
            for f in $ALL_FRAGMENTS; do
                if [[ "$f" == "$item" ]]; then
                    FRAGMENTS+=("$f")
                    FOUND=true
                    break
                fi
            done
        fi
    done
else
    # Default: build all collections and root fragments
    for c in $ALL_COLLECTIONS; do COLLECTIONS+=("$c"); done
    for f in $ALL_FRAGMENTS; do FRAGMENTS+=("$f"); done
fi

# 4. Create clean output structure
if [ "$FORCE_CLEAN" = true ]; then
    echo "--- CLEANING ALL ZIPS ---"
    rm -rf zips
elif [ ${#TARGET_ITEMS[@]} -eq 0 ]; then
    if [ "$BUILD_FRAGMENTS" = true ]; then 
        echo "  -> Cleaning zips/fragments/"
        rm -rf zips/fragments
    fi
    if [ "$BUILD_LANGUAGE" = true ]; then 
        echo "  -> Cleaning zips/language/"
        rm -rf zips/language
    fi
    if [ "$BUILD_SHOWCASE" = true ]; then 
        echo "  -> Cleaning zips/showcase/"
        rm -rf zips/showcase
    fi
fi

mkdir -p zips/fragments
mkdir -p zips/language
mkdir -p zips/showcase

# Helper function to generate fragment deployment descriptor
ensure_descriptor() {
    local TARGET_DIR=$1
    local DESCRIPTOR_PATH="$TARGET_DIR/liferay-deploy-fragments.json"

    if [ ! -f "$DESCRIPTOR_PATH" ]; then
        echo "  -> Generating temporary descriptor for $(basename "$TARGET_DIR")"
        
        local JSON_CONTENT
        JSON_CONTENT=$(jq -n --arg id "$COMPANY_WEB_ID" '{companyWebId: $id}')

        if [[ -n "$GROUP_KEY" && "$COMPANY_WEB_ID" != "*" ]]; then
            JSON_CONTENT=$(echo "$JSON_CONTENT" | jq --arg gk "$GROUP_KEY" '. + {groupKey: $gk}')
        fi

        echo "$JSON_CONTENT" > "$DESCRIPTOR_PATH"
        return 0 
    fi
    return 1 
}

# Helper to minimize and obfuscate
process_dir() {
    local DIR=$1
    local SOURCE_DIR=$2 # Original source to check for .no-transform
    
    if [ "$DEBUG_MODE" = true ]; then return; fi
    if [ -f "$SOURCE_DIR/.no-transform" ]; then echo "  -> Skipping transformations (.no-transform found)"; return; fi

    # JSON Minification
    find "$DIR" -name "*.json" -not -path "*/.*" -print0 | while IFS= read -r -d '' f; do
        jq -c . "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    done

    # JS Minification & Obfuscation
    find "$DIR" -name "*.js" -not -path "*/.*" -print0 | while IFS= read -r -d '' f; do
        local FRAG_DIR=$(dirname "$f")
        if [ ! -f "$FRAG_DIR/.no-transform" ]; then
            npx -y terser "$f" --mangle --compress -o "$f"
        fi
    done

    # CSS Minification
    find "$DIR" -name "*.css" -not -path "*/.*" -print0 | while IFS= read -r -d '' f; do
        local FRAG_DIR=$(dirname "$f")
        if [ ! -f "$FRAG_DIR/.no-transform" ]; then
            npx -y clean-css-cli --inline none "$f" -o "$f" 2>/dev/null
        fi
    done
}

# 1. Standard Fragment Zips (Root Level)
if [ "$BUILD_FRAGMENTS" = true ]; then
    for FRAGMENT_NAME in "${FRAGMENTS[@]}"; do
       if [[ "$INCLUDE_DEPRECATED" = false ]] && is_deprecated "$FRAGMENT_NAME"; then continue; fi

       echo "Processing fragment: $FRAGMENT_NAME"
       rm -f "zips/fragments/${FRAGMENT_NAME}${BUILD_SUFFIX}.zip"
       
       TEMP_FRAG="temp_build_$FRAGMENT_NAME"
       mkdir -p "$TEMP_FRAG/$FRAGMENT_NAME"
       cp -r "$FRAGMENT_NAME/." "$TEMP_FRAG/$FRAGMENT_NAME/"
       
       # For root fragments, COLLECTION_DIR is the fragment itself
       handle_shared_resources "$TEMP_FRAG/$FRAGMENT_NAME" "$FRAGMENT_NAME"
       ensure_descriptor "$TEMP_FRAG/$FRAGMENT_NAME"
       process_dir "$TEMP_FRAG/$FRAGMENT_NAME" "$FRAGMENT_NAME"
       
       OUTPUT_ZIP="$(pwd)/zips/fragments/${FRAGMENT_NAME}${BUILD_SUFFIX}.zip"
       (cd "$TEMP_FRAG" && zip -qr "$OUTPUT_ZIP" "$FRAGMENT_NAME" -x "*/Language*.properties" -x "*/client-extension.yaml" -x "*/test/*")
       rm -rf "$TEMP_FRAG"
    done
fi

# 2. Collection Zips
for COLLECTION_NAME in "${COLLECTIONS[@]}"; do
   echo "Processing collection: $COLLECTION_NAME"
   
   # --- A. Batch Language ---
   if [ "$BUILD_LANGUAGE" = true ]; then
       PROP_FILE="$COLLECTION_NAME/Language_en_US.properties"
       if [ -f "$PROP_FILE" ]; then
           CX_ROOT="temp_cx_${COLLECTION_NAME}"
           mkdir -p "$CX_ROOT/batch" "$CX_ROOT/WEB-INF"
           ITEMS_JSON=$(grep -v '^#' "$PROP_FILE" | grep '=' | jq -R -s 'split("\n")|map(select(length>0))|map(split("=")|{key:.[0],languageId:"en_US",value:(.[1:]|join("="))})')
           echo "{\"configuration\":{\"className\":\"com.liferay.portal.language.rest.dto.v1_0.Message\",\"parameters\":{\"containsHeaders\":\"true\",\"importStrategy\":\"ON_ERROR_CONTINUE\",\"updateStrategy\":\"UPDATE\"},\"taskItemDelegateName\":\"DEFAULT\"},\"items\":$ITEMS_JSON}" | jq -c . > "$CX_ROOT/batch/${COLLECTION_NAME}-language.batch-engine-data.json"
           echo "FROM liferay/batch:latest" > "$CX_ROOT/Dockerfile"
           echo "COPY --chown=liferay:liferay /batch /opt/liferay/batch" >> "$CX_ROOT/Dockerfile"
           jq -n --arg id "$COLLECTION_NAME-language" --arg erc "$COLLECTION_NAME-language-batch-oauth" '{cpu:0.2,env:{LIFERAY_BATCH_OAUTH_APP_ERC:$erc,LIFERAY_ROUTES_CLIENT_EXTENSION:"/etc/liferay/lxc/ext-init-metadata",LIFERAY_ROUTES_DXP:"/etc/liferay/lxc/dxp-metadata"},environments:{infra:{deploy:false}},id:$id,kind:"Job",memory:300,scale:1}' > "$CX_ROOT/LCP.json"
           echo "Bundle-SymbolicName=$COLLECTION_NAME-language" > "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
           echo "Liferay-Client-Extension-Batch=batch/" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
           echo "module-group-id=liferay" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
           echo "name=$COLLECTION_NAME Language Overrides" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
           CONFIG_KEY="com.liferay.oauth2.provider.configuration.OAuth2ProviderApplicationHeadlessServerConfiguration~$COLLECTION_NAME-language-batch-oauth"
           jq -n -c --arg key "$CONFIG_KEY" --arg name "$COLLECTION_NAME Language Batch OAuth" --arg proj "$COLLECTION_NAME-language" --argjson ts "$TIMESTAMP" '{$key:{".serviceAddress":"localhost:8080",".serviceScheme":"http",":configurator:policy":"force",baseURL:"${portalURL}/o/language",buildTimestamp:$ts,description:"", "dxp.lxc.liferay.com.virtualInstanceId":"default",homePageURL:"$[conf:.serviceScheme]://$[conf:.serviceAddress]",name:$name,projectId:$proj,projectName:$proj,properties:[],scopes:["Liferay.Headless.Admin.Workflow.everything","Liferay.Headless.Batch.Engine.everything","Liferay.Message.Admin.REST.everything"],sourceCodeURL:"",type:"oAuthApplicationHeadlessServer",typeSettings:[".serviceAddress=localhost:8080", ".serviceScheme=http", "scopes=Liferay.Headless.Admin.Workflow.everything\nLiferay.Headless.Batch.Engine.everything\nLiferay.Message.Admin.REST.everything"],webContextPath:("/"+$proj)}}' > "$CX_ROOT/client-extension-config.json"
           (cd "$CX_ROOT" && zip -qr "$(pwd)/zips/language/${COLLECTION_NAME}-language-batch-cx.zip" .)
           rm -rf "$CX_ROOT"
       fi
   fi

   # --- B. Standard Collection ---
   if [ "$BUILD_FRAGMENTS" = true ]; then
       TEMP_COLL="temp_build_coll_$COLLECTION_NAME"
       mkdir -p "$TEMP_COLL/$COLLECTION_NAME"
       cp -r "$COLLECTION_NAME/." "$TEMP_COLL/$COLLECTION_NAME/"
       
       if [ "$INCLUDE_DEPRECATED" = false ]; then
           for FRAG_PATH in "$TEMP_COLL/$COLLECTION_NAME"/fragments/*; do
               if [ -d "$FRAG_PATH" ] && is_deprecated "$FRAG_PATH"; then rm -rf "$FRAG_PATH"; fi
           done
       fi

       for FRAG_PATH in "$TEMP_COLL/$COLLECTION_NAME"/fragments/*; do
           if [ -d "$FRAG_PATH" ]; then
               handle_shared_resources "$FRAG_PATH" "$COLLECTION_NAME"
           fi
       done

       ensure_descriptor "$TEMP_COLL/$COLLECTION_NAME"
       process_dir "$TEMP_COLL/$COLLECTION_NAME" "$COLLECTION_NAME"
       (cd "$TEMP_COLL" && zip -qr "$(pwd)/zips/fragments/${COLLECTION_NAME}-collection${BUILD_SUFFIX}.zip" "$COLLECTION_NAME" -x "*/Language*.properties" -x "*/client-extension.yaml" -x "*/test/*")
       rm -rf "$TEMP_COLL"
       
       # --- C. Legacy Collection ---
       BUILD_TEMP="temp_legacy_${COLLECTION_NAME}"
       mkdir -p "$BUILD_TEMP/$COLLECTION_NAME"
       cp -r "$COLLECTION_NAME/." "$BUILD_TEMP/$COLLECTION_NAME/"
       
       if [ "$INCLUDE_DEPRECATED" = false ]; then
           for FRAG_PATH in "$BUILD_TEMP/$COLLECTION_NAME"/fragments/*; do
               if [ -d "$FRAG_PATH" ] && is_deprecated "$FRAG_PATH"; then rm -rf "$FRAG_PATH"; fi
           done
       fi

       for FRAG_PATH in "$BUILD_TEMP/$COLLECTION_NAME"/fragments/*; do
           if [ -d "$FRAG_PATH" ]; then
               handle_shared_resources "$FRAG_PATH" "$COLLECTION_NAME"
           fi
       done

       find "$BUILD_TEMP/$COLLECTION_NAME" -name "Language*.properties" -delete
       find "$BUILD_TEMP/$COLLECTION_NAME" -name "client-extension.yaml" -delete
       find "$BUILD_TEMP/$COLLECTION_NAME" -name "configuration.json" -exec sh -c 'jq "del(.fieldSets[].fields[].typeOptions.dependency)" "$1" > "$1.tmp" && mv "$1.tmp" "$1"' -- {} \;
       process_dir "$BUILD_TEMP/$COLLECTION_NAME" "$COLLECTION_NAME"
       (cd "$BUILD_TEMP" && zip -qr "$(pwd)/zips/fragments/${COLLECTION_NAME}-pre2025q3${BUILD_SUFFIX}.zip" "$COLLECTION_NAME" -x "*/test/*")
       rm -rf "$BUILD_TEMP"
   fi
done

# 3. Showcase Data
if [ "$BUILD_SHOWCASE" = true ] && [ -d "other-resources/showcase-data" ]; then
    SHOWCASE_RESOURCES=$(find other-resources/showcase-data -type d -maxdepth 1 -mindepth 1 | sort)
    for RESOURCE in $SHOWCASE_RESOURCES; do
        RESOURCE_NAME=$(basename "$RESOURCE")
        if [ ${#TARGET_ITEMS[@]} -gt 0 ]; then
            MATCH=false
            for item in "${TARGET_ITEMS[@]}"; do if [[ "$item" == "$RESOURCE_NAME" || "$item" == "showcase" ]]; then MATCH=true; break; fi; done
            if [ "$MATCH" = false ]; then continue; fi
        fi
        CX_ROOT="temp_cx_$RESOURCE_NAME"
        mkdir -p "$CX_ROOT/batch" "$CX_ROOT/WEB-INF"
        for f in "$RESOURCE/batch"/*.json; do jq -c . "$f" > "$CX_ROOT/batch/${RESOURCE_NAME}-$(basename "$f")"; done
        echo "FROM liferay/batch:latest" > "$CX_ROOT/Dockerfile"
        echo "COPY --chown=liferay:liferay /batch /opt/liferay/batch" >> "$CX_ROOT/Dockerfile"
        jq -n --arg id "$RESOURCE_NAME" --arg erc "$RESOURCE_NAME-batch-oauth" '{cpu:0.2,env:{LIFERAY_BATCH_OAUTH_APP_ERC:$erc,LIFERAY_ROUTES_CLIENT_EXTENSION:"/etc/liferay/lxc/ext-init-metadata",LIFERAY_ROUTES_DXP:"/etc/liferay/lxc/dxp-metadata"},environments:{infra:{deploy:false}},id:$id,kind:"Job",memory:300,scale:1}' > "$CX_ROOT/LCP.json"
        echo "Bundle-SymbolicName=$RESOURCE_NAME" > "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
        echo "Liferay-Client-Extension-Batch=batch/" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
        echo "module-group-id=liferay" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
        echo "name=$RESOURCE_NAME Showcase Object" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
        CONFIG_KEY="com.liferay.oauth2.provider.configuration.OAuth2ProviderApplicationHeadlessServerConfiguration~$RESOURCE_NAME-batch-oauth"
        jq -n -c --arg key "$CONFIG_KEY" --arg name "$RESOURCE_NAME Batch OAuth" --arg proj "$RESOURCE_NAME" --argjson ts "$TIMESTAMP" '{$key:{".serviceAddress":"localhost:8080",".serviceScheme":"http",":configurator:policy":"force",baseURL:("${portalURL}/o/"+$proj),buildTimestamp:$ts,description:"", "dxp.lxc.liferay.com.virtualInstanceId":"default",homePageURL:"$[conf:.serviceScheme]://$[conf:.serviceAddress]",name:$name,projectId:$proj,projectName:$proj,properties:[],scopes:["Liferay.Headless.Batch.Engine.everything","Liferay.Object.Admin.REST.everything"],sourceCodeURL:"",type:"oAuthApplicationHeadlessServer",typeSettings:[".serviceAddress=localhost:8080", ".serviceScheme=http", "scopes=Liferay.Headless.Admin.Workflow.everything\nLiferay.Headless.Batch.Engine.everything\nLiferay.Message.Admin.REST.everything"],webContextPath:("/"+$proj)}}' > "$CX_ROOT/client-extension-config.json"
        (cd "$CX_ROOT" && zip -qr "$(pwd)/zips/showcase/${RESOURCE_NAME}-batch-cx.zip" .)
        rm -rf "$CX_ROOT"
    done
fi

echo "Build complete."
