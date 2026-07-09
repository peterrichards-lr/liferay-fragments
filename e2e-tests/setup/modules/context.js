const fs = require('fs');
const path = require('path');
const { request } = require('@playwright/test');

class SetupContext {
  constructor(config) {
    this.config = config;
    this.baseURL = config.projects[0].use.baseURL;
    this.storageState = config.projects[0].use.storageState;
    this.liferayUser = process.env.LIFERAY_USER || 'test@liferay.com';
    this.liferayPassword = process.env.LIFERAY_PASSWORD || 'test';
    this.basicAuth = Buffer.from(
      `${this.liferayUser}:${this.liferayPassword}`
    ).toString('base64');
    this.projectRoot = path.join(__dirname, '..', '..', '..');

    this.pAuthToken = '';
    this.siteId = null;
    this.siteERC = 'FRAGMENTS_E2E_TEST_SITE';
    this.siteFriendlyUrl = '/fragments-e2e-test-site';
    this.realisedVersion = '';
    this.useStringForNumbers = true;
    this.globalSiteKey = 'L_GLOBAL';

    this.dbFragmentKeyToERC = {};
    this.fragmentKeyToDir = {};
    this.assetMap = {};
    this.documentIdMap = {};
    this.assetEntryIdMap = {};
    this.testPagesMap = [];
  }

  async createApiContext() {
    return await request.newContext({
      baseURL: this.baseURL,
      storageState: this.storageState,
      extraHTTPHeaders: {
        Authorization: `Basic ${this.basicAuth}`,
      },
      ignoreHTTPSErrors: true,
      timeout: 60000,
    });
  }

  saveTestPages() {
    const seenTestKeys = new Set();
    const uniqueTestPagesMap = this.testPagesMap.filter((entry) => {
      const key = `${entry.collectionName}|||${entry.fragmentName}`;
      if (seenTestKeys.has(key)) return false;
      seenTestKeys.add(key);
      return true;
    });

    fs.writeFileSync(
      path.join(this.projectRoot, 'e2e-tests', 'generated-test-pages.json'),
      JSON.stringify(uniqueTestPagesMap, null, 2)
    );
    console.log('Finished generating test pages.');
  }

  convertConfigToFieldValues(config, fragmentDir) {
    const fieldValues = {};
    if (!config) return fieldValues;

    let fieldsConfig = {};
    if (fragmentDir) {
      try {
        const configPath = path.join(fragmentDir, 'main/configuration.json');
        if (fs.existsSync(configPath)) {
          const configJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (configJson.fieldSets) {
            configJson.fieldSets.forEach((set) => {
              if (set.fields) {
                set.fields.forEach((f) => {
                  fieldsConfig[f.name] = f;
                });
              }
            });
          }
        }
      } catch (e) {
        // Ignore reading errors
      }
    }

    Object.keys(config).forEach((k) => {
      const val = config[k];
      const fieldDef = fieldsConfig[k] || {};
      const uiType = fieldDef.type || 'text'; // default to text
      let type = 'Text';

      if (uiType === 'checkbox') {
        type = 'Checkbox';
      } else if (uiType === 'select') {
        type = 'Select';
      } else if (uiType === 'item') {
        type = 'Item';
      } else if (uiType === 'collection') {
        type = 'Collection';
      } else if (uiType === 'url') {
        type = 'URL';
      } else if (uiType === 'video') {
        type = 'Video';
      } else if (uiType === 'colorPalette') {
        type = 'ColorPalette';
      } else if (uiType === 'colorPicker') {
        type = 'ColorPicker';
      } else if (uiType === 'length') {
        type = 'Length';
      }

      if (type === 'Checkbox') {
        fieldValues[k] = {
          type: type,
          value: typeof val === 'string' ? val === 'true' : !!val,
        };
      } else {
        fieldValues[k] = {
          type: type,
          value: val !== null && val !== undefined ? val.toString() : '',
        };
      }
    });

    return fieldValues;
  }

  getFragmentERC(key) {
    if (this.dbFragmentKeyToERC[key]) {
      return this.dbFragmentKeyToERC[key];
    }
    const dir = this.fragmentKeyToDir ? this.fragmentKeyToDir[key] : null;
    if (dir) {
      const grandparentDir = path.dirname(path.dirname(dir));
      const collectionFolderName = path.basename(grandparentDir);
      return `${collectionFolderName}-${key}`;
    }
    return `form-fragments-${key}`;
  }

  async getAssetEntryId(apiContext, className, classPK) {
    try {
      const resp = await apiContext.post(
        `/api/jsonws/assetentry/get-entry?p_auth=${this.pAuthToken}`,
        {
          form: {
            className: className,
            classPK: classPK.toString(),
          },
        }
      );
      if (resp.ok()) {
        const json = await resp.json();
        return json.entryId;
      } else {
        console.warn(
          `       [WARN] Failed to get asset entry for ${className} / ${classPK}: ${resp.status()}`
        );
      }
    } catch (err) {
      console.error(
        `       [ERROR] Exception getting asset entry:`,
        err.message
      );
    }
    return null;
  }

  findObjectDefinitionPayload(erc) {
    const { globSync } = require('glob');
    const files = globSync('**/*object-definition*.json', {
      cwd: this.projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/temp*/**', '**/zips/**'],
    });

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (data.items && Array.isArray(data.items)) {
          const item = data.items.find((i) => i.externalReferenceCode === erc);
          if (item) return item;
        }
      } catch (e) {}
    }
    return null;
  }
  /**
   * Issue #65: Playwright JSON-WS Exception Interceptor.
   * Liferay JSON-WS returns HTTP 200 even on Java exceptions. This helper
   * parses the body and throws if an 'exception' key is present, preventing
   * silent failures in setup/seeding tasks.
   *
   * @param {import('@playwright/test').APIRequestContext} apiContext
   * @param {string} endpoint  e.g. '/api/jsonws/assetlist.assetlistentry/add-asset-list-entry'
   * @param {Object} formPayload  Key-value pairs to send as form data
   * @returns {Promise<Object>} Parsed JSON response body
   */
  async postJsonWs(apiContext, endpoint, formPayload) {
    const url = `${endpoint}?p_auth=${this.pAuthToken}`;
    const resp = await apiContext.post(url, { form: formPayload });

    if (!resp.ok()) {
      throw new Error(
        `[JSON-WS] HTTP ${resp.status()} calling ${endpoint}`
      );
    }

    let json;
    try {
      json = await resp.json();
    } catch (e) {
      // Non-JSON response (e.g. HTML error page) — treat as failure
      const body = await resp.text().catch(() => '');
      throw new Error(
        `[JSON-WS] Non-JSON response from ${endpoint}: ${body.substring(0, 200)}`
      );
    }

    if (json && json.exception) {
      throw new Error(
        `[JSON-WS] Liferay exception in ${endpoint}: ${json.exception}`
      );
    }

    return json;
  }

}

module.exports = SetupContext;
