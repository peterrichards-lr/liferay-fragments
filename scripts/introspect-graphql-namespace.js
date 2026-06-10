// scripts/introspect-graphql-namespace.js
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

async function queryGraphQL(query, variables = {}) {
  const postData = JSON.stringify({ query, variables });
  const options = {
    hostname,
    port,
    path: '/o/graphql',
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + auth,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      Accept: 'application/json',
    },
  };
  const res = await makeRequest(options, postData);
  if (res.statusCode !== 200) {
    throw new Error(`GraphQL returned status ${res.statusCode}: ${res.data}`);
  }
  return JSON.parse(res.data);
}

async function run() {
  console.log('Introspecting namespace types...');

  // Introspect fields of types like headlessAdminContent_v1_0 or headlessDelivery_v1_0
  const query = `
    query {
      __schema {
        types {
          name
          fields {
            name
            description
            args {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const result = await queryGraphQL(query);
    const types = result.data.__schema.types;

    const targetNames = [
      'headlessAdminContent_v1_0',
      'headlessDelivery_v1_0',
      'Mutation',
    ];
    types.forEach((t) => {
      if (
        targetNames.includes(t.name) ||
        t.name.startsWith('Headless') ||
        t.name.startsWith('Journal')
      ) {
        if (t.fields) {
          console.log(`Type: ${t.name}`);
          t.fields.forEach((f) => {
            if (
              f.name.toLowerCase().includes('structure') ||
              f.name.toLowerCase().includes('content')
            ) {
              console.log(
                `  - Field: ${f.name} (Args: ${f.args.map((a) => a.name).join(', ')})`
              );
            }
          });
        }
      }
    });
  } catch (err) {
    console.error('GraphQL Query Failed:', err.message);
  }
}

run();
