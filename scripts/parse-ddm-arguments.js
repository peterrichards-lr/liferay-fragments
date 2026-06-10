// scripts/parse-ddm-arguments.js
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
  console.log('Fetching get-structures HTML...');
  try {
    const res = await getUrl('/o/ddm/api/jsonws/ddmstructure/get-structures');
    console.log(`Status: ${res.status}`);

    // Look for form input elements or parameter labels
    // In Liferay JSON WS, parameters are listed under a table or list
    // e.g. <td class="label">groupId</td> or <input name="groupId" ...>
    const regex = /<input[^>]*name="([^"]+)"[^>]*>/g;
    let match;
    const inputs = [];
    while ((match = regex.exec(res.data)) !== null) {
      if (!match[1].startsWith('_') && match[1] !== 'p_auth') {
        inputs.push(match[1]);
      }
    }

    console.log('Detected form inputs (method parameters):');
    console.log(inputs);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
