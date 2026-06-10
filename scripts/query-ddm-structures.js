// scripts/query-ddm-structures.js
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

async function postJSONWS(path, params) {
  const postData = JSON.stringify(params);
  const options = {
    hostname,
    port,
    path,
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + auth,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };
  const res = await makeRequest(options, postData);
  if (res.statusCode !== 200) {
    throw new Error(
      `POST ${path} returned status ${res.statusCode}: ${res.data}`
    );
  }
  return JSON.parse(res.data);
}

async function run() {
  console.log('Querying DDMStructure via JSON WS...');
  try {
    // 1. Get p_auth token or just call get-structures
    // In local development, we can call JSON WS directly
    const structures = await postJSONWS(
      '/api/jsonws/ddm.ddmstructure/get-structures',
      {}
    );
    console.log(`Found ${structures.length} DDM structures:`);
    structures.forEach((s) => {
      console.log(
        `- ID: ${s.structureId}, Key: "${s.structureKey}", Name: "${s.name}", classNameId: ${s.classNameId}`
      );
    });
  } catch (err) {
    console.error('Error querying DDM structures:', err.message);
  }
}

run();
