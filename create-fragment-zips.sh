#!/bin/bash

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

COLLECTIONS=$(find . -type d -maxdepth 1 -exec test -e '{}'/collection.json \; -print)
FRAGMENTS=$(find . -type d -maxdepth 1 -exec test -e '{}'/fragment.json \; -print)

rm -rf zips
mkdir -p zips/fragments
mkdir -p zips/language

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

# 1. Standard Fragment Zips
for FRAGMENT in $FRAGMENTS; do
   FRAGMENT_NAME=$(basename "$FRAGMENT")
   echo "Processing fragment: $FRAGMENT_NAME"
   
   ensure_descriptor "$FRAGMENT_NAME"
   CREATED=$?
   
   zip -qr ./zips/fragments/"$FRAGMENT_NAME".zip "$FRAGMENT_NAME" -x "*/Language*.properties" -x "*/client-extension.yaml"
   
   [[ $CREATED -eq 0 ]] && rm "$FRAGMENT_NAME/liferay-deploy-fragments.json"
done

# 2. Collection Zips and Batch Language CX Zips
for COLLECTION in $COLLECTIONS; do
   COLLECTION_NAME=$(basename "$COLLECTION")
   echo "Processing collection: $COLLECTION_NAME"
   
   # --- A. Create Batch Language Client Extension ZIP ---
   PROP_FILE="$COLLECTION_NAME/Language_en_US.properties"
   if [ -f "$PROP_FILE" ]; then
       echo "  -> Creating Batch Language CX for $COLLECTION_NAME..."
       CX_ROOT="temp_cx_${COLLECTION_NAME}"
       mkdir -p "$CX_ROOT/batch"
       mkdir -p "$CX_ROOT/WEB-INF"
       
       # Convert .properties to batch-engine-data.json
       ITEMS_JSON=$(grep -v '^#' "$PROP_FILE" | grep '=' | jq -R -s '
         split("\n") | map(select(length > 0)) | map(
           split("=") | {
             key: .[0], 
             languageId: "en_US", 
             value: (.[1:] | join("="))
           }
         )
       ')
       
       echo "{\"configuration\":{\"className\":\"com.liferay.portal.language.rest.dto.v1_0.Message\",\"parameters\":{\"containsHeaders\":\"true\",\"importStrategy\":\"ON_ERROR_CONTINUE\",\"updateStrategy\":\"UPDATE\"},\"taskItemDelegateName\":\"DEFAULT\"},\"items\":$ITEMS_JSON}" | jq -c . > "$CX_ROOT/batch/${COLLECTION_NAME}-language.batch-engine-data.json"

       # Create Dockerfile
       echo "FROM liferay/batch:latest" > "$CX_ROOT/Dockerfile"
       echo "COPY --chown=liferay:liferay /batch /opt/liferay/batch" >> "$CX_ROOT/Dockerfile"

       # Create LCP.json
       jq -n \
         --arg id "$COLLECTION_NAME-language" \
         --arg erc "$COLLECTION_NAME-language-batch-oauth" \
         '{cpu: 0.2, env: {LIFERAY_BATCH_OAUTH_APP_ERC: $erc, LIFERAY_ROUTES_CLIENT_EXTENSION: "/etc/liferay/lxc/ext-init-metadata", LIFERAY_ROUTES_DXP: "/etc/liferay/lxc/dxp-metadata"}, environments: {infra: {deploy: false}}, id: $id, kind: "Job", memory: 300, scale: 1}' \
         > "$CX_ROOT/LCP.json"

       # Create liferay-plugin-package.properties
       echo "Bundle-SymbolicName=$COLLECTION_NAME-language" > "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
       echo "Liferay-Client-Extension-Batch=batch/" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
       echo "module-group-id=liferay" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
       echo "name=$COLLECTION_NAME Language Overrides" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"

       # Create client-extension-config.json
       CONFIG_KEY="com.liferay.oauth2.provider.configuration.OAuth2ProviderApplicationHeadlessServerConfiguration~$COLLECTION_NAME-language-batch-oauth"
       
       jq -n -c \
         --arg key "$CONFIG_KEY" \
         --arg name "$COLLECTION_NAME Language Batch OAuth" \
         --arg proj "$COLLECTION_NAME-language" \
         --argjson ts "$TIMESTAMP" \
         '{($key): {".serviceAddress": "localhost:8080", ".serviceScheme": "http", ":configurator:policy": "force", baseURL: "${portalURL}/o/language", buildTimestamp: $ts, description: "", "dxp.lxc.liferay.com.virtualInstanceId": "default", homePageURL: "$[conf:.serviceScheme]://$[conf:.serviceAddress]", name: $name, projectId: $proj, projectName: $proj, properties: [], scopes: ["Liferay.Headless.Admin.Workflow.everything", "Liferay.Headless.Batch.Engine.everything", "Liferay.Message.Admin.REST.everything"], sourceCodeURL: "", type: "oAuthApplicationHeadlessServer", typeSettings: [".serviceAddress=localhost:8080", ".serviceScheme=http", "scopes=Liferay.Headless.Admin.Workflow.everything\nLiferay.Headless.Batch.Engine.everything\nLiferay.Message.Admin.REST.everything"], webContextPath: ("/" + $proj)}}' \
         > "$CX_ROOT/client-extension-config.json"

       # Zip the CX structure
       (cd "$CX_ROOT" && zip -qr ../zips/language/"$COLLECTION_NAME"-language-batch-cx.zip .)
       rm -rf "$CX_ROOT"
   fi

   # --- B. Standard Fragment Collection ZIP ---
   ensure_descriptor "$COLLECTION_NAME"
   CREATED=$?
   zip -qr ./zips/fragments/"$COLLECTION_NAME"-collection.zip "$COLLECTION_NAME" -x "*/Language*.properties" -x "*/client-extension.yaml"
   
   # --- C. Legacy Fragment Collection ZIP ---
   echo "  -> Creating pre-2025.Q3 version for $COLLECTION_NAME..."
   BUILD_TEMP="temp_build_${COLLECTION_NAME}"
   mkdir -p "$BUILD_TEMP/$COLLECTION_NAME"
   cp -r "$COLLECTION_NAME/." "$BUILD_TEMP/$COLLECTION_NAME/"
   
   find "$BUILD_TEMP/$COLLECTION_NAME" -name "Language*.properties" -delete
   find "$BUILD_TEMP/$COLLECTION_NAME" -name "client-extension.yaml" -delete
   
   find "$BUILD_TEMP/$COLLECTION_NAME" -name "configuration.json" -exec sh -c '
       jq "del(.fieldSets[].fields[].typeOptions.dependency)" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
   ' -- {} \;
   
   (cd "$BUILD_TEMP" && zip -qr ../zips/fragments/"$COLLECTION_NAME"-pre2025q3.zip "$COLLECTION_NAME")
   rm -rf "$BUILD_TEMP"
   
   [[ $CREATED -eq 0 ]] && rm "$COLLECTION_NAME/liferay-deploy-fragments.json"
done

# 3. Showcase Resources (in other-resources/showcase-data/)
if [ -d "other-resources/showcase-data" ]; then
    SHOWCASE_RESOURCES=$(find other-resources/showcase-data -type d -maxdepth 1 -mindepth 1)

    for RESOURCE in $SHOWCASE_RESOURCES; do
        RESOURCE_NAME=$(basename "$RESOURCE")
        
        if [ -d "$RESOURCE/batch" ]; then
            echo "Processing showcase resource: $RESOURCE_NAME"
            
            # Clean old zip
            rm -f "$RESOURCE/dist/$RESOURCE_NAME-batch-cx.zip"
            mkdir -p "$RESOURCE/dist"

            CX_ROOT="temp_cx_$RESOURCE_NAME"
            mkdir -p "$CX_ROOT/batch"
            mkdir -p "$CX_ROOT/WEB-INF"
            
            # Copy and MINIFY all batch engine data files with UNIQUE names
            for f in "$RESOURCE/batch"/*.json; do
                BASE_F=$(basename "$f")
                jq -c . "$f" > "$CX_ROOT/batch/${RESOURCE_NAME}-${BASE_F}"
            done
            
            # Create Dockerfile
            echo "FROM liferay/batch:latest" > "$CX_ROOT/Dockerfile"
            echo "COPY --chown=liferay:liferay /batch /opt/liferay/batch" >> "$CX_ROOT/Dockerfile"

            # Create LCP.json
            jq -n \
              --arg id "$RESOURCE_NAME" \
              --arg erc "$RESOURCE_NAME-batch-oauth" \
              '{cpu: 0.2, env: {LIFERAY_BATCH_OAUTH_APP_ERC: $erc, LIFERAY_ROUTES_CLIENT_EXTENSION: "/etc/liferay/lxc/ext-init-metadata", LIFERAY_ROUTES_DXP: "/etc/liferay/lxc/dxp-metadata"}, environments: {infra: {deploy: false}}, id: $id, kind: "Job", memory: 300, scale: 1}' \
              > "$CX_ROOT/LCP.json"

            # Create liferay-plugin-package.properties
            echo "Bundle-SymbolicName=$RESOURCE_NAME" > "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
            echo "Liferay-Client-Extension-Batch=batch/" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
            echo "module-group-id=liferay" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"
            echo "name=$RESOURCE_NAME Showcase Object" >> "$CX_ROOT/WEB-INF/liferay-plugin-package.properties"

            # Create client-extension-config.json
            CONFIG_KEY="com.liferay.oauth2.provider.configuration.OAuth2ProviderApplicationHeadlessServerConfiguration~$RESOURCE_NAME-batch-oauth"
            
            jq -n -c \
              --arg key "$CONFIG_KEY" \
              --arg name "$RESOURCE_NAME Batch OAuth" \
              --arg proj "$RESOURCE_NAME" \
              --argjson ts "$TIMESTAMP" \
              '{($key): {".serviceAddress": "localhost:8080", ".serviceScheme": "http", ":configurator:policy": "force", baseURL: ("${portalURL}/o/" + $proj), buildTimestamp: $ts, description: "", "dxp.lxc.liferay.com.virtualInstanceId": "default", homePageURL: "$[conf:.serviceScheme]://$[conf:.serviceAddress]", name: $name, projectId: $proj, projectName: $proj, properties: [], scopes: ["Liferay.Headless.Batch.Engine.everything", "Liferay.Object.Admin.REST.everything"], sourceCodeURL: "", type: "oAuthApplicationHeadlessServer", typeSettings: [".serviceAddress=localhost:8080", ".serviceScheme=http", "scopes=Liferay.Headless.Admin.Workflow.everything\nLiferay.Headless.Batch.Engine.everything\nLiferay.Message.Admin.REST.everything"], webContextPath: ("/" + $proj)}}' \
              > "$CX_ROOT/client-extension-config.json"

            # Zip the CX structure into the dist folder
            (cd "$CX_ROOT" && zip -qr "../$RESOURCE/dist/$RESOURCE_NAME-batch-cx.zip" .)
            rm -rf "$CX_ROOT"
        fi
    done
fi

echo "Build complete."
echo "Fragment Zips: ./zips/fragments/"
echo "Language Batch CX: ./zips/language/"
