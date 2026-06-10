// scripts/probe-ddm-jsonws.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');
const hostname = 'localhost';
const port = 8080;

function checkUrl(path) {
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
          snippet: data.substring(0, 200).trim().replace(/\n/g, ' '),
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
  const paths = [
    '/o/dynamic-data-mapping/api/jsonws',
    '/o/dynamic-data-mapping-web/api/jsonws',
    '/o/ddm-web/api/jsonws',
    '/o/dynamic-data-mapping-service/api/jsonws',
    '/o/ddm/api/jsonws',
    '/o/journal/api/jsonws',
    '/o/journal-web/api/jsonws',
  ];

  console.log('Probing JSON WS paths...');
  for (const p of paths) {
    const res = await checkUrl(p);
    console.log(`GET ${res.path} -> Status: ${res.status}`);
    if (res.status !== 404) {
      console.log(`  Response: ${res.snippet}...`);
    }
  }
}

run();
