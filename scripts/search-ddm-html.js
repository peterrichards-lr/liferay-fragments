// scripts/search-ddm-html.js
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
  try {
    const res = await getUrl('/api/jsonws?contextPath=ddm');
    console.log(`Status: ${res.status}`);

    // Find lines containing 'ddm' or 'structure'
    const lines = res.data.split('\n');
    console.log('Matching lines:');
    lines.forEach((line, idx) => {
      if (
        line.toLowerCase().includes('ddm') ||
        line.toLowerCase().includes('structure')
      ) {
        console.log(`${idx + 1}: ${line.trim().substring(0, 200)}`);
      }
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
