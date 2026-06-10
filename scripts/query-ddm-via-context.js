// scripts/query-ddm-via-context.js
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

async function testEndpoint(path, method = 'GET', postData = null) {
  const options = {
    hostname,
    port,
    path,
    method,
    headers: {
      Authorization: 'Basic ' + auth,
      Accept: 'application/json',
    },
  };
  if (postData) {
    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(postData);
  }
  const res = await makeRequest(options, postData);
  return {
    path,
    status: res.statusCode,
    data: res.data,
  };
}

async function run() {
  console.log('Testing context-path query parameters for DDM structures...');

  // Try 1: /api/jsonws/ddm.ddmstructure/get-structures?contextPath=ddm
  try {
    const res = await testEndpoint(
      '/api/jsonws/ddm.ddmstructure/get-structures?contextPath=ddm',
      'POST',
      JSON.stringify({})
    );
    console.log(
      `Try 1: /api/jsonws/ddm.ddmstructure/get-structures?contextPath=ddm -> Status: ${res.status}`
    );
    if (res.status === 200) {
      const structures = JSON.parse(res.data);
      console.log(`  Found ${structures.length} structures`);
    } else {
      console.log(`  Response: ${res.data}`);
    }
  } catch (err) {
    console.error('Try 1 failed:', err.message);
  }

  // Try 2: /o/ddm/api/jsonws/ddmstructure/get-structures
  try {
    const res = await testEndpoint(
      '/o/ddm/api/jsonws/ddmstructure/get-structures',
      'POST',
      JSON.stringify({})
    );
    console.log(
      `Try 2: /o/ddm/api/jsonws/ddmstructure/get-structures -> Status: ${res.status}`
    );
    if (res.status === 200) {
      const structures = JSON.parse(res.data);
      console.log(`  Found ${structures.length} structures`);
    } else {
      console.log(`  Response: ${res.data}`);
    }
  } catch (err) {
    console.error('Try 2 failed:', err.message);
  }
}

run();
