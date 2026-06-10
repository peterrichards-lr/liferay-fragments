// scripts/search-ddm-jsonws.js
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

    // Parse links to find services
    const regex = /signature=%2F([^%&]+)%2F/g;
    let match;
    const services = new Set();
    while ((match = regex.exec(res.data)) !== null) {
      services.add(match[1]);
    }

    console.log('Available Services in ddm context:');
    for (const service of Array.from(services).sort()) {
      console.log(`- ${service}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
