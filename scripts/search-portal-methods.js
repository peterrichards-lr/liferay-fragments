// scripts/search-portal-methods.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');
const hostname = 'localhost';
const port = 8080;

function getUrl(path) {
  return new Promise((resolve, reject) => {
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
          status: res.statusCode,
          data: data,
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Fetching Portal service methods...');
  try {
    const res = await getUrl('/api/jsonws?signature=%2Fportal');
    console.log(`Status: ${res.status}`);

    // Parse links to find methods
    const regex = /href="\/api\/jsonws\?signature=%2Fportal%2F([^"&]+)"/g;
    let match;
    const methods = new Set();
    while ((match = regex.exec(res.data)) !== null) {
      methods.add(match[1]);
    }

    console.log('Available methods for /portal:');
    for (const m of Array.from(methods).sort()) {
      console.log(`- ${m}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
