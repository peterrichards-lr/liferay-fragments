// scripts/test-structure-post.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');
const hostname = 'localhost';
const port = 8080;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  const payload = {
    externalReferenceCode: 'TEST-STRUCT-POST',
    name: 'Test Structure via POST',
    description: 'Testing if POST is supported on content-structures',
    contentStructureFields: [
      {
        name: 'title',
        label: 'Title',
        dataType: 'string',
        inputControl: 'text_box',
      },
    ],
  };

  const postData = JSON.stringify(payload);
  const options = {
    hostname,
    port,
    path: '/o/headless-delivery/v1.0/sites/20127/content-structures',
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + auth,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      Accept: 'application/json',
    },
  };

  try {
    const res = await makeRequest(options, postData);
    console.log(
      `POST /o/headless-delivery/v1.0/sites/20127/content-structures -> Status: ${res.statusCode}`
    );
    console.log(`Response: ${res.data}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
