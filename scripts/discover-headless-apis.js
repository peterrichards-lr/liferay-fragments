// scripts/discover-headless-apis.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');
const hostname = 'localhost';
const port = 8080;

function checkEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port,
      path,
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth,
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          snippet: data.substring(0, 150),
        });
      });
    });
    req.on('error', (err) => {
      resolve({
        path,
        status: -1,
        snippet: err.message,
      });
    });
    req.end();
  });
}

async function run() {
  const candidates = [
    '/o/headless-delivery/v1.0/content-structures',
    '/o/ddm/v1.0',
    '/o/journal-admin/v1.0',
    '/o/headless-delivery/v1.0/sites/20127/content-structures',
    '/o/headless-admin-content/v1.0',
    '/o/headless-admin-content/v1.0/content-structures',
    '/o/headless-admin-content/v1.0/sites/20127/content-structures',
    '/o/headless-admin-content/v1.0/web-content-structures',
    '/o/headless-admin-content/v1.0/sites/20127/web-content-structures',
    '/o/dynamic-data-mapping-structures/v1.0',
    '/o/ddm-structures/v1.0',
  ];

  console.log('Probing headless endpoints...');
  for (const path of candidates) {
    const res = await checkEndpoint(path);
    console.log(`GET ${res.path} -> Status: ${res.status}`);
    if (res.status !== 404) {
      console.log(`  Response: ${res.snippet.trim().replace(/\n/g, ' ')}...`);
    }
  }
}

run();
