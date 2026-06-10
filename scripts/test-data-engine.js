// scripts/test-data-engine.js
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

async function getUrl(path) {
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
  return makeRequest(options);
}

async function run() {
  console.log('Querying Data Engine API...');

  // Try querying data definitions for site 20127
  const paths = [
    '/o/data-engine/v2.0/sites/20127/data-definitions',
    '/o/data-engine/v2.0/sites/20127/data-definitions?contentType=journal',
    '/o/data-engine/v2.0/sites/20121/data-definitions',
    '/o/data-engine/v2.0/sites/20121/data-definitions?contentType=journal',
  ];

  for (const path of paths) {
    try {
      const res = await getUrl(path);
      console.log(`GET ${path} -> Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.data);
        console.log(`  Found ${json.totalCount} definitions:`);
        (json.items || []).forEach((item) => {
          console.log(
            `   - ID: ${item.id}, Name: "${item.name}", ERC: "${item.externalReferenceCode}", ContentType: "${item.contentType}"`
          );
        });
      } else {
        console.log(`  Error: ${res.data}`);
      }
    } catch (err) {
      console.error(`Path ${path} failed:`, err.message);
    }
  }
}

run();
