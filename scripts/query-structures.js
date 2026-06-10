// scripts/query-structures.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');

function querySiteStructures(siteId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: `/o/headless-delivery/v1.0/sites/${siteId}/content-structures`,
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth,
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.items || []);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  try {
    const guestStructs = await querySiteStructures(20127);
    console.log(
      'Guest Site (20127) Structures:',
      guestStructs.map((i) => ({
        id: i.id,
        name: i.name,
        erc: i.externalReferenceCode,
      }))
    );

    const globalStructs = await querySiteStructures(20121);
    console.log(
      'Global Site (20121) Structures:',
      globalStructs.map((i) => ({
        id: i.id,
        name: i.name,
        erc: i.externalReferenceCode,
      }))
    );
  } catch (err) {
    console.error('Error querying structures:', err.message);
  }
}

run();
