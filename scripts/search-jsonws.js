// scripts/search-jsonws.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');
const hostname = 'localhost';
const port = 8090;

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
  console.log('Fetching JSON WS service list...');
  try {
    const res = await getUrl('/api/jsonws');
    console.log(`Status: ${res.status}`);

    // Parse links to find services
    // JSON WS page contains links like href="/api/jsonws?contextPath=&signature=%2Fddm.ddmstructure%2F..."
    const regex = /signature=%2F([^%&]+)%2F/g;
    let match;
    const services = new Set();
    while ((match = regex.exec(res.data)) !== null) {
      services.add(match[1]);
    }

    console.log('Available JSON WS Services matching structure or ddm:');
    for (const service of Array.from(services).sort()) {
      if (
        service.includes('struct') ||
        service.includes('ddm') ||
        service.includes('journal')
      ) {
        console.log(`- ${service}`);
      }
    }

    console.log('\nAll Available JSON WS Services:');
    console.log(Array.from(services).sort().join(', '));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
