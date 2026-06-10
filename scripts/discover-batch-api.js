// scripts/discover-batch-api.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');
const hostname = 'localhost';
const port = 8080;

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Querying /o/api OpenAPI index...');
  const options = {
    hostname,
    port,
    path: '/o/api',
    method: 'GET',
    headers: {
      Authorization: 'Basic ' + auth,
      Accept: 'application/json',
    },
  };

  try {
    const res = await makeRequest(options);
    if (res.statusCode === 200) {
      const json = JSON.parse(res.data);
      const keys = Object.keys(json.resources || json);
      console.log('Exposed APIs matching "batch" or "import" or "engine":');
      const filtered = keys.filter(
        (k) =>
          k.toLowerCase().includes('batch') ||
          k.toLowerCase().includes('import') ||
          k.toLowerCase().includes('engine')
      );
      console.log(filtered);
    } else {
      console.log('Failed to fetch /o/api:', res.statusCode, res.data);
    }
  } catch (err) {
    console.error('Error during API discovery:', err.message);
  }
}

run();
