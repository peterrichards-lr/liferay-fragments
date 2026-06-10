// scripts/parse-ddm-methods.js
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
  console.log('Fetching DDM JSON WS page...');
  try {
    const res = await getUrl('/api/jsonws?contextPath=ddm');
    console.log(`Status: ${res.status}`);

    // Find all links containing signature
    // Match signature=/o/... or signature=/ddm...
    const regex = /href="\/api\/jsonws\?signature=([^"&]+)"/g;
    let match;
    const signatures = new Set();
    while ((match = regex.exec(res.data)) !== null) {
      signatures.add(decodeURIComponent(match[1]));
    }

    console.log('Exposed signatures in ddm context:');
    for (const sig of Array.from(signatures).sort()) {
      if (sig.includes('structure') || sig.includes('ddm')) {
        console.log(`- ${sig}`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
