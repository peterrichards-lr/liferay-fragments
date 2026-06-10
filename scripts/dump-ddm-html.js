// scripts/dump-ddm-html.js
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

    // Dump first 3000 chars of HTML
    console.log('HTML Snippet:');
    console.log(res.data.substring(0, 3000));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
