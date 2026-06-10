// scripts/test-ddm-add.js
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
    groupId: 20127,
    classNameId: 20015, // JournalArticle classNameId is usually around this or resolved dynamically
    structureKey: 'SLIDER-SLIDE-STRUCT',
    nameMap: { en_US: 'Slider Slide Structure' },
    descriptionMap: { en_US: 'Structure for slides' },
    definition: '{}',
    type: 'journal',
    serviceContext: {},
  };

  const postData = JSON.stringify(payload);
  const options = {
    hostname,
    port,
    path: '/o/ddm/api/jsonws/ddmstructure/add-structure',
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
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${res.data}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
