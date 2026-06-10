// scripts/query-liferay.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');
const hostname = 'localhost';
const port = 8080;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function getJSON(path) {
  const options = {
    hostname,
    port,
    path,
    method: 'GET',
    headers: {
      Authorization: 'Basic ' + auth,
      Accept: 'application/json',
    },
  };
  const res = await makeRequest(options);
  if (res.statusCode !== 200) {
    throw new Error(
      `GET ${path} returned status ${res.statusCode}: ${res.data}`
    );
  }
  return JSON.parse(res.data);
}

async function checkPath(path) {
  const options = {
    hostname,
    port,
    path,
    method: 'GET',
    headers: {
      Authorization: 'Basic ' + auth,
    },
  };
  const res = await makeRequest(options);
  return {
    path,
    status: res.statusCode,
    snippet: res.data.substring(0, 300),
  };
}

async function run() {
  console.log('======================================================');
  console.log(' Starting Liferay DXP API & Asset Diagnostics Script ');
  console.log('======================================================\n');

  try {
    // 1. Fetch Sites
    console.log('--- 1. Querying Sites ---');
    const sites = await getJSON('/o/headless-admin-site/v1.0/sites');
    console.log(`Found ${sites.items.length} sites:`);
    sites.items.forEach((site) => {
      console.log(
        ` - ID: ${site.id}, Name: "${site.name}", ERC: "${site.externalReferenceCode}"`
      );
    });
    console.log('');

    // 2. Query Structures, Articles, and Collections for Guest (20127) and Global (20121)
    const targetSites = [20127, 20121];
    for (const siteId of targetSites) {
      console.log(`--- 2. Diagnostics for Site ID: ${siteId} ---`);

      // Structures
      try {
        const structures = await getJSON(
          `/o/headless-delivery/v1.0/sites/${siteId}/content-structures`
        );
        console.log(`  Content Structures (${structures.items.length}):`);
        structures.items.forEach((item) => {
          console.log(
            `   * ID: ${item.id}, Name: "${item.name}", ERC: "${item.externalReferenceCode}"`
          );
        });
      } catch (err) {
        console.log(`  Content Structures: Failed to fetch (${err.message})`);
      }

      // Articles
      try {
        const articles = await getJSON(
          `/o/headless-delivery/v1.0/sites/${siteId}/structured-contents`
        );
        console.log(
          `  WebContent Articles / StructuredContents (${articles.items.length}):`
        );
        articles.items.forEach((item) => {
          console.log(
            `   * ID: ${item.id}, Title: "${item.title}", ERC: "${item.externalReferenceCode}"`
          );
        });
      } catch (err) {
        console.log(`  StructuredContents: Failed to fetch (${err.message})`);
      }

      // Content Sets / Collections
      try {
        const contentSets = await getJSON(
          `/o/headless-delivery/v1.0/sites/${siteId}/content-sets`
        );
        console.log(
          `  Content Sets / Collections (${contentSets.items.length}):`
        );
        contentSets.items.forEach((item) => {
          console.log(
            `   * ID: ${item.id}, Name: "${item.name}", ERC: "${item.externalReferenceCode}"`
          );
        });
      } catch (err) {
        console.log(`  Content Sets: Failed to fetch (${err.message})`);
      }
      console.log('');
    }

    // 3. Test Specific Endpoint Responses
    console.log('--- 3. Testing REST API Path Statuses ---');
    const pathsToTest = [
      '/o/headless-delivery/v1.0/collections/123/items',
      '/o/headless-delivery/v1.0/content-sets/123/content-set-elements',
      '/api/jsonws?cmd=/assetlist.assetlistentry/add-manual-asset-list-entry&p_auth=dummy',
    ];
    for (const path of pathsToTest) {
      const result = await checkPath(path);
      console.log(`  GET ${result.path} -> Status: ${result.status}`);
      console.log(
        `    Snippet: ${result.snippet.replace(/\n/g, ' ').substring(0, 120)}...`
      );
    }
    console.log('');

    // 4. Verify JSON WS Service Exposed list
    console.log('--- 4. Checking JSON WS exposed services ---');
    const serviceHtml = await checkPath('/api/jsonws');
    console.log(`  GET /api/jsonws -> Status: ${serviceHtml.status}`);
    const matches =
      serviceHtml.snippet.match(/assetlist|assetlistentry/g) || [];
    if (matches.length > 0) {
      console.log(
        `    Found occurrences of keywords: ${JSON.stringify(Array.from(new Set(matches)))}`
      );
    } else {
      console.log(
        '    No assetlist/assetlistentry keywords found in initial snippet.'
      );
    }
  } catch (err) {
    console.error('\n[FATAL ERROR] Diagnostics failed:', err.message);
  }

  console.log('\n======================================================');
  console.log(' Diagnostics Complete. ');
  console.log('======================================================');
}

run();
