// scripts/search-jsonws-contexts.js
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
  console.log('Fetching JSON WS context list...');
  try {
    const res = await getUrl('/api/jsonws');
    console.log(`Status: ${res.status}`);

    // Look for <select id="contextPath" or name="contextPath"
    // Let's search for option tags inside the select element
    const regex = /<option[^>]*value="([^"]+)"[^>]*>/g;
    let match;
    const contexts = [];
    while ((match = regex.exec(res.data)) !== null) {
      contexts.push(match[1]);
    }

    console.log('Found contexts:');
    contexts.forEach((c) => console.log(`- "${c}"`));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
